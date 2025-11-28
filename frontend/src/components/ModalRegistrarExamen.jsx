// frontend/src/components/ModalRegistrarExamen.jsx

import React, { useState } from 'react';
import { registrarExamen } from '../services/medicalService';
import { getUsuarioByCedula, buscarUsuarioExterno } from '../services/userService'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; 
import { BsSearch, BsCloudDownload, BsCalendarCheck } from 'react-icons/bs';

const LISTA_ENTIDADES = ['Sura', 'Nueva EPS', 'Sanitas', 'Salud Total', 'Coomeva', 'Sura ARL', 'Bolívar', 'Positiva', 'Axa Colpatria', 'Otra'];
const LISTA_ESPECIALISTAS = ['Médico General', 'Médico Laboral', 'Ortopedista', 'Optómetra', 'Psicólogo', 'Fisioterapeuta', 'Otro'];

const ModalRegistrarExamen = ({ alCerrar, alExito }) => {
    
    const [formData, setFormData] = useState({
        idUsuarioColaborador: '', 
        nombreColaborador: '',    
        cedulaColaborador: '',    
        tipoExamen: 'Ingreso',
        fechaExamen: new Date().toISOString().split('T')[0],
        conceptoAptitud: 'Apto',
        medicoEspecialista: '',
        entidadEmite: '',
        
        fechaFinRecomendaciones: '', // REEMPLAZA A duracionRecomendaciones
        
        resumenCaso: '',
        recomendacionesGenerales: '', 
        recomendacionesOcupacionales: '',
        compromisos: '',
        observaciones: '' 
    });
    
    // UI
    const [modoBusqueda, setModoBusqueda] = useState('LOCAL'); 
    const [busquedaGosen, setBusquedaGosen] = useState('');
    const [resultadosGosen, setResultadosGosen] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [esIndefinida, setEsIndefinida] = useState(false); // Checkbox indefinida

    // Selects "Otra"
    const [entidadSelect, setEntidadSelect] = useState('');
    const [medicoSelect, setMedicoSelect] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSelectChange = (e, campo, setEstadoLocal) => {
        const valor = e.target.value;
        setEstadoLocal(valor);
        if (valor !== 'Otra' && valor !== 'Otro') {
            setFormData(prev => ({ ...prev, [campo]: valor }));
        } else {
            setFormData(prev => ({ ...prev, [campo]: '' }));
        }
    };

    const handleIndefinidaChange = (e) => {
        const checked = e.target.checked;
        setEsIndefinida(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, fechaFinRecomendaciones: '' }));
        }
    };

    // --- BÚSQUEDA LOCAL ---
    const handleBuscarCedulaLocal = async () => {
        if (!formData.cedulaColaborador) return Swal.fire('Atención', 'Ingrese cédula.', 'warning');
        setIsSearching(true);
        try {
            const usuario = await getUsuarioByCedula(formData.cedulaColaborador);
            setFormData(prev => ({
                ...prev,
                idUsuarioColaborador: usuario.ID_Usuario,
                nombreColaborador: usuario.NombreCompleto
            }));
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Usuario Local Encontrado', timer: 1500, showConfirmButton: false });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setFormData(prev => ({ ...prev, idUsuarioColaborador: '', nombreColaborador: '' }));
            Swal.fire('No encontrado', 'No existe en usuarios locales.', 'error');
        } finally { setIsSearching(false); }
    };

    // --- BÚSQUEDA GOSEN ---
    const handleBuscarGosen = async (e) => {
        e.preventDefault();
        if (!busquedaGosen) return;
        setIsSearching(true);
        setResultadosGosen([]);
        try {
            const data = await buscarUsuarioExterno(busquedaGosen);
            setResultadosGosen(data);
            if(data.length === 0) Swal.fire('Info', 'No encontrado en Base de datos de Gosen', 'info');
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            Swal.fire('Error', 'Fallo conexión Gosen', 'error');
        } finally { setIsSearching(false); }
    };

    const seleccionarDeGosen = async (emp) => {
        let idLocal = '';
        try {
            const usuarioLocal = await getUsuarioByCedula(emp.Cedula);
            idLocal = usuarioLocal.ID_Usuario;
        // eslint-disable-next-line no-unused-vars, no-empty
        } catch (e) {}

        setFormData(prev => ({
            ...prev,
            idUsuarioColaborador: idLocal || null,
            nombreColaborador: emp.Nombre,
            cedulaColaborador: emp.Cedula
        }));
        setModoBusqueda('LOCAL');
        setResultadosGosen([]);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Colaborador cargado de Gosen', timer: 1500, showConfirmButton: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombreColaborador || !formData.cedulaColaborador) {
            Swal.fire('Error', 'Debe identificar al colaborador.', 'error');
            return;
        }
        
        // Validación de fecha de fin
        if (!esIndefinida && !formData.fechaFinRecomendaciones) {
             if(formData.recomendacionesGenerales || formData.recomendacionesOcupacionales){
                 Swal.fire('Atención', 'Si hay recomendaciones, indique fecha de terminación o marque "Indefinidas".', 'warning');
                 return;
             }
        }

        setIsLoading(true);
        try {
            await registrarExamen(formData); 
            Swal.fire({ title: '¡Éxito!', text: 'Registrado correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
            alExito(); 
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Registrar Examen Médico</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                {/* TABS */}
                <div style={{display:'flex', borderBottom:'1px solid #eee', marginBottom:'1rem'}}>
                    <button type="button" onClick={() => setModoBusqueda('LOCAL')} style={{flex:1, padding:'10px', background:'none', borderBottom: modoBusqueda==='LOCAL'?'3px solid #005A5B':'none', fontWeight:'bold', color:modoBusqueda==='LOCAL'?'#005A5B':'#999', cursor:'pointer'}}><BsSearch/> Buscar Local</button>
                    <button type="button" onClick={() => setModoBusqueda('GOSEN')} style={{flex:1, padding:'10px', background:'none', borderBottom: modoBusqueda==='GOSEN'?'3px solid #005A5B':'none', fontWeight:'bold', color:modoBusqueda==='GOSEN'?'#005A5B':'#999', cursor:'pointer'}}><BsCloudDownload/> Buscar en Gosen</button>
                </div>

                {modoBusqueda === 'GOSEN' ? (
                    <div className="modal-body" style={{minHeight:'300px'}}>
                        <form onSubmit={handleBuscarGosen} style={{display:'flex', gap:'10px', marginBottom:'1rem'}}>
                            <input className="form-control" placeholder="Nombre o Cédula..." value={busquedaGosen} onChange={e=>setBusquedaGosen(e.target.value)} autoFocus/>
                            <button className="btn btn-primary" type="submit" disabled={isSearching}>Buscar</button>
                        </form>
                        <div style={{maxHeight:'250px', overflowY:'auto'}}>
                            {resultadosGosen.map((emp, idx) => (
                                <div key={idx} onClick={() => seleccionarDeGosen(emp)} style={{padding:'10px', borderBottom:'1px solid #eee', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}} onMouseEnter={e=>e.currentTarget.style.backgroundColor='#f9f9f9'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='white'}>
                                    <div><strong>{emp.Nombre}</strong><br/><small>{emp.Cedula} - {emp.Cargo}</small></div>
                                    <span className="btn btn-sm btn-secondary">Seleccionar</span>
                                </div>
                            ))}
                        </div>
                        <div style={{textAlign:'right', marginTop:'1rem'}}><button className="btn btn-link" onClick={() => setModoBusqueda('LOCAL')}>Cancelar</button></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label>Cédula Colaborador *</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input name="cedulaColaborador" value={formData.cedulaColaborador} onChange={handleChange} placeholder="Cédula..." required style={{ flex: 1 }} />
                                    <button type="button" className="btn btn-secondary" onClick={handleBuscarCedulaLocal} disabled={isSearching}><BsSearch /></button>
                                </div>
                            </div>
                            <div className="form-group"><label>Nombre</label><input value={formData.nombreColaborador} readOnly disabled style={{ backgroundColor: '#f0f0f0' }} /></div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Tipo Examen *</label>
                                    <select name="tipoExamen" value={formData.tipoExamen} onChange={handleChange}>
                                        <option>Ingreso</option><option>Periódico</option><option>Egreso</option><option>Post-incapacidad</option><option>Otro</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Fecha *</label>
                                    <input type="date" name="fechaExamen" value={formData.fechaExamen} onChange={handleChange} required />
                                </div>
                            </div>
                            
                            <div className="form-group"><label>Concepto Aptitud *</label>
                                <select name="conceptoAptitud" value={formData.conceptoAptitud} onChange={handleChange}>
                                    <option>Apto</option><option>Apto con restricciones</option><option>No Apto</option>
                                </select>
                            </div>

                            <hr />
                            
                            <div className="form-group">
                                <label>Entidad que emite (ARL/EPS)</label>
                                <select value={entidadSelect} onChange={(e) => handleSelectChange(e, 'entidadEmite', setEntidadSelect)}>
                                    <option value="">-- Seleccione --</option>
                                    {LISTA_ENTIDADES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                {(entidadSelect === 'Otra') && <input type="text" name="entidadEmite" placeholder="Escriba nombre..." value={formData.entidadEmite} onChange={handleChange} style={{marginTop:'0.5rem'}} />}
                            </div>

                            <div className="form-group">
                                <label>Profesional (Médico)</label>
                                <select value={medicoSelect} onChange={(e) => handleSelectChange(e, 'medicoEspecialista', setMedicoSelect)}>
                                    <option value="">-- Seleccione --</option>
                                    {LISTA_ESPECIALISTAS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                {(medicoSelect === 'Otro') && <input type="text" name="medicoEspecialista" placeholder="Escriba tipo..." value={formData.medicoEspecialista} onChange={handleChange} style={{marginTop:'0.5rem'}} />}
                            </div>

                            {/* --- CAMPO VIGENCIA RECOMENDACIONES --- */}
                            <div className="form-group" style={{backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #eee'}}>
                                <label style={{fontWeight: 'bold', color: '#005A5B', display:'flex', alignItems:'center', gap:'8px'}}>
                                    <BsCalendarCheck /> Fecha de terminación de recomendaciones
                                </label>
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px'}}>
                                    <input 
                                        type="date" 
                                        name="fechaFinRecomendaciones" 
                                        value={formData.fechaFinRecomendaciones} 
                                        onChange={handleChange} 
                                        className="form-control"
                                        style={{flex: 1, opacity: esIndefinida ? 0.5 : 1}}
                                        disabled={esIndefinida}
                                    />
                                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem', color: '#555', whiteSpace:'nowrap'}}>
                                        <input 
                                            type="checkbox" 
                                            checked={esIndefinida} 
                                            onChange={handleIndefinidaChange}
                                            style={{marginRight: '8px', width: '16px', height: '16px'}}
                                        />
                                        Indefinidas / No aplica
                                    </label>
                                </div>
                            </div>
                            {/* ------------------------------------------- */}

                            <div className="form-group"><label>Resumen del caso</label><textarea name="resumenCaso" rows="2" value={formData.resumenCaso} onChange={handleChange} /></div>
                            <div className="form-group"><label>Recomendaciones Médicas</label><textarea name="recomendacionesGenerales" rows="2" value={formData.recomendacionesGenerales} onChange={handleChange} /></div>
                            <div className="form-group"><label>Restricciones Ocupacionales</label><textarea name="recomendacionesOcupacionales" rows="2" value={formData.recomendacionesOcupacionales} onChange={handleChange} /></div>
                            <div className="form-group"><label>Compromisos</label><textarea name="compromisos" rows="2" value={formData.compromisos} onChange={handleChange} /></div>
                            <div className="form-group"><label>Observaciones Internas</label><textarea name="observaciones" rows="2" value={formData.observaciones} onChange={handleChange} /></div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>Guardar</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ModalRegistrarExamen;