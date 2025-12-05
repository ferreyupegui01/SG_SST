// frontend/src/components/Header.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../style/Header.css';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/logo-empaquetados.png";
import { BsList } from 'react-icons/bs'; // Icono de hamburguesa

// Importamos el componente de Campana
import NotificationBell from './NotificationBell'; 

const Header = ({ onToggleSidebar }) => { // Recibimos la función del Layout
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Verificamos si es Colaborador
    const esColaborador = usuario?.rol === 'Colaborador';

    return (
        <header className="header-container">
            
            {/* --- BOTÓN HAMBURGUESA (Visible solo en Móvil/Tablet) --- */}
            {/* Solo se muestra si NO es colaborador (porque el colaborador no tiene sidebar) */}
            {!esColaborador && (
                <button className="header-toggle-btn" onClick={onToggleSidebar}>
                    <BsList />
                </button>
            )}

            {/* --- LOGO (SOLO VISIBLE PARA COLABORADOR) --- */}
            {esColaborador && (
                <img 
                    src={logo} 
                    alt="Logo Empaquetados El Trece" 
                    className="sidebar-logo-img3"
                />
            )}

            {/* Placeholder flexible para empujar el contenido a la derecha */}
            <div className="header-title-placeholder"></div>
       
            {/* --- Sección Derecha: Usuario y Notificaciones --- */}
            <div className="header-user-info">
                
                {/* 1. CAMPANA DE NOTIFICACIONES */}
                <NotificationBell />
                
                {/* Separador vertical */}
                <div className="header-separator"></div>

                {/* 2. Información del Usuario */}
                <div className="user-details">
                    <span className="user-name">
                        {usuario ? usuario.nombre : 'Usuario'}
                    </span>
                    <span className="user-role">
                        {usuario ? usuario.rol : ''}
                    </span>
                </div>

                <div className="user-avatar">
                    {usuario ? usuario.nombre[0].toUpperCase() : 'U'}
                </div>
                
                {/* 3. Botón Cerrar Sesión */}
                <button onClick={handleLogout} className="header-logout-button">
                    <span className="logout-text">Cerrar Sesión</span>
                    <span className="logout-icon">⏻</span>
                </button>
            </div>
        </header>
    );
};

export default Header;