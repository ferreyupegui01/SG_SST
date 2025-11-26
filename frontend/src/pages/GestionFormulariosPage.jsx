// frontend/src/pages/GestionFormulariosPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
    getFormularios, 
    getPreguntasFormulario, 
    agregarPregunta, 
    eliminarPregunta, 
    toggleVisibilidadFormulario,
    eliminarFormulario 
} from '../services/inspectionService';
import '../index.css'; // Asegúrate de que los estilos nuevos están aquí
import Swal from 'sweetalert2';
import { 
    BsPencilSquare, BsPlusCircleFill, BsTrashFill, BsListCheck, 
    BsArrowLeft, BsFileEarmarkPlus, BsToggleOn, BsToggleOff, 
    BsTrash, BsPencil, BsSearch, BsUiChecksGrid, BsFolder2Open 
} from 'react-icons/bs';
import { Link } from 'react-router-dom';
import ModalCrearFormulario from '../components/ModalCrearFormulario';

const GestionFormulariosPage = () => {
    // --- Estados ---
    const [formularios, setFormularios] = useState([]);
    const [busquedaForm, setBusquedaForm] = useState('');
    const [formularioSeleccionado, setFormularioSeleccionado] = useState(null);
    const [preguntas, setPreguntas] = useState([]);
    const [nuevaPregunta, setNuevaPregunta] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPreguntas, setIsLoadingPreguntas] = useState(false);
    
    // --- Modales ---
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [formularioParaEditar, setFormularioParaEditar] = useState(null);

    // --- Carga Inicial ---
    useEffect(() => {
        cargarFormularios();
    }, []);

    const cargarFormularios = async () => {
        setIsLoading(true);
        try {
            const data = await getFormularios();
            setFormularios(data);
            
            // Mantener selección si refrescamos
            if (formularioSeleccionado) {
                const aunExiste = data.find(f => f.ID_Formulario === formularioSeleccionado.ID_Formulario);
                if (!aunExiste) {
                    setFormularioSeleccionado(null);
                    setPreguntas([]);
                } else {
                    setFormularioSeleccionado(aunExiste);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Filtro de Búsqueda ---
    const formulariosFiltrados = useMemo(() => {
        return formularios.filter(f => 
            f.NombreFormulario.toLowerCase().includes(busquedaForm.toLowerCase()) ||
            f.TipoActivoAsociado.toLowerCase().includes(busquedaForm.toLowerCase())
        );
    }, [formularios, busquedaForm]);

    // --- Selección de Formulario ---
    const handleSeleccionar = async (form) => {
        setFormularioSeleccionado(form);
        setNuevaPregunta('');
        setIsLoadingPreguntas(true);
        try {
            const data = await getPreguntasFormulario(form.ID_Formulario);
            setPreguntas(data || []); 
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingPreguntas(false);
        }
    };

    // --- Acciones del Formulario ---
    const abrirModalCrear = () => {
        setFormularioParaEditar(null);
        setModalCrearAbierto(true);
    };

    const abrirModalEditar = (e) => {
        if (e) e.stopPropagation(); // Evitar clicks fantasma
        setFormularioParaEditar(formularioSeleccionado);
        setModalCrearAbierto(true);
    };

    const handleFormularioGuardado = () => {
        setModalCrearAbierto(false);
        cargarFormularios();
    };

    const handleToggleVisibilidad = async () => {
        if (!formularioSeleccionado) return;
        const nuevoEstado = !formularioSeleccionado.VisibleColaborador;
        try {
            await toggleVisibilidadFormulario(formularioSeleccionado.ID_Formulario, nuevoEstado);
            // Actualizar localmente
            const formActualizado = { ...formularioSeleccionado, VisibleColaborador: nuevoEstado };
            setFormularioSeleccionado(formActualizado);
            setFormularios(prev => prev.map(f => f.ID_Formulario === formActualizado.ID_Formulario ? formActualizado : f));
            
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
            Toast.fire({ 
                icon: nuevoEstado ? 'success' : 'info', 
                title: nuevoEstado ? 'Visible para Colaborador' : 'Oculto para Colaborador' 
            });
        // eslint-disable-next-line no-unused-vars
        } catch (error) { 
            Swal.fire('Error', 'No se pudo cambiar la visibilidad', 'error'); 
        }
    };

    const handleEliminarFormularioActual = async () => {
        if (!formularioSeleccionado) return;
        const result = await Swal.fire({
            title: '¿Eliminar Formulario?',
            text: `Se eliminará "${formularioSeleccionado.NombreFormulario}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d9534f',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await eliminarFormulario(formularioSeleccionado.ID_Formulario);
                Swal.fire('Eliminado', 'Formulario inactivado.', 'success');
                setFormularioSeleccionado(null);
                cargarFormularios();
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    // --- Acciones de Preguntas ---
    const handleAgregarPregunta = async (e) => {
        e.preventDefault();
        if (!nuevaPregunta.trim()) return;
        try {
            await agregarPregunta(formularioSeleccionado.ID_Formulario, nuevaPregunta);
            const data = await getPreguntasFormulario(formularioSeleccionado.ID_Formulario);
            setPreguntas(data);
            setNuevaPregunta('');
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    const handleEliminarPregunta = async (id) => {
        try {
            await eliminarPregunta(id);
            const data = await getPreguntasFormulario(formularioSeleccionado.ID_Formulario);
            setPreguntas(data);
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    // --- RENDERIZADO ---
    return (
        <div className="page-container" style={{height: '100vh', display:'flex', flexDirection:'column', overflow:'hidden'}}>
            
            {/* HEADER DE LA PÁGINA */}
            <div className="page-header" style={{ paddingBottom: '1rem', flexShrink: 0 }}>
                <h1>Gestor de Formularios</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/super-admin/dashboard" className="btn btn-secondary"><BsArrowLeft /> Volver</Link>
                    <button className="btn btn-primary" onClick={abrirModalCrear}><BsFileEarmarkPlus /> Crear Nuevo</button>
                </div>
            </div>

            {/* CONTENEDOR DIVIDIDO (SPLIT VIEW) */}
            <div className="split-layout-container">
                
                {/* === PANEL IZQUIERDO: LISTA === */}
                <div className="split-sidebar">
                    {/* Buscador */}
                    <div className="sidebar-search-box">
                        <div className="search-input-container" style={{width:'100%'}}>
                            <BsSearch style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'#999'}}/>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Buscar formulario..." 
                                style={{paddingLeft:'35px', borderRadius:'20px'}}
                                value={busquedaForm}
                                onChange={e => setBusquedaForm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Lista de Items */}
                    <div className="sidebar-list">
                        {isLoading ? <p style={{padding:'1rem', textAlign:'center'}}>Cargando...</p> : (
                            <>
                                {formulariosFiltrados.map(form => (
                                    <div 
                                        key={form.ID_Formulario}
                                        onClick={() => handleSeleccionar(form)}
                                        className={`form-item ${formularioSeleccionado?.ID_Formulario === form.ID_Formulario ? 'active' : ''}`}
                                    >
                                        <div className="form-item-title">{form.NombreFormulario}</div>
                                        <div className="form-item-subtitle">
                                            <span>{form.TipoActivoAsociado}</span>
                                            {form.VisibleColaborador ? 
                                                <span style={{color:'#28a745', fontSize:'0.7rem'}}>Visible</span> : 
                                                <span style={{color:'#ccc', fontSize:'0.7rem'}}>Oculto</span>
                                            }
                                        </div>
                                    </div>
                                ))}
                                {formulariosFiltrados.length === 0 && <div style={{padding:'1rem', textAlign:'center', color:'#999'}}>No se encontraron formularios.</div>}
                            </>
                        )}
                    </div>
                </div>

                {/* === PANEL DERECHO: EDITOR === */}
                <div className="split-content">
                    {!formularioSeleccionado ? (
                        <div className="empty-placeholder">
                            <BsUiChecksGrid />
                            <h3>Selecciona un Formulario</h3>
                            <p>Elige un formulario de la lista izquierda para ver sus preguntas.</p>
                        </div>
                    ) : (
                        <>
                            {/* 1. Cabecera del Formulario */}
                            <div className="editor-header">
                                <div>
                                    <h2 style={{margin:'0 0 5px 0', color:'var(--color-primario)'}}>{formularioSeleccionado.NombreFormulario}</h2>
                                    <div style={{display:'flex', gap:'15px', fontSize:'0.9rem', color:'#666'}}>
                                        <span>ID: <strong>{formularioSeleccionado.ID_Formulario}</strong></span>
                                        <span>Categoría: <strong>{formularioSeleccionado.Categoria}</strong></span>
                                    </div>
                                    <p style={{margin:'5px 0 0 0', fontSize:'0.9rem', fontStyle:'italic', color:'#888'}}>
                                        {formularioSeleccionado.Descripcion || 'Sin descripción'}
                                    </p>
                                </div>

                                {/* Barra de Herramientas */}
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button 
                                        className="btn" 
                                        onClick={handleToggleVisibilidad}
                                        title={formularioSeleccionado.VisibleColaborador ? "Ocultar" : "Hacer Visible"}
                                        style={{backgroundColor:'#fff', border:'1px solid #dee2e6', color: formularioSeleccionado.VisibleColaborador ? '#28a745' : '#999'}}
                                    >
                                        {formularioSeleccionado.VisibleColaborador ? <BsToggleOn size={22}/> : <BsToggleOff size={22}/>}
                                    </button>
                                    <button className="btn" onClick={abrirModalEditar} style={{backgroundColor:'#fff', border:'1px solid #dee2e6', color:'#f0ad4e'}} title="Editar Datos">
                                        <BsPencil size={18}/>
                                    </button>
                                    <button className="btn" onClick={handleEliminarFormularioActual} style={{backgroundColor:'#fff', border:'1px solid #dee2e6', color:'#d9534f'}} title="Eliminar Formulario">
                                        <BsTrash size={18}/>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Cuerpo (Lista de Preguntas) */}
                            <div className="editor-body">
                                <h4 style={{marginTop:0, marginBottom:'1rem', color:'#666', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
                                    Preguntas del Checklist ({preguntas.length})
                                </h4>

                                {isLoadingPreguntas ? <p>Cargando preguntas...</p> : (
                                    <>
                                        {preguntas.length === 0 ? (
                                            <div style={{textAlign:'center', padding:'2rem', color:'#999', border:'2px dashed #e0e0e0', borderRadius:'8px'}}>
                                                <BsFolder2Open style={{fontSize:'2rem', marginBottom:'10px'}} />
                                                <p>Este formulario no tiene preguntas. Agrega la primera abajo.</p>
                                            </div>
                                        ) : (
                                            <div style={{display:'flex', flexDirection:'column'}}>
                                                {preguntas.map((p, index) => (
                                                    <div key={p.ID_Pregunta} className="question-block">
                                                        <div className="q-number">{index + 1}</div>
                                                        <div className="q-text">{p.TextoPregunta}</div>
                                                        <button 
                                                            onClick={() => handleEliminarPregunta(p.ID_Pregunta)}
                                                            style={{background:'none', border:'none', color:'#d9534f', cursor:'pointer', padding:'5px'}}
                                                            title="Eliminar pregunta"
                                                        >
                                                            <BsTrashFill size={16}/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* 3. Footer (Agregar Pregunta) */}
                            <div className="editor-footer">
                                <form onSubmit={handleAgregarPregunta} style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Escribe una nueva pregunta aquí..." 
                                        value={nuevaPregunta} 
                                        onChange={(e) => setNuevaPregunta(e.target.value)} 
                                        style={{ flex: 1 }} 
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-primary" disabled={!nuevaPregunta.trim()}>
                                        <BsPlusCircleFill /> Agregar
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {modalCrearAbierto && (
                <ModalCrearFormulario 
                    formularioEditar={formularioParaEditar} 
                    alCerrar={() => setModalCrearAbierto(false)}
                    alExito={handleFormularioGuardado}
                />
            )}
        </div>
    );
};

export default GestionFormulariosPage;