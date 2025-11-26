// frontend/src/components/ModalCrearFormulario.jsx

import React, { useState, useEffect } from 'react';
import { crearNuevoFormulario, editarFormulario, getTiposActivosUnicos } from '../services/inspectionService';
import '../style/Modal.css';
import '../index.css';
import Swal from 'sweetalert2';
import { BsPlusLg, BsTrash } from 'react-icons/bs';

const ModalCrearFormulario = ({ formularioEditar, alCerrar, alExito }) => {
    
    const isEditMode = !!formularioEditar; // Detecta si estamos editando

    const [formData, setFormData] = useState({
        idFormulario: '',
        nombreFormulario: '',
        descripcion: '',
        tipoActivoAsociado: '',
        categoria: 'General',
        visibleColaborador: false
    });

    // Preguntas (Solo para creación)
    const [preguntas, setPreguntas] = useState([{ id: 1, texto: '' }]);
    
    // Estados para el selector inteligente
    const [listaTiposExistentes, setListaTiposExistentes] = useState([]);
    const [tipoInputMode, setTipoInputMode] = useState('select'); // 'select' o 'text'
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 1. Cargar lista de tipos de activos existentes
        const cargarTipos = async () => {
            try {
                const tipos = await getTiposActivosUnicos();
                setListaTiposExistentes(tipos);
            } catch (e) { console.error(e); }
        };
        cargarTipos();

        // 2. Si es edición, llenar los campos
        if (isEditMode) {
            setFormData({
                idFormulario: formularioEditar.ID_Formulario,
                nombreFormulario: formularioEditar.NombreFormulario,
                descripcion: formularioEditar.Descripcion || '',
                tipoActivoAsociado: formularioEditar.TipoActivoAsociado,
                categoria: formularioEditar.Categoria,
                visibleColaborador: formularioEditar.VisibleColaborador
            });
            // En modo edición, verificamos si el tipo actual está en la lista
            // Si no está, cambiamos a modo texto para que se vea
            setTipoInputMode('text'); 
        }
    }, [isEditMode, formularioEditar]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Manejo de Preguntas (Solo Creación)
    const handlePreguntaChange = (id, texto) => {
        setPreguntas(preguntas.map(p => p.id === id ? { ...p, texto } : p));
    };
    const agregarPregunta = () => {
        const nuevoId = preguntas.length > 0 ? Math.max(...preguntas.map(p => p.id)) + 1 : 1;
        setPreguntas([...preguntas, { id: nuevoId, texto: '' }]);
    };
    const eliminarPregunta = (id) => {
        if (preguntas.length > 1) setPreguntas(preguntas.filter(p => p.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isEditMode && preguntas.some(p => !p.texto.trim())) {
            Swal.fire('Error', 'Todas las preguntas deben tener texto.', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            if (isEditMode) {
                // Lógica Edición
                await editarFormulario(formData.idFormulario, formData);
                Swal.fire('¡Actualizado!', 'El formulario ha sido actualizado.', 'success');
            } else {
                // Lógica Creación
                const payload = {
                    ...formData,
                    preguntas: preguntas.map((p, index) => ({ texto: p.texto, orden: index + 1 }))
                };
                await crearNuevoFormulario(payload);
                Swal.fire({ icon: 'success', title: '¡Formulario Creado!', text: 'Ahora puedes asociar activos a este formulario.' });
            }
            alExito();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditMode ? 'Editar Formulario' : 'Crear Nuevo Formulario'}</h2>
                    <button className="modal-close-button" onClick={alCerrar}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                        
                        <div className="form-group">
                            <label>Código Identificador *</label>
                            <input 
                                name="idFormulario" 
                                value={formData.idFormulario} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ej: FTO-SST-TRACTO" 
                                disabled={isEditMode} // No editable en modo edición
                                style={isEditMode ? {backgroundColor: '#e9ecef', cursor:'not-allowed'} : {}}
                            />
                            <small style={{color:'#666'}}>Este código es único y no se puede cambiar después.</small>
                        </div>

                        <div className="form-group">
                            <label>Nombre del Formulario *</label>
                            <input name="nombreFormulario" value={formData.nombreFormulario} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Descripción</label>
                            <input name="descripcion" value={formData.descripcion} onChange={handleChange} />
                        </div>
                        
                        <div style={{display:'flex', gap:'1rem', flexWrap: 'wrap'}}>
                            
                            {/* --- SELECTOR DE TIPO DE ACTIVO MEJORADO --- */}
                            <div className="form-group" style={{flex:1, minWidth: '250px'}}>
                                <label>Tipo de Activo Asociado *</label>
                                
                                <div style={{display:'flex', gap:'5px'}}>
                                    {tipoInputMode === 'select' ? (
                                        <select 
                                            className="form-control"
                                            name="tipoActivoAsociado" 
                                            value={formData.tipoActivoAsociado} 
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">-- Seleccione uno existente --</option>
                                            {listaTiposExistentes.map((tipo, i) => (
                                                <option key={i} value={tipo}>{tipo}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input 
                                            className="form-control"
                                            name="tipoActivoAsociado"
                                            value={formData.tipoActivoAsociado}
                                            onChange={handleChange}
                                            placeholder="Escriba el nuevo tipo..."
                                            required
                                        />
                                    )}
                                    
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        style={{padding: '0 10px'}}
                                        onClick={() => {
                                            setTipoInputMode(prev => prev === 'select' ? 'text' : 'select');
                                            if (tipoInputMode === 'select') setFormData(prev => ({...prev, tipoActivoAsociado: ''}));
                                        }}
                                        title={tipoInputMode === 'select' ? "Crear nuevo tipo" : "Seleccionar existente"}
                                    >
                                        {tipoInputMode === 'select' ? <BsPlusLg /> : 'Lista'}
                                    </button>
                                </div>
                                <small style={{color:'#666'}}>
                                    {tipoInputMode === 'select' ? 'Selecciona un tipo existente de tus activos.' : 'Define un nuevo tipo de activo para el sistema.'}
                                </small>
                            </div>

                            {/* --- CATEGORÍAS AJUSTADAS SEGÚN TU SOLICITUD --- */}
                            <div className="form-group" style={{flex:1, minWidth: '250px'}}>
                                <label>Categoría del Comportamiento *</label>
                                <select name="categoria" value={formData.categoria} onChange={handleChange} required>
                                    <option value="General">General Inspecciones (Extintores, Orden y Aseo...)</option>
                                    <option value="Vehiculo">Vehículo (Pide Placa, SOAT, KM)</option>
                                </select>
                            </div>
                        </div>

                        {/* SECCIÓN DE PREGUNTAS (SOLO EN CREACIÓN) */}
                        {!isEditMode && (
                            <>
                                <hr />
                                <h3>Preguntas Iniciales del Checklist</h3>
                                <p style={{fontSize:'0.9rem', color:'#666'}}>Podrás agregar o quitar más preguntas después en el gestor.</p>
                                {preguntas.map((p, index) => (
                                    <div key={p.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <span style={{fontWeight: 'bold', marginTop: '10px'}}>{index + 1}.</span>
                                        <input type="text" value={p.texto} onChange={(e) => handlePreguntaChange(p.id, e.target.value)} placeholder="Escribe la pregunta..." style={{flex: 1}} required />
                                        <button type="button" className="btn btn-danger" onClick={() => eliminarPregunta(p.id)}><BsTrash /></button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-secondary" onClick={agregarPregunta}><BsPlusLg /> Agregar Pregunta</button>
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Guardar')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCrearFormulario;