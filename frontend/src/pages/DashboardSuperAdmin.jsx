// frontend/src/pages/DashboardSuperAdmin.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiService'; // Usamos apiFetch directo para simplificar
import { Link } from 'react-router-dom';
import '../style/DashboardAdmin.css'; // Reutilizamos estilos base
// Iconos
import { 
    BsShieldLockFill, BsActivity, BsPeopleFill, BsDatabaseFillGear, 
    BsCheckCircleFill, BsExclamationOctagonFill, BsGraphUp, BsBellFill 
} from 'react-icons/bs';
// Gráficas
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const DashboardSuperAdmin = () => {
    const { usuario } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar Datos
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Llamamos al nuevo endpoint unificado
                const respuesta = await apiFetch('/dashboard/super-admin');
                setData(respuesta);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    if (loading) return <div className="page-container"><p>Cargando Centro de Comando...</p></div>;

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

            {/* --- SECCIÓN 2: RENDIMIENTO Y LOGS (GRID ASIMÉTRICO) --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* GRÁFICA DE RENDIMIENTO */}
                <div className="page-content-card">
                    <h2 style={{marginBottom: '1.5rem', display:'flex', alignItems:'center', gap:'10px'}}>
                        <BsActivity /> Rendimiento del Sistema (Últimos 7 días)
                    </h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={grafica}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="Dia" />
                                <YAxis />
                                <RechartsTooltip 
                                    contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}
                                />
                                <Bar dataKey="CantidadAcciones" name="Acciones/Eventos" fill="#005A5B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* NOTIFICACIONES / LOGS EN VIVO */}
                <div className="page-content-card" style={{maxHeight: '400px', overflowY: 'auto'}}>
                    <h2 style={{marginBottom: '1rem', display:'flex', alignItems:'center', gap:'10px', fontSize:'1.2rem'}}>
                        <BsBellFill style={{color:'#f1c40f'}} /> Actividad Reciente
                    </h2>
                    {logs.length === 0 ? (
                        <p style={{color:'#999'}}>No hay actividad reciente.</p>
                    ) : (
                        <ul style={{listStyle:'none', padding:0}}>
                            {logs.map(log => (
                                <li key={log.ID_Log} style={{
                                    padding: '0.8rem 0',
                                    borderBottom: '1px solid #eee',
                                    fontSize: '0.85rem'
                                }}>
                                    <div style={{fontWeight:'bold', color:'#333', marginBottom:'0.2rem'}}>
                                        {log.Accion}
                                    </div>
                                    <div style={{color:'#666', marginBottom:'0.2rem'}}>
                                        {log.Descripcion.substring(0, 60)}{log.Descripcion.length > 60 ? '...' : ''}
                                    </div>
                                    <div style={{fontSize:'0.75rem', color:'#999', display:'flex', justifyContent:'space-between'}}>
                                        <span>👤 {log.NombreUsuario}</span>
                                        <span>🕒 {new Date(log.FechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div style={{textAlign:'center', marginTop:'1rem'}}>
                        <Link to="/logs" className="btn btn-secondary btn-sm" style={{fontSize:'0.8rem'}}>Ver Auditoría Completa</Link>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 3: ACCESOS RÁPIDOS DE CONTROL --- */}
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
                {/* Próximamente: Permisos Dinámicos */}
                <div className="kpi-card" style={{ borderLeft: '4px solid #6c757d', padding:'1rem', opacity:0.6, cursor:'not-allowed' }}>
                    <h4 style={{margin:0, color:'#6c757d'}}>Permisos Dinámicos</h4>
                    <small style={{color:'#666'}}>Próximamente (Fase 3)</small>
                </div>
            </div>
        </div>
    );
};

export default DashboardSuperAdmin;