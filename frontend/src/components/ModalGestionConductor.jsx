// frontend/src/components/ModalGestionConductor.jsx

import React, { useState, useEffect } from 'react';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsUpload, BsFileEarmarkPerson } from 'react-icons/bs';

const ModalGestionConductor = ({ conductor, alCerrar, alExito }) => {
    const [form, setForm] = useState({
        numeroLicencia: '',
        categoria: '',
        vencimiento: ''
    });
    const [archivo, setArchivo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Cargar datos existentes al abrir
    useEffect(() => {
        if (conductor) {
            setForm({
                numeroLicencia: conductor.NumeroLicencia || '',
                categoria: conductor.Categoria || '',
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

        // Usamos FormData para enviar archivo + texto
        const formData = new FormData();
        formData.append('idUsuario', conductor.ID_Usuario);
        formData.append('numeroLicencia', form.numeroLicencia);
        formData.append('categoria', form.categoria);
        formData.append('vencimiento', form.vencimiento);
        
        if (archivo) {
            formData.append('archivoLicencia', archivo);
        }

        try {
            const token = localStorage.getItem('token');
            // Hacemos fetch directo porque apiService suele estar configurado para JSON
            const response = await fetch('http://localhost:5000/api/pesv/conductores', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.msg || 'Error al guardar');

            Swal.fire('Actualizado', 'Información del conductor guardada correctamente.', 'success');
            alExito(); // Refrescar tabla padre
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
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
                        
                        <div style={{marginBottom:'1.5rem', padding:'10px', backgroundColor:'#f0f7ff', borderRadius:'8px', display:'flex', alignItems:'center', gap:'10px'}}>
                            <div className="user-avatar" style={{width:'40px', height:'40px', fontSize:'1.2rem'}}>
                                {conductor.NombreCompleto.charAt(0)}
                            </div>
                            <div>
                                <strong>{conductor.NombreCompleto}</strong>
                                <div style={{fontSize:'0.85rem', color:'#666'}}>C.C. {conductor.CedulaUsuario}</div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>N° Licencia de Conducción *</label>
                            <input type="text" className="form-control" required 
                                value={form.numeroLicencia} onChange={e => setForm({...form, numeroLicencia: e.target.value})} 
                                placeholder="Ej: 1234567890"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Categoría (Ej: C1, B2) *</label>
                            <input type="text" className="form-control" required 
                                value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Fecha Vencimiento Licencia *</label>
                            <input type="date" className="form-control" required 
                                value={form.vencimiento} onChange={e => setForm({...form, vencimiento: e.target.value})} 
                            />
                        </div>
                        
                        <div className="form-group" style={{marginTop: '1.5rem'}}>
                            <label>Adjuntar Copia Digital (Opcional)</label>
                            <div style={{display:'flex', gap:'10px', alignItems:'center', border:'2px dashed #ddd', padding:'1rem', borderRadius:'8px', backgroundColor:'#f9f9f9'}}>
                                <BsUpload style={{color:'#007BFF', fontSize:'1.5rem'}}/>
                                <div style={{flex:1}}>
                                    <input type="file" onChange={handleFileChange} accept=".pdf,image/*" style={{width:'100%'}} />
                                    <small style={{color:'#888', display:'block', marginTop:'5px'}}>Formatos: PDF, JPG, PNG</small>
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