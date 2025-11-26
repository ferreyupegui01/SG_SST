// frontend/src/pages/SolicitudesPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import '../style/Solicitudes.css';
import Swal from 'sweetalert2';
// Iconos
import { 
    BsSend, BsFileEarmarkPdf, BsCheckCircle, BsXCircle, BsInbox, 
    BsDownload, BsCloudCheck, BsPencilSquare, BsArrowRepeat 
} from 'react-icons/bs';
import ModalFirmarSolicitud from '../components/ModalFirmarSolicitud';

const SolicitudesPage = () => {
    const { usuario } = useAuth();
    const [solicitudes, setSolicitudes] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados Formulario
    const [tipo, setTipo] = useState('Firma Documento');
    const [mensaje, setMensaje] = useState('');
    const [modoAdjunto, setModoAdjunto] = useState('interno'); 
    const [archivoSubido, setArchivoSubido] = useState(null);
    const [docInternoSeleccionado, setDocInternoSeleccionado] = useState('');
    const [listaDocsInternos, setListaDocsInternos] = useState([]);
    const [isSending, setIsSending] = useState(false);

    // Estados Modal Firma
    const [modalFirmaOpen, setModalFirmaOpen] = useState(false);
    const [solicitudAFirmar, setSolicitudAFirmar] = useState(null);

    // Lógica de Actualización Manual (Input oculto)
    const fileInputRef = useRef(null);
    const [solicitudParaActualizar, setSolicitudParaActualizar] = useState(null);

    const esSuperAdmin = usuario.rol === 'Super Admin';
    const API_URL = 'http://localhost:5000'; 

    useEffect(() => {
        cargarSolicitudes();
        if (!esSuperAdmin) cargarDocsInternos();
    }, []);

    const cargarSolicitudes = async () => {
        try {
            const data = await apiFetch('/solicitudes');
            setSolicitudes(data);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const cargarDocsInternos = async () => {
        try {
            const docs = await apiFetch('/pesv/documentos-internos');
            setListaDocsInternos(docs);
        } catch (error) { console.error(error); }
    };

    // --- ENVIAR SOLICITUD ---
    const handleEnviar = async (e) => {
        e.preventDefault();
        setIsSending(true);

        const formData = new FormData();
        formData.append('tipo', tipo);
        formData.append('mensaje', mensaje);

        if (modoAdjunto === 'archivo' && archivoSubido) {
            formData.append('archivo', archivoSubido);
        } else if (modoAdjunto === 'interno' && docInternoSeleccionado) {
            formData.append('rutaDocumentoInterno', docInternoSeleccionado);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/solicitudes`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                Swal.fire('Enviado', 'Solicitud creada exitosamente.', 'success');
                setMensaje('');
                setArchivoSubido(null);
                setDocInternoSeleccionado('');
                cargarSolicitudes();
            } else throw new Error('Error al enviar');
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    // --- LÓGICA DE APROBACIÓN ---
    const handleAprobarClic = (solicitud) => {
        if (solicitud.RutaDocumento) {
            setSolicitudAFirmar(solicitud);
            setModalFirmaOpen(true);
        } else {
            // Aprobación simple
            apiFetch('/solicitudes/responder', {
                method: 'PUT',
                body: JSON.stringify({ idSolicitud: solicitud.ID_Solicitud, estado: 'Aprobado', comentario: 'Aprobado manual.' })
            }).then(() => {
                Swal.fire('Listo', 'Solicitud aprobada', 'success');
                cargarSolicitudes();
            });
        }
    };

    const handleRechazarClic = async (solicitud) => {
        const { value: text } = await Swal.fire({
            title: 'Rechazar Solicitud',
            input: 'textarea',
            inputPlaceholder: 'Motivo del rechazo...',
            showCancelButton: true,
            confirmButtonColor: '#d33'
        });
        if (text) {
            await apiFetch('/solicitudes/responder', {
                method: 'PUT',
                body: JSON.stringify({ idSolicitud: solicitud.ID_Solicitud, estado: 'Rechazado', comentario: text })
            });
            Swal.fire('Rechazado', 'Solicitud rechazada.', 'info');
            cargarSolicitudes();
        }
    };

    // --- LÓGICA DE ACTUALIZACIÓN MANUAL (BOTÓN RECICLAJE) ---
    const handleClicActualizar = (solicitud) => {
        setSolicitudParaActualizar(solicitud);
        fileInputRef.current.click(); 
    };

    const handleArchivoSeleccionado = async (e) => {
        const file = e.target.files[0];
        if (!file || !solicitudParaActualizar) return;

        const result = await Swal.fire({
            title: '¿Reemplazar documento firmado?',
            text: `Se subirá "${file.name}" como la versión final firmada.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, subir'
        });

        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('idSolicitud', solicitudParaActualizar.ID_Solicitud);
            formData.append('archivo', file);

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/solicitudes/actualizar-doc`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (response.ok) {
                    Swal.fire('¡Listo!', 'Documento actualizado.', 'success');
                    cargarSolicitudes();
                } else throw new Error('Error');
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
                Swal.fire('Error', 'No se pudo actualizar.', 'error');
            }
        }
        e.target.value = null;
        setSolicitudParaActualizar(null);
    };

    const getEstadoBadge = (estado) => {
        switch(estado) {
            case 'Pendiente': return <span className="status-pill status-pendiente">Pendiente</span>;
            case 'Aprobado': return <span className="status-pill status-activo">Aprobado</span>;
            case 'Rechazado': return <span className="status-pill status-inactivo">Rechazado</span>;
            default: return <span>{estado}</span>;
        }
    };

    return (
        <div className="solicitudes-container">
            <div className="page-header">
                <h1>{esSuperAdmin ? <><BsInbox /> Bandeja de Entrada</> : <><BsSend /> Centro de Solicitudes</>}</h1>
            </div>

            {/* INPUT OCULTO PARA ACTUALIZACIÓN */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display:'none'}} 
                accept=".pdf,.jpg,.png" 
                onChange={handleArchivoSeleccionado} 
            />

            {/* --- FORMULARIO SST --- */}
            {!esSuperAdmin && (
                <div className="solicitud-form-card">
                    <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>Nueva Solicitud</h3>
                    <form onSubmit={handleEnviar}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Tipo de Solicitud</label>
                                <select className="form-control" value={tipo} onChange={e => setTipo(e.target.value)}>
                                    <option>Firma Documento</option>
                                    <option>Aprobación</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mensaje</label>
                                <input className="form-control" required value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Describa su solicitud..." />
                            </div>
                        </div>

                        <div style={{backgroundColor:'#f8f9fa', padding:'1rem', borderRadius:'8px', border:'1px solid #dee2e6', marginBottom:'1rem'}}>
                            <label style={{fontWeight:'bold', marginBottom:'10px', display:'block'}}>Documento a Adjuntar:</label>
                            <div style={{display:'flex', gap:'20px', marginBottom:'15px'}}>
                                <label style={{cursor:'pointer'}}><input type="radio" checked={modoAdjunto === 'interno'} onChange={() => setModoAdjunto('interno')} /> <BsCloudCheck /> Del Software</label>
                                <label style={{cursor:'pointer'}}><input type="radio" checked={modoAdjunto === 'archivo'} onChange={() => setModoAdjunto('archivo')} /> <BsFileEarmarkPdf /> Subir PC</label>
                            </div>
                            
                            {modoAdjunto === 'interno' ? (
                                <select className="form-control" value={docInternoSeleccionado} onChange={e => setDocInternoSeleccionado(e.target.value)}>
                                    <option value="">-- Seleccione --</option>
                                    {listaDocsInternos.map(d => (
                                        <option key={d.ID_Evidencia} value={d.RutaArchivo}>{d.NombreArchivo}</option>
                                    ))}
                                </select>
                            ) : (
                                <input type="file" className="form-control" accept=".pdf,.jpg,.png" onChange={e => setArchivoSubido(e.target.files[0])} />
                            )}
                        </div>

                        <div style={{textAlign:'right'}}>
                            <button className="btn btn-primary" disabled={isSending}>{isSending ? 'Enviando...' : 'Enviar'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- TABLA --- */}
            <div className="solicitudes-list-card">
                <h3 style={{marginTop:0}}>Historial</h3>
                <div className="table-wrapper">
                    <table className="solicitud-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Solicitante</th>
                                <th>Mensaje</th>
                                <th>Documentos</th>
                                <th>Estado</th>
                                <th>Respuesta</th>
                                {esSuperAdmin && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudes.map(s => (
                                <tr key={s.ID_Solicitud}>
                                    <td>{new Date(s.FechaSolicitud).toLocaleDateString()}</td>
                                    <td><strong>{s.Solicitante}</strong><br/><small>{s.Cargo}</small></td>
                                    <td style={{maxWidth:'250px'}}>{s.Mensaje}</td>
                                    
                                    {/* COLUMNA DOCUMENTOS */}
                                    <td>
                                        <div className="btn-doc-group">
                                            {s.RutaDocumento && (
                                                <a href={`${API_URL}/api/pesv/download/${s.RutaDocumento.split('/').pop()}`} className="btn-doc btn-doc-original">
                                                    <BsFileEarmarkPdf /> Original
                                                </a>
                                            )}

                                            {s.RutaDocumentoFirmado && (
                                                <a href={`${API_URL}/api/pesv/download/${s.RutaDocumentoFirmado.split('/').pop()}`} className="btn-doc btn-doc-firmado">
                                                    <BsCheckCircle /> Firmado
                                                </a>
                                            )}

                                            {/* Botón Actualizar (Solo Admin) */}
                                            {esSuperAdmin && (
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{marginTop:'5px', backgroundColor:'#fff', border:'1px dashed #007BFF', color:'#007BFF', width:'100%', fontSize:'0.75rem'}}
                                                    onClick={() => handleClicActualizar(s)}
                                                    title="Reemplazar firmado manualmente"
                                                >
                                                    <BsArrowRepeat /> {s.RutaDocumentoFirmado ? 'Cambiar' : 'Subir'}
                                                </button>
                                            )}

                                            {!s.RutaDocumento && !s.RutaDocumentoFirmado && '--'}
                                        </div>
                                    </td>

                                    <td>{getEstadoBadge(s.Estado)}</td>
                                    <td>{s.ComentarioAdmin || '--'}</td>
                                    
                                    {esSuperAdmin && s.Estado === 'Pendiente' && (
                                        <td className="actions-cell">
                                            <button className="btn btn-sm btn-primary" title="Firmar" onClick={() => handleAprobarClic(s)}><BsPencilSquare /></button>
                                            <button className="btn btn-sm btn-danger" title="Rechazar" onClick={() => handleRechazarClic(s)}><BsXCircle /></button>
                                        </td>
                                    )}
                                    {esSuperAdmin && s.Estado !== 'Pendiente' && <td>--</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalFirmaOpen && solicitudAFirmar && (
                <ModalFirmarSolicitud 
                    solicitud={solicitudAFirmar} 
                    alCerrar={() => setModalFirmaOpen(false)} 
                    alExito={() => { setModalFirmaOpen(false); cargarSolicitudes(); }} 
                />
            )}
        </div>
    );
};

export default SolicitudesPage;