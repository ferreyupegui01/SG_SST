// frontend/src/components/ModalVerMantenimiento.jsx

import React from 'react';
import '../style/Modal.css';
import '../style/InspeccionesPage.css'; // Reutilizamos estilos
import { BsTools, BsCalendarEvent, BsFileEarmarkPdf, BsCurrencyDollar } from 'react-icons/bs';

const ModalVerMantenimiento = ({ mantenimiento, alCerrar }) => {
    if (!mantenimiento) return null;

    const API_URL = 'http://localhost:5000'; // Ajusta si cambia tu puerto

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Detalle de Mantenimiento</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body">
                    
                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'1rem', borderBottom:'1px solid #eee', paddingBottom:'1rem'}}>
                        <div style={{fontSize:'2rem', color:'#005A5B'}}>
                            <BsTools />
                        </div>
                        <div>
                            <h3 style={{margin:0}}>{mantenimiento.Vehiculo}</h3>
                            <span className="status-pill status-activo">{mantenimiento.Placa}</span>
                        </div>
                    </div>

                    <div className="inspection-details">
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                            <div className="detail-section">
                                <strong>Tipo:</strong> {mantenimiento.TipoMantenimiento}
                            </div>
                            <div className="detail-section">
                                <strong>Fecha:</strong> {new Date(mantenimiento.Fecha).toLocaleDateString()}
                            </div>
                            <div className="detail-section">
                                <strong>Kilometraje:</strong> {mantenimiento.Kilometraje} km
                            </div>
                            <div className="detail-section">
                                <strong>Taller:</strong> {mantenimiento.Taller_Realizo}
                            </div>
                        </div>

                        <div className="detail-section" style={{marginTop:'1rem'}}>
                            <strong>Descripción del Trabajo:</strong>
                            <p className="detail-box">{mantenimiento.Descripcion}</p>
                        </div>

                        <div className="detail-section" style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8f9fa', padding:'10px', borderRadius:'8px'}}>
                            <div>
                                <strong>Costo Total:</strong>
                            </div>
                            <div style={{fontSize:'1.2rem', color:'#28a745', fontWeight:'bold'}}>
                                <BsCurrencyDollar/> {mantenimiento.Costo.toLocaleString()}
                            </div>
                        </div>

                        {/* --- SECCIÓN DE EVIDENCIA --- */}
                        <div className="detail-section" style={{marginTop:'1.5rem', borderTop:'1px solid #eee', paddingTop:'1rem'}}>
                            <strong>Evidencia / Soporte Adjunto:</strong>
                            
                            {mantenimiento.RutaEvidencia ? (
                                <div style={{marginTop:'10px'}}>
                                    <a 
                                        href={`${API_URL}/${mantenimiento.RutaEvidencia}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'8px'}}
                                    >
                                        <BsFileEarmarkPdf /> Ver Documento Soporte
                                    </a>
                                    <p style={{fontSize:'0.8rem', color:'#666', marginTop:'5px'}}>Se abrirá en una nueva pestaña.</p>
                                </div>
                            ) : (
                                <p style={{color:'#999', fontStyle:'italic'}}>No se adjuntó evidencia para este mantenimiento.</p>
                            )}
                        </div>
                    </div>

                </div>

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={alCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerMantenimiento;