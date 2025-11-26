// frontend/src/componentes/ModalVerInspeccion.jsx

import React, { useState, useEffect } from 'react';
import { getInspeccionDetalle } from '../services/inspectionService';
import InspeccionDetalleRenderer from './InspeccionDetalleRenderer'; 
import '../style/Modal.css';
import '../index.css';
import '../style/InspeccionesPage.css'; 

const ModalVerInspeccion = ({ inspeccionId, alCerrar }) => {
    
    const [inspeccion, setInspeccion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // --- VALIDACIÓN: No hacer nada si no hay ID ---
        if (!inspeccionId) {
            return; 
        }
        // ---------------------------------------------

        const cargarDetalle = async () => {
            try {
                setIsLoading(true);
                const data = await getInspeccionDetalle(inspeccionId);
                setInspeccion(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        cargarDetalle();
    }, [inspeccionId]);

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        return new Date(fechaISO.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO');
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Detalle de Inspección #{inspeccionId}</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {isLoading && <p>Cargando detalle...</p>}
                    {error && <p className="error-message">{error}</p>}
                    
                    {!isLoading && inspeccion && (
                        <div className="inspection-details">
                            <div className="detail-header-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="detail-section"><strong>Formulario:</strong> {inspeccion.NombreFormulario}</div>
                                <div className="detail-section"><strong>Fecha:</strong> {formatearFecha(inspeccion.FechaInspeccion)}</div>
                                <div className="detail-section"><strong>Realizado por:</strong> {inspeccion.NombreUsuarioRealizo}</div>
                                <div className="detail-section"><strong>Activo/Área:</strong> {inspeccion.NombreActivo || 'N/A'}</div>
                                <div className="detail-section"><strong>Resultado:</strong> <span className={`status-pill ${inspeccion.ResultadoGeneral === 'OK' ? 'status-activo' : 'status-pendiente'}`} style={{marginLeft: '0.5rem'}}>{inspeccion.ResultadoGeneral}</span></div>
                            </div>
                            <hr style={{margin: '1rem 0'}}/>
                            <InspeccionDetalleRenderer formId={inspeccion.ID_Formulario} jsonString={inspeccion.DatosDiligenciados} />
                            {inspeccion.ObservacionesGenerales && (<div className="detail-section" style={{ marginTop: '2rem' }}><strong>Observaciones Generales:</strong><p className="detail-box">{inspeccion.ObservacionesGenerales}</p></div>)}
                        </div>
                    )}
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={alCerrar}>Cerrar</button></div>
            </div>
        </div>
    );
};

export default ModalVerInspeccion;