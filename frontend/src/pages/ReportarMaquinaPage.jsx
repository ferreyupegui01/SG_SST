// frontend/src/pages/ReportarMaquinaPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActivosTodos } from '../services/assetService'; 
import { crearReporteMaquina } from '../services/reportService';
import { getFormularios, getPreguntasFormulario } from '../services/inspectionService';
import { useAuth } from '../context/AuthContext'; 
import '../index.css'; 
import '../style/ReportarPage.css'; 
import Swal from 'sweetalert2'; 
import { BsArrowLeftCircle, BsSpeedometer2, BsSearch, BsChevronDown, BsPersonBadge } from 'react-icons/bs';

const ReportarMaquinaPage = () => {
    const { usuario } = useAuth(); // Aquí obtenemos los datos del logueado
    
    // Estados del Reporte
    const [idActivo, setIdActivo] = useState('');
    const [kilometraje, setKilometraje] = useState('');
    const [estadoReportado, setEstadoReportado] = useState('OK');
    const [descripcionProblema, setDescripcionProblema] = useState('');
    const [fotoReporte, setFotoReporte] = useState(null); 
    
    // Estados de Datos Maestros
    const [listaActivos, setListaActivos] = useState([]);
    const [listaFormularios, setListaFormularios] = useState([]);
    
    // Estados para el Buscador Inteligente
    const [busquedaActivo, setBusquedaActivo] = useState('');
    const [activosFiltrados, setActivosFiltrados] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const wrapperRef = useRef(null); 

    // Estados de Lógica Interna
    const [activoInfo, setActivoInfo] = useState(null);
    const [preguntasActivas, setPreguntasActivas] = useState([]);
    const [respuestasChecklist, setRespuestasChecklist] = useState({});
    
    // Estados de UI
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingPreguntas, setIsLoadingPreguntas] = useState(false);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState(null);

    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();

    // 1. Carga Inicial
    useEffect(() => {
        const cargarDatosMaestros = async () => {
            try {
                const [activos, formularios] = await Promise.all([
                    getActivosTodos(),
                    getFormularios()
                ]);
                
                const formulariosVisibles = formularios.filter(f => f.VisibleColaborador === true);
                setListaFormularios(formulariosVisibles);

                const tiposPermitidos = formulariosVisibles.map(f => f.TipoActivoAsociado.toLowerCase().trim());

                const activosFiltradosBD = activos.filter(a => 
                    a.TipoActivo && tiposPermitidos.includes(a.TipoActivo.toLowerCase().trim())
                );

                setListaActivos(activosFiltradosBD);
                setActivosFiltrados(activosFiltradosBD);

            } catch (err) {
                console.error(err);
                setError("Error conectando con el servidor.");
            } finally {
                setIsLoadingData(false);
            }
        };
        cargarDatosMaestros();
    }, []);

    // 2. Manejador de clics fuera del buscador
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setMostrarSugerencias(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // 3. Lógica del Buscador
    const handleSearchChange = (e) => {
        const texto = e.target.value;
        setBusquedaActivo(texto);
        
        if (texto === '') {
            setIdActivo('');
            setActivoInfo(null);
            setPreguntasActivas([]);
        }

        const filtrados = listaActivos.filter(a => 
            a.NombreDescriptivo.toLowerCase().includes(texto.toLowerCase()) ||
            a.CodigoIdentificador.toLowerCase().includes(texto.toLowerCase())
        );
        setActivosFiltrados(filtrados);
        setMostrarSugerencias(true);
    };

    const seleccionarActivo = (activo) => {
        setBusquedaActivo(`${activo.NombreDescriptivo} (${activo.CodigoIdentificador})`);
        setIdActivo(activo.ID_Activo);
        setMostrarSugerencias(false);
    };

    // 4. Buscar Formulario y Preguntas
    useEffect(() => {
        if (!idActivo) {
            setPreguntasActivas([]);
            setDebugInfo(null);
            setEstadoReportado('OK');
            setActivoInfo(null);
            return;
        }

        const buscarPreguntas = async () => {
            setIsLoadingPreguntas(true);
            setRespuestasChecklist({});
            setEstadoReportado('OK');
            
            const activoSelect = listaActivos.find(a => a.ID_Activo == idActivo);
            if (!activoSelect) return;

            setActivoInfo(activoSelect);

            const tipoActivoReal = activoSelect.TipoActivo.trim();

            const formularioAsociado = listaFormularios.find(f => 
                f.TipoActivoAsociado && 
                f.TipoActivoAsociado.trim().toLowerCase() === tipoActivoReal.toLowerCase()
            );

            setDebugInfo({
                tipoDetectado: tipoActivoReal,
                formularioEncontrado: formularioAsociado ? formularioAsociado.NombreFormulario : "NINGUNO"
            });

            if (formularioAsociado) {
                try {
                    const preguntas = await getPreguntasFormulario(formularioAsociado.ID_Formulario);
                    setPreguntasActivas(preguntas);
                    
                    const inicial = {};
                    preguntas.forEach(p => { inicial[p.ID_Pregunta] = 'Cumple'; });
                    setRespuestasChecklist(inicial);
                } catch (err) {
                    console.error("Error preguntas:", err);
                }
            } else {
                setPreguntasActivas([]);
            }
            setIsLoadingPreguntas(false);
        };

        buscarPreguntas();
    }, [idActivo, listaActivos, listaFormularios]);

    const handleChecklistChange = (id, val) => {
        setRespuestasChecklist(prev => {
            const nuevasRespuestas = { ...prev, [id]: val };
            const hayFalla = Object.values(nuevasRespuestas).some(v => v === 'No Cumple');
            setEstadoReportado(hayFalla ? 'Con Problema' : 'OK');
            return nuevasRespuestas;
        });
    };

    const handleFileChange = (e) => setFotoReporte(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const esTipoVehiculo = ['vehiculo', 'moto', 'montacarga', 'carro', 'camion', 'tractomula', 'furgon'].some(t => 
            activoInfo?.TipoActivo.toLowerCase().includes(t)
        );

        if (activoInfo && esTipoVehiculo && !kilometraje) {
            setError('El kilometraje es obligatorio para este equipo.');
            return;
        }

        if (estadoReportado === 'Con Problema' && !descripcionProblema.trim()) {
            setError('Por favor describa el problema detectado en las observaciones.');
            return;
        }

        setIsLoadingSubmit(true);
        const formData = new FormData();
        formData.append('idActivo', idActivo);
        formData.append('estadoReportado', estadoReportado);
        if (kilometraje) formData.append('kilometraje', kilometraje);
        
        if (preguntasActivas.length > 0) {
            const reporteDetallado = preguntasActivas.map(p => ({
                pregunta: p.TextoPregunta,
                respuesta: respuestasChecklist[p.ID_Pregunta] || 'N/A'
            }));
            formData.append('datosReporte', JSON.stringify(reporteDetallado));
        }

        if (descripcionProblema.trim()) {
            formData.append('descripcionProblema', descripcionProblema);
        }
        
        if (fotoReporte) formData.append('fotoReporte', fotoReporte);

        try {
            await crearReporteMaquina(formData);
            Swal.fire('Enviado', 'Reporte registrado exitosamente.', 'success');
            
            // Resetear
            setIdActivo('');
            setBusquedaActivo('');
            setActivosFiltrados(listaActivos);
            setEstadoReportado('OK');
            setDescripcionProblema('');
            setKilometraje('');
            setFotoReporte(null);
            setPreguntasActivas([]);
            setDebugInfo(null);
            setActivoInfo(null);
            e.target.reset();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Reporte Pre-Uso</h1>
                <Link to="/dashboard" className="btn btn-secondary"><BsArrowLeftCircle /> Volver</Link>
            </div>

            <div className="page-content-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    
                    {/* --- BUSCADOR INTELIGENTE --- */}
                    <div className="form-group" ref={wrapperRef}>
                        <label>Seleccione el Equipo:</label>
                        {isLoadingData ? (
                            <p>Cargando activos...</p>
                        ) : (
                            <div style={{position: 'relative'}}>
                                <BsSearch style={{position: 'absolute', top: '12px', left: '12px', color: '#999', zIndex: 1}}/>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{paddingLeft: '35px', paddingRight: '30px'}} 
                                    placeholder="Buscar por nombre, placa o código..." 
                                    value={busquedaActivo}
                                    onChange={handleSearchChange}
                                    onFocus={() => setMostrarSugerencias(true)}
                                    required
                                    autoComplete="off"
                                />
                                <BsChevronDown style={{position: 'absolute', top: '12px', right: '12px', color: '#999', cursor:'pointer'}} onClick={() => setMostrarSugerencias(!mostrarSugerencias)}/>

                                {mostrarSugerencias && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        backgroundColor: 'white', border: '1px solid #dee2e6',
                                        borderRadius: '0 0 8px 8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        maxHeight: '250px', overflowY: 'auto', zIndex: 1000
                                    }}>
                                        {activosFiltrados.length > 0 ? (
                                            activosFiltrados.map((a) => (
                                                <div 
                                                    key={a.ID_Activo} 
                                                    onClick={() => seleccionarActivo(a)}
                                                    style={{
                                                        padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                                                        display: 'flex', flexDirection: 'column'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                                >
                                                    <span style={{fontWeight: '600', color: '#333'}}>{a.NombreDescriptivo}</span>
                                                    <div style={{fontSize: '0.8rem', color: '#666', display:'flex', justifyContent:'space-between'}}>
                                                        <span>Código: {a.CodigoIdentificador}</span>
                                                        <span style={{textTransform:'uppercase', fontSize:'0.7rem', backgroundColor:'#e9ecef', padding:'2px 6px', borderRadius:'4px'}}>{a.TipoActivo}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{padding: '15px', textAlign: 'center', color: '#999'}}>
                                                No se encontraron equipos.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- INFO DEL ACTIVO + USUARIO LOGUEADO --- */}
                    {activoInfo && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#eef2f7', padding: '1rem', borderRadius: '8px' }}>
                            <div className="form-group" style={{marginBottom:0}}>
                                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#666'}}>Código:</label>
                                <div style={{fontSize:'1rem', fontWeight:'500'}}>{activoInfo.CodigoIdentificador}</div>
                            </div>
                            <div className="form-group" style={{marginBottom:0}}>
                                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#666'}}>Marca/Modelo:</label>
                                <div style={{fontSize:'1rem'}}>{activoInfo.Marca || ''} {activoInfo.Modelo || ''}</div>
                            </div>
                            
                            {/* --- CORRECCIÓN FINAL (Multiopción) --- */}
                            <div className="form-group" style={{marginBottom:0, gridColumn:'span 2', borderTop:'1px solid #ddd', paddingTop:'10px', marginTop:'5px'}}>
                                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#666', display:'flex', alignItems:'center', gap:'5px'}}>
                                    <BsPersonBadge /> Reportado por:
                                </label>
                                <div style={{fontSize:'1rem', color: '#005A5B', fontWeight:'bold'}}>
                                    {usuario?.NombreCompleto || usuario?.nombre || usuario?.Nombre}
                                </div>
                               
                            </div>
                            {/* --------------------------------------------------- */}
                        </div>
                    )}

                    {/* CAMPO KILOMETRAJE */}
                    {activoInfo && ['vehiculo', 'moto', 'montacarga', 'carro', 'camion', 'tractomula', 'furgon'].some(t => activoInfo.TipoActivo.toLowerCase().includes(t)) && (
                        <div className="form-group">
                            <label style={{color: 'var(--color-acento)', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                                <BsSpeedometer2 /> Kilometraje Actual *
                            </label>
                            <input 
                                type="number" 
                                className="form-control" 
                                placeholder={`Anterior: ${activoInfo.KilometrajeActual || 0} km`} 
                                value={kilometraje} 
                                onChange={(e) => setKilometraje(e.target.value)} 
                                required
                                style={{borderColor: '#007BFF', backgroundColor: '#f0f8ff'}}
                            />
                        </div>
                    )}

                    {/* CHECKLIST */}
                    {!isLoadingPreguntas && preguntasActivas.length > 0 && (
                        <div style={{backgroundColor:'#f8f9fa', padding:'1rem', borderRadius:'8px', border:'1px solid #dee2e6', marginBottom:'1.5rem'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #ddd', paddingBottom:'0.5rem'}}>
                                <h3 style={{margin:0, color:'var(--color-primario)'}}>Checklist</h3>
                                <span className={`status-pill ${estadoReportado === 'OK' ? 'status-activo' : 'status-inactivo'}`}>
                                    Estado: {estadoReportado}
                                </span>
                            </div>
                            
                            {preguntasActivas.map((p, idx) => (
                                <div key={p.ID_Pregunta} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.8rem 0', borderBottom:'1px solid #e0e0e0'}}>
                                    <span style={{flex:1, paddingRight:'10px', fontWeight:'500'}}>{idx + 1}. {p.TextoPregunta}</span>
                                    <div style={{display:'flex', gap:'15px'}}>
                                        <label style={{color:'#28a745', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <input type="radio" name={`p_${p.ID_Pregunta}`} checked={respuestasChecklist[p.ID_Pregunta] === 'Cumple'} onChange={() => handleChecklistChange(p.ID_Pregunta, 'Cumple')} /> 
                                            Cumple
                                        </label>
                                        <label style={{color:'#dc3545', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <input type="radio" name={`p_${p.ID_Pregunta}`} checked={respuestasChecklist[p.ID_Pregunta] === 'No Cumple'} onChange={() => handleChecklistChange(p.ID_Pregunta, 'No Cumple')} /> 
                                            No Cumple
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AVISO SI NO HAY CHECKLIST */}
                    {!isLoadingPreguntas && idActivo && preguntasActivas.length === 0 && (
                        <div style={{padding:'1rem', backgroundColor:'#fff3cd', color:'#856404', borderRadius:'8px', marginBottom:'1.5rem', border:'1px solid #ffeeba'}}>
                            <strong>⚠️ Aviso:</strong> No hay checklist para el tipo <strong>"{debugInfo?.tipoDetectado}"</strong>.<br/>
                            (El Super Admin debe crear o activar un formulario para este tipo de activo).
                        </div>
                    )}

                    <div className="form-group">
                        <label>Observaciones / Detalles {estadoReportado === 'Con Problema' && <span style={{color:'red'}}>* (Obligatorio)</span>}</label>
                        <textarea 
                            className="form-control" 
                            rows="3" 
                            value={descripcionProblema} 
                            onChange={(e) => setDescripcionProblema(e.target.value)} 
                            placeholder={estadoReportado === 'Con Problema' ? "Describa qué falló..." : "Comentarios adicionales..."}
                            required={estadoReportado === 'Con Problema'}
                            style={{borderColor: estadoReportado === 'Con Problema' ? '#dc3545' : '#dee2e6'}}
                        />
                    </div>

                    <div className="form-group">
                        <label>Foto (Opcional)</label>
                        <input type="file" className="form-control" onChange={handleFileChange} accept="image/*" />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={isLoadingSubmit}>
                        {isLoadingSubmit ? 'Enviando...' : 'Enviar Reporte'}
                    </button>
                    
                    {error && <p className="error-message" style={{marginTop:'1rem'}}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default ReportarMaquinaPage;