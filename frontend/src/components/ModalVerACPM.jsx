// frontend/src/componentes/ModalVerACPM.jsx

import React, { useState, useEffect } from 'react';
// Importamos ambos servicios
import { getACPMDetalle, getEvidenciasPorACPM } from '../services/acpmService';
import '../style/Modal.css';
import '../style/UsuariosPage.css';
import '../style/InspeccionesPage.css'; // Reutiliza estilos de detalle

/**
 * @component ModalVerACPM
 * @desc Modal de "Solo Lectura" para ver el detalle de una ACPM
 */
const ModalVerACPM = ({ acpmId, alCerrar }) => {
    
    // Estados para los datos
    const [acpm, setAcpm] = useState(null);
    const [evidencias, setEvidencias] = useState([]);
    
    // Estados de carga separados
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEvidencias, setIsLoadingEvidencias] = useState(true);
    const [error, setError] = useState('');

    // URL base del backend para construir los enlaces
    const API_BASE_URL = 'http://localhost:5000';

    // Carga los detalles y las evidencias al mismo tiempo
    useEffect(() => {
        if (!acpmId) return;

        const cargarDatos = async () => {
            try {
                // Inicia ambas peticiones
                const detallePromise = getACPMDetalle(acpmId);
                const evidenciasPromise = getEvidenciasPorACPM(acpmId);
                
                // Espera a que la de detalle termine
                const dataDetalle = await detallePromise;
                setAcpm(dataDetalle);
                setIsLoading(false); // Detalle cargado

                // Espera a que la de evidencias termine
                const dataEvidencias = await evidenciasPromise;
                setEvidencias(dataEvidencias);
                setIsLoadingEvidencias(false); // Evidencias cargadas

            } catch (err) {
                setError(err.message);
                setIsLoading(false);
                setIsLoadingEvidencias(false);
            }
        };
        cargarDatos();
    }, [acpmId]);

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        return new Date(fechaISO.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO');
    };

    // Función para íconos (reutilizada de ModalVerEvidencias)
    const getIconoTipo = (tipo) => {
        if (tipo.includes('pdf')) return '📄';
        if (tipo.includes('png') || tipo.includes('jpg') || tipo.includes('jpeg')) return '🖼️';
        return '📎';
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Detalle de Acción ACPM (ID: {acpmId})</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {isLoading && <p>Cargando detalle...</p>}
                    {error && <p className="modal-error">{error}</p>}
                    
                    {!isLoading && acpm && (
                        <div className="inspection-details">
                            {/* ... (Toda la sección de detalles de la ACPM, sin cambios) ... */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div className="detail-section" style={{ flex: 1, minWidth: '200px' }}>
                                    <strong>Tipo de Acción:</strong> {acpm.TipoAccion}
                                </div>
                                <div className="detail-section" style={{ flex: 1, minWidth: '200px' }}>
                                    <strong>Origen:</strong> {acpm.Origen}
                                </div>
                                <div className="detail-section" style={{ flex: 1, minWidth: '200px' }}>
                                    <strong>Estado:</strong>
                                    <span className={`status-pill ${
                                        acpm.EstadoACPM === 'Abierta' ? 'status-pendiente' :
                                        acpm.EstadoACPM === 'En Proceso' ? 'status-proceso' : 'status-activo'
                                    }`}>
                                        {acpm.EstadoACPM}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-section"><strong>Descripción del Problema:</strong><p className="detail-box">{acpm.DescripcionProblema}</p></div>
                            <div className="detail-section"><strong>Análisis de Causa:</strong><p className="detail-box">{acpm.AnalisisCausa || 'No registrado'}</p></div>
                            <div className="detail-section"><strong>Plan de Acción:</strong><p className="detail-box">{acpm.PlanAccion}</p></div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div className="detail-section" style={{ flex: 1 }}><strong>Responsable:</strong> {acpm.NombreResponsable || 'No asignado'}</div>
                                <div className="detail-section" style={{ flex: 1 }}><strong>Fecha Límite:</strong> {formatearFecha(acpm.FechaLimite)}</div>
                                <div className="detail-section" style={{ flex: 1 }}><strong>Fecha Cierre:</strong> {formatearFecha(acpm.FechaCierre)}</div>
                            </div>
                            <div className="detail-section">
                                <strong>Historial de Seguimiento:</strong>
                                <pre className="detail-box" style={{ fontFamily: 'inherit', fontSize: '0.9rem' }}>
                                    {acpm.ComentariosSeguimiento || 'Sin comentarios de seguimiento.'}
                                </pre>
                            </div>
                            
                            {/* --- SECCIÓN DE EVIDENCIAS (NUEVO) --- */}
                            <div className="detail-section">
                                <strong>Archivos de Evidencia:</strong>
                                {isLoadingEvidencias && <p>Cargando evidencias...</p>}
                                {!isLoadingEvidencias && evidencias.length === 0 && (
                                    <p className="detail-box" style={{fontStyle: 'italic'}}>No se han adjuntado evidencias.</p>
                                )}
                                {!isLoadingEvidencias && evidencias.length > 0 && (
                                    <ul className="evidence-list" style={{marginTop: '0.5rem'}}>
                                        {evidencias.map(ev => (
                                            <li key={ev.ID_EvidenciaACPM} className="evidence-item">
                                                <span>{getIconoTipo(ev.TipoArchivo)}</span>
                                                <div className="evidence-info">
                                                    <a href={`${API_BASE_URL}/${ev.RutaArchivo.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer">
                                                        {ev.NombreArchivo}
                                                    </a>
                                                    <small>
                                                        Subido por: {ev.NombreUsuarioSubio} el {new Date(ev.FechaSubida).toLocaleDateString()}
                                                        {ev.EsEvidenciaDeCierre && <strong style={{color: '#005A5B'}}> (Evidencia de Cierre)</strong>}
                                                    </small>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={alCerrar}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerACPM;