// frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getMisReportesMaquina, getMisReportesSeguridad } from '../services/reportService';
import { getAdminKPIs, getAdminActividadesPendientes, getAdminReportesRecientes } from '../services/dashboardService';
import ModalVerReporte from '../components/ModalVerReporte'; // <--- IMPORTANTE

import '../style/UsuariosPage.css';
import '../style/DashboardColaborador.css'; 
import '../style/DashboardAdmin.css';

// --- VISTA DEL COLABORADOR ---
const DashboardColaborador = ({ usuario }) => {
    const [misReportes, setMisReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estados para el modal de detalle
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

    useEffect(() => {
        const cargarMisReportes = async () => {
            try {
                const [maquina, seguridad] = await Promise.all([
                    getMisReportesMaquina(),
                    getMisReportesSeguridad()
                ]);
                // Unificar formatos para la tabla
                const maqFormateados = maquina.map(r => ({ 
                    id: `maq-${r.ID_ReporteMaquina}`,
                    ID_ReporteMaquina: r.ID_ReporteMaquina, // ID Real para el modal
                    fecha: r.FechaHoraReporte,
                    tipo: 'Máquina (Pre-uso)',
                    rawTipo: 'maquina', // Para saber qué endpoint llamar
                    ref: r.NombreActivo, 
                    estado: r.EstadoRevision
                }));
                const segFormateados = seguridad.map(r => ({ 
                    id: `seg-${r.ID_ReporteSeguridad}`,
                    ID_ReporteSeguridad: r.ID_ReporteSeguridad, // ID Real para el modal
                    fecha: r.FechaHoraReporte,
                    tipo: r.TipoReporte, 
                    rawTipo: 'seguridad', // Para saber qué endpoint llamar
                    ref: r.UbicacionArea, 
                    estado: r.EstadoRevision
                }));
                
                const todos = [...maqFormateados, ...segFormateados];
                todos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                setMisReportes(todos);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar el historial de reportes.');
            } finally {
                setIsLoading(false);
            }
        };
        cargarMisReportes();
    }, []);

    const formatearFecha = (fechaISO) => new Date(fechaISO).toLocaleString('es-CO');

    // Función para abrir el modal
    const abrirDetalle = (rep) => {
        setReporteSeleccionado(rep);
        setModalVerAbierto(true);
    };

    return (
        <div className="dashboard-colaborador">
            <div className="dashboard-colaborador-header">
                <h1>Hola, {usuario.nombre}</h1>
            </div>
            <div className="report-cards-container">
                <Link to="/reportar-maquina" className="report-card">
                    <h2>Reportar Estado de Máquina y vehiculos</h2>
                    <p>Diligenciar el reporte pre-uso de su equipo.</p>
                </Link>
                <Link to="/reportar-seguridad" className="report-card">
                    <h2>Reportar Incidente / Condición</h2>
                    <p>Reportar actos, condiciones, incidentes o accidentes.</p>
                </Link>
            </div>
            
            <div className="historial-section">
                <h2>Historial de mis reportes enviados</h2>
                <div className="page-content-card">
                    {isLoading && <p>Cargando historial...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {!isLoading && !error && (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo de Reporte</th>
                                        <th>Equipo / Área</th>
                                        <th>Estado (Revisión)</th>
                                        <th>Acción</th> {/* Columna Nueva */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {misReportes.length === 0 ? (
                                        <tr><td colSpan="5" style={{textAlign: 'center'}}>No has enviado reportes.</td></tr>
                                    ) : (
                                        misReportes.slice(0, 10).map((rep) => (
                                            <tr key={rep.id}>
                                                <td>{formatearFecha(rep.fecha)}</td>
                                                <td>{rep.tipo}</td>
                                                <td>{rep.ref}</td>
                                                <td>
                                                    <span className={`status-pill ${rep.estado === 'Nuevo' ? 'status-pendiente' : 'status-inactivo'}`}>
                                                        {rep.estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-secondary" 
                                                        onClick={() => abrirDetalle(rep)}
                                                    >
                                                        Ver Detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Ver Reporte (Reutilizado) */}
            {modalVerAbierto && reporteSeleccionado && (
                <ModalVerReporte 
                    reporte={reporteSeleccionado} 
                    tipo={reporteSeleccionado.rawTipo} 
                    alCerrar={() => setModalVerAbierto(false)}
                    // No pasamos alExito porque el colaborador no cambia el estado
                />
            )}
        </div>
    );
};

// --- VISTA DEL ADMINISTRADOR (Sin cambios significativos, solo formato) ---
const DashboardAdmin = ({ usuario }) => {
    const [kpis, setKpis] = useState(null);
    const [actividades, setActividades] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const formatearFechaCorta = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        const fecha = new Date(fechaISO.split('T')[0] + 'T00:00:00');
        return fecha.toLocaleDateString('es-CO');
    };

    useEffect(() => {
        const cargarDashboard = async () => {
            try {
                setIsLoading(true);
                const [dataKPIs, dataActividades, dataReportes] = await Promise.all([
                    getAdminKPIs(),
                    getAdminActividadesPendientes(),
                    getAdminReportesRecientes()
                ]);
                setKpis(dataKPIs);
                setActividades(dataActividades);
                setReportes(dataReportes);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar el dashboard.');
            } finally {
                setIsLoading(false);
            }
        };
        cargarDashboard();
    }, []);

    if (isLoading) return <div className="page-container"><p>Cargando dashboard...</p></div>;
    if (error) return <div className="page-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="page-container">
            <div className="dashboard-admin-header">
                <h1>Bienvenido, {usuario.nombre}</h1>
            </div>

            {kpis && (
                <div className="kpi-grid">
                    <Link to="/inspecciones" className="kpi-card-link">
                        <div className="kpi-card kpi-inspecciones">
                            <h3>Inspecciones Realizadas</h3>
                            <div className="kpi-value">{kpis.InspeccionesRealizadas}</div>
                        </div>
                    </Link>
                    <Link to="/reportes" className="kpi-card-link">
                        <div className="kpi-card kpi-reportes-maq">
                            <h3>Reportes de Maquinaria</h3>
                            <div className="kpi-value">{kpis.ReportesMaquinaria}</div>
                        </div>
                    </Link>
                    <Link to="/reportes" className="kpi-card-link">
                        <div className="kpi-card kpi-reportes-seg">
                            <h3>Reportes de Seguridad</h3>
                            <div className="kpi-value">{kpis.ReportesSeguridad}</div>
                        </div>
                    </Link>
                    <Link to="/acpm" className="kpi-card-link">
                        <div className="kpi-card kpi-acpm">
                            <h3>Acciones Creadas (ACPM)</h3>
                            <div className="kpi-value">{kpis.AccionesCreadas}</div>
                        </div>
                    </Link>
                </div>
            )}

            <div className="dashboard-lists-grid">
                <div className="dashboard-list-card">
                    <h2><Link to="/planificacion">Actividades Pendientes</Link></h2>
                    {actividades.length === 0 ? (
                        <p>¡No hay actividades pendientes!</p>
                    ) : (
                        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                            {actividades.map(act => (
                                <li key={act.ID_Actividad} className="dashboard-list-item">
                                    <span className="item-info">{act.NombreActividad}</span>
                                    <span className="item-date">{formatearFechaCorta(act.FechaLimite)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="dashboard-list-card">
                    <h2><Link to="/reportes">Reportes Recientes</Link></h2>
                    {reportes.length === 0 ? (
                        <p>No hay reportes nuevos pendientes.</p>
                    ) : (
                        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                            {reportes.map(rep => (
                                <li key={rep.ID} className="dashboard-list-item">
                                    <div>
                                        <span className="item-info">{rep.TipoReporte}</span>
                                        <small className="item-type" style={{display: 'block'}}>Ref: {rep.Referencia}</small>
                                    </div>
                                    <span className="item-date" style={{color: '#6c757d', fontWeight: 'normal'}}>
                                        {new Date(rep.FechaHoraReporte).toLocaleDateString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const { usuario } = useAuth();
    if (!usuario) return <div>Cargando...</div>; 
    
    return usuario.rol === 'Administrador SST' 
        ? <DashboardAdmin usuario={usuario} /> 
        : <DashboardColaborador usuario={usuario} />;
};

export default DashboardPage;