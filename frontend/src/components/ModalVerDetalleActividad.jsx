// frontend/src/componentes/ModalVerDetalleActividad.jsx

import React, { useState, useEffect } from 'react';
import { getActividadDetalle } from '../services/scheduleService';
import '../style/Modal.css';
import '../style/index.css'; 

const ModalVerDetalleActividad = ({ idActividad, alCerrar }) => {
    
    const [detalle, setDetalle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!idActividad) return;

        const cargarDetalle = async () => {
            try {
                setIsLoading(true);
                const data = await getActividadDetalle(idActividad);
                setDetalle(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        cargarDetalle();
    }, [idActividad]);

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        // Ajustamos la fecha para que no se desplace el día
        return new Date(fechaISO.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO');
    };
    
    const getEstadoClass = (estado) => {
        if (estado === 'Realizada') return 'status-activo';
        if (estado === 'Pendiente') return 'status-pendiente';
        return 'status-inactivo';
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Detalle de Actividad #{idActividad}</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {isLoading && <p>Cargando detalle...</p>}
                    {error && <p className="modal-error">{error}</p>}
                    
                    {!isLoading && detalle && (
                        <div className="detail-container">
                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                {detalle.NombreActividad}
                            </h3>

                            {/* --- Grid de Información Básica --- */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                
                                <div style={{ flex: 1, minWidth: '45%' }}>
                                    <strong>Estado:</strong>
                                    <span className={`status-pill ${getEstadoClass(detalle.EstadoActividad)}`} style={{ marginLeft: '10px' }}>
                                        {detalle.EstadoActividad}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: '45%' }}>
                                    <strong>Responsable:</strong> {detalle.Responsable} ({detalle.CedulaResponsable})
                                </div>
                                <div style={{ flex: 1, minWidth: '45%' }}>
                                    <strong>Fecha Límite:</strong> {formatearFecha(detalle.FechaLimite)}
                                </div>
                                <div style={{ flex: 1, minWidth: '45%' }}>
                                    <strong>Fecha Realización:</strong> {detalle.FechaRealizacion ? formatearFecha(detalle.FechaRealizacion) : 'Pendiente'}
                                </div>
                            </div>
                            
                            <hr />

                            {/* --- Descripción --- */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <strong>Descripción Detallada:</strong>
                                <p className="detail-box">{detalle.DescripcionActividad || 'No aplica'}</p>
                            </div>

                            {/* --- Observaciones --- */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <strong>Observaciones Finales:</strong>
                                <p className="detail-box">{detalle.Observaciones || 'Sin observaciones registradas'}</p>
                            </div>

                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerDetalleActividad;