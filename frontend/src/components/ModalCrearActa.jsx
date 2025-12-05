// frontend/src/components/ModalCrearActa.jsx

import React, { useState } from 'react';
import { crearActa } from '../services/committeeService';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsPlusCircle, BsTrash } from 'react-icons/bs';

const ModalCrearActa = ({ alCerrar, alExito }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Datos Generales
    const [form, setForm] = useState({
        codigoDocumento: 'FTO-SST-COM-01', fechaEmision: '', fechaRevision: '', version: '1',
        numeroActa: '', lugar: 'Sala de Juntas', fechaReunion: '', horaInicio: '', horaFin: '',
        objetivo: '', desarrollo: '', nombrePresidente: '', nombreSecretario: ''
    });

    const [asistentes, setAsistentes] = useState([{ Nombre: '', Cargo: '' }]);
    const [compromisos, setCompromisos] = useState([{ Compromiso: '', Responsable: '', FechaEjecucion: '' }]);
    
    const [archivoManual, setArchivoManual] = useState(null);
    const [modoSubida, setModoSubida] = useState('GENERAR');

    const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    
    const updateAsistente = (idx, field, val) => {
        const newAsistentes = [...asistentes];
        newAsistentes[idx][field] = val;
        setAsistentes(newAsistentes);
    };
    const addAsistente = () => setAsistentes([...asistentes, { Nombre: '', Cargo: '' }]);
    const removeAsistente = (idx) => setAsistentes(asistentes.filter((_, i) => i !== idx));

    const updateCompromiso = (idx, field, val) => {
        const newComp = [...compromisos];
        newComp[idx][field] = val;
        setCompromisos(newComp);
    };
    const addCompromiso = () => setCompromisos([...compromisos, { Compromiso: '', Responsable: '', FechaEjecucion: '' }]);
    const removeCompromiso = (idx) => setCompromisos(compromisos.filter((_, i) => i !== idx));

    const handleSubmit = async () => {
        // VALIDACIÓN PREVIA
        if (!form.numeroActa || !form.fechaReunion) {
            Swal.fire('Faltan datos', 'Por favor complete el N° de Acta y la Fecha de Reunión.', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => formData.append(key, form[key]));
            
            formData.append('asistentes', JSON.stringify(asistentes));
            formData.append('compromisos', JSON.stringify(compromisos));

            if (modoSubida === 'SUBIR' && archivoManual) {
                formData.append('archivoManual', archivoManual);
            }

            await crearActa(formData);
            Swal.fire('Éxito', 'Acta guardada correctamente', 'success');
            alExito();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-lg" style={{maxWidth: '800px'}}>
                <div className="modal-header">
                    <h2>Crear Acta de Comité - Paso {step}/4</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{maxHeight:'60vh', overflowY:'auto'}}>
                    
                    {/* PASO 1: DATOS DE ENCABEZADO */}
                    {step === 1 && (
                        <>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                <button className={`btn ${modoSubida==='GENERAR'?'btn-primary':'btn-secondary'}`} onClick={()=>setModoSubida('GENERAR')}>Generar PDF en Sistema</button>
                                <button className={`btn ${modoSubida==='SUBIR'?'btn-primary':'btn-secondary'}`} onClick={()=>setModoSubida('SUBIR')}>Subir PDF Existente</button>
                            </div>

                            <div className="form-group-row">
                                <div className="form-group"><label>N° Acta *</label><input name="numeroActa" className="form-control" value={form.numeroActa} onChange={handleForm} required/></div>
                                <div className="form-group"><label>Lugar</label><input name="lugar" className="form-control" value={form.lugar} onChange={handleForm} /></div>
                                <div className="form-group"><label>Fecha Reunión *</label><input type="date" name="fechaReunion" className="form-control" value={form.fechaReunion} onChange={handleForm} required/></div>
                            </div>
                            <div className="form-group-row">
                                <div className="form-group"><label>Hora Inicio</label><input type="time" name="horaInicio" className="form-control" value={form.horaInicio} onChange={handleForm} /></div>
                                <div className="form-group"><label>Hora Fin</label><input type="time" name="horaFin" className="form-control" value={form.horaFin} onChange={handleForm} /></div>
                            </div>
                            
                            <h4 style={{borderBottom:'1px solid #eee'}}>Datos de Control (Encabezado PDF)</h4>
                            <div className="form-group-row">
                                <div className="form-group"><label>Código</label><input name="codigoDocumento" className="form-control" value={form.codigoDocumento} onChange={handleForm} /></div>
                                <div className="form-group"><label>Versión</label><input name="version" className="form-control" value={form.version} onChange={handleForm} /></div>
                                <div className="form-group"><label>Fecha Emisión</label><input type="date" name="fechaEmision" className="form-control" value={form.fechaEmision} onChange={handleForm} /></div>
                                <div className="form-group"><label>Fecha Revisión</label><input type="date" name="fechaRevision" className="form-control" value={form.fechaRevision} onChange={handleForm} /></div>
                            </div>
                        </>
                    )}

                    {/* PASO 2: ASISTENTES */}
                    {step === 2 && (
                        <>
                            <h4>Verificación de Quorum (Asistentes)</h4>
                            {asistentes.map((asis, idx) => (
                                <div key={idx} style={{display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center'}}>
                                    <input placeholder="Nombre Completo" className="form-control" value={asis.Nombre} onChange={(e) => updateAsistente(idx, 'Nombre', e.target.value)} />
                                    <input placeholder="Cargo" className="form-control" value={asis.Cargo} onChange={(e) => updateAsistente(idx, 'Cargo', e.target.value)} />
                                    <button className="btn btn-danger btn-sm" onClick={() => removeAsistente(idx)}><BsTrash/></button>
                                </div>
                            ))}
                            <button className="btn btn-secondary btn-sm" onClick={addAsistente}><BsPlusCircle/> Agregar Asistente</button>
                        </>
                    )}

                    {/* PASO 3: CONTENIDO Y COMPROMISOS */}
                    {step === 3 && (
                        <>
                            <div className="form-group">
                                <label>Objetivo de la Reunión</label>
                                <textarea name="objetivo" className="form-control" rows="2" value={form.objetivo} onChange={handleForm}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Desarrollo de la Reunión</label>
                                <textarea name="desarrollo" className="form-control" rows="4" value={form.desarrollo} onChange={handleForm}></textarea>
                            </div>

                            <h4>Compromisos</h4>
                            {compromisos.map((comp, idx) => (
                                <div key={idx} style={{display:'flex', gap:'5px', marginBottom:'10px', alignItems:'center'}}>
                                    <input placeholder="Compromiso" className="form-control" style={{flex:2}} value={comp.Compromiso} onChange={(e) => updateCompromiso(idx, 'Compromiso', e.target.value)} />
                                    <input placeholder="Responsable" className="form-control" style={{flex:1}} value={comp.Responsable} onChange={(e) => updateCompromiso(idx, 'Responsable', e.target.value)} />
                                    <input type="date" className="form-control" style={{width:'130px'}} value={comp.FechaEjecucion} onChange={(e) => updateCompromiso(idx, 'FechaEjecucion', e.target.value)} />
                                    <button className="btn btn-danger btn-sm" onClick={() => removeCompromiso(idx)}><BsTrash/></button>
                                </div>
                            ))}
                            <button className="btn btn-secondary btn-sm" onClick={addCompromiso}><BsPlusCircle/> Agregar Compromiso</button>
                        </>
                    )}

                    {/* PASO 4: CIERRE Y FIRMAS */}
                    {step === 4 && (
                        <>
                            <h4>Firmas</h4>
                            <div className="form-group-row">
                                <div className="form-group"><label>Nombre Presidente</label><input name="nombrePresidente" className="form-control" value={form.nombrePresidente} onChange={handleForm} /></div>
                                <div className="form-group"><label>Nombre Secretario</label><input name="nombreSecretario" className="form-control" value={form.nombreSecretario} onChange={handleForm} /></div>
                            </div>

                            {modoSubida === 'SUBIR' && (
                                <div className="form-group" style={{marginTop:'20px', border:'2px dashed #ccc', padding:'20px', textAlign:'center'}}>
                                    <label>Subir Acta Firmada (PDF)</label>
                                    <input type="file" className="form-control" accept=".pdf" onChange={(e) => setArchivoManual(e.target.files[0])} />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    {step > 1 && <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>Atrás</button>}
                    {step < 4 && <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Siguiente</button>}
                    {step === 4 && (
                        <button className="btn btn-success" onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Finalizar y Crear Acta'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalCrearActa;