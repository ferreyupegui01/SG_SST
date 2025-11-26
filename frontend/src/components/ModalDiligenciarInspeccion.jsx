// frontend/src/componentes/ModalDiligenciarInspeccion.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { crearInspeccion } from '../services/inspectionService';
import { getActivosPorTipo } from '../services/assetService'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; 

// Importamos los formularios específicos (para los viejos)
import FormExtintores from './forms/FormExtintores'; 
import FormVehiculos from './forms/FormVehiculos';
import FormBotiquin from './forms/FormBotiquin';
import FormOrdenAseo from './forms/FormOrdenAseo';
import FormSeguridadGeneral from './forms/FormSeguridadGeneral';
import FormSustanciasQuimicas from './forms/FormSustanciasQuimicas';
import FormRiesgoElectrico from './forms/FormRiesgoElectrico';
// Importamos el Renderizador Genérico (para los NUEVOS)
import FormularioGenericoRenderer from './forms/FormularioGenericoRenderer';

const ModalDiligenciarInspeccion = ({ 
    idFormulario, 
    nombreFormulario, 
    tipoActivo, // <--- ESTE ES EL DATO CLAVE QUE VIENE DE LA BD
    datosFormulario, // (Estructura de preguntas si es dinámico)
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
    // eslint-disable-next-line no-unused-vars
    const [otroActivoMencionado, setOtroActivoMencionado] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- 1. CARGAR ACTIVOS (CORREGIDO) ---
    // Ahora confiamos plenamente en la prop 'tipoActivo'
    useEffect(() => {
        if (tipoActivo) {
            const cargarActivos = async () => {
                setIsLoadingActivos(true);
                try {
                    // Busca activos del tipo específico (ej: "Montacargas", "Vehiculo")
                    const data = await getActivosPorTipo(tipoActivo);
                    setListaActivos(data);
                } catch (err) { 
                    console.error("Error cargando activos:", err); 
                    // No mostramos error fatal, solo lista vacía
                } finally { 
                    setIsLoadingActivos(false); 
                }
            };
            cargarActivos();
        }
    }, [tipoActivo]); // Se ejecuta cuando cambia el tipo

    // --- 2. RENDERIZADO DEL FORMULARIO ---
    const renderContent = () => {
        // Si es uno de los formularios "viejos" (hardcoded), usamos su componente
        switch (idFormulario) {
            case 'FTO-SST-13': return <FormExtintores onFormChange={setDatosDiligenciados} onResultadoChange={setResultadoGeneral} />;
            case 'FTO-SST-02': return <FormVehiculos onFormChange={setDatosDiligenciados} onResultadoChange={setResultadoGeneral} />;
            case 'FTO-SST-14': return <FormBotiquin onFormChange={setDatosDiligenciados} onResultadoChange={setResultadoGeneral} />;
            case 'FTO-SST-23': return <FormOrdenAseo onFormChange={setDatosDiligenciados} onResultadoChange={setResultadoGeneral} />;
            case 'FTO-SST-45': return <FormSeguridadGeneral onFormChange={setDatosDiligenciados} onResultadoChange={setResultadoGeneral} />;
            case 'FTO-SST-95': return <FormSustanciasQuimicas onFormChange={setDatosDiligenciados} onResultadoChange={setResultadoGeneral} />;
            case 'FTO-SST-96': return <FormRiesgoElectrico onFormChange={setDatosDiligenciados} onResultadoChange={setResultadoGeneral} />;
            
            // Si no es ninguno de los anteriores, es un FORMULARIO NUEVO DINÁMICO
            default: 
                // Aquí deberíamos pasar las preguntas. 
                // NOTA: Si 'datosFormulario' no tiene preguntas, el renderer mostrará "Cargando..."
                // Para la versión actual, asumimos que si es nuevo, usas el generador.
                // Pero ojo: necesitamos obtener las preguntas de la BD si no las tenemos.
                // (Por simplicidad en esta fase, mostraremos un mensaje si no hay preguntas cargadas, 
                //  o usaremos el renderer si ya tenemos la lógica de carga en el padre).
                
                /* IMPORTANTE: Si creaste el formulario con preguntas en la BD, 
                   necesitamos un endpoint para traer esas preguntas aquí.
                   Si ves el formulario vacío, es porque falta ese paso de "Traer Preguntas".
                */
               
               // Fallback temporal para formularios nuevos sin preguntas cargadas en el frontend
               if (!datosFormulario || !datosFormulario.preguntas) {
                   return <div style={{padding: '2rem', textAlign: 'center'}}>
                       <p>Este es un formulario dinámico.</p>
                       <p>(La carga automática de preguntas dinámicas requiere el endpoint GET /preguntas/:id)</p>
                       {/* Aquí podríamos inyectar el FormularioGenerico si tuviéramos las preguntas */}
                   </div>;
               }

                return (
                    <FormularioGenericoRenderer 
                        preguntas={datosFormulario.preguntas} 
                        onFormChange={setDatosDiligenciados}
                        onResultadoChange={setResultadoGeneral}
                    />
                );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validación básica
        if (!datosDiligenciados.checklist || Object.keys(datosDiligenciados.checklist).length === 0) {
            setError('Por favor, diligencie el checklist.');
            return;
        }

        setIsLoading(true);
        try {
            const datosJSONCompletos = {
                ...datosDiligenciados, 
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
            
            Swal.fire({ title: '¡Éxito!', text: 'Inspección guardada.', icon: 'success', timer: 2000, showConfirmButton: false });
            alExito(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const handleFormChange = useCallback((data) => { setDatosDiligenciados(data); }, []);
    // eslint-disable-next-line no-unused-vars
    const handleResultadoChange = useCallback((resultado) => { setResultadoGeneral(resultado); }, []);

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Diligenciar: {nombreFormulario}</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        
                        {/* SELECTOR DE ACTIVO (DINÁMICO) */}
                        <div className="form-group">
                            <label htmlFor="activo-select">
                                Seleccione el Activo ({tipoActivo || 'General'})
                            </label>
                            
                            {isLoadingActivos ? (
                                <p>Cargando activos...</p>
                            ) : (
                                <select 
                                    id="activo-select" 
                                    value={idActivoSeleccionado || ''} 
                                    onChange={(e) => setIdActivoSeleccionado(e.target.value || null)}
                                >
                                    <option value="">-- Opcional (Inspección General) --</option>
                                    
                                    {listaActivos.length > 0 ? (
                                        listaActivos.map(activo => (
                                            <option key={activo.ID_Activo} value={activo.ID_Activo}>
                                                {activo.NombreDescriptivo} ({activo.CodigoIdentificador})
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No hay activos de tipo "{tipoActivo}" registrados</option>
                                    )}
                                </select>
                            )}
                        </div>

                        <div className="form-group"><label>Información Adicional (Opcional)</label><input type="text" value={infoAdicionalActivo} onChange={(e) => setInfoAdicionalActivo(e.target.value)} placeholder="Ej: Serial XT-123..." /></div>
                        
                        <hr />
                        
                        {/* Renderizado del Formulario */}
                        {renderContent()}

                        <hr style={{ margin: '1.5rem 0' }} />
                        <div className="form-group"><label>Observaciones Generales</label><textarea rows="2" value={observacionesGenerales} onChange={(e) => setObservacionesGenerales(e.target.value)} /></div>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Finalizar y Guardar Inspección'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalDiligenciarInspeccion;