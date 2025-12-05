/* eslint-disable no-unused-vars */
// frontend/src/pages/IndicadoresPage.jsx

import React, { useState, useEffect } from 'react';
import { guardarIndicador, getIndicadoresAnuales, getConfiguracionesIndicadores, eliminarRegistroIndicador } from '../services/indicatorService';
import '../index.css';
import Swal from 'sweetalert2';
import { 
    BsGraphUp, BsSave, BsCalendarCheck, BsTable, BsSearch, 
    BsCalculator, BsChatQuote, BsCheck2Circle, BsXCircle, BsGearFill, BsTrash
} from 'react-icons/bs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

import ModalVerIndicador from '../components/ModalVerIndicador';
import ModalConfigurarIndicadores from '../components/ModalConfigurarIndicadores';

const IndicadoresPage = () => {
    const currentYear = new Date().getFullYear();
    const [anio, setAnio] = useState(currentYear);
    const [dataRaw, setDataRaw] = useState([]);
    const [dataGraficas, setDataGraficas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filtroTabla, setFiltroTabla] = useState('');

    // Estado para la configuración dinámica
    const [configIndicadores, setConfigIndicadores] = useState({});
    const [listaNombresIndicadores, setListaNombresIndicadores] = useState([]);

    // Estados Modales
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
    
    const [indicadorSeleccionado, setIndicadorSeleccionado] = useState(null);

    // Formulario (Estado dinámico de valores)
    const [form, setForm] = useState({
        nombreIndicador: '',
        mes: new Date().getMonth() + 1,
        meta: 0,
        analisis: ''
    });

    // Variables dinámicas para el cálculo
    const [valoresVariables, setValoresVariables] = useState({}); // { v1: 10, v2: 20... }
    const [resultadoPreliminar, setResultadoPreliminar] = useState(0);

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // 1. CARGA INICIAL DE CONFIGURACIONES
    useEffect(() => {
        cargarConfiguraciones();
    }, []);

    const cargarConfiguraciones = async () => {
        try {
            const data = await getConfiguracionesIndicadores();
            
            const configMap = {};
            const nombres = [];
            
            data.forEach(c => {
                // Parseamos el JSON de variables
                let vars = [];
                try {
                    if (c.VariablesJSON) vars = JSON.parse(c.VariablesJSON);
                    else {
                        // BACKWARD COMPATIBILITY: Si es un indicador viejo sin JSON, lo simulamos
                        if(c.LabelNumerador) vars.push({ code: 'v1', label: c.LabelNumerador });
                        if(c.LabelDenominador) vars.push({ code: 'v2', label: c.LabelDenominador });
                        if(c.LabelAdicional) vars.push({ code: 'v3', label: c.LabelAdicional });
                    }
                } catch (e) { console.error("Error parseando JSON vars", e); }

                configMap[c.NombreIndicador] = {
                    ...c,
                    variables: vars,
                    metaDefault: c.MetaDefault,
                    // Aseguramos lectura correcta de propiedades (Case Insensitive)
                    Frecuencia: c.Frecuencia || c.frecuencia || 'Mensual',
                    TipoGrafica: c.TipoGrafica || c.tipoGrafica || 'Bar',
                    OperadorMeta: c.OperadorMeta || c.operadorMeta || '>=',
                    FormulaCalculo: c.FormulaCalculo || c.formula || c.Tipo,
                    Constante: (c.Constante !== undefined && c.Constante !== null) ? c.Constante : 100,
                    ID_Config: c.ID_Config
                };
                nombres.push(c.NombreIndicador);
            });

            setConfigIndicadores(configMap);
            setListaNombresIndicadores(nombres);

            // Seleccionar el primero por defecto
            if (nombres.length > 0 && !form.nombreIndicador) {
                handleIndicadorChange(nombres[0], configMap);
            }

        } catch (error) {
            console.error("Error cargando configuraciones:", error);
        }
    };

    // 2. CARGAR DATOS HISTÓRICOS DEL AÑO
    useEffect(() => {
        if (Object.keys(configIndicadores).length > 0) {
            cargarDatos();
        }
    }, [anio, configIndicadores]);

    // 3. CÁLCULO AUTOMÁTICO EN TIEMPO REAL
    useEffect(() => {
        if (form.nombreIndicador && configIndicadores[form.nombreIndicador]) {
            setResultadoPreliminar(calcularResultado());
        }
    }, [valoresVariables, form.nombreIndicador]);

    const cargarDatos = async () => {
        try {
            const datosRaw = await getIndicadoresAnuales(anio);
            const datosOrdenados = [...datosRaw].sort((a, b) => b.Mes - a.Mes);
            setDataRaw(datosOrdenados);
            procesarDatosParaGrafica(datosRaw);
        } catch (error) { console.error(error); }
    };

    const procesarDatosParaGrafica = (datos) => {
        const chartData = meses.map((mesNombre) => ({
            name: mesNombre,
            ...Object.keys(configIndicadores).reduce((acc, key) => ({ ...acc, [key]: 0, [`Meta_${key}`]: 0 }), {})
        }));

        datos.forEach(d => {
            const mesIndex = d.Mes - 1;
            if (chartData[mesIndex]) {
                chartData[mesIndex][d.NombreIndicador] = d.Resultado || 0;
                chartData[mesIndex][`Meta_${d.NombreIndicador}`] = d.Meta || 0;
            }
        });
        setDataGraficas(chartData);
    };

    const handleIndicadorChange = (nuevoNombre, mapaConfig = configIndicadores) => {
        const config = mapaConfig[nuevoNombre];
        if (config) {
            setForm(prev => ({
                ...prev,
                nombreIndicador: nuevoNombre,
                meta: config.metaDefault,
                analisis: ''
            }));
            // Inicializar variables en vacío/cero
            const initVars = {};
            config.variables.forEach(v => initVars[v.code] = '');
            setValoresVariables(initVars);
        }
    };

    const handleVariableValueChange = (code, val) => {
        setValoresVariables(prev => ({ ...prev, [code]: val }));
    };

    // --- LÓGICA MATEMÁTICA ---
    const calcularResultado = () => {
        const config = configIndicadores[form.nombreIndicador];
        if (!config) return 0;

        try {
            let expresion = config.FormulaCalculo ? config.FormulaCalculo.toLowerCase() : '';
            
            // Si no hay fórmula explícita (legacy), asumimos v1 / v2
            if(!expresion && config.variables.length >= 2) {
                expresion = "(v1 / v2)";
            } 
            // Si es legacy compuesto (3 vars)
            else if (!expresion && config.Tipo === 'COMPUESTO') {
                expresion = "((v1 + v2) / v3)";
            }

            // Ordenamos variables por longitud (v10 antes que v1) para evitar reemplazos parciales
            const variablesOrdenadas = [...config.variables].sort((a, b) => b.code.length - a.code.length);

            variablesOrdenadas.forEach(v => {
                const valor = valoresVariables[v.code] === '' ? 0 : parseFloat(valoresVariables[v.code]);
                // Reemplazo global seguro
                const regex = new RegExp(v.code, 'gi'); 
                expresion = expresion.replace(regex, `(${valor})`); 
            });

            // Evaluar
            // eslint-disable-next-line no-new-func
            let resultado = new Function('return ' + expresion)();
            
            // Multiplicar por constante si aplica
            if (config.Constante) resultado = resultado * config.Constante;

            return isNaN(resultado) || !isFinite(resultado) ? 0 : resultado;
        } catch (e) {
            return 0;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const config = configIndicadores[form.nombreIndicador];
            const resultadoFinal = calcularResultado();
            
            // Construir el desglose técnico para guardar en la BD
            let desglose = `[Fórmula: ${config.FormulaCalculo || config.Tipo} | K: ${config.Constante}] `;
            desglose += `Valores: { ` + config.variables.map(v => `${v.code}(${v.label}): ${valoresVariables[v.code] || 0}`).join(', ') + ` }`;
            
            // Separador especial '///' para diferenciar datos técnicos de comentarios humanos
            const analisisFinal = form.analisis ? `${desglose} /// ${form.analisis}` : desglose;

            const payload = {
                nombreIndicador: form.nombreIndicador,
                mes: form.mes,
                anio: anio,
                constante: config.Constante,
                meta: parseFloat(form.meta || 0),
                analisis: analisisFinal,
                resultadoCalculado: resultadoFinal, 
                // Valores dummy para compatibilidad
                numerador: 0, 
                denominador: 1
            };
            
            await guardarIndicador(payload);
            
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
            cargarDatos();
            
            // Limpiar solo campos de valor, mantener indicador seleccionado
            setForm(prev => ({...prev, analisis: ''}));
            const initVars = {};
            config.variables.forEach(v => initVars[v.code] = '');
            setValoresVariables(initVars);

        } catch (error) {
            // AQUÍ ATRAPAMOS EL ERROR DE DUPLICADOS (400 Bad Request)
            Swal.fire('Atención', error.message, 'warning');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEliminarRegistro = async (id) => {
        const result = await Swal.fire({
            title: '¿Inactivar registro?',
            text: "El registro desaparecerá de la vista actual.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, inactivar'
        });

        if (result.isConfirmed) {
            try {
                await eliminarRegistroIndicador(id);
                Swal.fire('Inactivado', 'Registro eliminado de la vista.', 'success');
                cargarDatos();
            } catch (error) {
                Swal.fire('Error', 'No se pudo inactivar.', 'error');
            }
        }
    };

    const configActual = configIndicadores[form.nombreIndicador] || { variables: [] };

    const cumpleMeta = (valor, meta, indicadorNombre) => {
        const valSeguro = valor || 0;
        const metaSegura = meta || 0;
        const config = configIndicadores[indicadorNombre];
        if (!config) return true;
        
        const op = config.OperadorMeta || '>=';
        
        if (op === '<=') return valSeguro <= metaSegura;
        if (op === '>=') return valSeguro >= metaSegura;
        return valSeguro === metaSegura;
    };

    // --- COMPONENTE VISUAL PARA ANÁLISIS ---
    const RenderAnalisisCell = ({ textoAnalisis }) => {
        if (!textoAnalisis) return <span style={{fontStyle:'italic', color:'#ccc'}}>Sin análisis.</span>;

        let parteComentario = textoAnalisis;
        // Extraer solo el comentario del usuario para la tabla
        if (textoAnalisis.includes('///')) {
            parteComentario = textoAnalisis.split('///')[1]?.trim() || "Ver detalles...";
        } else if (textoAnalisis.includes(']')) {
            const splitIndex = textoAnalisis.lastIndexOf('}');
            if (splitIndex !== -1) parteComentario = textoAnalisis.substring(splitIndex + 1).replace(/^->/, '').trim();
        }
        
        return <div style={{fontSize:'0.85rem', color:'#555'}}>{parteComentario}</div>;
    };

    // --- COMPONENTE VISUAL PARA FÓRMULA ---
    const RenderFormulaCell = ({ nombreIndicador }) => {
        const conf = configIndicadores[nombreIndicador];
        if(!conf) return <span>--</span>;

        let formulaBonita = conf.FormulaCalculo || conf.Tipo || 'Estándar';
        // Reemplazo visual
        formulaBonita = formulaBonita
            .replace(/\*/g, ' × ')
            .replace(/\//g, ' ÷ ')
            .replace(/\+/g, ' + ')
            // eslint-disable-next-line no-useless-escape
            .replace(/\-/g, ' - ');

        return (
            <div style={{fontFamily:'monospace', fontSize:'0.8rem', color:'#005A5B'}}>
                {formulaBonita}
                {conf.Constante && parseInt(conf.Constante) !== 1 && (
                    <span style={{color:'#d63384', fontWeight:'bold'}}> × {parseInt(conf.Constante).toLocaleString()}</span>
                )}
            </div>
        );
    };

    const RenderGrafica = ({ titulo, dataKey, tipo }) => (
        <div className="page-content-card" style={{marginBottom:'1rem', minWidth: '0'}}>
            <h4 style={{fontSize:'0.9rem', color:'#666', textTransform:'uppercase', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>{titulo}</h4>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {tipo === 'Line' ? (
                        <LineChart data={dataGraficas} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{borderRadius:'8px'}} />
                            <Legend />
                            <Line type="monotone" dataKey={dataKey} stroke="#005A5B" strokeWidth={3} activeDot={{ r: 6 }} name="Resultado" />
                            <Line type="monotone" dataKey={`Meta_${dataKey}`} stroke="#dc3545" strokeDasharray="5 5" name="Meta" />
                        </LineChart>
                    ) : (
                        <BarChart data={dataGraficas} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{borderRadius:'8px'}} />
                            <Legend />
                            <Bar dataKey={dataKey} fill="#005A5B" name="Resultado" radius={[4, 4, 0, 0]} />
                            <Bar dataKey={`Meta_${dataKey}`} fill="#b3b3b3" name="Meta" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Indicadores de Gestión SST ({anio})</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <button className="btn btn-secondary" onClick={() => setModalConfigAbierto(true)}>
                        <BsGearFill /> Gestionar Indicadores
                    </button>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <span style={{fontWeight:'bold'}}>Año:</span>
                        <input type="number" className="form-control" value={anio} onChange={(e) => setAnio(e.target.value)} style={{width:'80px', padding:'5px'}} />
                    </div>
                </div>
            </div>

            {/* FORMULARIO DE REGISTRO DINÁMICO */}
            <div className="page-content-card" style={{borderTop: '5px solid var(--color-acento)', marginBottom: '2rem'}}>
                <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}>
                    <BsCalendarCheck /> Registrar Medición Mensual
                </h3>
                
                {listaNombresIndicadores.length === 0 ? (
                    <p style={{color:'#666'}}>No hay indicadores configurados.</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
                            <div className="form-group">
                                <label>Seleccione Indicador</label>
                                <select className="form-control" value={form.nombreIndicador} onChange={(e) => handleIndicadorChange(e.target.value)}>
                                    {listaNombresIndicadores.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                                <div style={{marginTop:'5px', fontSize:'0.8rem', color:'#666', display:'flex', gap:'10px'}}>
                                    <span>Frecuencia: <strong>{configActual.Frecuencia}</strong></span>
                                    {configActual.Constante !== 1 && <span>K: <strong>{configActual.Constante?.toLocaleString()}</strong></span>}
                                    <span>Fórmula: <code style={{color:'#d63384'}}>{configActual.FormulaCalculo || configActual.Tipo}</code></span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Mes de Reporte</label>
                                <select className="form-control" value={form.mes} onChange={(e) => setForm({...form, mes: parseInt(e.target.value)})}>
                                    {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* INPUTS DINÁMICOS PARA LAS VARIABLES */}
                        <div style={{marginTop:'1rem', backgroundColor:'#f8f9fa', padding:'1.5rem', borderRadius:'8px', border:'1px solid #dee2e6'}}>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                                {configActual.variables && configActual.variables.map(v => (
                                    <div key={v.code} className="form-group" style={{marginBottom:0}}>
                                        <label>{v.label} <span style={{color:'#007BFF', fontSize:'0.8rem'}}>({v.code})</span></label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control" 
                                            required 
                                            value={valoresVariables[v.code] || ''} 
                                            onChange={(e) => handleVariableValueChange(v.code, e.target.value)} 
                                            placeholder="0" 
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{display: 'flex', gap:'2rem', marginTop: '1.5rem', borderTop:'1px solid #ddd', paddingTop:'1rem', alignItems:'center'}}>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label>Meta Establecida</label>
                                    <input type="number" step="0.01" className="form-control" required value={form.meta} onChange={(e) => setForm({...form, meta: e.target.value})} style={{width:'150px'}} />
                                </div>
                                <div style={{flex:1, textAlign:'right'}}>
                                    <label style={{display:'block', marginBottom:'5px', color:'#005A5B', fontSize:'0.9rem'}}>Resultado Calculado {configActual.Constante !== 1 && `(x ${configActual.Constante})`}</label>
                                    <span style={{fontSize:'2.5rem', fontWeight:'bold', color:'#005A5B'}}>
                                        {resultadoPreliminar.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group" style={{marginTop: '1rem'}}>
                            <label>Análisis Cualitativo / Comentarios (Opcional)</label>
                            <textarea className="form-control" rows="2" value={form.analisis} onChange={(e) => setForm({...form, analisis: e.target.value})} placeholder="Comentarios sobre el resultado..." />
                        </div>

                        <div style={{textAlign:'right', marginTop:'1rem'}}>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                <BsSave /> {isLoading ? 'Guardando...' : 'Guardar Registro'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* GRÁFICAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                {listaNombresIndicadores.map(key => {
                    const tieneDatos = dataRaw.some(d => d.NombreIndicador === key);
                    if (!tieneDatos) return null;
                    return (
                        <RenderGrafica 
                            key={key} 
                            titulo={key} 
                            dataKey={key} 
                            tipo={configIndicadores[key]?.TipoGrafica || 'Bar'} 
                        />
                    );
                })}
            </div>

            {/* TABLA HISTÓRICA */}
            <div className="page-content-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                    <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}><BsTable /> Detalle de Registros {anio}</h3>
                    <div className="search-input-container" style={{maxWidth:'300px'}}>
                        <BsSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        <input type="text" className="form-control" placeholder="Filtrar..." style={{ paddingLeft: '30px', height: '35px' }} value={filtroTabla} onChange={(e) => setFiltroTabla(e.target.value)} />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{width: '80px'}}>Mes</th>
                                <th style={{width: '200px'}}>Indicador</th>
                                <th style={{width: '180px'}}>Fórmula</th>
                                <th style={{width: '100px'}}>Resultado</th>
                                <th style={{width: '80px'}}>Meta</th>
                                <th style={{width: '100px'}}>Estado</th>
                                <th>Comentarios</th>
                                <th style={{width: '120px', textAlign:'center'}}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataRaw.filter(r => r.NombreIndicador.toLowerCase().includes(filtroTabla.toLowerCase())).length === 0 ? (
                                <tr><td colSpan="8" style={{textAlign:'center'}}>No hay registros.</td></tr>
                            ) : (
                                dataRaw.filter(r => r.NombreIndicador.toLowerCase().includes(filtroTabla.toLowerCase())).map((row) => (
                                    <tr key={row.ID_Indicador}>
                                        <td>{meses[row.Mes - 1]}</td>
                                        <td><strong style={{fontSize:'0.9rem'}}>{row.NombreIndicador}</strong></td>
                                        
                                        <td style={{verticalAlign:'middle'}}>
                                            <RenderFormulaCell nombreIndicador={row.NombreIndicador} />
                                        </td>

                                        <td style={{fontWeight:'bold', color: '#005A5B', fontSize:'1rem'}}>{(row.Resultado || 0).toFixed(2)}</td>
                                        <td>{row.Meta}</td>
                                        <td>
                                            {cumpleMeta(row.Resultado, row.Meta, row.NombreIndicador) ? (
                                                <span className="status-pill status-activo"><BsCheck2Circle/> Cumple</span>
                                            ) : (
                                                <span className="status-pill status-inactivo"><BsXCircle/> No Cumple</span>
                                            )}
                                        </td>
                                        <td style={{verticalAlign: 'top'}}><RenderAnalisisCell textoAnalisis={row.Analisis} /></td>
                                        <td style={{textAlign:'center', display:'flex', gap:'5px', justifyContent:'center'}}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => {setIndicadorSeleccionado({...row, Anio: anio}); setModalDetalleAbierto(true);}} title="Ver Detalle">Ver</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleEliminarRegistro(row.ID_Indicador)} title="Inactivar Registro"><BsTrash /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalConfigAbierto && (
                <ModalConfigurarIndicadores 
                    configs={Object.values(configIndicadores)} 
                    alCerrar={() => setModalConfigAbierto(false)} 
                    alActualizar={() => { setModalConfigAbierto(false); cargarConfiguraciones(); }}
                />
            )}

            {modalDetalleAbierto && (
                <ModalVerIndicador indicador={indicadorSeleccionado} alCerrar={() => setModalDetalleAbierto(false)} />
            )}
        </div>
    );
};

export default IndicadoresPage;