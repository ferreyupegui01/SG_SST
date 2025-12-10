// frontend/src/components/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/Sidebar.css'; 
import logo from "../assets/logo-empaquetados.png";

// Importamos iconos
import { 
    BsGrid1X2Fill, BsPeopleFill, BsCalendarWeek, BsClipboard2CheckFill, 
    BsExclamationTriangleFill, BsGraphUpArrow, BsHouseFill, BsCpuFill, 
    BsShieldFillExclamation, BsFillFolderFill, BsHeartPulseFill, BsArchiveFill, 
    BsFileEarmarkTextFill, BsShieldLockFill, BsListCheck, 
    BsBarChartFill, BsConeStriped, BsEnvelopeExclamation, BsJournalRichtext,
    BsFileText, BsCurrencyDollar, BsClockHistory 
} from 'react-icons/bs';

const Sidebar = ({ isOpen, onClose }) => {
    const { usuario } = useAuth(); 
    const containerClass = `sidebar-container ${isOpen ? 'open' : ''}`;

    // Roles
    const isSuperAdmin = usuario?.rol === 'Super Admin';
    const isAdminSST = usuario?.rol === 'Administrador SST';
    const isColaborador = usuario?.rol === 'Colaborador';

    return (
        <aside className={containerClass}>
            <div className="sidebar-logo">
                <img src={logo} alt="Logo" className="sidebar-logo-img"/>
                <h3>SG-SST App</h3>
                <button className="sidebar-close-btn" onClick={onClose}>&times;</button>
            </div>

            <nav className="sidebar-nav">
                
                {/* =================================================
                   MENÚ EXCLUSIVO SUPER ADMIN
                   ================================================= */}
                {isSuperAdmin && (
                    <>
                        <div className="sidebar-section-label">CENTRO DE COMANDO</div>
                        
                        <NavLink to="/super-admin/dashboard" className="sidebar-link" onClick={onClose}>
                            <BsShieldLockFill /> Dashboard Global
                        </NavLink>

                        <div className="sidebar-section-label">ADMINISTRACIÓN</div>

                        <NavLink to="/usuarios" className="sidebar-link" onClick={onClose}>
                            <BsPeopleFill /> Gestión de Usuarios
                        </NavLink>

                        <NavLink to="/pesv" className="sidebar-link" onClick={onClose}>
                            <BsConeStriped /> Gestión PESV (Estratégico)
                        </NavLink>

                        <NavLink to="/super-admin/formularios" className="sidebar-link" onClick={onClose}>
                            <BsListCheck /> Gestor de Formularios
                        </NavLink>
                        
                        <NavLink to="/presupuesto" className="sidebar-link" onClick={onClose}>
                            <BsCurrencyDollar /> Gestión Presupuesto
                        </NavLink>

                        <NavLink to="/historial" className="sidebar-link" onClick={onClose}>
                            <BsClockHistory /> Historial y Trazabilidad
                        </NavLink>

                        <div className="sidebar-section-label">APROBACIONES</div>

                        <NavLink to="/solicitudes" className="sidebar-link" onClick={onClose}>
                            <BsEnvelopeExclamation /> Solicitudes y Firmas
                        </NavLink>

                        <div className="sidebar-section-label">SEGURIDAD</div>

                        <NavLink to="/logs" className="sidebar-link" onClick={onClose}>
                            <BsFileEarmarkTextFill /> Auditoría (Logs)
                        </NavLink>
                    </>
                )}

                {/* =================================================
                   MENÚ OPERATIVO SST (Solo para Admin SST)
                   ================================================= */}
                {isAdminSST && (
                    <>
                        <div className="sidebar-section-label">GESTIÓN OPERATIVA</div>
                        
                        <NavLink to="/dashboard" className="sidebar-link" onClick={onClose}>
                            <BsGrid1X2Fill /> Dashboard SST
                        </NavLink>

                        <NavLink to="/historial" className="sidebar-link" onClick={onClose}>
                            <BsClockHistory /> Historial y Trazabilidad
                        </NavLink>

                        <NavLink to="/presupuesto" className="sidebar-link" onClick={onClose}>
                            <BsCurrencyDollar /> Presupuesto SST
                        </NavLink>

                        <NavLink to="/usuarios" className="sidebar-link" onClick={onClose}>
                            <BsPeopleFill /> Usuarios Locales
                        </NavLink>

                        <NavLink to="/directorio" className="sidebar-link" onClick={onClose}>
                            <BsJournalRichtext /> Directorio Colaboradores
                        </NavLink>

                        <div className="sidebar-section-label">PROCESOS</div>

                        <NavLink to="/planificacion" className="sidebar-link" onClick={onClose}>
                            <BsCalendarWeek /> Planificación
                        </NavLink>

                        <NavLink to="/inspecciones" className="sidebar-link" onClick={onClose}>
                            <BsClipboard2CheckFill /> Inspecciones
                        </NavLink>

                        <NavLink to="/pesv" className="sidebar-link" onClick={onClose}>
                            <BsConeStriped /> Gestión PESV
                        </NavLink>

                        <NavLink to="/activos" className="sidebar-link" onClick={onClose}>
                            <BsArchiveFill /> Activos y Equipos
                        </NavLink>

                        <NavLink to="/reportes" className="sidebar-link" onClick={onClose}>
                            <BsExclamationTriangleFill /> Reportes Colaboradores
                        </NavLink>

                        <div className="sidebar-section-label">ANÁLISIS Y CIERRE</div>

                        <NavLink to="/indicadores" className="sidebar-link" onClick={onClose}>
                            <BsBarChartFill /> Indicadores
                        </NavLink>

                        <NavLink to="/acpm" className="sidebar-link" onClick={onClose}>
                            <BsGraphUpArrow /> Acciones (ACPM)
                        </NavLink>
                        
                        <NavLink to="/actas" className="sidebar-link" onClick={onClose}>
                            <BsFileText /> Actas de Comité
                        </NavLink>

                        <NavLink to="/solicitudes" className="sidebar-link" onClick={onClose}>
                            <BsEnvelopeExclamation /> Solicitudes a Gerencia
                        </NavLink>

                        <NavLink to="/documentos" className="sidebar-link" onClick={onClose}>
                            <BsFillFolderFill /> Documentación
                        </NavLink>

                        <NavLink to="/medicina" className="sidebar-link" onClick={onClose}>
                            <BsHeartPulseFill /> Medicina Laboral
                        </NavLink>
                    </>
                )}

                {/* =================================================
                   MENÚ COLABORADOR
                   ================================================= */}
                {isColaborador && (
                    <>
                        <div className="sidebar-section-label">MI GESTIÓN</div>
                        <NavLink to="/dashboard" className="sidebar-link" onClick={onClose}>
                            <BsHouseFill /> Inicio
                        </NavLink>
                        <NavLink to="/reportar-maquina" className="sidebar-link" onClick={onClose}>
                            <BsCpuFill /> Reportar Máquina
                        </NavLink>
                        <NavLink to="/reportar-seguridad" className="sidebar-link" onClick={onClose}>
                            <BsShieldFillExclamation /> Reportar Seguridad
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <span style={{padding: '1rem', fontSize: '0.75rem', color: '#ffffff80', display: 'block', textAlign: 'center'}}>
                    {usuario?.nombre}<br/>
                    <strong style={{ color: 'white', textTransform: 'uppercase' }}>{usuario?.rol}</strong>
                </span>
            </div>
        </aside>
    );
};

export default Sidebar;