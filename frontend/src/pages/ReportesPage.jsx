// frontend/src/pages/ReportesPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getReportesMaquina, getReportesSeguridad } from '../services/reportService';
import '../index.css'; 
import '../style/PlanificacionPage.css'; 

// --- Importamos los modales ---
import ModalVerReporte from '../components/ModalVerReporte.jsx';
import ModalCrearACPM from '../components/ModalCrearACPM.jsx';
import ModalVerACPM from '../components/ModalVerACPM.jsx'; 
import { BsPlusLg, BsEyeFill } from 'react-icons/bs';

const ReportesPage = () => {
    // --- Estados ---
    const [reportesMaquina, setReportesMaquina] = useState([]);
    const [reportesSeguridad, setReportesSeguridad] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState('Todos'); 
    
    // --- Estados de Modales ---
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [modalCrearAcpmAbierto, setModalCrearAcpmAbierto] = useState(false);
    const [modalVerAcpmId, setModalVerAcpmId] = useState(null); 
    const [reporteSeleccionado, setReporteSeleccionado] = useState(null); 
    const [acpmInitialData, setAcpmInitialData] = useState({});

    // --- Carga Inicial ---
    const cargarReportes = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setIsLoading(true);
            const [dataMaquina, dataSeguridad] = await Promise.all([
                getReportesMaquina(),
                getReportesSeguridad()
            ]);
            setReportesMaquina(dataMaquina);
            setReportesSeguridad(dataSeguridad);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRefreshing) setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarReportes(false); 
    }, []); 

    // --- Lógica de Filtrado ---
    const reportesMaquinaFiltrados = useMemo(() => {
        if (filtroEstado === 'Todos') return reportesMaquina;
        return reportesMaquina.filter(rep => rep.EstadoRevision === filtroEstado);
    }, [reportesMaquina, filtroEstado]);

    const reportesSeguridadFiltrados = useMemo(() => {
        if (filtroEstado === 'Todos') return reportesSeguridad;
        return reportesSeguridad.filter(rep => rep.EstadoRevision === filtroEstado);
    }, [reportesSeguridad, filtroEstado]);


    // --- Manejadores de Modales ---
    
    const abrirModalVer = (reporte, tipo) => {
        setReporteSeleccionado({ reporte, tipo });
        setModalVerAbierto(true);
    };

    // --- CORRECCIÓN: Recargar tabla AL CERRAR el modal ---
    const cerrarModalVer = () => {
        setModalVerAbierto(false);
        setReporteSeleccionado(null);
        // Recargamos aquí para que el estado "Nuevo" cambie a "Revisado" visualmente
        cargarReportes(true); 
    };

    const abrirModalCrearACPM = (reporte, tipo) => {
        if (tipo === 'maquina') {
            setAcpmInitialData({
                origen: `Reporte Máquina ID: ${reporte.ID_ReporteMaquina}`,
                descripcionProblema: `(Activo: ${reporte.NombreActivo}) ${reporte.DescripcionProblema}`,
                idReporteMaquinaOrigen: reporte.ID_ReporteMaquina
            });
        } else { 
            setAcpmInitialData({
                origen: `Reporte Seguridad ID: ${reporte.ID_ReporteSeguridad}`,
                descripcionProblema: `(Área: ${reporte.UbicacionArea}) ${reporte.Descripcion}`,
                idReporteSeguridadOrigen: reporte.ID_ReporteSeguridad
            });
        }
        setModalCrearAcpmAbierto(true);
    };
    
    const cerrarModalCrearACPM = () => {
        setModalCrearAcpmAbierto(false);
        setAcpmInitialData({});
    };
    
    const handleAcpmCreada = (nuevoIdACPM) => {
        cerrarModalCrearACPM();
        cargarReportes(true); 
        setModalVerAcpmId(nuevoIdACPM); 
    };
    
    const abrirModalVerACPM = (idACPM) => {
        setModalVerAcpmId(idACPM);
    };
    const cerrarModalVerACPM = () => {
        setModalVerAcpmId(null);
    };

    const formatearFechaHora = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        return new Date(fechaISO).toLocaleString('es-CO');
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gestión de Reportes de Colaboradores</h1>
            </div>

            <div className="cronograma-selector" style={{ marginBottom: '2rem' }}>
                <label htmlFor="filtro-estado">Filtrar por Estado:</label>
                <select id="filtro-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    <option value="Todos">Todos</option>
                    <option value="Nuevo">Nuevos</option>
                    <option value="Revisado">Revisados</option>
                </select>
            </div>

            {isLoading && <p>Cargando reportes...</p>}
            {error && <p className="error-message">Error: {error}</p>}

            {/* --- Tarjeta "Reportes de Máquina" --- */}
            {!isLoading && !error && (
                <div className="page-content-card" style={{ marginBottom: '2rem' }}>
                    <h2>Reportes de Estado de Máquina (Pre-uso)</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Máquina/Activo</th>
                                    <th>Reportado por</th>
                                    <th>Estado Reportado</th>
                                    <th>Descripción</th>
                                    <th>Estado Revisión</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportesMaquinaFiltrados.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center' }}>No hay reportes de máquina {filtroEstado !== 'Todos' ? `con estado "${filtroEstado}"` : ''}.</td></tr>
                                ) : (
                                    reportesMaquinaFiltrados.map((rep) => (
                                        <tr key={rep.ID_ReporteMaquina}>
                                            <td>{formatearFechaHora(rep.FechaHoraReporte)}</td>
                                            <td>{rep.NombreActivo} ({rep.CodigoActivo})</td>
                                            <td>{rep.NombreUsuarioReporta}</td>
                                            <td><span className={`status-pill ${rep.EstadoReportado === 'OK' ? 'status-activo' : 'status-pendiente'}`}>{rep.EstadoReportado}</span></td>
                                            <td title={rep.DescripcionProblema}>{rep.DescripcionProblema?.substring(0, 30) || 'N/A'}{rep.DescripcionProblema?.length > 30 ? '...' : ''}</td>
                                            <td><span className={`status-pill ${rep.EstadoRevision === 'Nuevo' ? 'status-pendiente' : 'status-inactivo'}`}>{rep.EstadoRevision}</span></td>
                                            <td className="action-buttons">
                                                <button className="btn btn-secondary" onClick={() => abrirModalVer(rep, 'maquina')}>Ver Detalle</button>
                                                {rep.EstadoReportado === 'Con Problema' && (
                                                    rep.ID_ACPM_Vinculada ? (
                                                        <button className="btn btn-success" onClick={() => abrirModalVerACPM(rep.ID_ACPM_Vinculada)}>
                                                            <BsEyeFill /> Ver ACPM
                                                        </button>
                                                    ) : (
                                                        <button className="btn btn-warning" onClick={() =>abrirModalCrearACPM(rep, 'maquina')}>Crear ACPM</button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div> 
                </div>
            )}

            {/* --- Tarjeta "Reportes de Seguridad" --- */}
            {!isLoading && !error && (
                <div className="page-content-card">
                    <h2>Reportes de Seguridad (Actos/Condiciones)</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Reportado por</th>
                                    <th>Ubicación</th>
                                    <th>Descripción</th>
                                    <th>Estado Revisión</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportesSeguridadFiltrados.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center' }}>No hay reportes de seguridad {filtroEstado !== 'Todos' ? `con estado "${filtroEstado}"` : ''}.</td></tr>
                                ) : (
                                    reportesSeguridadFiltrados.map((rep) => (
                                        <tr key={rep.ID_ReporteSeguridad}>
                                            <td>{formatearFechaHora(rep.FechaHoraReporte)}</td>
                                            <td>{rep.TipoReporte}</td>
                                            <td>{rep.NombreUsuarioReporta}</td>
                                            <td>{rep.UbicacionArea}</td>
                                            <td title={rep.Descripcion}>{rep.Descripcion.substring(0, 30)}...</td>
                                            <td><span className={`status-pill ${rep.EstadoRevision === 'Nuevo' ? 'status-pendiente' : 'status-inactivo'}`}>{rep.EstadoRevision}</span></td>
                                            <td className="action-buttons">
                                                <button className="btn btn-secondary" onClick={() => abrirModalVer(rep, 'seguridad')}>Ver Detalle</button>
                                                {rep.ID_ACPM_Vinculada ? (
                                                    <button className="btn btn-success" onClick={() => abrirModalVerACPM(rep.ID_ACPM_Vinculada)}>
                                                        <BsEyeFill /> Ver ACPM
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-warning" onClick={() =>abrirModalCrearACPM(rep, 'seguridad')}>Crear ACPM</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* --- Renderizado de Modales --- */}
            {modalVerAbierto && ( 
                <ModalVerReporte 
                    reporte={reporteSeleccionado.reporte} 
                    tipo={reporteSeleccionado.tipo} 
                    alCerrar={cerrarModalVer} 
                /> 
            )}
            
            {modalCrearAcpmAbierto && ( 
                <ModalCrearACPM 
                    alCerrar={cerrarModalCrearACPM} 
                    alExito={handleAcpmCreada} 
                    initialData={acpmInitialData} 
                /> 
            )}

            {modalVerAcpmId && ( <ModalVerACPM acpmId={modalVerAcpmId} alCerrar={cerrarModalVerACPM} /> )}
        </div>
    );
};

export default ReportesPage;