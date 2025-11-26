// frontend/src/components/ModalVerEvidencia.jsx

import React, { useState, useRef, useEffect } from 'react';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsDownload, BsFileEarmarkPdf, BsImage, BsEye, BsXCircle, BsArrowRepeat } from 'react-icons/bs';

const ModalVerEvidencia = ({ archivos, pasoNombre, alCerrar }) => {
    
    const API_URL = 'http://localhost:5000'; 
    
    // Estado local
    const [listaArchivos, setListaArchivos] = useState([]);
    // Referencia para el input file
    const fileInputRef = useRef(null);
    const [evidenciaAActualizar, setEvidenciaAActualizar] = useState(null);

    useEffect(() => {
        if (archivos) {
            setListaArchivos(archivos);
        }
    }, [archivos]);

    const esImagen = (ruta) => ruta && ruta.match(/\.(jpeg|jpg|gif|png)$/) != null;

    // --- 1. BOTÓN ACTUALIZAR ---
    const handleClicActualizar = (e, evidencia) => {
        e.preventDefault(); // Prevenir comportamientos por defecto
        e.stopPropagation(); // EVITAR QUE SE CIERRE EL MODAL
        
        setEvidenciaAActualizar(evidencia);
        
        // Disparar el selector de archivos
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // --- 2. AL SELECCIONAR ARCHIVO ---
    const handleArchivoSeleccionado = async (e) => {
        // Evitar propagación aquí también por seguridad
        e.stopPropagation();
        
        const file = e.target.files[0];
        if (!file || !evidenciaAActualizar) return;

        const result = await Swal.fire({
            title: '¿Reemplazar documento?',
            text: `Vas a cambiar "${evidenciaAActualizar.NombreArchivo}" por "${file.name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, reemplazar'
        });

        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('idEvidencia', evidenciaAActualizar.ID_Evidencia);
            formData.append('evidencia', file);

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/pesv/evidencias/reemplazar', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (response.ok) {
                    Swal.fire('¡Éxito!', 'Documento actualizado.', 'success');
                    
                    // Actualizar la lista visualmente al instante
                    const nuevaLista = listaArchivos.map(item => {
                        if (item.ID_Evidencia === evidenciaAActualizar.ID_Evidencia) {
                            return {
                                ...item,
                                NombreArchivo: file.name,
                                // Ruta visual temporal (el backend ya la guardó bien)
                                RutaArchivo: 'uploads/' + file.name, 
                                FechaSubida: new Date().toISOString()
                            };
                        }
                        return item;
                    });
                    setListaArchivos(nuevaLista);

                } else {
                    throw new Error('Error al actualizar');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo actualizar el archivo.', 'error');
            }
        }

        // Limpiar input para permitir subir el mismo archivo si se necesita
        e.target.value = null;
        setEvidenciaAActualizar(null);
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            
            {/* CONTENIDO DEL MODAL */}
            <div className="modal-content modal-lg" style={{maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
                
                {/* --- IMPORTANTE: EL INPUT DEBE ESTAR AQUÍ DENTRO (NO AFUERA) --- */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{display:'none'}} 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={handleArchivoSeleccionado}
                    onClick={(e) => e.stopPropagation()} // Doble seguridad
                />
                {/* ------------------------------------------------------------- */}

                <div className="modal-header">
                    <h3 style={{margin:0, fontSize:'1.2rem'}}>Evidencias: {pasoNombre}</h3>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{flex: 1, overflowY: 'auto', padding: '1.5rem'}}>
                    
                    {listaArchivos.length === 0 ? (
                        <div style={{textAlign:'center', padding:'2rem', color:'#999', border:'2px dashed #eee', borderRadius:'8px'}}>
                            <BsFileEarmarkPdf style={{fontSize:'3rem', marginBottom:'10px', opacity:0.3}}/>
                            <p>No hay archivos adjuntos en este paso.</p>
                        </div>
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            {listaArchivos.map((archivo) => {
                                const rutaLimpia = archivo.RutaArchivo ? archivo.RutaArchivo.replace(/\\/g, '/') : '';
                                const urlVer = `${API_URL}/${rutaLimpia}`;
                                const urlDescarga = `${API_URL}/api/pesv/download/${archivo.NombreArchivo}`;
                                
                                return (
                                    <div key={archivo.ID_Evidencia} style={{
                                        border: '1px solid #e0e0e0', 
                                        borderRadius: '8px', 
                                        padding: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: '#fff',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{display:'flex', alignItems:'center', gap:'15px', flex: 1, minWidth: 0}}>
                                            <div style={{
                                                width:'45px', height:'45px', borderRadius:'8px', 
                                                backgroundColor: esImagen(rutaLimpia) ? '#fff8e1' : '#e7f1ff',
                                                color: esImagen(rutaLimpia) ? '#ffc107' : '#007BFF',
                                                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem',
                                                flexShrink: 0
                                            }}>
                                                {esImagen(rutaLimpia) ? <BsImage /> : <BsFileEarmarkPdf />}
                                            </div>
                                            <div style={{overflow: 'hidden'}}>
                                                <div style={{fontWeight:'600', color:'#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={archivo.NombreArchivo}>
                                                    {archivo.NombreArchivo}
                                                </div>
                                                <div style={{fontSize:'0.75rem', color:'#888'}}>
                                                    Fecha: {new Date(archivo.FechaSubida).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{display:'flex', gap:'8px', marginLeft:'15px'}}>
                                            <a href={urlVer} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{backgroundColor: '#17a2b8', color: 'white'}}>
                                                <BsEye /> Ver
                                            </a>
                                            <a href={urlDescarga} className="btn btn-sm" style={{backgroundColor: '#6c757d', color: 'white'}}>
                                                <BsDownload /> Bajar
                                            </a>
                                            
                                            {/* BOTÓN ACTUALIZAR CORREGIDO */}
                                            <button 
                                                onClick={(e) => handleClicActualizar(e, archivo)} // Pasamos el evento 'e'
                                                className="btn btn-sm"
                                                type="button"
                                                style={{backgroundColor: '#fff', color: '#28a745', border: '1px solid #28a745', fontWeight: 'bold'}}
                                            >
                                                <BsArrowRepeat /> Actualizar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={alCerrar}>
                        <BsXCircle style={{marginRight:'5px'}}/> Cerrar Ventana
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerEvidencia;