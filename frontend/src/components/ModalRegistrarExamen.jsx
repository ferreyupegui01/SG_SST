// frontend/src/componentes/ModalRegistrarExamen.jsx

import React, { useState } from 'react';
import { registrarExamen } from '../services/medicalService';
import { getUsuarioByCedula } from '../services/userService'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; 
import { BsSearch } from 'react-icons/bs';

// Listas de opciones
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
        duracionRecomendaciones: '',
        resumenCaso: '',
        recomendacionesGenerales: '', 
        recomendacionesOcupacionales: '',
        compromisos: '',
        observaciones: '' 
    });
    
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para opción "Otra"
    const [entidadSelect, setEntidadSelect] = useState('');
    const [medicoSelect, setMedicoSelect] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    // Manejo especial para Selects
    const handleSelectChange = (e, campo, setEstadoLocal) => {
        const valor = e.target.value;
        setEstadoLocal(valor);
        if (valor !== 'Otra' && valor !== 'Otro') {
            setFormData(prev => ({ ...prev, [campo]: valor }));
        } else {
            setFormData(prev => ({ ...prev, [campo]: '' }));
        }
    };

    // --- LÓGICA DE BÚSQUEDA RESTAURADA ---
    const handleBuscarCedula = async () => {
        if (!formData.cedulaColaborador) {
            Swal.fire('Atención', 'Por favor ingrese un número de cédula para buscar.', 'warning');
            return;
        }

        setIsSearching(true);
        try {
            const usuario = await getUsuarioByCedula(formData.cedulaColaborador);
            
            setFormData(prev => ({
                ...prev,
                idUsuarioColaborador: usuario.ID_Usuario,
                nombreColaborador: usuario.NombreCompleto
            }));

            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
                timerProgressBar: true, didOpen: (toast) => { toast.onmouseenter = Swal.stopTimer; toast.onmouseleave = Swal.resumeTimer; }
            });
            Toast.fire({ icon: 'success', title: 'Colaborador encontrado' });

        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setFormData(prev => ({
                ...prev,
                idUsuarioColaborador: '',
                nombreColaborador: '' 
            }));
            
            Swal.fire({
                title: 'Usuario no encontrado',
                text: 'El usuario no está registrado. Verifique la cédula o cree el usuario primero.',
                icon: 'error'
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.idUsuarioColaborador) {
            Swal.fire('Error', 'Debe buscar y seleccionar un colaborador válido antes de guardar.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            await registrarExamen(formData); 
            Swal.fire({
                title: '¡Éxito!',
                text: 'Examen médico registrado exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            alExito(); 
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Registrar Examen Médico Ocupacional</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        
                        {/* BUSCADOR */}
                        <div className="form-group">
                            <label htmlFor="cedulaColaborador">Cédula del Colaborador *</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text" id="cedulaColaborador" name="cedulaColaborador"
                                    value={formData.cedulaColaborador} onChange={handleChange}
                                    placeholder="Ingrese cédula y busque..." required style={{ flex: 1 }}
                                />
                                <button type="button" className="btn btn-secondary" onClick={handleBuscarCedula} disabled={isSearching}>
                                    <BsSearch /> {isSearching ? '...' : 'Buscar'}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="nombreColaborador">Nombre del Colaborador (Automático)</label>
                            <input type="text" id="nombreColaborador" name="nombreColaborador" value={formData.nombreColaborador} readOnly disabled style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Tipo de Examen *</label>
                                <select name="tipoExamen" value={formData.tipoExamen} onChange={handleChange}>
                                    <option value="Ingreso">Ingreso</option>
                                    <option value="Periódico">Periódico</option>
                                    <option value="Egreso">Egreso</option>
                                    <option value="Post-incapacidad">Post-incapacidad</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Fecha de Examen *</label>
                                <input type="date" name="fechaExamen" value={formData.fechaExamen} onChange={handleChange} required />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Concepto de Aptitud *</label>
                            <select name="conceptoAptitud" value={formData.conceptoAptitud} onChange={handleChange}>
                                <option value="Apto">Apto</option>
                                <option value="Apto con restricciones">Apto con restricciones</option>
                                <option value="No Apto">No Apto</option>
                            </select>
                        </div>

                        <hr />
                        <h4>Detalles del Concepto</h4>

                        {/* SELECTOR ENTIDAD */}
                        <div className="form-group">
                            <label>Entidad que emite (ARL/EPS)</label>
                            <select value={entidadSelect} onChange={(e) => handleSelectChange(e, 'entidadEmite', setEntidadSelect)}>
                                <option value="">-- Seleccione --</option>
                                {LISTA_ENTIDADES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {(entidadSelect === 'Otra') && (
                                <input type="text" name="entidadEmite" placeholder="Escriba el nombre..." value={formData.entidadEmite} onChange={handleChange} style={{ marginTop: '0.5rem' }} autoFocus />
                            )}
                        </div>

                        {/* SELECTOR MÉDICO */}
                        <div className="form-group">
                            <label>Profesional que emite (Médico)</label>
                            <select value={medicoSelect} onChange={(e) => handleSelectChange(e, 'medicoEspecialista', setMedicoSelect)}>
                                <option value="">-- Seleccione --</option>
                                {LISTA_ESPECIALISTAS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {(medicoSelect === 'Otro') && (
                                <input type="text" name="medicoEspecialista" placeholder="Escriba el tipo..." value={formData.medicoEspecialista} onChange={handleChange} style={{ marginTop: '0.5rem' }} />
                            )}
                        </div>

                        <div className="form-group"><label>Duración de Recomendaciones</label><input type="text" name="duracionRecomendaciones" value={formData.duracionRecomendaciones} onChange={handleChange} /></div>
                        <div className="form-group"><label>Breve resumen del caso</label><textarea name="resumenCaso" rows="2" value={formData.resumenCaso} onChange={handleChange} /></div>
                        <div className="form-group"><label>Recomendaciones Médicas</label><textarea name="recomendacionesGenerales" rows="3" value={formData.recomendacionesGenerales} onChange={handleChange} /></div>
                        <div className="form-group"><label>Recomendaciones Ocupacionales</label><textarea name="recomendacionesOcupacionales" rows="3" value={formData.recomendacionesOcupacionales} onChange={handleChange} /></div>
                        <div className="form-group"><label>Compromisos</label><textarea name="compromisos" rows="2" value={formData.compromisos} onChange={handleChange} /></div>
                        <div className="form-group"><label>Observaciones Internas</label><textarea name="observaciones" rows="2" value={formData.observaciones} onChange={handleChange} /></div>
                        
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Examen'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalRegistrarExamen;