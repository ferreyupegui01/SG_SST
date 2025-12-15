// frontend/src/components/ModalVerReporte.jsx

import React, { useState, useEffect } from 'react';
import { getReporteMaquinaDetalle, getReporteSeguridadDetalle } from '../services/reportService';
import '../style/Modal.css';
import '../index.css'; 
import '../style/InspeccionesPage.css';
import { 
    BsSpeedometer2, 
    BsGeoAlt, 
    BsPersonBadge, 
    BsCalendarCheck,
    BsFileEarmarkCheckFill,   // Nuevo icono
    BsCheckCircleFill,        // Nuevo icono
    BsExclamationTriangleFill // Nuevo icono
} from 'react-icons/bs';

const ModalVerReporte = ({ reporte, tipo, alCerrar }) => {
    const [detalle, setDetalle] = useState(reporte);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const API_BASE_URL = 'http://localhost:5000'; // Ajusta si tu puerto es 4000

    useEffect(() => {
        const cargarDetalle = async () => {
            try {
                setIsLoading(true);
                
                let data;
                // Soporte para ambos nombres de tipo que llegan del dashboard o tabla
                if (tipo === 'maquina' || tipo === 'Máquina (Pre-uso)') { 
                    data = await getReporteMaquinaDetalle(reporte.ID_ReporteMaquina || reporte.id?.split('-')[1]);
                } else {
                    data = await getReporteSeguridadDetalle(reporte.ID_ReporteSeguridad || reporte.id?.split('-')[1]);
                }
            
                setDetalle(data); 

            } catch (err) { 
                setError(err.message); 
            } finally { 
                setIsLoading(false); 
            }
        };
        cargarDetalle();
    }, [reporte, tipo]); 

    // Formatear fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleString('es-CO');
    };

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
                                    <div style={{display:'flex', gap:'1rem', marginBottom:'1rem', backgroundColor:'#f8f9fa', padding:'1rem', borderRadius:'8px', alignItems:'center', flexWrap:'wrap'}}>
                                        <div style={{flex:'1 1 200px'}}>
                                            <strong>Activo:</strong> {detalle.NombreActivo}
                                            <div style={{fontSize:'0.9rem', color:'#666'}}>{detalle.CodigoActivo} {detalle.Marca ? `- ${detalle.Marca}` : ''}</div>
                                        </div>
                                        <div style={{flex:'1 1 200px'}}>
                                            <strong>Reportado por:</strong> {detalle.NombreUsuarioReporta}
                                            <div style={{fontSize:'0.9rem', color:'#666'}}>C.C. {detalle.CedulaUsuarioReporta}</div>
                                        </div>
                                        <div style={{textAlign:'right', flex:'1 1 auto'}}>
                                            <span className={`status-pill ${detalle.EstadoReportado === 'OK' ? 'status-activo' : 'status-pendiente'}`}>
                                                {detalle.EstadoReportado}
                                            </span>
                                        </div>
                                    </div>

                                    {detalle.Kilometraje && (
                                        <div className="detail-section" style={{color: '#007BFF', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <BsSpeedometer2 /> Kilometraje: {detalle.Kilometraje.toLocaleString()} km
                                        </div>
                                    )}

                                    <div className="detail-section">
                                        <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#666'}}>
                                            <BsCalendarCheck/> {formatearFecha(detalle.FechaHoraReporte)}
                                        </span>
                                    </div>

                                    {/* CHECKLIST */}
                                    {detalle.DatosReporte && (
                                        <div className="detail-section" style={{marginTop: '1rem'}}>
                                            <strong>Checklist de Verificación:</strong>
                                            <div style={{ background: '#fff', padding: '0.5rem', border: '1px solid #eee', maxHeight: '250px', overflowY: 'auto', borderRadius:'8px' }}>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {JSON.parse(detalle.DatosReporte).map((item, idx) => (
                                                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
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

                                    {/* OBSERVACIONES */}
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

                                    {/* --- SECCIÓN NUEVA: DECLARACIÓN JURAMENTADA EN MODAL --- */}
                                    <div style={{ 
                                        marginTop: '20px',
                                        border: '1px solid #005A5B', 
                                        backgroundColor: '#e6f7ec', 
                                        borderRadius: '8px', 
                                        padding: '15px',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{fontSize:'1.5rem', color:'#005A5B', marginBottom:'5px'}}>
                                            <BsFileEarmarkCheckFill />
                                        </div>
                                        
                                        <h4 style={{margin:'0 0 5px 0', color:'#005A5B', fontSize:'1rem'}}>Declaración del Colaborador</h4>
                                        
                                        <p style={{fontStyle:'italic', color:'#333', fontSize:'0.8rem', margin:'0 0 10px 0'}}>
                                            "Declaro que la información es veraz y asumo la responsabilidad."
                                        </p>

                                        <div style={{
                                            padding:'5px 15px', 
                                            borderRadius:'20px', 
                                            backgroundColor:'#fff', 
                                            border:'1px solid #28a745', 
                                            color:'#28a745', 
                                            fontWeight:'bold', 
                                            fontSize:'0.85rem',
                                            display:'flex', 
                                            alignItems:'center', 
                                            gap:'5px'
                                        }}>
                                            {detalle.AceptaDeclaracion ? (
                                                <>
                                                    <BsCheckCircleFill /> CONFIRMADO
                                                </>
                                            ) : (
                                                <span style={{color:'#dc3545', display:'flex', alignItems:'center', gap:'5px'}}>
                                                    <BsExclamationTriangleFill /> NO REGISTRADO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* ----------------------------------------------------- */}

                                </>
                            ) : (
                                /* === REPORTE DE SEGURIDAD === */
                                <>
                                    <div style={{display:'flex', gap:'1rem', marginBottom:'1rem', backgroundColor:'#f8f9fa', padding:'1rem', borderRadius:'8px'}}>
                                        <div style={{flex:1}}>
                                            <strong>Tipo:</strong> <span style={{color:'#005A5B', fontWeight:'bold'}}>{detalle.TipoReporte}</span>
                                        </div>
                                        <div style={{flex:1}}>
                                            <strong>Ubicación:</strong> <BsGeoAlt/> {detalle.UbicacionArea}
                                        </div>
                                    </div>
                                    
                                    <div className="detail-section">
                                        <strong>Reportado por:</strong> {detalle.NombreUsuarioReporta}
                                    </div>
                                    <div className="detail-section">
                                        <strong>Fecha:</strong> {formatearFecha(detalle.FechaHoraReporte)}
                                    </div>

                                    <div className="detail-section"><strong>Descripción:</strong><p className="detail-box">{detalle.Descripcion}</p></div>
                                    
                                    {detalle.RutaFotoAdjunta && (
                                        <div className="detail-section">
                                            <strong>Evidencia:</strong><br/>
                                            <img src={`${API_BASE_URL}/${detalle.RutaFotoAdjunta.replace(/\\/g, '/')}`} alt="Evidencia" style={{ maxWidth: '100%', borderRadius:'8px' }} />
                                        </div>
                                    )}
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