// frontend/src/componentes/ModalVerEvidencias.jsx

import React, { useState, useEffect } from 'react';
// --- CORRECCIÓN: El nombre correcto es getEvidenciasActividad ---
import { getEvidenciasActividad } from '../services/scheduleService'; 
import '../style/Modal.css';
import '../index.css'; 
import '../style/InspeccionesPage.css'; // Reutiliza estilos de detalle

const ModalVerEvidencias = ({ actividad, alCerrar }) => {
    
    const [evidencias, setEvidencias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // URL base del backend para los enlaces
    const API_BASE_URL = 'http://localhost:5000';

    useEffect(() => {
        if (!actividad) return;

        const cargarEvidencias = async () => {
            try {
                setIsLoading(true);
                // --- Llamada a la función con el nombre correcto ---
                const data = await getEvidenciasActividad(actividad.ID_Actividad);
                setEvidencias(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        cargarEvidencias();
    }, [actividad]);

    // Helper para icono según tipo
    const getIconoTipo = (tipo) => {
        if (!tipo) return '📎';
        if (tipo.includes('pdf')) return '📄';
        if (tipo.includes('image')) return '🖼️';
        return '📎';
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Evidencias de la Actividad</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body">
                    <div className="detail-section">
                        <strong>Actividad:</strong> {actividad?.NombreActividad}
                    </div>

                    {isLoading && <p>Cargando evidencias...</p>}
                    {error && <p className="modal-error">{error}</p>}
                    
                    {!isLoading && !error && evidencias.length === 0 && (
                        <p style={{ fontStyle: 'italic', color: '#666', textAlign: 'center', marginTop: '2rem' }}>
                            No hay evidencias adjuntas para esta actividad.
                        </p>
                    )}

                    {!isLoading && evidencias.length > 0 && (
                        <ul className="evidence-list" style={{ marginTop: '1rem' }}>
                            {evidencias.map((ev) => (
                                <li key={ev.ID_EvidenciaAct} className="evidence-item" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderBottom: '1px solid #eee',
                                    gap: '1rem'
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>{getIconoTipo(ev.TipoArchivo)}</span>
                                    <div style={{ flex: 1 }}>
                                        <a 
                                            href={`${API_BASE_URL}/${ev.RutaArchivo.replace(/\\/g, '/')}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ fontWeight: '600', color: 'var(--color-acento)', textDecoration: 'none' }}
                                        >
                                            {ev.NombreArchivo}
                                        </a>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                            Subido por: {ev.NombreUsuarioSubio} • {new Date(ev.FechaSubida).toLocaleDateString()}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerEvidencias;