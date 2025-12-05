// frontend/src/components/NotificationBell.jsx

import React, { useState, useEffect, useRef } from 'react';
import { BsBellFill, BsTrash, BsXLg } from 'react-icons/bs'; // Importamos BsXLg para la X
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiService';
import '../style/Header.css';

const NotificationBell = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    
    // Referencia para detectar clics fuera del componente
    const dropdownRef = useRef(null);

    const cargarNotificaciones = async () => {
        try {
            const data = await apiFetch('/notificaciones');
            setNotificaciones(data);
        } catch (err) {
            console.error("Error notificaciones:", err);
        }
    };

    // Polling: Busca notificaciones cada 30 segundos
    useEffect(() => {
        cargarNotificaciones();
        const interval = setInterval(cargarNotificaciones, 30000);
        return () => clearInterval(interval);
    }, []);

    // Efecto para cerrar el dropdown si se hace clic fuera de él
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        // Agregar el listener
        document.addEventListener("mousedown", handleClickOutside);
        // Limpiar el listener
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // Al hacer clic en una notificación: marca leída y navega
    const handleClicNotificacion = async (n) => {
        if (!n.Leida) {
            try {
                await apiFetch(`/notificaciones/${n.ID_Notificacion}/leida`, { method: 'PATCH' });
                setNotificaciones(prev => prev.map(item => 
                    item.ID_Notificacion === n.ID_Notificacion ? { ...item, Leida: true } : item
                ));
            } catch (err) { console.error(err); }
        }
        setShowDropdown(false);
        if (n.RutaAccion) navigate(n.RutaAccion);
    };

    // Borrar notificación (Ocultar)
    const handleEliminar = async (e, id) => {
        e.stopPropagation(); 
        try {
            await apiFetch(`/notificaciones/${id}/ocultar`, { method: 'PATCH' });
            setNotificaciones(prev => prev.filter(n => n.ID_Notificacion !== id));
        } catch (err) { console.error(err); }
    };

    const conteoNoLeidas = notificaciones.filter(n => !n.Leida).length;

    return (
        <div className="notification-container" style={{position: 'relative', marginRight: '1.5rem'}} ref={dropdownRef}>
            
            {/* --- ICONO DE CAMPANA --- */}
            <div 
                className="bell-icon" 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{cursor: 'pointer', position: 'relative', fontSize: '1.2rem', color: '#6c757d'}}
                title="Notificaciones"
            >
                <BsBellFill />
                {conteoNoLeidas > 0 && (
                    <span className="notification-badge" style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        backgroundColor: '#dc3545', color: 'white', borderRadius: '50%',
                        padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold'
                    }}>
                        {conteoNoLeidas}
                    </span>
                )}
            </div>

            {/* --- VENTANA DESPLEGABLE --- */}
            {showDropdown && (
                <div className="notification-dropdown" style={{
                    position: 'absolute', top: '150%', right: '-10px', width: '350px',
                    backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    borderRadius: '12px', zIndex: 2000, border: '1px solid #dee2e6',
                    maxHeight: '400px', display: 'flex', flexDirection: 'column'
                }}>
                    {/* HEADER DE LA VENTANA */}
                    <div style={{
                        padding: '12px 15px', borderBottom: '1px solid #eee', 
                        fontWeight: 'bold', fontSize: '1rem', color: '#333',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: '#f8f9fa', borderRadius: '12px 12px 0 0'
                    }}>
                        <span>Notificaciones</span>
                        
                        {/* --- BOTÓN "X" PARA CERRAR --- */}
                        <button 
                            onClick={() => setShowDropdown(false)}
                            style={{
                                background:'none', border:'none', cursor:'pointer', 
                                color:'#6c757d', display:'flex', alignItems:'center', padding: '4px'
                            }}
                            title="Cerrar ventana"
                        >
                            <BsXLg size={16} />
                        </button>
                    </div>

                    {/* LISTA DE NOTIFICACIONES */}
                    <div style={{overflowY: 'auto', flex: 1}}>
                        {notificaciones.length === 0 ? (
                            <div style={{padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.9rem'}}>
                                No tienes notificaciones pendientes.
                            </div>
                        ) : (
                            notificaciones.map(n => (
                                <div 
                                    key={n.ID_Notificacion} 
                                    onClick={() => handleClicNotificacion(n)}
                                    style={{
                                        padding: '12px 15px', borderBottom: '1px solid #f0f0f0', 
                                        cursor: 'pointer', transition: 'background 0.2s',
                                        backgroundColor: n.Leida ? '#ffffff' : '#eef7ff', 
                                        display: 'flex', gap: '10px', alignItems: 'flex-start', position: 'relative'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.Leida ? '#ffffff' : '#eef7ff'}
                                >
                                    {/* Punto azul si no está leída */}
                                    {!n.Leida && (
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%', 
                                            backgroundColor: '#007BFF', marginTop: '6px', flexShrink: 0
                                        }}></div>
                                    )}

                                    <div style={{flex: 1, opacity: n.Leida ? 0.7 : 1}}>
                                        <div style={{fontWeight: n.Leida ? '500' : '700', fontSize: '0.9rem', color: n.Leida ? '#555' : '#005A5B', marginBottom: '2px'}}>
                                            {n.Titulo}
                                        </div>
                                        <div style={{fontSize: '0.85rem', color: '#666', lineHeight: '1.4'}}>
                                            {n.Mensaje}
                                        </div>
                                        <div style={{fontSize: '0.75rem', color: '#aaa', marginTop: '5px'}}>
                                            {new Date(n.FechaCreacion).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Botón Papelera para ocultar notificación individual */}
                                    <button 
                                        onClick={(e) => handleEliminar(e, n.ID_Notificacion)}
                                        title="Eliminar de la lista"
                                        style={{
                                            background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', 
                                            padding: '2px', opacity: 0.6, marginTop: '2px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                    >
                                        <BsTrash size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;