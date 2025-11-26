// frontend/src/components/ModalVerIndicador.jsx

import React from 'react';
import '../style/Modal.css';
import '../index.css'; 
import '../style/InspeccionesPage.css'; // Reutiliza estilos de etiquetas y cajas
import { BsCalendarEvent, BsGraphUp, BsChatLeftText } from 'react-icons/bs';

const ModalVerIndicador = ({ indicador, alCerrar }) => {
    if (!indicador) return null;

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    // Helper para formatear números
    const fmt = (num) => (num || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 });

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Detalle del Indicador</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    
                    {/* CABECERA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <small style={{color: '#666', textTransform: 'uppercase', fontWeight: 'bold'}}>Indicador de Gestión</small>
                            <h3 style={{ margin: 0, color: '#005A5B' }}>{indicador.NombreIndicador}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="status-pill status-proceso" style={{fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <BsCalendarEvent /> {meses[indicador.Mes - 1]} {indicador.Anio}
                            </div>
                        </div>
                    </div>

                    <div className="inspection-details">
                        
                        {/* RESULTADOS */}
                        <div className="detail-section" style={{backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef'}}>
                            <h4 style={{marginTop: 0, color: '#6c757d', borderBottom: '1px solid #ddd', paddingBottom: '5px'}}>
                                <BsGraphUp /> Resultados del Periodo
                            </h4>
                            
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                                <div>
                                    <strong>Resultado Obtenido:</strong>
                                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#005A5B'}}>
                                        {indicador.Resultado.toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <strong>Meta Establecida:</strong>
                                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#666'}}>
                                        {indicador.Meta}
                                    </div>
                                </div>
                                <div>
                                    <strong>Variables (Num / Den):</strong>
                                    <div style={{fontSize: '1.1rem'}}>
                                        {fmt(indicador.Numerador)} / {fmt(indicador.Denominador)}
                                    </div>
                                    <small style={{color: '#888'}}>Constante: {indicador.Constante}</small>
                                </div>
                            </div>
                        </div>

                        {/* ANÁLISIS CUALITATIVO (AQUÍ SE VE COMPLETO) */}
                        <div className="detail-section" style={{marginTop: '1.5rem'}}>
                            <h4 style={{marginTop: 0, color: '#6c757d', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <BsChatLeftText /> Análisis y Gestión
                            </h4>
                            <div className="detail-box" style={{minHeight: '100px', fontSize: '1rem', lineHeight: '1.6'}}>
                                {indicador.Analisis || <span style={{fontStyle:'italic', color:'#999'}}>Sin análisis registrado.</span>}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerIndicador;