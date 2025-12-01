// frontend/src/components/ModalGestionConductor.jsx

import React, { useState, useEffect } from 'react';
import '../style/Modal.css';
import Swal from 'sweetalert2';
// Importamos iconos para la interfaz visual
import { BsUpload, BsEyeFill, BsFileEarmarkCheckFill, BsCloudArrowUpFill } from 'react-icons/bs';

const ModalGestionConductor = ({ conductor, alCerrar, alExito }) => {
    
    // URL base de tu backend para construir el link del archivo (Asegúrate que coincida con tu puerto)
    const API_BASE_URL = 'http://localhost:5000';

    const [form, setForm] = useState({
        numeroLicencia: '',
        categoria: '',
        vencimiento: ''
    });
    
    const [archivo, setArchivo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Cargar datos existentes al abrir el modal
    useEffect(() => {
        if (conductor) {
            setForm({
                numeroLicencia: conductor.NumeroLicencia || '',
                categoria: conductor.Categoria || '',
                // Formato YYYY-MM-DD para que el input type="date" lo lea bien
                vencimiento: conductor.VencimientoLicencia ? conductor.VencimientoLicencia.split('T')[0] : ''
            });
        }
    }, [conductor]);

    const handleFileChange = (e) => {
        setArchivo(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append('idUsuario', conductor.ID_Usuario);
        formData.append('numeroLicencia', form.numeroLicencia);
        formData.append('categoria', form.categoria);
        formData.append('vencimiento', form.vencimiento);
        
        // Solo agregamos el archivo si el usuario seleccionó uno nuevo (Renovación)
        if (archivo) {
            formData.append('archivoLicencia', archivo);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/pesv/conductores`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.msg || 'Error al guardar');

            Swal.fire({
                title: '¡Actualizado!',
                text: 'La información y la licencia se han guardado correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            alExito(); 
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper para limpiar la ruta del archivo (quitando backslashes de Windows si existen)
    const getUrlArchivo = (ruta) => {
        if (!ruta) return '#';
        // Reemplaza barras invertidas por normales para que la URL sea válida
        const rutaLimpia = ruta.replace(/\\/g, '/'); 
        return `${API_BASE_URL}/${rutaLimpia}`;
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h3>Gestionar Conductor</h3>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        
                        {/* TARJETA DE RESUMEN DEL USUARIO */}
                        <div style={{marginBottom:'1.5rem', padding:'10px', backgroundColor:'#f0f7ff', borderRadius:'8px', display:'flex', alignItems:'center', gap:'10px', border: '1px solid #cce5ff'}}>
                            <div className="user-avatar" style={{width:'40px', height:'40px', fontSize:'1.2rem', backgroundColor: '#007BFF', color: 'white'}}>
                                {conductor.NombreCompleto.charAt(0)}
                            </div>
                            <div>
                                <div style={{fontWeight: 'bold', color: '#005A5B'}}>{conductor.NombreCompleto}</div>
                                <div style={{fontSize:'0.85rem', color:'#666'}}>C.C. {conductor.CedulaUsuario}</div>
                            </div>
                        </div>

                        {/* CAMPOS DE TEXTO */}
                        <div className="form-group">
                            <label>N° Licencia de Conducción *</label>
                            <input type="text" className="form-control" required 
                                value={form.numeroLicencia} onChange={e => setForm({...form, numeroLicencia: e.target.value})} 
                                placeholder="Ej: 1234567890"
                            />
                        </div>
                        
                        <div style={{display: 'flex', gap: '1rem'}}>
                            <div className="form-group" style={{flex: 1}}>
                                <label>Categoría *</label>
                                <input type="text" className="form-control" required 
                                    value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} 
                                    placeholder="Ej: C2"
                                />
                            </div>
                            
                            <div className="form-group" style={{flex: 1}}>
                                <label>Vencimiento *</label>
                                <input type="date" className="form-control" required 
                                    value={form.vencimiento} onChange={e => setForm({...form, vencimiento: e.target.value})} 
                                />
                            </div>
                        </div>
                        
                        <hr style={{margin: '1.5rem 0', border: '0', borderTop: '1px solid #eee'}}/>

                        {/* --- SECCIÓN DE ARCHIVO (VISUALIZACIÓN Y CARGA) --- */}
                        <div className="form-group">
                            <label style={{fontWeight: 'bold', marginBottom: '10px', display: 'block'}}>Soporte Digital (Licencia)</label>
                            
                            {/* 1. SI YA TIENE LICENCIA CARGADA: MOSTRAR BOTÓN DE VER */}
                            {conductor.RutaLicencia && (
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    backgroundColor: '#d4edda', border: '1px solid #c3e6cb', 
                                    padding: '10px 15px', borderRadius: '8px', marginBottom: '15px'
                                }}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#155724'}}>
                                        <BsFileEarmarkCheckFill size={20} />
                                        <span style={{fontSize: '0.9rem', fontWeight: '500'}}>Archivo actual cargado</span>
                                    </div>
                                    
                                    {/* BOTÓN PARA VER EL DOCUMENTO */}
                                    <a 
                                        href={getUrlArchivo(conductor.RutaLicencia)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-success"
                                        style={{
                                            backgroundColor: '#155724', color: 'white', textDecoration: 'none', 
                                            display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '4px'
                                        }}
                                    >
                                        <BsEyeFill /> Ver Licencia
                                    </a>
                                </div>
                            )}

                            {/* 2. INPUT PARA SUBIR O REEMPLAZAR */}
                            <div style={{
                                display:'flex', gap:'10px', alignItems:'center', 
                                border:'2px dashed #007BFF', padding:'1.5rem', borderRadius:'8px', 
                                backgroundColor:'#f8f9fa', flexDirection: 'column', textAlign: 'center'
                            }}>
                                <BsCloudArrowUpFill style={{color:'#007BFF', fontSize:'2rem'}}/>
                                <div style={{width: '100%'}}>
                                    <label htmlFor="file-upload" style={{cursor: 'pointer', color: '#007BFF', fontWeight: 'bold', textDecoration: 'underline'}}>
                                        {conductor.RutaLicencia ? 'Clic aquí para actualizar archivo' : 'Clic aquí para subir licencia'}
                                    </label>
                                    <input 
                                        id="file-upload"
                                        type="file" 
                                        onChange={handleFileChange} 
                                        accept=".pdf,.jpg,.jpeg,.png" 
                                        style={{display: 'none'}} 
                                    />
                                    <div style={{fontSize: '0.85rem', color: '#666', marginTop: '5px'}}>
                                        {archivo ? `Seleccionado: ${archivo.name}` : (conductor.RutaLicencia ? 'Opcional: Solo si desea reemplazar el actual' : 'Requerido: PDF o Imagen')}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar Información'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalGestionConductor;