// frontend/src/components/ModalDetalleActividad.jsx

import React from 'react';
import '../style/Modal.css'; //
import '../index.css';

const ModalDetalleActividad = ({ actividad, alCerrar }) => {
    if (!actividad) return null;

    // Helper para fechas
    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        // Ajuste simple para zona horaria local
        const fecha = new Date(fechaISO.split('T')[0] + 'T00:00:00');
        return fecha.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getEstadoClass = (estado) => {
        if (estado === 'Realizada') return 'status-activo';
        if (estado === 'Pendiente') return 'status-pendiente';
        return 'status-inactivo';
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                
                {/* --- Encabezado --- */}
                <div className="modal-header">
                    <h2>Detalle de Actividad</h2>
                    <button className="modal-close-button" onClick={alCerrar}>&times;</button>
                </div>
                
                {/* --- Cuerpo (Usando estructura similar a form-group para consistencia) --- */}
                <div className="modal-body">
                    
                    {/* Nombre */}
                    <div className="form-group">
                        <label>Nombre de la Actividad:</label>
                        <p style={{ fontSize: '1.1rem', margin: '0.2rem 0', color: '#212529' }}>
                            {actividad.NombreActividad}
                        </p>
                    </div>

                    {/* Estado y Responsable (En fila) */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#6c757d', marginBottom: '0.5rem' }}>
                                Estado:
                            </label>
                            <span className={`status-pill ${getEstadoClass(actividad.EstadoActividad)}`}>
                                {actividad.EstadoActividad}
                            </span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#6c757d', marginBottom: '0.5rem' }}>
                                Responsable:
                            </label>
                            <span style={{ fontSize: '1rem' }}>{actividad.Responsable || 'Sin asignar'}</span>
                        </div>
                    </div>

                    {/* Fechas (En fila) */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#6c757d', marginBottom: '0.5rem' }}>
                                Fecha Límite:
                            </label>
                            <span>{formatearFecha(actividad.FechaLimite)}</span>
                        </div>
                        {actividad.FechaRealizacion && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#6c757d', marginBottom: '0.5rem' }}>
                                    Fecha Realización:
                                </label>
                                <span>{formatearFecha(actividad.FechaRealizacion)}</span>
                            </div>
                        )}
                    </div>

                    {/* Descripción */}
                    <div className="form-group">
                        <label>Descripción:</label>
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '0.8rem', 
                            borderRadius: '8px', 
                            border: '1px solid #dee2e6', 
                            fontSize: '0.95rem',
                            maxHeight: '120px', 
                            overflowY: 'auto' 
                        }}>
                            {actividad.DescripcionActividad || 'Sin descripción.'}
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="form-group">
                        <label>Observaciones:</label>
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '0.8rem', 
                            borderRadius: '8px', 
                            border: '1px solid #dee2e6',
                            fontSize: '0.95rem',
                            minHeight: '40px' 
                        }}>
                            {actividad.Observaciones || 'Ninguna observación registrada.'}
                        </div>
                    </div>
                </div>

                {/* --- Pie (Botones) --- */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={alCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalleActividad;