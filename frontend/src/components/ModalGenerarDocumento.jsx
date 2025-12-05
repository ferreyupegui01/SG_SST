// frontend/src/components/ModalGenerarDocumento.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsCheckCircle, BsDownload, BsEye, BsFileText, BsCardHeading } from 'react-icons/bs';

const ModalGenerarDocumento = ({ paso, alCerrar, alExito }) => {
    const [plantilla, setPlantilla] = useState(null); 
    const [respuestas, setRespuestas] = useState({}); 
    
    // --- NUEVO: Estado para datos del encabezado ---
    const [headerData, setHeaderData] = useState({
        codigo: '',
        version: '',
        fechaEmision: '',
        fechaRevision: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfGenerado, setPdfGenerado] = useState(null); 

    const API_URL = 'http://localhost:5000'; 

    useEffect(() => {
        const cargarPlantilla = async () => {
            try {
                const data = await apiFetch(`/pesv/plantilla/${paso.ID_Paso}`);
                if (data.existe) {
                    setPlantilla(data);
                    
                    // Pre-llenar con lo que está configurado en BD
                    setHeaderData({
                        codigo: data.config.CodigoDocumento || `PESV-FTO-${paso.NumeroPaso}`,
                        version: data.config.Version || '1',
                        fechaEmision: data.config.FechaEmision ? data.config.FechaEmision.split('T')[0] : new Date().toISOString().split('T')[0],
                        fechaRevision: data.config.FechaRevision ? data.config.FechaRevision.split('T')[0] : new Date().toISOString().split('T')[0]
                    });

                } else {
                    setPlantilla(null); 
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo cargar la plantilla', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        cargarPlantilla();
    }, [paso]);

    const handleChange = (label, valor) => {
        setRespuestas({ ...respuestas, [label]: valor });
    };

    // Manejador para los campos del encabezado
    const handleHeaderChange = (e) => {
        setHeaderData({ ...headerData, [e.target.name]: e.target.value });
    };

    const handleGenerar = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            const response = await apiFetch('/pesv/pasos/generar', {
                method: 'POST',
                body: JSON.stringify({
                    idPaso: paso.ID_Paso,
                    datosFormulario: respuestas,
                    headerData: headerData // Enviamos los datos editados del encabezado
                })
            });
            
            setPdfGenerado(`${API_URL}/${response.ruta}`);
            
            Swal.fire({
                icon: 'success',
                title: '¡Generado!',
                text: 'Documento creado y firmado digitalmente.',
                timer: 1500,
                showConfirmButton: false
            });
            
            if (alExito) alExito();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const renderFormulario = () => {
        if (isLoading) return <p>Cargando estructura...</p>;
        
        if (!plantilla) {
            return (
                <div style={{textAlign:'center', padding:'2rem', color:'#666', backgroundColor:'#f8f9fa', borderRadius:'8px'}}>
                    <BsFileText style={{fontSize:'2rem', marginBottom:'10px', opacity:0.5}}/>
                    <p>Este paso aún no tiene una plantilla automática configurada.</p>
                    <p style={{fontSize:'0.85rem'}}>Por favor, contacte al Administrador para configurar el formato.</p>
                </div>
            );
        }

        return (
            <form onSubmit={handleGenerar}>
                
                {/* --- SECCIÓN DE ENCABEZADO EDITABLE --- */}
                <div style={{backgroundColor: '#f0f7ff', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #cce5ff'}}>
                    <h4 style={{marginTop: 0, fontSize: '0.9rem', color: '#005A5B', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <BsCardHeading /> Información del Documento
                    </h4>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                        <div className="form-group" style={{marginBottom: 0}}>
                            <label style={{fontSize: '0.8rem'}}>Código:</label>
                            <input className="form-control" name="codigo" value={headerData.codigo} onChange={handleHeaderChange} required />
                        </div>
                        <div className="form-group" style={{marginBottom: 0}}>
                            <label style={{fontSize: '0.8rem'}}>Versión:</label>
                            <input className="form-control" name="version" value={headerData.version} onChange={handleHeaderChange} required />
                        </div>
                        <div className="form-group" style={{marginBottom: 0}}>
                            <label style={{fontSize: '0.8rem'}}>Fecha Emisión:</label>
                            <input type="date" className="form-control" name="fechaEmision" value={headerData.fechaEmision} onChange={handleHeaderChange} required />
                        </div>
                        <div className="form-group" style={{marginBottom: 0}}>
                            <label style={{fontSize: '0.8rem'}}>Fecha Revisión:</label>
                            <input type="date" className="form-control" name="fechaRevision" value={headerData.fechaRevision} onChange={handleHeaderChange} required />
                        </div>
                    </div>
                </div>
                
                {/* --- HEADER VISUAL --- */}
                <div className="form-header-box">
                    <BsFileText />
                    <div>
                        <strong>{plantilla.config.TituloDocumento}</strong>
                        <p style={{margin:0, fontSize:'0.8rem'}}>{plantilla.config.CuerpoInicial.substring(0, 60)}...</p>
                    </div>
                </div>

                {/* --- CAMPOS DINÁMICOS --- */}
                {plantilla.campos.map((campo) => (
                    <div key={campo.ID_Campo} className="form-group">
                        <label>{campo.Etiqueta}</label>
                        {campo.TipoInput === 'parrafo' ? (
                            <textarea 
                                className="form-control" 
                                rows="3" 
                                required 
                                onChange={(e) => handleChange(campo.Etiqueta, e.target.value)}
                            />
                        ) : (
                            <input 
                                type={campo.TipoInput === 'fecha' ? 'date' : 'text'} 
                                className="form-control" 
                                required 
                                onChange={(e) => handleChange(campo.Etiqueta, e.target.value)}
                            />
                        )}
                    </div>
                ))}

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cancelar</button>
                    <button type="submit" className="btn btn-magic" disabled={isGenerating}>
                        {isGenerating ? 'Generando...' : 'Crear Documento'}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" style={{maxWidth: '650px'}} onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h3>{pdfGenerado ? 'Documento Listo' : `Generar: Paso ${paso.NumeroPaso}`}</h3>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                
                {!pdfGenerado ? (
                    <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                        {renderFormulario()}
                    </div>
                ) : (
                    // VISTA DE ÉXITO
                    <div className="modal-body" style={{textAlign:'center', padding:'2rem'}}>
                        <BsCheckCircle style={{fontSize:'4rem', color:'#28a745', marginBottom:'1rem'}} />
                        <h3 style={{color:'#005A5B'}}>¡Documento Generado!</h3>
                        <p style={{color:'#666', marginBottom:'2rem'}}>Se ha guardado en el historial del paso.</p>
                        
                        <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
                            <a href={pdfGenerado} target="_blank" rel="noopener noreferrer" className="btn btn-view" style={{textDecoration:'none'}}>
                                <BsEye /> Ver Online
                            </a>
                            <a href={`${API_URL}/api/pesv/download/${pdfGenerado.split('/').pop()}`} className="btn btn-download" style={{textDecoration:'none'}}>
                                <BsDownload /> Descargar
                            </a>
                        </div>
                        
                        <button className="btn btn-link" onClick={alCerrar} style={{marginTop:'2rem'}}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalGenerarDocumento;