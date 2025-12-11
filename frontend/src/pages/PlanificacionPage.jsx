// frontend/src/pages/PlanificacionPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    getCronogramas, 
    getActividadesPorCronograma, 
    // eslint-disable-next-line no-unused-vars
    eliminarActividad,
    eliminarCronograma 
} from '../services/scheduleService';
import { getACPMs } from '../services/acpmService'; 
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es'; 
import 'react-big-calendar/lib/css/react-big-calendar.css'; 

import '../index.css'; 
import '../style/PlanificacionPage.css'; 
import { BsEyeFill, BsPlusLg, BsTrash, BsSearch, BsInfoCircle } from 'react-icons/bs'; 
import Swal from 'sweetalert2'; 

// Modales
import ModalCrearCronograma from '../components/ModalCrearCronograma.jsx';
import ModalCrearActividad from '../components/ModalCrearActividad.jsx';
import ModalEditarActividad from '../components/ModalEditarActividad.jsx';
import ModalConfirmarAccion from '../components/ModalConfirmarAccion.jsx'; 
import ModalGestionarActividad from '../components/ModalGestionarActividad.jsx';
import ModalVerEvidencias from '../components/ModalVerEvidencias.jsx';
import ModalDetalleActividad from '../components/ModalDetalleActividad.jsx';
import ModalVerACPM from '../components/ModalVerACPM.jsx'; 

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales });
const messages = { allDay: 'Todo el día', previous: 'Anterior', next: 'Siguiente', today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda', date: 'Fecha', time: 'Hora', event: 'Evento', noEventsInRange: 'No hay eventos en este rango.'};

const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    try { 
        const datePart = dateString.split('T')[0]; 
        const [year, month, day] = datePart.split('-'); 
        return new Date(year, month - 1, day); 
    // eslint-disable-next-line no-unused-vars
    } catch (e) { return new Date(dateString); }
};

