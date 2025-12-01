// frontend/src/components/ModalDiligenciarInspeccion.jsx

import React, { useState, useEffect } from 'react';
// Importamos el servicio para traer las preguntas de la BD
import { crearInspeccion, getPreguntasFormulario } from '../services/inspectionService'; 
import { getActivosPorTipo } from '../services/assetService'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; 

// ÚNICO RENDERIZADOR NECESARIO AHORA
import FormularioGenericoRenderer from './forms/FormularioGenericoRenderer';

const ModalDiligenciarInspeccion = ({ 
    idFormulario, 
    nombreFormulario, 
    tipoActivo, 
    datosFormulario, // Puede venir con preguntas si es desde el gestor, o vacío si es desde biblioteca
    alCerrar, 
    alExito 
}) => {

    const [listaActivos, setListaActivos] = useState([]);
    const [isLoadingActivos, setIsLoadingActivos] = useState(false);
    const [idActivoSeleccionado, setIdActivoSeleccionado] = useState(null); 
    
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [datosDiligenciados, setDatosDiligenciados] = useState({}); 
    const [resultadoGeneral, setResultadoGeneral] = useState('OK');
    const [infoAdicionalActivo, setInfoAdicionalActivo] = useState('');
    const [otroActivoMencionado, setOtroActivoMencionado] = useState('');
    
    // Estado local para almacenar las preguntas que vienen de la BD
    const [preguntasLocales, setPreguntasLocales] = useState([]);
    const [isLoadingPreguntas, setIsLoadingPreguntas] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- 1. CARGAR ACTIVOS ---
    useEffect(() => {
        if (tipoActivo) {
            const cargarActivos = async () => {
                setIsLoadingActivos(true);
                try {
                    const data = await getActivosPorTipo(tipoActivo);
                    setListaActivos(data);
                } catch (err) { 
                    console.error("Error cargando activos:", err); 
                } finally { 
                    setIsLoadingActivos(false); 
                }
            };
            cargarActivos();
        }
    }, [tipoActivo]);

    // --- 2. CARGAR PREGUNTAS DEL FORMULARIO (LÓGICA UNIFICADA) ---
    useEffect(() => {
        // Opción A: Si ya nos pasaron las preguntas por props (ej: vista previa del gestor)
        if (datosFormulario && datosFormulario.preguntas && datosFormulario.preguntas.length > 0) {
            setPreguntasLocales(datosFormulario.preguntas);
            return;
        }

        // Opción B: Si no, vamos a la BD a buscarlas por el ID del formulario
        const cargarPreguntasBD = async () => {
            setIsLoadingPreguntas(true);
            try {
                // Esto traerá las preguntas que ya migraste a la tabla PreguntasInspeccion
                const data = await getPreguntasFormulario(idFormulario);
                setPreguntasLocales(data);
            } catch (err) {
                console.error("Error cargando preguntas:", err);
                setError("No se pudo cargar el checklist del formulario.");
            } finally {
                setIsLoadingPreguntas(false);
            }
        };
        
        if (idFormulario) {
            cargarPreguntasBD();
        }

    }, [idFormulario, datosFormulario]);


    // --- 3. RENDERIZADO DEL CONTENIDO ---
    const renderContent = () => {
        if (isLoadingPreguntas) return <p style={{textAlign:'center', padding:'2rem'}}>Cargando preguntas del formulario...</p>;
        
        if (!preguntasLocales || preguntasLocales.length === 0) {
            return (
                <div style={{padding: '2rem', textAlign: 'center', color: '#666', border: '1px dashed #ccc', borderRadius: '8px'}}>
                    <p><strong>Formulario vacío.</strong></p>
                    <p>No se encontraron preguntas configuradas para este formulario en la base de datos.</p>
                </div>
            );
        }

        // Usamos siempre el genérico, que ahora es capaz de renderizar cualquier lista de preguntas
        return (
            <FormularioGenericoRenderer 
                preguntas={preguntasLocales} 
                onFormChange={setDatosDiligenciados}
                onResultadoChange={setResultadoGeneral}
            />
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validación básica
        if (!datosDiligenciados.checklist || Object.keys(datosDiligenciados.checklist).length === 0) {
            setError('Por favor, diligencie el checklist (marque opciones).');
            return;
        }

        setIsLoading(true);
        try {
            // Estructura JSON final ("Tabla sobre Tabla")
            const datosJSONCompletos = {
                ...datosDiligenciados, // Aquí va el 'checklist' con respuestas y textos
                infoAdicionalActivo: infoAdicionalActivo,
                otroActivoMencionado: otroActivoMencionado
            };
            
            const payload = {
                idFormulario,
                idActivoInspeccionado: idActivoSeleccionado ? Number(idActivoSeleccionado) : null,
                datosDiligenciados: datosJSONCompletos, 
                observacionesGenerales,
                resultadoGeneral
            };
            
            await crearInspeccion(payload); 
            
            Swal.fire({ title: '¡Éxito!', text: 'Inspección guardada correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
            alExito(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Diligenciar: {nombreFormulario}</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        
                        {/* SELECTOR DE ACTIVO */}
                        <div className="form-group">
                            <label htmlFor="activo-select">
                                Seleccione el Activo / Área ({tipoActivo || 'General'})
                            </label>
                            
                            {isLoadingActivos ? (
                                <p>Cargando activos...</p>
                            ) : (
                                <select 
                                    id="activo-select" 
                                    className="form-control"
                                    value={idActivoSeleccionado || ''} 
                                    onChange={(e) => setIdActivoSeleccionado(e.target.value || null)}
                                >
                                    <option value="">-- Selección Opcional (Inspección General) --</option>
                                    
                                    {listaActivos.length > 0 ? (
                                        listaActivos.map(activo => (
                                            <option key={activo.ID_Activo} value={activo.ID_Activo}>
                                                {activo.NombreDescriptivo} ({activo.CodigoIdentificador})
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No hay activos registrados tipo "{tipoActivo}"</option>
                                    )}
                                </select>
                            )}
                        </div>

                        <div className="form-group" style={{display: 'flex', gap: '1rem'}}>
                            <div style={{flex: 1}}>
                                <label>Info Adicional (Serial/Placa/Detalle)</label>
                                <input type="text" className="form-control" value={infoAdicionalActivo} onChange={(e) => setInfoAdicionalActivo(e.target.value)} placeholder="Ej: Serial XT-123..." />
                            </div>
                            <div style={{flex: 1}}>
                                <label>Otra Área/Activo (Si no está en lista)</label>
                                <input type="text" className="form-control" value={otroActivoMencionado} onChange={(e) => setOtroActivoMencionado(e.target.value)} placeholder="Ej: Pasillo Principal..." />
                            </div>
                        </div>
                        
                        <hr />
                        
                        {/* Aquí se inyecta el formulario dinámico */}
                        {renderContent()}

                        <hr style={{ margin: '1.5rem 0' }} />
                        <div className="form-group">
                            <label>Observaciones Generales de la Inspección</label>
                            <textarea className="form-control" rows="2" value={observacionesGenerales} onChange={(e) => setObservacionesGenerales(e.target.value)} placeholder="Comentarios generales sobre la inspección..." />
                        </div>
                        
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Finalizar y Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalDiligenciarInspeccion;