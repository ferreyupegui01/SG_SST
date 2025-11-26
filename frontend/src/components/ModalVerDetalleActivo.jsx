// frontend/src/components/ModalVerDetalleActivo.jsx

import React from 'react';
import '../style/Modal.css';
import '../style/InspeccionesPage.css';
import { BsSpeedometer2, BsCalendarEvent, BsPersonBadge, BsGeoAlt } from 'react-icons/bs';

const ModalVerDetalleActivo = ({ activo, alCerrar }) => {
    if (!activo) return null;

    const esVehiculo = ['Vehiculo', 'Moto', 'Montacarga'].includes(activo.TipoActivo);

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return <span style={{color: '#999'}}>No registrada</span>;
        return new Date(fechaISO.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO');
    };

    const getEstadoDocumento = (fechaISO) => {
        if (!fechaISO) return null;
        const fechaDoc = new Date(fechaISO);
        const hoy = new Date();
        const esVencido = fechaDoc < hoy;
        return (
            <span className={`status-pill ${esVencido ? 'status-inactivo' : 'status-activo'}`} style={{fontSize: '0.75rem', marginLeft: '5px'}}>
                {esVencido ? 'Vencido' : 'Vigente'}
            </span>
        );
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Ficha Técnica del Activo</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <small style={{color: '#666', textTransform: 'uppercase'}}>{activo.TipoActivo}</small>
                            <h3 style={{ margin: 0, color: '#005A5B' }}>{activo.NombreDescriptivo}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="status-pill status-activo" style={{fontSize: '1rem'}}>
                                {activo.CodigoIdentificador}
                            </span>
                        </div>
                    </div>

                    <div className="inspection-details">
                        <div className="detail-section">
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div>
                                    <strong>Ubicación:</strong>
                                    <p className="detail-box"><BsGeoAlt /> {activo.Ubicacion || 'No definida'}</p>
                                </div>
                                <div>
                                    <strong>Marca / Modelo:</strong>
                                    <p className="detail-box">{activo.Marca || '---'} {activo.Modelo || ''}</p>
                                </div>
                            </div>
                        </div>

                        {esVehiculo && (
                            <>
                                <h4 style={{borderBottom: '2px solid #f0f2f5', paddingBottom: '5px', marginTop: '1.5rem', color: '#6c757d'}}>
                                    Información del Vehículo
                                </h4>
                                
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem'}}>
                                    <div>
                                        <strong><BsPersonBadge /> Conductor Asignado:</strong>
                                        <div className="detail-box">
                                            {activo.NombreConductor ? (
                                                <>
                                                    <div style={{fontWeight: 'bold'}}>{activo.NombreConductor}</div>
                                                    <small style={{color: '#666'}}>C.C. {activo.CedulaConductor}</small>
                                                </>
                                            ) : (
                                                <span style={{color: '#999', fontStyle: 'italic'}}>Sin conductor asignado</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <strong><BsSpeedometer2 /> Kilometraje Actual:</strong>
                                        <div className="detail-box" style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#007BFF'}}>
                                            {activo.KilometrajeActual ? `${activo.KilometrajeActual.toLocaleString()} km` : '0 km'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{marginTop: '1rem'}}>
                                    <strong>Documentación Legal:</strong>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem'}}>
                                        <div style={{background: '#f8f9fa', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e9ecef'}}>
                                            <div style={{fontWeight: '600', color: '#555'}}><BsCalendarEvent /> Vencimiento SOAT</div>
                                            <div style={{marginTop: '5px'}}>
                                                {formatearFecha(activo.SOAT_Vencimiento)}
                                                {getEstadoDocumento(activo.SOAT_Vencimiento)}
                                            </div>
                                        </div>
                                        <div style={{background: '#f8f9fa', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e9ecef'}}>
                                            <div style={{fontWeight: '600', color: '#555'}}><BsCalendarEvent /> Vencimiento Tecnomecánica</div>
                                            <div style={{marginTop: '5px'}}>
                                                {formatearFecha(activo.Tecno_Vencimiento)}
                                                {getEstadoDocumento(activo.Tecno_Vencimiento)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerDetalleActivo;