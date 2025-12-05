// frontend/src/components/ModalGenerarPdfMedico.jsx

import React, { useState } from 'react';
import { generarPdfExamen } from '../services/medicalService';
import '../style/Modal.css';
import { BsFileEarmarkPdfFill, BsCardHeading } from 'react-icons/bs';
import Swal from 'sweetalert2';

const ModalGenerarPdfMedico = ({ examen, alCerrar }) => {
    
    // Valores por defecto
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
            await generarPdfExamen(examen.ID_ExamenMedico, examen.CedulaColaborador, headerData);
            
            Swal.fire({
                icon: 'success',
                title: 'PDF Descargado',
                text: 'El archivo se ha generado con el encabezado configurado.',
                timer: 2000,
                showConfirmButton: false
            });
            alCerrar(); // Cerramos el modal al terminar
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
                        
                        <div style={{backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #b6d4fe'}}>
                            <div style={{fontSize:'0.9rem', marginBottom:'10px', color:'#005A5B', display:'flex', alignItems:'center', gap:'8px'}}>
                                <BsCardHeading size={20} />
                                <strong>Configurar Encabezado del Documento</strong>
                            </div>
                            
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem'}}>Código</label>
                                    <input className="form-control" name="codigo" value={headerData.codigo} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem'}}>Versión</label>
                                    <input className="form-control" name="version" value={headerData.version} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem'}}>Fecha Emisión</label>
                                    <input type="date" className="form-control" name="fechaEmision" value={headerData.fechaEmision} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label style={{fontSize:'0.8rem'}}>Fecha Revisión</label>
                                    <input type="date" className="form-control" name="fechaRevision" value={headerData.fechaRevision} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <p style={{fontSize:'0.9rem', color:'#666'}}>
                            Se generará el acta para: <strong>{examen.NombreColaborador}</strong>
                        </p>

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