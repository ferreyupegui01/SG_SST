// frontend/src/components/ModalConfigurarPlantilla.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsPlusCircle, BsTrash, BsFileEarmarkText } from 'react-icons/bs';

const ModalConfigurarPlantilla = ({ paso, alCerrar }) => {
    const [config, setConfig] = useState({
        titulo: '',
        cuerpo: '',
        campos: [] // [{ label: 'Nombre', tipo: 'texto', orden: 1 }]
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        cargarConfig();
    }, []);

    const cargarConfig = async () => {
        try {
            const data = await apiFetch(`/pesv/plantilla/${paso.ID_Paso}`);
            if (data.existe) {
                setConfig({
                    titulo: data.config.TituloDocumento,
                    cuerpo: data.config.CuerpoInicial || '',
                    campos: data.campos.map(c => ({ label: c.Etiqueta, tipo: c.TipoInput, orden: c.Orden }))
                });
            }
        } catch (error) { console.error(error); }
    };

    const agregarCampo = () => {
        setConfig(prev => ({
            ...prev,
            campos: [...prev.campos, { label: '', tipo: 'texto', orden: prev.campos.length + 1 }]
        }));
    };

    const actualizarCampo = (idx, key, val) => {
        const nuevos = [...config.campos];
        nuevos[idx][key] = val;
        setConfig({ ...config, campos: nuevos });
    };

    const borrarCampo = (idx) => {
        const nuevos = config.campos.filter((_, i) => i !== idx);
        setConfig({ ...config, campos: nuevos });
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        if (config.campos.length === 0) {
            Swal.fire('Atención', 'Debe agregar al menos un campo para el formulario.', 'warning');
            return;
        }
        setIsLoading(true);
        try {
            await apiFetch('/pesv/plantilla', {
                method: 'POST',
                body: JSON.stringify({
                    idPaso: paso.ID_Paso,
                    titulo: config.titulo,
                    cuerpo: config.cuerpo,
                    campos: config.campos
                })
            });
            Swal.fire('Éxito', 'Plantilla configurada correctamente. Ahora se puede generar.', 'success');
            alCerrar();
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Diseñar Formulario: Paso {paso.NumeroPaso}</h3>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleGuardar}>
                    <div className="modal-body" style={{maxHeight:'70vh', overflowY:'auto'}}>
                        
                        <div className="form-group">
                            <label>Título del Documento PDF</label>
                            <input className="form-control" required value={config.titulo} onChange={e => setConfig({...config, titulo: e.target.value})} placeholder="Ej: ACTA DE REUNIÓN" />
                        </div>
                        
                        <div className="form-group">
                            <label>Texto Introductorio (Fijo)</label>
                            <textarea className="form-control" rows="3" value={config.cuerpo} onChange={e => setConfig({...config, cuerpo: e.target.value})} placeholder="Ej: En la ciudad de Medellín se reunieron..." />
                        </div>

                        <hr />
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                            <h4 style={{margin:0, color:'#005A5B'}}>Campos Dinámicos</h4>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={agregarCampo}>
                                <BsPlusCircle /> Agregar Campo
                            </button>
                        </div>
                        
                        {config.campos.length === 0 && <p style={{color:'#999', textAlign:'center'}}>No hay campos definidos. Agrega uno.</p>}

                        {config.campos.map((campo, idx) => (
                            <div key={idx} style={{display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center', backgroundColor:'#f8f9fa', padding:'10px', borderRadius:'6px'}}>
                                <span style={{fontWeight:'bold', color:'#666'}}>{idx + 1}.</span>
                                <input 
                                    className="form-control" 
                                    placeholder="Nombre del Campo (Ej: Nombre Asistente)" 
                                    value={campo.label} 
                                    onChange={e => actualizarCampo(idx, 'label', e.target.value)}
                                    required
                                    style={{flex: 2}}
                                />
                                <select className="form-control" value={campo.tipo} onChange={e => actualizarCampo(idx, 'tipo', e.target.value)} style={{flex: 1}}>
                                    <option value="texto">Texto Corto</option>
                                    <option value="fecha">Fecha</option>
                                    <option value="parrafo">Párrafo Largo</option>
                                </select>
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => borrarCampo(idx)}><BsTrash /></button>
                            </div>
                        ))}

                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar Diseño'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalConfigurarPlantilla;