// frontend/src/pages/DashboardSuperAdmin.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiService'; 
// Importamos el servicio de la gráfica que creamos previamente
import { getAdminActividadesEstado } from '../services/dashboardService'; 
import { Link } from 'react-router-dom';
import '../style/DashboardAdmin.css'; 

// Iconos
import { 
    BsShieldLockFill, BsActivity, BsPeopleFill, 
    BsCheckCircleFill, BsExclamationOctagonFill, BsGraphUp, BsBellFill, BsPieChartFill
} from 'react-icons/bs';

// Gráficas (Añadimos PieChart y componentes necesarios)
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

const DashboardSuperAdmin = () => {
    const { usuario } = useAuth();
    
    // Estados
    const [data, setData] = useState(null); // Data general (KPIs, Barras, Logs)
    const [actividadesGrafica, setActividadesGrafica] = useState([]); // Data para la gráfica de pastel
    const [loading, setLoading] = useState(true);

    // Colores para la gráfica de pastel
    const COLORES_GRAFICA = {
        'Realizada': '#28a745',  // Verde
        'Pendiente': '#ffc107',  // Amarillo
        'Cancelada': '#dc3545'   // Rojo
    };

    // Cargar Datos
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Hacemos las dos peticiones en paralelo
                const [respuestaGeneral, respuestaActividades] = await Promise.all([
                    apiFetch('/dashboard/super-admin'),
                    getAdminActividadesEstado()
                ]);

                setData(respuestaGeneral);
                setActividadesGrafica(respuestaActividades);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    if (loading) return <div className="page-container"><p style={{padding:'2rem', textAlign:'center'}}>Cargando Centro de Comando...</p></div>;
    
    const { kpis, grafica, logs } = data;

    return (
        <div className="page-container">
            {/* --- HEADER --- */}
            <div className="dashboard-admin-header" style={{ borderBottom: '4px solid #f1c40f', paddingBottom: '1rem' }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <h1 style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <BsShieldLockFill style={{color: '#f1c40f'}}/> Centro de Comando
                        </h1>
                        <p>Super Usuario: <strong>{usuario.nombre}</strong></p>
                    </div>
                    <div style={{textAlign:'right'}}>
                        <span className="status-pill status-activo">Sistema Operativo</span>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 1: KPIs GLOBALES --- */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h3><BsPeopleFill style={{color:'#007BFF'}}/> Usuarios Totales</h3>
                    <div className="kpi-value">{kpis?.TotalUsuarios || 0}</div>
                </div>
                <div className="kpi-card">
                    <h3><BsCheckCircleFill style={{color:'#28a745'}}/> Inspecciones</h3>
                    <div className="kpi-value">{kpis?.TotalInspecciones || 0}</div>
                </div>
                <div className="kpi-card">
                    <h3><BsExclamationOctagonFill style={{color:'#dc3545'}}/> Reportes</h3>
                    <div className="kpi-value">{kpis?.TotalReportes || 0}</div>
                </div>
                <div className="kpi-card">
                    <h3><BsGraphUp style={{color:'#005A5B'}}/> ACPM Globales</h3>
                    <div className="kpi-value">{kpis?.TotalACPM || 0}</div>
                </div>
            </div>

            {/* --- SECCIÓN 2: GRÁFICAS (GRID DE 2 COLUMNAS) --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* 1. GRÁFICA DE RENDIMIENTO (BARRAS) */}
                <div className="page-content-card">
                    <h2 style={{marginBottom: '1.5rem', display:'flex', alignItems:'center', gap:'10px', fontSize:'1.1rem'}}>
                        <BsActivity /> Rendimiento (Últimos 7 días)
                    </h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={grafica}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="Dia" />
                                <YAxis />
                                <Tooltip 
                                    contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}
                                />
                                <Bar dataKey="CantidadAcciones" name="Eventos" fill="#005A5B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. GRÁFICA DE ACTIVIDADES (PASTEL) - NUEVA PARA SUPER ADMIN */}
                <div className="page-content-card">
                    <h2 style={{marginBottom: '1.5rem', display:'flex', alignItems:'center', gap:'10px', fontSize:'1.1rem'}}>
                        <BsPieChartFill /> Estado Global de Actividades
                    </h2>
                    <div style={{ width: '100%', height: 300, display:'flex', justifyContent:'center', alignItems:'center' }}>
                        {actividadesGrafica.length === 0 ? (
                            <p style={{color:'#999'}}>No hay actividades registradas.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={actividadesGrafica}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {actividadesGrafica.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORES_GRAFICA[entry.name] || '#8884d8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius:'8px'}} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>

            {/* --- SECCIÓN 3: LOGS EN VIVO (Ancho Completo) --- */}
            <div className="page-content-card" style={{ marginBottom: '2rem' }}>
                <h2 style={{marginBottom: '1rem', display:'flex', alignItems:'center', gap:'10px', fontSize:'1.2rem'}}>
                    <BsBellFill style={{color:'#f1c40f'}} /> Auditoría Reciente
                </h2>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {logs.length === 0 ? (
                        <p style={{color:'#999', padding:'1rem'}}>No hay actividad reciente.</p>
                    ) : (
                        <table className="data-table" style={{fontSize:'0.9rem'}}>
                            <thead>
                                <tr>
                                    <th>Hora</th>
                                    <th>Usuario</th>
                                    <th>Acción</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.ID_Log}>
                                        <td style={{whiteSpace:'nowrap', color:'#666'}}>
                                            {new Date(log.FechaHora).toLocaleDateString()} {new Date(log.FechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td><strong>{log.NombreUsuario}</strong></td>
                                        <td><span className="status-pill status-proceso" style={{fontSize:'0.75rem'}}>{log.Accion}</span></td>
                                        <td>{log.Descripcion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div style={{textAlign:'center', marginTop:'1rem'}}>
                    <Link to="/logs" className="btn btn-secondary btn-sm">Ver Historial Completo</Link>
                </div>
            </div>

            {/* --- ACCESOS RÁPIDOS --- */}
            <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', color: '#666'}}>Panel de Control</h2>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <Link to="/usuarios" className="kpi-card-link">
                    <div className="kpi-card" style={{ borderLeft: '4px solid #007BFF', padding:'1rem' }}>
                        <h4 style={{margin:0, color:'#007BFF'}}>Gestión de Usuarios</h4>
                        <small style={{color:'#666'}}>Permisos y Roles</small>
                    </div>
                </Link>
                <Link to="/logs" className="kpi-card-link">
                    <div className="kpi-card" style={{ borderLeft: '4px solid #f1c40f', padding:'1rem' }}>
                        <h4 style={{margin:0, color:'#f1c40f'}}>Auditoría Total</h4>
                        <small style={{color:'#666'}}>Traza de seguridad</small>
                    </div>
                </Link>
                <Link to="/super-admin/formularios" className="kpi-card-link">
                    <div className="kpi-card" style={{ borderLeft: '4px solid #28a745', padding:'1rem' }}>
                        <h4 style={{margin:0, color:'#28a745'}}>Formularios</h4>
                        <small style={{color:'#666'}}>Diseñador de Inspecciones</small>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default DashboardSuperAdmin;