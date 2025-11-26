// frontend/src/components/ModalFirmarSolicitud.jsx

import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import '../style/Modal.css';
import Swal from 'sweetalert2';

const ModalFirmarSolicitud = ({ solicitud, alCerrar, alExito }) => {
    const [comentario, setComentario] = useState('Aprobado y firmado.');
    const [modoFirma, setModoFirma] = useState('dibujar'); // 'dibujar' o 'subir'
    const [imagenSubida, setImagenSubida] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const sigCanvas = useRef({});

    const limpiarFirma = () => sigCanvas.current.clear();

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImagenSubida(e.target.files[0]);
        }
    };

    const handleAprobar = async () => {
        setIsProcessing(true);
        
        // 1. Preparar la imagen de la firma
        let firmaBlob = null;

        try {
            if (modoFirma === 'dibujar') {
                if (sigCanvas.current.isEmpty()) {
                    Swal.fire('Error', 'Por favor dibuje su firma.', 'warning');
                    setIsProcessing(false);
                    return;
                }
                
                // --- CORRECCIÓN AQUÍ ---
                // Eliminamos .getTrimmedCanvas() porque causa conflicto con Vite/Webpack
                // Usamos .toDataURL() directo que funciona perfecto.
                const dataURL = sigCanvas.current.toDataURL('image/png');
                
                const res = await fetch(dataURL);
                firmaBlob = await res.blob();

            } else {
                if (!imagenSubida) {
                    Swal.fire('Error', 'Por favor suba una imagen de su firma.', 'warning');
                    setIsProcessing(false);
                    return;
                }
                firmaBlob = imagenSubida;
            }

            // 2. Enviar al Backend
            const formData = new FormData();
            formData.append('idSolicitud', solicitud.ID_Solicitud);
            formData.append('estado', 'Aprobado');
            formData.append('comentario', comentario);
            formData.append('rutaDocumentoOriginal', solicitud.RutaDocumento); 
            formData.append('firma', firmaBlob, 'firma_admin.png'); 

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/solicitudes/responder', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                Swal.fire('¡Éxito!', 'Documento firmado y solicitud aprobada.', 'success');
                alExito(); 
            } else {
                throw new Error('Error en el servidor al firmar');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message || 'No se pudo procesar la firma', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '500px'}}>
                <div className="modal-header">
                    <h3>Firmar Documento</h3>
                    <button className="modal-close-button" onClick={alCerrar}>&times;</button>
                </div>
                <div className="modal-body">
                    <p style={{color:'#666'}}>Estás aprobando la solicitud de: <strong>{solicitud.Solicitante}</strong></p>
                    
                    <div className="form-group">
                        <label>Comentario de Aprobación</label>
                        <input className="form-control" value={comentario} onChange={e => setComentario(e.target.value)} />
                    </div>

                    <div style={{marginBottom:'10px', display:'flex', gap:'10px'}}>
                        <button className={`btn btn-sm ${modoFirma==='dibujar'?'btn-primary':'btn-secondary'}`} onClick={() => setModoFirma('dibujar')}>Dibujar</button>
                        <button className={`btn btn-sm ${modoFirma==='subir'?'btn-primary':'btn-secondary'}`} onClick={() => setModoFirma('subir')}>Subir Imagen</button>
                    </div>

                    {modoFirma === 'dibujar' ? (
                        <div style={{border: '2px dashed #ccc', borderRadius:'8px', backgroundColor:'#fff'}}>
                            <SignatureCanvas 
                                penColor="black"
                                canvasProps={{width: 460, height: 200, className: 'sigCanvas'}}
                                ref={sigCanvas}
                            />
                            <button onClick={limpiarFirma} style={{fontSize:'0.8rem', margin:'5px', color:'red', background:'none', border:'none', cursor:'pointer'}}>Borrar firma</button>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Subir imagen de firma (PNG/JPG)</label>
                            <input type="file" className="form-control" onChange={handleFileChange} accept="image/*" />
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={alCerrar} disabled={isProcessing}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleAprobar} disabled={isProcessing}>
                        {isProcessing ? 'Firmando...' : 'Estampar Firma y Aprobar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalFirmarSolicitud;