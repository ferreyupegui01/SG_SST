// frontend/src/components/NotificationBell.jsx

import React, { useState, useEffect } from 'react';
import { BsBellFill, BsX, BsTrash } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiService';
import '../style/Header.css';

const NotificationBell = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    const cargarNotificaciones = async () => {
        try {
            const data = await apiFetch('/notificaciones');
            setNotificaciones(data);
        } catch (err) {
            console.error("Error notificaciones:", err);
        }
    };

    // Polling cada 30s
    useEffect(() => {
        cargarNotificaciones();
        const interval = setInterval(cargarNotificaciones, 30000);
        return () => clearInterval(interval);
    }, []);

    // 1. CLIC EN EL CUERPO: Marca como leída y navega, PERO NO BORRA
    const handleClicNotificacion = async (n) => {
        if (!n.Leida) {
            try {
                await apiFetch(`/notificaciones/${n.ID_Notificacion}/leida`, { method: 'PATCH' });
                // Actualización optimista: Marcamos leída localmente sin borrarla
                setNotificaciones(prev => prev.map(item => 
                    item.ID_Notificacion === n.ID_Notificacion ? { ...item, Leida: true } : item
                ));
            } catch (err) { console.error(err); }
        }
        
        setShowDropdown(false);
        if (n.RutaAccion) navigate(n.RutaAccion);
    };

    // 2. CLIC EN BASURA: Elimina de la vista (Soft Delete)
    const handleEliminar = async (e, id) => {
        e.stopPropagation(); // Evita que se dispare el clic de navegación
        try {
            await apiFetch(`/notificaciones/${id}/ocultar`, { method: 'PATCH' });
            // Aquí sí la quitamos del array local
            setNotificaciones(prev => prev.filter(n => n.ID_Notificacion !== id));
        } catch (err) { console.error(err); }
    };

    // Contamos solo las no leídas para el globito rojo
    const conteoNoLeidas = notificaciones.filter(n => !n.Leida).length;

    return (
        <div className="notification-container" style={{position: 'relative', marginRight: '1.5rem'}}>
            <div 
                className="bell-icon" 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{cursor: 'pointer', position: 'relative', fontSize: '1.2rem', color: '#6c757d'}}
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

            {showDropdown && (
                <div className="notification-dropdown" style={{
                    position: 'absolute', top: '150%', right: '-50px', width: '350px',
                    backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    borderRadius: '12px', zIndex: 1000, border: '1px solid #dee2e6',
                    maxHeight: '400px', display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '15px', borderBottom: '1px solid #eee', 
                        fontWeight: 'bold', fontSize: '1rem', color: '#333',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: '#f8f9fa', borderRadius: '12px 12px 0 0'
                    }}>
                        <span>Notificaciones</span>
                        {conteoNoLeidas === 0 && <span style={{fontSize:'0.7rem', color:'#28a745', fontWeight:'normal'}}>Todo al día</span>}
                    </div>

                    <div style={{overflowY: 'auto', flex: 1}}>
                        {notificaciones.length === 0 ? (
                            <div style={{padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.9rem'}}>
                                No tienes notificaciones.
                            </div>
                        ) : (
                            notificaciones.map(n => (
                                <div 
                                    key={n.ID_Notificacion} 
                                    onClick={() => handleClicNotificacion(n)}
                                    style={{
                                        padding: '12px 15px', 
                                        borderBottom: '1px solid #f0f0f0', 
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        backgroundColor: n.Leida ? '#ffffff' : '#eef7ff', // Azulito si no leída
                                        display: 'flex',
                                        gap: '10px',
                                        alignItems: 'flex-start',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.Leida ? '#ffffff' : '#eef7ff'}
                                >
                                    {/* Indicador visual de no leído */}
                                    {!n.Leida && (
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%', 
                                            backgroundColor: '#007BFF', marginTop: '6px', flexShrink: 0
                                        }}></div>
                                    )}

                                    <div style={{flex: 1, opacity: n.Leida ? 0.7 : 1}}>
                                        <div style={{
                                            fontWeight: n.Leida ? '500' : '700', 
                                            fontSize: '0.9rem', 
                                            color: n.Leida ? '#555' : '#005A5B',
                                            marginBottom: '2px'
                                        }}>
                                            {n.Titulo}
                                        </div>
                                        <div style={{fontSize: '0.85rem', color: '#666', lineHeight: '1.4'}}>
                                            {n.Mensaje}
                                        </div>
                                        <div style={{fontSize: '0.75rem', color: '#aaa', marginTop: '5px'}}>
                                            {new Date(n.FechaCreacion).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* BOTÓN ELIMINAR (X) */}
                                    <button 
                                        onClick={(e) => handleEliminar(e, n.ID_Notificacion)}
                                        title="Eliminar de la lista"
                                        style={{
                                            background: 'none', border: 'none', 
                                            color: '#dc3545', cursor: 'pointer', 
                                            padding: '2px', opacity: 0.6,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                    >
                                        <BsX size={20} />
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