const PlanificacionPage = () => {
    const [cronogramas, setCronogramas] = useState([]);
    const [cronogramaSeleccionado, setCronogramaSeleccionado] = useState(null);
    const [cronogramaDescripcion, setCronogramaDescripcion] = useState(''); 
    
    const [actividades, setActividades] = useState([]);
    const [acpms, setAcpms] = useState([]); 

    const [isLoadingCronogramas, setIsLoadingCronogramas] = useState(true);
    const [isLoadingActividades, setIsLoadingActividades] = useState(false);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState(''); 
    
    const [modalCronogramaAbierto, setModalCronogramaAbierto] = useState(false);
    const [modalActividadAbierto, setModalActividadAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
    const [modalGestionarAbierto, setModalGestionarAbierto] = useState(false);
    const [modalEvidenciaAbierto, setModalEvidenciaAbierto] = useState(false);
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [modalVerACPMAbierto, setModalVerACPMAbierto] = useState(false); 
    const [acpmSeleccionadaId, setAcpmSeleccionadaId] = useState(null);

    const [itemAEliminar, setItemAEliminar] = useState(null); 
    const [actividadSeleccionada, setActividadSeleccionada] = useState(null); 
    
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState(Views.MONTH);
    
    // --- Carga Inicial ---
    const cargarDatosIniciales = useCallback(async () => {
        try {
            setIsLoadingCronogramas(true);
            const dataCronos = await getCronogramas();
            setCronogramas(dataCronos);
            const dataAcpms = await getACPMs();
            setAcpms(dataAcpms);

            if (dataCronos.length > 0 && !cronogramaSeleccionado) {
                const primerId = dataCronos[0].ID_Cronograma;
                handleSeleccionarCronograma(primerId, dataCronos); 
            }
        } catch (err) { setError(err.message); } finally { setIsLoadingCronogramas(false); }
    }, [cronogramaSeleccionado]); 
    
    useEffect(() => { cargarDatosIniciales(); }, []); 
    
    const handleSeleccionarCronograma = useCallback(async (idCronograma, cronogramasData = cronogramas) => {
        if (!idCronograma) return;
        setCronogramaSeleccionado(idCronograma); 
        const crono = cronogramasData.find(c => c.ID_Cronograma == idCronograma);
        setCronogramaDescripcion(crono?.Descripcion || 'Este cronograma no tiene descripción.');
        setIsLoadingActividades(true);
        setError(null);
        setActividades([]); 
        try {
            const data = await getActividadesPorCronograma(idCronograma);
            setActividades(data);
        } catch (err) { setError(err.message); } finally { setIsLoadingActividades(false); }
    }, [cronogramas]); 

    // --- Filtros ---
    const actividadesFiltradas = useMemo(() => {
        return actividades.filter(act => {
            const texto = busqueda.toLowerCase();
            const matchTexto = 
                act.NombreActividad.toLowerCase().includes(texto) ||
                (act.DescripcionActividad && act.DescripcionActividad.toLowerCase().includes(texto)) ||
                (act.Responsable && act.Responsable.toLowerCase().includes(texto));
            const matchEstado = filtroEstado ? act.EstadoActividad === filtroEstado : true;
            return matchTexto && matchEstado;
        });
    }, [actividades, busqueda, filtroEstado]);

    // --- Cálculo de Totales para la Leyenda ---
    const totales = useMemo(() => {
        return {
            pendientes: actividades.filter(a => a.EstadoActividad === 'Pendiente').length,
            realizadas: actividades.filter(a => a.EstadoActividad === 'Realizada').length,
            canceladas: actividades.filter(a => a.EstadoActividad === 'Cancelada').length,
            acpmAbiertas: acpms.filter(a => a.EstadoACPM !== 'Cerrada').length,
            acpmCerradas: acpms.filter(a => a.EstadoACPM === 'Cerrada').length
        };
    }, [actividades, acpms]);

    // --- Calendario ---
    const calendarEvents = useMemo(() => {
        // 1. Actividades
        const eventosActividades = actividadesFiltradas.map(act => ({
            title: act.NombreActividad, 
            start: parseDateAsLocal(act.FechaLimite), 
            end: parseDateAsLocal(act.FechaLimite), 
            allDay: true, 
            tipo: 'ACTIVIDAD', 
            resource: act 
        }));

        // 2. ACPMs
        const eventosACPM = acpms.map(acpm => {
            const isCerrada = acpm.EstadoACPM === 'Cerrada';
            const fechaEvento = isCerrada && acpm.FechaCierre ? acpm.FechaCierre : acpm.FechaLimite;
            
            return {
                title: `ACPM: ${acpm.Origen} (${acpm.EstadoACPM})`, 
                start: parseDateAsLocal(fechaEvento),
                end: parseDateAsLocal(fechaEvento),
                allDay: true,
                tipo: 'ACPM', 
                resource: acpm
            };
        });

        return [...eventosActividades, ...eventosACPM];
    }, [actividadesFiltradas, acpms]); 

    const onCalendarNavigate = useCallback((newDate) => setCalendarDate(newDate), [setCalendarDate]);
    const onCalendarView = useCallback((newView) => setCalendarView(newView), [setCalendarView]);
    
    const handleSelectEvent = (event) => {
        if (event.tipo === 'ACPM') {
            setAcpmSeleccionadaId(event.resource.ID_ACPM);
            setModalVerACPMAbierto(true);
        } else {
            const actividad = event.resource;
            if (actividad.EstadoActividad === 'Realizada' || actividad.EstadoActividad === 'Cancelada') {
                abrirModalDetalle(actividad);
            } else {
                abrirModalGestionar(actividad);
            }
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad'; 
        
        if (event.tipo === 'ACPM') {
            backgroundColor = event.resource.EstadoACPM === 'Cerrada' ? '#6c757d' : '#fd7e14';
        } else {
            if (event.resource.EstadoActividad === 'Realizada') backgroundColor = '#28a745'; 
            else if (event.resource.EstadoActividad === 'Cancelada') backgroundColor = '#dc3545'; 
        }

        return { style: { backgroundColor, borderRadius: '5px', opacity: 0.9, color: 'white', border: '0px', display: 'block', fontSize: '0.85rem' } };
    };

    const refrescarActividades = () => { if (cronogramaSeleccionado) { handleSeleccionarCronograma(cronogramaSeleccionado); } };
    const handleCronogramaCreado = () => { setModalCronogramaAbierto(false); cargarDatosIniciales(); };
    const handleActividadCreada = () => { setModalActividadAbierto(false); refrescarActividades(); };
    const abrirModalEditar = (actividad) => { setActividadSeleccionada(actividad); setModalEditarAbierto(true); };
    const cerrarModalEditar = () => { setModalEditarAbierto(false); setActividadSeleccionada(null); };
    const handleActividadEditada = () => { cerrarModalEditar(); refrescarActividades(); };
    const abrirModalGestionar = (actividad) => { setActividadSeleccionada(actividad); setModalGestionarAbierto(true); };
    const cerrarModalGestionar = () => { setModalGestionarAbierto(false); setActividadSeleccionada(null); };
    const handleActividadGestionada = () => { cerrarModalGestionar(); refrescarActividades(); };
    const abrirModalEvidencia = (actividad) => { setActividadSeleccionada(actividad); setModalEvidenciaAbierto(true); };
    const cerrarModalEvidencia = () => { setModalEvidenciaAbierto(false); setActividadSeleccionada(null); };
    const abrirModalDetalle = (actividad) => { setActividadSeleccionada(actividad); setModalDetalleAbierto(true); };
    const cerrarModalDetalle = () => { setModalDetalleAbierto(false); setActividadSeleccionada(null); };
    
    // Solo dejamos la eliminación de cronogramas
    const abrirModalEliminarCronograma = () => {
        if (!cronogramaSeleccionado) return;
        const crono = cronogramas.find(c => c.ID_Cronograma == cronogramaSeleccionado);
        if (crono) { setItemAEliminar({ tipo: 'cronograma', data: crono }); setModalConfirmarAbierto(true); }
    };
    const cerrarModalEliminar = () => { setModalConfirmarAbierto(false); setItemAEliminar(null); };

    const handleConfirmarEliminacion = async () => {
        if (!itemAEliminar) return;
        // eslint-disable-next-line no-useless-catch
        try {
            if (itemAEliminar.tipo === 'cronograma') {
                await eliminarCronograma(itemAEliminar.data.ID_Cronograma);
                setCronogramaSeleccionado(null); cargarDatosIniciales(); 
            }
        } catch (err) { throw err; }
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        const fecha = parseDateAsLocal(fechaISO);
        return fecha.toLocaleDateString('es-CO');
    };

    return (
        <div className="page-container">
            {/* --- Encabezado --- */}
            <div className="page-header">
                <h1>Planificación (Cronogramas y Actividades)</h1>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setModalCronogramaAbierto(true)}>
                        <BsPlusLg /> Crear Cronograma
                    </button>
                    <button className="btn btn-primary" disabled={!cronogramaSeleccionado} onClick={() => setModalActividadAbierto(true)}>
                        <BsPlusLg /> Añadir Actividad
                    </button>
                    {cronogramaSeleccionado && (
                        <button className="btn btn-danger" onClick={abrirModalEliminarCronograma} title="Eliminar el cronograma actual">
                            <BsTrash /> Eliminar Cronograma
                        </button>
                    )}
                </div>
            </div>

            {/* --- Selector de Cronograma --- */}
            <div className="cronograma-selector-container" style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="cronograma" style={{ marginBottom: '0.5rem' }}>Seleccione un Cronograma:</label>
                    <select 
                        id="cronograma"
                        className="form-control"
                        value={cronogramaSeleccionado || ''}
                        onChange={(e) => handleSeleccionarCronograma(e.target.value)}
                        disabled={isLoadingCronogramas}
                    >
                        <option value="" disabled>-- Seleccione --</option>
                        {cronogramas.map(c => (
                            <option key={c.ID_Cronograma} value={c.ID_Cronograma}>
                                {c.NombreCronograma} ({c.AnioAplicacion || 'N/A'})
                            </option>
                        ))}
                    </select>
                </div>
                {cronogramaDescripcion && (
                    <p className="cronograma-descripcion" style={{ marginTop: '0.5rem', color: '#666', fontStyle: 'italic' }}>
                        {cronogramaDescripcion}
                    </p>
                )}
            </div>

            {/* --- CALENDARIO INTEGRADO (PRIMERO) --- */}
            <div className="page-content-card calendar-card" style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap:'wrap', gap:'10px'}}>
                    <h2 style={{margin:0}}>Calendario General</h2>
                    
                    {/* --- LEYENDA CON CONTADORES --- */}
                    <div style={{display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap:'wrap'}}>
                        <span title="Actividades Pendientes" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <span style={{width: 10, height: 10, background: '#3174ad', borderRadius: '50%'}}></span> 
                            Pendientes <strong>({totales.pendientes})</strong>
                        </span>
                        <span title="Actividades Realizadas" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <span style={{width: 10, height: 10, background: '#28a745', borderRadius: '50%'}}></span> 
                            Realizadas <strong>({totales.realizadas})</strong>
                        </span>
                        <span title="Actividades Canceladas" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <span style={{width: 10, height: 10, background: '#dc3545', borderRadius: '50%'}}></span> 
                            Canceladas <strong>({totales.canceladas})</strong>
                        </span>
                        <span title="ACPM en curso" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <span style={{width: 10, height: 10, background: '#fd7e14', borderRadius: '50%'}}></span> 
                            ACPM (Abierta) <strong>({totales.acpmAbiertas})</strong>
                        </span>
                        <span title="ACPM Cerradas" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <span style={{width: 10, height: 10, background: '#6c757d', borderRadius: '50%'}}></span> 
                            ACPM (Cerrada) <strong>({totales.acpmCerradas})</strong>
                        </span>
                    </div>
                </div>
                
                {isLoadingActividades ? (
                    <p>Cargando calendario...</p>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        culture="es" 
                        messages={messages}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        date={calendarDate}
                        view={calendarView} 
                        onNavigate={onCalendarNavigate}
                        onView={onCalendarView}
                    />
                )}
            </div>

            {/* --- BARRA DE FILTROS --- */}
            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="search-input-container" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input type="text" className="form-control" placeholder="Buscar actividad, descripción o responsable..." style={{ paddingLeft: '35px', height: '40px' }} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
                <div className="filter-select-container" style={{ minWidth: '200px' }}>
                    <select className="form-control" style={{ height: '40px' }} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option value="">Todos los Estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Realizada">Realizada</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>
            </div>

            {/* --- TABLA DE ACTIVIDADES --- */}
            <div className="page-content-card">
                <h2>Listado de Actividades</h2>
                <div className="table-wrapper">
                    {!isLoadingActividades && !error && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Actividad</th>
                                    <th>Descripción</th> 
                                    <th>Responsable</th>
                                    <th>Fecha Límite</th>
                                    <th>Estado</th>
                                    <th>Evidencia</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actividades.length === 0 && (
                                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>{cronogramaSeleccionado ? 'Este cronograma aún no tiene actividades.' : 'Por favor, seleccione un cronograma.'}</td></tr>
                                )}
                                {actividadesFiltradas.map((act) => (
                                    <tr key={act.ID_Actividad}>
                                        <td title={act.NombreActividad}>{act.NombreActividad.substring(0, 30)}{act.NombreActividad.length > 30 ? '...' : ''}</td>
                                        <td title={act.DescripcionActividad}>{act.DescripcionActividad?.substring(0, 20) || 'N/A'}{act.DescripcionActividad?.length > 20 ? '...' : ''}</td>
                                        <td>{act.Responsable}</td>
                                        <td>{formatearFecha(act.FechaLimite)}</td>
                                        <td><span className={`status-pill ${
                                            act.EstadoActividad === 'Realizada' ? 'status-activo' :
                                            act.EstadoActividad === 'Pendiente' ? 'status-pendiente' : 'status-inactivo'
                                        }`}>{act.EstadoActividad}</span></td>
                                        
                                        <td>
                                            {act.EstadoActividad === 'Realizada' ? (
                                                <button 
                                                    className="btn btn-icon" 
                                                    onClick={() => abrirModalEvidencia(act)} 
                                                    title="Ver Evidencias"
                                                    style={{ color: '#6c757d', border: '1px solid #6c757d' }}
                                                >
                                                    <BsEyeFill /> Ver
                                                </button>
                                            ) : <span style={{ color: '#999', fontSize: '0.8rem' }}>-</span>}
                                        </td>

                                        <td className="action-buttons">
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => abrirModalDetalle(act)} 
                                                title="Ver Detalle Completo"
                                            >
                                                <BsInfoCircle /> Ver Detalle
                                            </button>

                                            {act.EstadoActividad !== 'Realizada' && act.EstadoActividad !== 'Cancelada' && (
                                                <>
                                                    <button className="btn btn-secondary" onClick={() => abrirModalGestionar(act)} title="Cambiar Estado">Gestionar</button>
                                                    <button className="btn btn-warning" onClick={() => abrirModalEditar(act)} title="Editar Datos">Editar</button>
                                                    {/* El botón de eliminar actividad se ha retirado */}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div> 
            </div>
            
            {/* Modales */}
            {modalCronogramaAbierto && <ModalCrearCronograma alCerrar={() => setModalCronogramaAbierto(false)} alExito={handleCronogramaCreado} />}
            {modalActividadAbierto && <ModalCrearActividad idCronograma={cronogramaSeleccionado} alCerrar={() => setModalActividadAbierto(false)} alExito={handleActividadCreada} />}
            {modalEditarAbierto && <ModalEditarActividad actividad={actividadSeleccionada} alCerrar={cerrarModalEditar} alExito={handleActividadEditada} />}
            {modalConfirmarAbierto && <ModalConfirmarAccion titulo={itemAEliminar?.tipo === 'cronograma' ? 'Eliminar Cronograma' : 'Eliminar Actividad'} mensaje={itemAEliminar?.tipo === 'cronograma' ? `¿Eliminar cronograma?` : `¿Eliminar actividad?`} enConfirmar={handleConfirmarEliminacion} alCerrar={cerrarModalEliminar} textoBotonConfirmar="Eliminar" claseBoton="btn-danger" />}
            {modalGestionarAbierto && <ModalGestionarActividad actividad={actividadSeleccionada} alCerrar={cerrarModalGestionar} alExito={handleActividadGestionada} />}
            {modalEvidenciaAbierto && <ModalVerEvidencias actividad={actividadSeleccionada} alCerrar={cerrarModalEvidencia} />}
            {modalDetalleAbierto && <ModalDetalleActividad actividad={actividadSeleccionada} alCerrar={cerrarModalDetalle} />}
            {modalVerACPMAbierto && <ModalVerACPM acpmId={acpmSeleccionadaId} alCerrar={() => setModalVerACPMAbierto(false)} />}
        </div>
    );
};

export default PlanificacionPage;