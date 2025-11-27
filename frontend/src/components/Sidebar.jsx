// frontend/src/components/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/Sidebar.css'; 
import logo from "../assets/logo-empaquetados.png";

import { 
    BsGrid1X2Fill, BsPeopleFill, BsCalendarWeek, BsClipboard2CheckFill, 
    BsExclamationTriangleFill, BsGraphUpArrow, BsHouseFill, BsCpuFill, 
    BsShieldFillExclamation, BsFillFolderFill, BsHeartPulseFill, BsArchiveFill, 
    BsFileEarmarkTextFill, BsShieldLockFill, BsJournalCheck, BsListCheck, 
    BsBarChartFill, BsConeStriped, BsEnvelopeExclamation, BsJournalRichtext
} from 'react-icons/bs';

const Sidebar = ({ isOpen, onClose }) => {
    const { usuario } = useAuth(); 
    const containerClass = `sidebar-container ${isOpen ? 'open' : ''}`;

    const isSuperAdmin = usuario?.rol === 'Super Admin';
    const isAdminSST = usuario?.rol === 'Administrador SST';
    const isCalidad = usuario?.rol === 'Gestion de Calidad';
    const isColaborador = usuario?.rol === 'Colaborador';

    const isGestorSST = isAdminSST || isSuperAdmin;

    return (
        <aside className={containerClass}>
            <div className="sidebar-logo">
                <img src={logo} alt="Logo" className="sidebar-logo-img"/>
                <h3>SG-SST App</h3>
                <button className="sidebar-close-btn" onClick={onClose}>&times;</button>
            </div>

            <nav className="sidebar-nav">
                
                {/* SUPER ADMIN */}
                {isSuperAdmin && (
                    <>
                        <div className="sidebar-section-label">SUPER ADMIN</div>
                        <NavLink to="/super-admin/dashboard" className="sidebar-link" onClick={onClose}>
                            <BsShieldLockFill /> Panel de Control
                        </NavLink>
                        <NavLink to="/super-admin/formularios" className="sidebar-link" onClick={onClose}>
                            <BsListCheck /> Gestor de Formularios
                        </NavLink>
                        <NavLink to="/logs" className="sidebar-link" onClick={onClose}>
                            <BsFileEarmarkTextFill /> Auditoría (Logs)
                        </NavLink>
                    </>
                )}

                {/* CALIDAD */}
                {isCalidad && (
                    <>
                        <div className="sidebar-section-label">CALIDAD</div>
                        <NavLink to="/calidad/dashboard" className="sidebar-link" onClick={onClose}>
                            <BsJournalCheck /> Dashboard Calidad
                        </NavLink>
                    </>
                )}

                {/* GESTIÓN SST */}
                {isGestorSST && (
                    <>
                        <div className="sidebar-section-label">GESTIÓN SST</div>
                        
                        {!isSuperAdmin && (
                            <NavLink to="/dashboard" className="sidebar-link" onClick={onClose}>
                                <BsGrid1X2Fill /> Dashboard Operativo
                            </NavLink>
                        )}

                        <NavLink to="/usuarios" className="sidebar-link" onClick={onClose}>
                            <BsPeopleFill /> Usuarios
                        </NavLink>

                        {/* --- ENLACE NUEVO: DIRECTORIO DE NÓMINA --- */}
                        <NavLink to="/directorio" className="sidebar-link" onClick={onClose}>
                            <BsJournalRichtext /> Directorio Nómina
                        </NavLink>
                        {/* ------------------------------------------ */}

                        <NavLink to="/solicitudes" className="sidebar-link" onClick={onClose}>
                            <BsEnvelopeExclamation /> Solicitudes
                        </NavLink>

                        <NavLink to="/indicadores" className="sidebar-link" onClick={onClose}>
                            <BsBarChartFill /> Indicadores
                        </NavLink>

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
                            <BsArchiveFill /> Activos
                        </NavLink>

                        <NavLink to="/reportes" className="sidebar-link" onClick={onClose}>
                            <BsExclamationTriangleFill /> Reportes
                        </NavLink>

                        <NavLink to="/acpm" className="sidebar-link" onClick={onClose}>
                            <BsGraphUpArrow /> Acciones (ACPM)
                        </NavLink>

                        <NavLink to="/documentos" className="sidebar-link" onClick={onClose}>
                            <BsFillFolderFill /> Gestión Documental
                        </NavLink>

                        <NavLink to="/medicina" className="sidebar-link" onClick={onClose}>
                            <BsHeartPulseFill /> Medicina Laboral
                        </NavLink>
                    </>
                )}

                {/* COLABORADOR */}
                {isColaborador && (
                    <>
                        <div className="sidebar-section-label">COLABORADOR</div>
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
                    <strong style={{ color: 'white' }}>{usuario?.rol}</strong>
                </span>
            </div>
        </aside>
    );
};

export default Sidebar;