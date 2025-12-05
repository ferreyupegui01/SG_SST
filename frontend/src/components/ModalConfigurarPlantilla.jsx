// frontend/src/components/ModalConfigurarPlantilla.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsPlusCircle, BsTrash, BsCardHeading, BsTextParagraph } from 'react-icons/bs';

const ModalConfigurarPlantilla = ({ paso, alCerrar }) => {
    
    const [config, setConfig] = useState({
        // Datos del Encabezado
        codigo: '',
        version: '',
        fechaEmision: '',
        fechaRevision: '',
        
        // Datos del Contenido
        titulo: '',
        cuerpo: '',
        campos: [] 
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        cargarConfig();
    }, []);

    const cargarConfig = async () => {
        try {
            const data = await apiFetch(`/pesv/plantilla/${paso.ID_Paso}`);
            if (data.existe) {
                // Parseamos fechas para el input date (YYYY-MM-DD)
                const fEmision = data.config.FechaEmision ? data.config.FechaEmision.split('T')[0] : '';
                const fRevision = data.config.FechaRevision ? data.config.FechaRevision.split('T')[0] : '';

                setConfig({
                    titulo: data.config.TituloDocumento,
                    cuerpo: data.config.CuerpoInicial || '',
                    codigo: data.config.CodigoDocumento || '',
                    version: data.config.Version || '',
                    fechaEmision: fEmision,
                    fechaRevision: fRevision,
                    campos: data.campos.map(c => ({ label: c.Etiqueta, tipo: c.TipoInput, orden: c.Orden }))
                });
            } else {
                // Valores por defecto sugeridos
                setConfig(prev => ({
                    ...prev,
                    codigo: `PESV-FTO-${paso.NumeroPaso}`,
                    version: '1',
                    fechaEmision: new Date().toISOString().split('T')[0],
                    fechaRevision: new Date().toISOString().split('T')[0]
                }));
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
            Swal.fire('Atención', 'Debe agregar al menos un campo dinámico para el formulario.', 'warning');
            return;
        }
        setIsLoading(true);
        try {
            await apiFetch('/pesv/plantilla', {
                method: 'POST',
                body: JSON.stringify({
                    idPaso: paso.ID_Paso,
                    ...config // Enviamos todo: codigo, version, fechas, titulo, cuerpo, campos
                })
            });
            Swal.fire('Éxito', 'Diseño guardado correctamente.', 'success');
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
                        
                        {/* SECCIÓN 1: ENCABEZADO DE CONTROL */}
                        <div style={{backgroundColor:'#f0f7ff', padding:'15px', borderRadius:'8px', marginBottom:'1.5rem', border:'1px solid #cce5ff'}}>
                            <h4 style={{marginTop:0, color:'#005A5B', fontSize:'1rem', display:'flex', alignItems:'center', gap:'8px'}}>
                                <BsCardHeading /> Datos del Encabezado (Control Documental)
                            </h4>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                <div className="form-group" style={{flex:1, marginBottom:0}}>
                                    <label style={{fontSize:'0.85rem'}}>Código Doc</label>
                                    <input className="form-control" required value={config.codigo} onChange={e => setConfig({...config, codigo: e.target.value})} placeholder="PESV-FTO-001" />
                                </div>
                                <div className="form-group" style={{flex:1, marginBottom:0}}>
                                    <label style={{fontSize:'0.85rem'}}>Versión</label>
                                    <input className="form-control" required value={config.version} onChange={e => setConfig({...config, version: e.target.value})} placeholder="1" />
                                </div>
                            </div>
                            <div style={{display:'flex', gap:'10px'}}>
                                <div className="form-group" style={{flex:1, marginBottom:0}}>
                                    <label style={{fontSize:'0.85rem'}}>Fecha Emisión</label>
                                    <input type="date" className="form-control" required value={config.fechaEmision} onChange={e => setConfig({...config, fechaEmision: e.target.value})} />
                                </div>
                                <div className="form-group" style={{flex:1, marginBottom:0}}>
                                    <label style={{fontSize:'0.85rem'}}>Fecha Revisión</label>
                                    <input type="date" className="form-control" required value={config.fechaRevision} onChange={e => setConfig({...config, fechaRevision: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: CONTENIDO */}
                        <h4 style={{marginTop:0, color:'#005A5B', fontSize:'1rem', display:'flex', alignItems:'center', gap:'8px'}}>
                            <BsTextParagraph /> Contenido del Documento
                        </h4>
                        
                        <div className="form-group">
                            <label>Título del Documento (Aparece bajo el nombre del PESV)</label>
                            <input className="form-control" required value={config.titulo} onChange={e => setConfig({...config, titulo: e.target.value})} placeholder="Ej: ACTA DE CAPACITACIÓN EN SEGURIDAD VIAL" />
                        </div>
                        
                        <div className="form-group">
                            <label>Texto Introductorio (Párrafo fijo antes de los campos)</label>
                            <textarea className="form-control" rows="3" value={config.cuerpo} onChange={e => setConfig({...config, cuerpo: e.target.value})} placeholder="Ej: En la ciudad de Medellín, siendo el día..." />
                        </div>

                        <hr />
                        
                        {/* SECCIÓN 3: CAMPOS */}
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                            <h4 style={{margin:0, color:'#005A5B'}}>Campos Dinámicos (Formulario)</h4>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={agregarCampo}>
                                <BsPlusCircle /> Agregar Campo
                            </button>
                        </div>
                        
                        {config.campos.length === 0 && <p style={{color:'#999', textAlign:'center', fontStyle:'italic'}}>Agrega campos para que el usuario diligencie.</p>}

                        {config.campos.map((campo, idx) => (
                            <div key={idx} style={{display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center', backgroundColor:'#f8f9fa', padding:'10px', borderRadius:'6px', border:'1px solid #eee'}}>
                                <span style={{fontWeight:'bold', color:'#666', width:'20px'}}>{idx + 1}.</span>
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