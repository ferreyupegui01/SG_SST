// frontend/src/components/ModalVerReporte.jsx

import React, { useState, useEffect } from 'react';
import { getReporteMaquinaDetalle, getReporteSeguridadDetalle } from '../services/reportService';
import '../style/Modal.css';
import '../index.css'; 
import '../style/InspeccionesPage.css';
import { BsSpeedometer2 } from 'react-icons/bs';

const ModalVerReporte = ({ reporte, tipo, alCerrar, alExito }) => {
    const [detalle, setDetalle] = useState(reporte);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const API_BASE_URL = 'http://localhost:5000';

    useEffect(() => {
        const cargarDetalle = async () => {
            try {
                setIsLoading(true);
                let data;
                if (tipo === 'maquina' || tipo === 'Máquina (Pre-uso)') { // Soporte para ambos nombres
                    data = await getReporteMaquinaDetalle(reporte.ID_ReporteMaquina || reporte.id.split('-')[1]);
                } else {
                    data = await getReporteSeguridadDetalle(reporte.ID_ReporteSeguridad || reporte.id.split('-')[1]);
                }
                setDetalle(data); 
                if (alExito) alExito(); 
            } catch (err) { setError(err.message); } finally { setIsLoading(false); }
        };
        cargarDetalle();
    }, [reporte, tipo, alExito]);

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Detalle de Reporte</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {isLoading && <p>Cargando...</p>}
                    {error && <p className="modal-error">{error}</p>}
                    
                    {!isLoading && detalle && (
                        <div className="inspection-details">
                            
                            {/* === REPORTE DE MÁQUINA === */}
                            {(tipo === 'maquina' || tipo === 'Máquina (Pre-uso)') ? (
                                <>
                                    <div style={{display:'flex', gap:'1rem', marginBottom:'1rem', backgroundColor:'#f8f9fa', padding:'1rem', borderRadius:'8px'}}>
                                        <div style={{flex:1}}>
                                            <strong>Activo:</strong> {detalle.NombreActivo}
                                            <div style={{fontSize:'0.9rem', color:'#666'}}>{detalle.CodigoActivo} {detalle.Marca ? `- ${detalle.Marca}` : ''}</div>
                                        </div>
                                        <div style={{flex:1}}>
                                            <strong>Reportado por:</strong> {detalle.NombreUsuarioReporta}
                                            <div style={{fontSize:'0.9rem', color:'#666'}}>C.C. {detalle.CedulaUsuarioReporta}</div>
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                            <span className={`status-pill ${detalle.EstadoReportado === 'OK' ? 'status-activo' : 'status-pendiente'}`}>
                                                {detalle.EstadoReportado}
                                            </span>
                                        </div>
                                    </div>

                                    {detalle.Kilometraje && (
                                        <div className="detail-section" style={{color: '#007BFF', fontWeight:'bold'}}>
                                            <BsSpeedometer2 /> Kilometraje: {detalle.Kilometraje.toLocaleString()} km
                                        </div>
                                    )}

                                    <div className="detail-section">
                                        <strong>Fecha:</strong> {new Date(detalle.FechaHoraReporte).toLocaleString('es-CO')}
                                    </div>

                                    {/* CHECKLIST */}
                                    {detalle.DatosReporte && (
                                        <div className="detail-section" style={{marginTop: '1rem'}}>
                                            <strong>Checklist de Verificación:</strong>
                                            <div style={{ background: '#fff', padding: '0.5rem', border: '1px solid #eee', maxHeight: '250px', overflowY: 'auto' }}>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {JSON.parse(detalle.DatosReporte).map((item, idx) => (
                                                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                                                            <span>{item.pregunta}</span>
                                                            <span style={{ fontWeight: 'bold', color: item.respuesta === 'No Cumple' ? '#dc3545' : '#28a745' }}>
                                                                {item.respuesta}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* OBSERVACIONES (Siempre visible ahora) */}
                                    <div className="detail-section" style={{marginTop:'1rem'}}>
                                        <strong>Observaciones / Detalles:</strong>
                                        <p className="detail-box" style={{
                                            color: detalle.EstadoReportado === 'Con Problema' ? '#dc3545' : '#333',
                                            borderColor: detalle.EstadoReportado === 'Con Problema' ? '#dc3545' : '#dee2e6'
                                        }}>
                                            {detalle.DescripcionProblema || 'Sin observaciones registradas.'}
                                        </p>
                                    </div>

                                    {detalle.RutaFotoAdjunta && (
                                        <div className="detail-section">
                                            <strong>Evidencia Fotográfica:</strong><br/>
                                            <img src={`${API_BASE_URL}/${detalle.RutaFotoAdjunta.replace(/\\/g, '/')}`} alt="Evidencia" style={{ maxWidth: '100%', marginTop:'0.5rem', borderRadius:'8px', border:'1px solid #ddd' }} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* === REPORTE DE SEGURIDAD === */
                                <>
                                    <div className="detail-section"><strong>Tipo:</strong> {detalle.TipoReporte}</div>
                                    <div className="detail-section"><strong>Ubicación:</strong> {detalle.UbicacionArea}</div>
                                    <div className="detail-section"><strong>Descripción:</strong><p className="detail-box">{detalle.Descripcion}</p></div>
                                    {detalle.RutaFotoAdjunta && <img src={`${API_BASE_URL}/${detalle.RutaFotoAdjunta.replace(/\\/g, '/')}`} alt="Evidencia" style={{ maxWidth: '100%' }} />}
                                </>
                            )}
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
export default ModalVerReporte;