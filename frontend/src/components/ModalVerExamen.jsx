// frontend/src/componentes/ModalVerExamen.jsx

import React, { useState, useEffect } from 'react';
// Importamos el servicio para obtener el detalle
import { getExamenMedicoDetalle } from '../services/medicalService'; 
import '../style/Modal.css';
import '../index.css'; 
import '../style/InspeccionesPage.css'; // Reutiliza estilos de detalle

/**
 * @component ModalVerExamen
 * @desc Modal de "Solo Lectura" para ver el detalle de un Examen Médico
 * @param {number} examenId - El ID del examen a cargar
 * @param {function} alCerrar - Función para cerrar el modal
 */
const ModalVerExamen = ({ examenId, alCerrar }) => {
    
    const [examen, setExamen] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!examenId) return;
        const cargarDetalle = async () => {
            try {
                setIsLoading(true);
                // Llama al servicio para obtener los datos
                const data = await getExamenMedicoDetalle(examenId);
                setExamen(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        cargarDetalle();
    }, [examenId]); // Se ejecuta cuando el modal se abre

    // Formatear la fecha (corrigiendo zona horaria)
    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        const fecha = new Date(fechaISO.split('T')[0] + 'T00:00:00');
        return fecha.toLocaleDateString('es-CO');
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Detalle de Examen Médico</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {isLoading && <p>Cargando detalle...</p>}
                    {error && <p className="modal-error">{error}</p>}
                    
                    {!isLoading && examen && (
                        <div className="inspection-details">
                            {/* --- Datos Básicos --- */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                                <div className="detail-section" style={{ flex: 1, minWidth: '200px' }}>
                                    <strong>Colaborador:</strong> {examen.NombreColaborador}
                                </div>
                                <div className="detail-section" style={{ flex: 1, minWidth: '200px' }}>
                                    <strong>Cédula:</strong> {examen.CedulaColaborador}
                                </div>
                                <div className="detail-section" style={{ flex: 1, minWidth: '200px' }}>
                                    <strong>Tipo Examen:</strong> {examen.TipoExamen}
                                </div>
                                <div className="detail-section" style={{ flex: 1, minWidth: '200px' }}>
                                    <strong>Fecha Examen:</strong> {formatearFecha(examen.FechaExamen)}
                                </div>
                            </div>

                            {/* --- Concepto --- */}
                            <div className="detail-section" style={{marginTop: '1rem'}}>
                                <strong>Concepto de Aptitud:</strong> 
                                <p style={{margin: 0}}><strong>{examen.ConceptoAptitud}</strong></p>
                            </div>
                            
                            {/* --- Datos del PDF --- */}
                            <div className="detail-section">
                                <strong>Médico:</strong> {examen.MedicoEspecialista || 'N/A'}
                            </div>
                            <div className="detail-section">
                                <strong>Entidad:</strong> {examen.EntidadEmite || 'N/A'}
                            </div>
                            <div className="detail-section">
                                <strong>Duración:</strong> {examen.DuracionRecomendaciones || 'N/A'}
                            </div>
                            
                            <div className="detail-section">
                                <strong>Resumen del Caso:</strong>
                                <p className="detail-box">{examen.ResumenCaso || 'N/A'}</p>
                            </div>
                            <div className="detail-section">
                                <strong>Recomendaciones Médicas:</strong>
                                <p className="detail-box">{examen.RecomendacionesGenerales || 'N/A'}</p>
                            </div>
                            <div className="detail-section">
                                <strong>Recomendaciones Ocupacionales:</strong>
                                <p className="detail-box">{examen.RecomendacionesOcupacionales || 'N/A'}</p>
                            </div>
                            <div className="detail-section">
                                <strong>Compromisos:</strong>
                                <p className="detail-box">{examen.Compromisos || 'N/A'}</p>
                            </div>
                            <div className="detail-section">
                                <strong>Observaciones (Uso Interno):</strong>
                                <p className="detail-box">{examen.Observaciones || 'N/A'}</p>
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

export default ModalVerExamen;