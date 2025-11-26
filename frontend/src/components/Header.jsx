// frontend/src/components/Header.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../style/Header.css';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/logo-empaquetados.png";

// Importamos el componente de Campana
import NotificationBell from './NotificationBell'; 

const Header = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header-container">
            
            {/* --- LOGO RECUPERADO --- */}
            {/* Se usa la clase 'sidebar-logo-img3' que ya tienes en Header.css con posición absoluta */}
            <img src={logo} alt="Logo Empaquetados El Trece" className="sidebar-logo-img3"/>

            {/* Placeholder izquierdo */}
            <div className="header-title-placeholder"></div>
            
            {/* --- Sección Derecha: Usuario y Notificaciones --- */}
            <div className="header-user-info">
                
                {/* 1. CAMPANA DE NOTIFICACIONES */}
                <NotificationBell />
                
                {/* Separador vertical sutil */}
                <div style={{width:'1px', height:'25px', background:'#dee2e6', margin:'0 1rem'}}></div>

                {/* 2. Información del Usuario */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '0.8rem'}}>
                    <span style={{fontSize: '0.9rem', fontWeight: '600', color: '#333'}}>
                        {usuario ? usuario.nombre : 'Usuario'}
                    </span>
                    <span style={{fontSize: '0.75rem', color: '#6c757d'}}>
                        {usuario ? usuario.rol : ''}
                    </span>
                </div>

                <div className="user-avatar">
                    {usuario ? usuario.nombre[0].toUpperCase() : 'U'}
                </div>
                
                {/* 3. Botón Cerrar Sesión */}
                <button onClick={handleLogout} className="header-logout-button">
                    Cerrar Sesión
                </button>
            </div>
        </header>
    );
};

export default Header;