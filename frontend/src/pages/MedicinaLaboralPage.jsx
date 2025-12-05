// frontend/src/components/ModalGenerarPdfMedico.jsx

import React, { useState } from 'react';
import { generarPdfExamen } from '../services/medicalService';
import '../style/Modal.css';
import { BsFileEarmarkPdfFill, BsCardHeading, BsCalendarEvent, BsHash } from 'react-icons/bs';
import Swal from 'sweetalert2';

const ModalGenerarPdfMedico = ({ examen, alCerrar }) => {
    
    // Valores por defecto del encabezado
    const [headerData, setHeaderData] = useState({
        codigo: 'SST-FTO-001',
        version: '1',
        fechaEmision: new Date().toISOString().split('T')[0],
        fechaRevision: new Date().toISOString().split('T')[0]
    });

    const [isGenerating, setIsGenerating] = useState(false);

    const handleChange = (e) => {
        setHeaderData({ ...headerData, [e.target.name]: e.target.value });
    };

    const handleGenerar = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            // Llamamos al servicio enviando el ID, Cédula y los datos del Encabezado
            await generarPdfExamen(examen.ID_ExamenMedico, examen.CedulaColaborador, headerData);
            
            Swal.fire({
                icon: 'success',
                title: 'PDF Descargado',
                text: 'El documento se ha generado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
            alCerrar();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" style={{maxWidth:'500px'}} onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h3>Generar PDF de Recomendaciones</h3>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <form onSubmit={handleGenerar}>
                    <div className="modal-body">
                        
                        <p style={{fontSize:'0.9rem', color:'#666', marginBottom: '1rem'}}>
                            Vas a generar el documento para: <strong style={{color:'#005A5B'}}>{examen.NombreColaborador}</strong>
                        </p>

                        {/* --- SECCIÓN DE ENCABEZADO (La que no te aparecía) --- */}
                        <div style={{backgroundColor: '#f0f7ff', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #cce5ff'}}>
                            <div style={{fontSize:'0.9rem', marginBottom:'15px', color:'#005A5B', display:'flex', alignItems:'center', gap:'8px', borderBottom:'1px solid #cce5ff', paddingBottom:'5px'}}>
                                <BsCardHeading size={18} />
                                <strong>Configuración del Encabezado</strong>
                            </div>
                            
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                {/* Código */}
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem', display:'flex', gap:'5px', alignItems:'center'}}><BsHash/> Código Doc</label>
                                    <input className="form-control" name="codigo" value={headerData.codigo} onChange={handleChange} required />
                                </div>
                                {/* Versión */}
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem', display:'flex', gap:'5px', alignItems:'center'}}><BsHash/> Versión</label>
                                    <input className="form-control" name="version" value={headerData.version} onChange={handleChange} required />
                                </div>
                                {/* Fecha Emisión */}
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem', display:'flex', gap:'5px', alignItems:'center'}}><BsCalendarEvent/> F. Emisión</label>
                                    <input type="date" className="form-control" name="fechaEmision" value={headerData.fechaEmision} onChange={handleChange} required />
                                </div>
                                {/* Fecha Revisión */}
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem', display:'flex', gap:'5px', alignItems:'center'}}><BsCalendarEvent/> F. Revisión</label>
                                    <input type="date" className="form-control" name="fechaRevision" value={headerData.fechaRevision} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isGenerating}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                            <BsFileEarmarkPdfFill /> {isGenerating ? 'Generando...' : 'Descargar PDF'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalGenerarPdfMedico;