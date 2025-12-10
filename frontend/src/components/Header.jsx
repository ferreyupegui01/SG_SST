// frontend/src/components/Header.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../style/Header.css';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/logo-empaquetados.png";
import { BsList, BsExclamationCircleFill } from 'react-icons/bs';

// Importamos el componente de Campana y Modal
import NotificationBell from './NotificationBell'; 
import ModalMiPerfil from './ModalMiPerfil';

const Header = ({ onToggleSidebar }) => { 
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const [modalPerfilOpen, setModalPerfilOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- LÓGICA DE ROLES Y ALERTAS ---
    const esColaborador = usuario?.rol === 'Colaborador';
    
    // Verificamos si falta el correo, PERO solo si NO es colaborador.
    // Si es colaborador, 'mostrarAlerta' siempre será falso.
    const tieneCorreo = usuario?.email && usuario.email !== '';
    const mostrarAlerta = !tieneCorreo && !esColaborador;

    return (
        <>
            <header className="header-container">
                
                {!esColaborador && (
                    <button className="header-toggle-btn" onClick={onToggleSidebar}>
                        <BsList />
                    </button>
                )}

                {esColaborador && (
                    <img 
                        src={logo} 
                        alt="Logo Empaquetados El Trece" 
                        className="sidebar-logo-img3"
                    />
                )}

                <div className="header-title-placeholder"></div>
        
                <div className="header-user-info">
                    
                    {/* Alerta de Texto (Solo visible si falta correo y NO es colaborador) */}
                    {mostrarAlerta && (
                        <div 
                            style={{
                                color:'#dc3545', marginRight:'15px', display:'flex', alignItems:'center', 
                                gap:'5px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'bold',
                                animation: 'pulse 2s infinite'
                            }}
                            onClick={() => setModalPerfilOpen(true)}
                            title="Haz clic para configurar tu correo"
                        >
                            <BsExclamationCircleFill /> Configurar Correo
                        </div>
                    )}

                    <NotificationBell />
                    
                    <div className="header-separator"></div>

                    <div className="user-details">
                        <span className="user-name">
                            {usuario ? usuario.nombre : 'Usuario'}
                        </span>
                        <span className="user-role">
                            {usuario ? usuario.rol : ''}
                        </span>
                    </div>

                    {/* Avatar Clickeable */}
                    <div 
                        className="user-avatar" 
                        onClick={() => setModalPerfilOpen(true)}
                        style={{cursor: 'pointer', position:'relative'}}
                        title="Ver Mi Perfil"
                    >
                        {usuario ? usuario.nombre[0].toUpperCase() : 'U'}
                        
                        {/* Punto Rojo (Solo si corresponde mostrar alerta) */}
                        {mostrarAlerta && (
                            <span style={{
                                position:'absolute', bottom:'-2px', right:'-2px', 
                                width:'12px', height:'12px', backgroundColor:'#dc3545', 
                                borderRadius:'50%', border:'2px solid white'
                            }}></span>
                        )}
                    </div>
                    
                    <button onClick={handleLogout} className="header-logout-button">
                        <span className="logout-text">Cerrar Sesión</span>
                        <span className="logout-icon">⏻</span>
                    </button>
                </div>
            </header>

            {/* Modal */}
            {modalPerfilOpen && (
                <ModalMiPerfil alCerrar={() => setModalPerfilOpen(false)} />
            )}
        </>
    );
};

export default Header;