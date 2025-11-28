// frontend/src/components/ModalGestionarDocs.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch, apiFetchBlob } from '../services/apiService';
import '../style/Modal.css';
import Swal from 'sweetalert2';
// Iconos
import { BsCloudUpload, BsFileEarmarkPdf, BsTrash, BsDownload, BsEyeFill } from 'react-icons/bs';

const ModalGestionarDocs = ({ colaborador, alCerrar }) => {
    const [docs, setDocs] = useState([]);
    const [tipoDoc, setTipoDoc] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Estado para saber cuál se está abriendo (loading visual)
    const [openingId, setOpeningId] = useState(null);

    useEffect(() => {
        cargarDocs();
    }, []);

    const cargarDocs = async () => {
        try {
            const data = await apiFetch(`/colaboradores-docs/${colaborador.Cedula}`);
            setDocs(data);
        } catch (error) { console.error(error); }
    };

    const handleSubir = async (e) => {
        e.preventDefault();
        if (!archivo || !tipoDoc) return Swal.fire('Error', 'Seleccione archivo y tipo', 'warning');

        setUploading(true);
        const formData = new FormData();
        formData.append('cedula', colaborador.Cedula);
        formData.append('nombreColaborador', colaborador.Nombre);
        formData.append('tipoDocumento', tipoDoc);
        formData.append('archivo', archivo);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/colaboradores-docs', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (res.ok) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Documento adjuntado', showConfirmButton: false, timer: 1500 });
                setArchivo(null);
                setTipoDoc('');
                document.getElementById('fileInputDocs').value = ""; 
                cargarDocs(); 
            } else { throw new Error('Error subiendo'); }
        // eslint-disable-next-line no-unused-vars
        } catch (err) { Swal.fire('Error', 'No se pudo subir', 'error'); } finally { setUploading(false); }
    };

    // --- VER EN PESTAÑA NUEVA ---
    const handleVer = async (doc) => {
        setOpeningId(doc.ID_Documento);
        try {
            const blob = await apiFetchBlob(`/colaboradores-docs/view/${doc.ID_Documento}`);
            const fileURL = window.URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se puede visualizar este archivo.', 'error');
        } finally {
            setOpeningId(null);
        }
    };

    const handleDescargar = async (doc) => {
        try {
            const blob = await apiFetchBlob(`/colaboradores-docs/download/${doc.ID_Documento}`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.NombreArchivo;
            a.click();
        // eslint-disable-next-line no-unused-vars
        } catch (e) { Swal.fire('Error', 'No se pudo descargar', 'error'); }
    };

    const handleEliminar = async (id) => {
        const result = await Swal.fire({ title: '¿Eliminar?', text: 'Se borrará permanentemente', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
        if (result.isConfirmed) {
            await apiFetch(`/colaboradores-docs/${id}`, { method: 'DELETE' });
            cargarDocs();
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <div>
                        <h2 style={{fontSize:'1.2rem'}}>Documentos del Colaborador</h2>
                        <div style={{color:'#666', fontSize:'0.9rem', marginTop:'5px'}}>
                            <strong>{colaborador.Nombre}</strong> | C.C. {colaborador.Cedula}
                        </div>
                    </div>
                    <button className="modal-close-button" onClick={alCerrar}>&times;</button>
                </div>

                <div className="modal-body">
                    
                    {/* FORMULARIO SUBIDA */}
                    <div style={{backgroundColor:'#f8f9fa', padding:'15px', borderRadius:'8px', marginBottom:'1.5rem', border:'1px solid #eee'}}>
                        <h4 style={{marginTop:0, color:'#005A5B', fontSize:'1rem'}}>Adjuntar Nuevo Documento</h4>
                        <form onSubmit={handleSubir} style={{display:'flex', gap:'10px', alignItems:'flex-end', flexWrap:'wrap'}}>
                            <div style={{flex:1, minWidth:'200px'}}>
                                <label style={{fontSize:'0.85rem'}}>Tipo de Documento</label>
                                <select className="form-control" value={tipoDoc} onChange={e => setTipoDoc(e.target.value)} required>
                                    <option value="">-- Seleccione --</option>
                                    <option>Examen Médico</option>
                                    <option>Certificado Laboral</option>
                                    <option>Contrato</option>
                                    <option>Capacitación / Diploma</option>
                                    <option>Incapacidad</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                            <div style={{flex:2, minWidth:'250px'}}>
                                <label style={{fontSize:'0.85rem'}}>Archivo</label>
                                <input id="fileInputDocs" type="file" className="form-control" onChange={e => setArchivo(e.target.files[0])} required />
                            </div>
                            <button className="btn btn-primary" disabled={uploading}>
                                <BsCloudUpload /> {uploading ? 'Subiendo...' : 'Adjuntar'}
                            </button>
                        </form>
                    </div>

                    {/* LISTA */}
                    <div style={{maxHeight:'300px', overflowY:'auto'}}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Nombre Archivo</th>
                                    <th>Fecha</th>
                                    <th style={{textAlign: 'center'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.length === 0 ? (
                                    <tr><td colSpan="4" style={{textAlign:'center', color:'#999', padding:'2rem'}}>No hay documentos adjuntos.</td></tr>
                                ) : (
                                    docs.map(d => (
                                        <tr key={d.ID_Documento}>
                                            <td><span className="status-pill status-activo" style={{fontSize:'0.75rem'}}>{d.TipoDocumento}</span></td>
                                            <td style={{maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={d.NombreArchivo}>
                                                <BsFileEarmarkPdf style={{color:'#dc3545', marginRight:'5px'}}/>
                                                {d.NombreArchivo}
                                            </td>
                                            <td>{new Date(d.FechaSubida).toLocaleDateString()}</td>
                                            
                                            <td style={{display:'flex', gap:'5px', justifyContent: 'center'}}>
                                                
                                                {/* BOTÓN VER (AZUL SÓLIDO) */}
                                                <button 
                                                    className="btn btn-sm" 
                                                    onClick={() => handleVer(d)} 
                                                    title="Ver documento"
                                                    disabled={openingId === d.ID_Documento}
                                                    style={{
                                                        backgroundColor: '#007BFF', // Azul fuerte
                                                        color: 'white',
                                                        border: 'none',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    {openingId === d.ID_Documento ? '...' : <BsEyeFill />}
                                                </button>

                                                {/* BOTÓN DESCARGAR (GRIS) */}
                                                <button 
                                                    className="btn btn-sm btn-secondary" 
                                                    onClick={() => handleDescargar(d)} 
                                                    title="Descargar"
                                                    style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                                >
                                                    <BsDownload />
                                                </button>

                                                {/* BOTÓN ELIMINAR (ROJO) */}
                                                <button 
                                                    className="btn btn-sm btn-danger" 
                                                    onClick={() => handleEliminar(d.ID_Documento)} 
                                                    title="Eliminar"
                                                    style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                                >
                                                    <BsTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalGestionarDocs;