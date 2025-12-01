// frontend/src/pages/InspeccionesPage.jsx

import React, { useState, useEffect, useMemo } from 'react';

// Servicios
import { 
    getInspeccionesHistorial, 
    getFormularios, 
    getPreguntasFormulario 
} from '../services/inspectionService';

import '../index.css';
import '../style/InspeccionesPage.css';

// Iconos (Quitamos BsFileEarmarkPlus que ya no se usa)
import { BsPlusLg, BsEyeFill, BsSearch } from 'react-icons/bs';
import Swal from 'sweetalert2'; 

// Modales
import ModalVerInspeccion from '../components/ModalVerInspeccion.jsx';
import ModalDiligenciarInspeccion from '../components/ModalDiligenciarInspeccion.jsx';
import ModalCrearACPM from '../components/ModalCrearACPM.jsx'; 
import ModalVerACPM from '../components/ModalVerACPM.jsx'; 

const InspeccionesPage = () => {

    // DATOS
    const [historial, setHistorial] = useState([]);
    const [listaFormularios, setListaFormularios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FILTROS ---
    const [busqueda, setBusqueda] = useState('');
    const [filtroResultado, setFiltroResultado] = useState(''); // 'OK', 'Con Hallazgos'

    // MODALES
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [inspeccionSeleccionadaId, setInspeccionSeleccionadaId] = useState(null);

    const [modalDiligenciarAbierto, setModalDiligenciarAbierto] = useState(false);
    const [formularioSeleccionado, setFormularioSeleccionado] = useState(null);

    // *** ESTADO PARA PREGUNTAS DINÁMICAS ***
    const [preguntasFormulario, setPreguntasFormulario] = useState([]);

    // ACPM
    const [modalCrearAcpmAbierto, setModalCrearAcpmAbierto] = useState(false);
    const [modalVerAcpmId, setModalVerAcpmId] = useState(null);
    const [acpmInitialData, setAcpmInitialData] = useState({});

    // CARGA INICIAL
    const cargarDatos = async () => {
        try {
            setIsLoading(true);
            const [dataHistorial, dataFormularios] = await Promise.all([
                getInspeccionesHistorial(),
                getFormularios()
            ]);
            setHistorial(dataHistorial);
            setListaFormularios(dataFormularios);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    // --- LÓGICA DE FILTRADO ---
    const historialFiltrado = useMemo(() => {
        return historial.filter(ins => {
            const texto = busqueda.toLowerCase();
            
            // 1. Búsqueda por: Formulario, Usuario, Activo o ID
            const matchTexto = 
                ins.NombreFormulario.toLowerCase().includes(texto) ||
                ins.NombreUsuarioRealizo.toLowerCase().includes(texto) ||
                (ins.NombreActivo && ins.NombreActivo.toLowerCase().includes(texto)) ||
                ins.ID_InspeccionRealizada.toString().includes(texto);

            // 2. Filtro por Resultado
            const matchResultado = filtroResultado ? ins.ResultadoGeneral === filtroResultado : true;

            return matchTexto && matchResultado;
        });
    }, [historial, busqueda, filtroResultado]);

    // MODAL DETALLE
    const abrirModalDetalle = (id) => {
        setInspeccionSeleccionadaId(id);
        setModalDetalleAbierto(true);
    };
    const cerrarModalDetalle = () => {
        setModalDetalleAbierto(false);
        setInspeccionSeleccionadaId(null);
    };

    // ABRIR MODAL DILIGENCIAR
    const abrirModalDiligenciar = async (form) => {
        setFormularioSeleccionado(form);
        setPreguntasFormulario([]);

        // Formularios hardcoded que NO usan BD (Legacy)
        const formulariosHardcoded = [
            'FTO-SST-02', 'FTO-SST-13', 'FTO-SST-14',
            'FTO-SST-23', 'FTO-SST-45', 'FTO-SST-95', 'FTO-SST-96'
        ];

        // Si NO es hardcoded -> cargar preguntas desde BD
        if (!formulariosHardcoded.includes(form.ID_Formulario)) {
            try {
                const preguntas = await getPreguntasFormulario(form.ID_Formulario);
                setPreguntasFormulario(preguntas);
            // eslint-disable-next-line no-unused-vars
            } catch (err) {
                // eslint-disable-next-line no-unused-vars
                Swal.fire('Error', 'No se pudieron cargar las preguntas del formulario dinámico.', 'error');
                return;
            }
        }

        setModalDiligenciarAbierto(true);
    };

    const cerrarModalDiligenciar = () => {
        setModalDiligenciarAbierto(false);
        setFormularioSeleccionado(null);
        setPreguntasFormulario([]);
    };

    const handleInspeccionGuardada = () => {
        cerrarModalDiligenciar();
        cargarDatos();
    };

    // ACPM
    const abrirModalCrearACPM = (inspeccion) => {
        setAcpmInitialData({
            origen: `Inspección: ${inspeccion.NombreFormulario} (ID: ${inspeccion.ID_InspeccionRealizada})`,
            descripcionProblema: `Hallazgos encontrados en inspección de ${inspeccion.NombreFormulario} (Activo: ${inspeccion.NombreActivo || 'N/A'}).`,
            idInspeccionOrigen: inspeccion.ID_InspeccionRealizada
        });
        setModalCrearAcpmAbierto(true);
    };

    const cerrarModalCrearACPM = () => {
        setModalCrearAcpmAbierto(false);
        setAcpmInitialData({});
    };

    const handleAcpmCreada = (nuevoIdACPM) => {
        cerrarModalCrearACPM();
        cargarDatos();
        Swal.fire({
            title: '¡ACPM Creada!',
            text: `La Acción ACPM (ID: ${nuevoIdACPM}) ha sido creada.`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Ver ACPM',
            cancelButtonText: 'Cerrar'
        }).then(result => {
            if (result.isConfirmed) setModalVerAcpmId(nuevoIdACPM);
        });
    };

    const abrirModalVerACPM = (id) => setModalVerAcpmId(id);
    const cerrarModalVerACPM = () => setModalVerAcpmId(null);

    // UTIL FECHA
    const formatearFechaHora = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        return new Date(fechaISO).toLocaleString('es-CO');
    };

    return (
        <div className="page-container">
            
            {/* HEADER */}
            <div className="page-header">
                <h1>Inspecciones de Seguridad</h1>
                {/* BOTÓN ELIMINADO AQUÍ */}
            </div>

            {/* BIBLIOTECA */}
            <div className="page-content-card inspection-library">
                <h2>Biblioteca de Formularios</h2>
                <p>Seleccione un formulario para diligenciar una nueva inspección.</p>

                <div className="form-buttons-container">
                    {listaFormularios.length === 0 ? (
                        <p>Cargando formularios...</p>
                    ) : (
                        listaFormularios.map(form => (
                            <button 
                                key={form.ID_Formulario}
                                className="btn btn-primary"
                                onClick={() => abrirModalDiligenciar(form)}
                                title={form.Descripcion}
                            >
                                <BsPlusLg /> {form.NombreFormulario}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* HISTORIAL */}
            <div className="page-content-card" style={{ marginTop: '2rem' }}>
                <h2>Historial de Inspecciones Realizadas</h2>

                {/* --- BARRA DE FILTROS --- */}
                <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Input Búsqueda */}
                    <div className="search-input-container" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Buscar por formulario, usuario, activo..." 
                            style={{ paddingLeft: '35px', height: '40px' }}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {/* Select Resultado */}
                    <div className="filter-select-container" style={{ minWidth: '200px' }}>
                        <select 
                            className="form-control"
                            style={{ height: '40px' }}
                            value={filtroResultado}
                            onChange={(e) => setFiltroResultado(e.target.value)}
                        >
                            <option value="">Todos los Resultados</option>
                            <option value="OK">OK (Sin Hallazgos)</option>
                            <option value="Con Hallazgos">Con Hallazgos</option>
                        </select>
                    </div>
                </div>

                <div className="table-wrapper">
                    {isLoading && <p>Cargando historial...</p>}
                    {error && <p className="error-message">Error: {error}</p>}

                    {!isLoading && !error && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Formulario</th>
                                    <th>Fecha Realizada</th>
                                    <th>Realizada por</th>
                                    <th>Resultado</th>
                                    <th>Activo/Área</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialFiltrado.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No se encontraron inspecciones.</td></tr>
                                ) : (
                                    historialFiltrado.map(ins => (
                                        <tr key={ins.ID_InspeccionRealizada}>
                                            <td>{ins.NombreFormulario} ({ins.ID_Formulario})</td>
                                            <td>{formatearFechaHora(ins.FechaInspeccion)}</td>
                                            <td>{ins.NombreUsuarioRealizo}</td>
                                            <td>
                                                <span className={`status-pill ${
                                                    ins.ResultadoGeneral === 'OK' ? 'status-activo' : 'status-pendiente'
                                                }`}>
                                                    {ins.ResultadoGeneral}
                                                </span>
                                            </td>
                                            <td>{ins.NombreActivo || 'N/A'}</td>
                                            <td className="action-buttons">
                                                <button 
                                                    className="btn btn-secondary"
                                                    onClick={() => abrirModalDetalle(ins.ID_InspeccionRealizada)}
                                                >
                                                    Ver Detalle
                                                </button>

                                                {ins.ResultadoGeneral === 'Con Hallazgos' && (
                                                    ins.ID_ACPM_Vinculada ? (
                                                        <button 
                                                            className="btn btn-success"
                                                            onClick={() => abrirModalVerACPM(ins.ID_ACPM_Vinculada)}
                                                        >
                                                            <BsEyeFill /> Ver ACPM
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="btn btn-warning"
                                                            onClick={() => abrirModalCrearACPM(ins)}
                                                        >
                                                            Crear ACPM
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODALES */}

            {modalDetalleAbierto && (
                <ModalVerInspeccion 
                    inspeccionId={inspeccionSeleccionadaId}
                    alCerrar={cerrarModalDetalle}
                />
            )}

            {/* Modal DILIGENCIAR con preguntas dinámicas */}
            {modalDiligenciarAbierto && formularioSeleccionado && (
                <ModalDiligenciarInspeccion 
                    idFormulario={formularioSeleccionado.ID_Formulario}
                    nombreFormulario={formularioSeleccionado.NombreFormulario}
                    tipoActivo={formularioSeleccionado.TipoActivoAsociado}
                    datosFormulario={{ preguntas: preguntasFormulario }}
                    alCerrar={cerrarModalDiligenciar}
                    alExito={handleInspeccionGuardada}
                />
            )}

            {modalCrearAcpmAbierto && (
                <ModalCrearACPM 
                    alCerrar={cerrarModalCrearACPM}
                    alExito={handleAcpmCreada}
                    initialData={acpmInitialData}
                />
            )}

            {modalVerAcpmId && (
                <ModalVerACPM 
                    acpmId={modalVerAcpmId}
                    alCerrar={cerrarModalVerACPM}
                />
            )}

        </div>
    );
};

export default InspeccionesPage;