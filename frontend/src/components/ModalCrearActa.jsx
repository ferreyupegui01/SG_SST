// frontend/src/components/ModalCrearActa.jsx

import React, { useState } from 'react';
import { crearActa } from '../services/committeeService';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsPlusCircle, BsTrash, BsCloudUpload, BsFileEarmarkText } from 'react-icons/bs';

const ModalCrearActa = ({ alCerrar, alExito }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [modoSubida, setModoSubida] = useState('GENERAR'); // 'GENERAR' o 'SUBIR'

    // Datos Generales
    const [form, setForm] = useState({
        codigoDocumento: 'FTO-SST-COM-01', 
        fechaEmision: '', 
        fechaRevision: '', 
        version: '1',
        numeroActa: '', 
        lugar: 'Sala de Juntas', 
        fechaReunion: new Date().toISOString().split('T')[0], 
        horaInicio: '', 
        horaFin: '',
        objetivo: '', 
        desarrollo: '', 
        nombrePresidente: '', 
        nombreSecretario: ''
    });

    const [asistentes, setAsistentes] = useState([{ Nombre: '', Cargo: '' }]);
    const [compromisos, setCompromisos] = useState([{ Compromiso: '', Responsable: '', FechaEjecucion: '' }]);
    
    const [archivoManual, setArchivoManual] = useState(null);

    const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    
    // --- Lógica de Listas (Solo usadas en modo GENERAR) ---
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

    // --- ENVIAR ---
    const handleSubmit = async () => {
        // VALIDACIÓN BÁSICA (Aplica para ambos modos)
        if (!form.numeroActa || !form.fechaReunion) {
            Swal.fire('Faltan datos', 'El N° de Acta y la Fecha son obligatorios para el historial.', 'warning');
            return;
        }

        // VALIDACIÓN ESPECÍFICA MODO SUBIR
        if (modoSubida === 'SUBIR' && !archivoManual) {
            Swal.fire('Atención', 'Debes seleccionar el archivo PDF del acta.', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            
            // 1. Datos del Formulario
            Object.keys(form).forEach(key => {
                // Si estamos en modo SUBIR, llenamos los campos de texto obligatorios con un default
                // para que la base de datos (NOT NULL) no falle.
                if (modoSubida === 'SUBIR' && (key === 'objetivo' || key === 'desarrollo')) {
                    formData.append(key, form[key] || 'Contenido en documento adjunto.');
                } else if (modoSubida === 'SUBIR' && (key === 'horaInicio' || key === 'horaFin')) {
                     formData.append(key, form[key] || '00:00');
                } else {
                    formData.append(key, form[key]);
                }
            });
            
            // 2. Listas (En modo SUBIR se envían vacías para no ensuciar la BD)
            if (modoSubida === 'GENERAR') {
                formData.append('asistentes', JSON.stringify(asistentes));
                formData.append('compromisos', JSON.stringify(compromisos));
            } else {
                formData.append('asistentes', '[]');
                formData.append('compromisos', '[]');
            }

            // 3. Archivo
            if (modoSubida === 'SUBIR' && archivoManual) {
                formData.append('archivoManual', archivoManual);
            }

            // Llamada al servicio
            await crearActa(formData);
            
            Swal.fire('Éxito', 'Acta guardada correctamente', 'success');
            alExito();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message || 'Error al guardar', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-lg" style={{maxWidth: '800px'}}>
                <div className="modal-header">
                    <h2>
                        {modoSubida === 'GENERAR' ? `Crear Acta - Paso ${step}/4` : 'Subir Acta Existente'}
                    </h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <div className="modal-body" style={{maxHeight:'65vh', overflowY:'auto'}}>
                    
                    {/* --- SELECTOR DE MODO --- */}
                    <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', backgroundColor:'#f8f9fa', padding:'10px', borderRadius:'8px', justifyContent:'center'}}>
                        <button 
                            className={`btn ${modoSubida==='GENERAR'?'btn-primary':'btn-secondary'}`} 
                            onClick={()=>{setModoSubida('GENERAR'); setStep(1);}}
                            style={{minWidth:'180px'}}
                        >
                            <BsFileEarmarkText /> Generar PDF (Wizard)
                        </button>
                        <button 
                            className={`btn ${modoSubida==='SUBIR'?'btn-primary':'btn-secondary'}`} 
                            onClick={()=>{setModoSubida('SUBIR'); setStep(1);}}
                            style={{minWidth:'180px'}}
                        >
                            <BsCloudUpload /> Subir PDF Listo
                        </button>
                    </div>

                    {/* =========================================================
                        VISTA PARA SUBIR PDF (FORMULARIO CORTO)
                       ========================================================= */}
                    {modoSubida === 'SUBIR' && (
                        <div className="fade-in">
                            <p style={{color:'#666', marginBottom:'1rem', textAlign:'center'}}>
                                Utiliza esta opción si ya tienes el acta firmada o escaneada. Solo necesitamos los datos básicos para el índice.
                            </p>

                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>N° Acta *</label>
                                    <input name="numeroActa" className="form-control" value={form.numeroActa} onChange={handleForm} placeholder="Ej: 005-2025" required autoFocus/>
                                </div>
                                <div className="form-group">
                                    <label>Fecha Reunión *</label>
                                    <input type="date" name="fechaReunion" className="form-control" value={form.fechaReunion} onChange={handleForm} required/>
                                </div>
                                <div className="form-group">
                                    <label>Lugar</label>
                                    <input name="lugar" className="form-control" value={form.lugar} onChange={handleForm} />
                                </div>
                            </div>

                            {/* Campos opcionales para mejorar la búsqueda futura */}
                            <div className="form-group">
                                <label>Objetivo / Tema Principal (Para búsquedas)</label>
                                <input name="objetivo" className="form-control" value={form.objetivo} onChange={handleForm} placeholder="Ej: Revisión indicadores trimestrales"/>
                            </div>

                            <div className="form-group" style={{marginTop:'20px', border:'2px dashed #007BFF', padding:'30px', textAlign:'center', backgroundColor:'#e7f1ff', borderRadius:'10px'}}>
                                <label style={{display:'block', marginBottom:'10px', fontSize:'1.1rem', color:'#005A5B', fontWeight:'bold'}}>
                                    <BsCloudUpload size={24} style={{verticalAlign:'middle', marginRight:'8px'}}/>
                                    Seleccionar Archivo PDF
                                </label>
                                <input 
                                    type="file" 
                                    className="form-control" 
                                    accept=".pdf" 
                                    onChange={(e) => setArchivoManual(e.target.files[0])} 
                                    style={{maxWidth:'400px', margin:'0 auto'}}
                                />
                                <small style={{display:'block', marginTop:'5px', color:'#666'}}>Máximo 10MB</small>
                            </div>
                        </div>
                    )}


                    {/* =========================================================
                        VISTA PARA GENERAR PDF (WIZARD 4 PASOS)
                       ========================================================= */}
                    {modoSubida === 'GENERAR' && (
                        <div className="fade-in">
                            {/* PASO 1: METADATA */}
                            {step === 1 && (
                                <>
                                    <div className="form-group-row">
                                        <div className="form-group"><label>N° Acta *</label><input name="numeroActa" className="form-control" value={form.numeroActa} onChange={handleForm} required/></div>
                                        <div className="form-group"><label>Lugar</label><input name="lugar" className="form-control" value={form.lugar} onChange={handleForm} /></div>
                                        <div className="form-group"><label>Fecha Reunión *</label><input type="date" name="fechaReunion" className="form-control" value={form.fechaReunion} onChange={handleForm} required/></div>
                                    </div>
                                    <div className="form-group-row">
                                        <div className="form-group"><label>Hora Inicio</label><input type="time" name="horaInicio" className="form-control" value={form.horaInicio} onChange={handleForm} /></div>
                                        <div className="form-group"><label>Hora Fin</label><input type="time" name="horaFin" className="form-control" value={form.horaFin} onChange={handleForm} /></div>
                                    </div>
                                    
                                    <h4 style={{borderBottom:'1px solid #eee', marginTop:'1rem', color:'#005A5B'}}>Datos de Control (Encabezado PDF)</h4>
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

                            {/* PASO 3: CONTENIDO */}
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

                            {/* PASO 4: FIRMAS */}
                            {step === 4 && (
                                <>
                                    <h4>Firmas (Aparecerán en el PDF)</h4>
                                    <div className="form-group-row">
                                        <div className="form-group"><label>Nombre Presidente</label><input name="nombrePresidente" className="form-control" value={form.nombrePresidente} onChange={handleForm} /></div>
                                        <div className="form-group"><label>Nombre Secretario</label><input name="nombreSecretario" className="form-control" value={form.nombreSecretario} onChange={handleForm} /></div>
                                    </div>
                                    
                                    <div style={{marginTop:'2rem', padding:'1rem', backgroundColor:'#e6f7ec', borderRadius:'8px', color:'#0f5132', textAlign:'center'}}>
                                        <BsFileEarmarkText size={20} style={{verticalAlign:'middle', marginRight:'10px'}}/>
                                        Al finalizar, el sistema generará automáticamente el PDF con el formato oficial.
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {/* BOTONES MODO GENERAR (WIZARD) */}
                    {modoSubida === 'GENERAR' && (
                        <>
                            {step > 1 && <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>Atrás</button>}
                            {step < 4 && <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Siguiente</button>}
                            {step === 4 && (
                                <button className="btn btn-success" onClick={handleSubmit} disabled={isLoading}>
                                    {isLoading ? 'Generando PDF...' : 'Finalizar y Crear'}
                                </button>
                            )}
                        </>
                    )}

                    {/* BOTONES MODO SUBIR (DIRECTO) */}
                    {modoSubida === 'SUBIR' && (
                        <>
                            <button className="btn btn-secondary" onClick={alCerrar}>Cancelar</button>
                            <button className="btn btn-success" onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? 'Subiendo...' : 'Guardar y Subir'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalCrearActa;