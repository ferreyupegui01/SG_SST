/* eslint-disable no-unused-vars */
// frontend/src/pages/IndicadoresPage.jsx

import React, { useState, useEffect } from 'react';
import { guardarIndicador, getIndicadoresAnuales } from '../services/indicatorService';
import '../index.css';
import Swal from 'sweetalert2';
import { BsGraphUp, BsSave, BsCalendarCheck, BsInfoCircle, BsTable, BsSearch } from 'react-icons/bs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Importamos el modal de detalle
import ModalVerIndicador from '../components/ModalVerIndicador';

const IndicadoresPage = () => {
    const currentYear = new Date().getFullYear();
    const [anio, setAnio] = useState(currentYear);
    const [dataRaw, setDataRaw] = useState([]);
    const [dataGraficas, setDataGraficas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filtroTabla, setFiltroTabla] = useState('');

    // Estados para el Modal
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [indicadorSeleccionado, setIndicadorSeleccionado] = useState(null);

    // --- CONFIGURACIÓN MAESTRA ---
    const CONFIG_INDICADORES = {
        'Severidad de Accidentalidad': {
            tipo: 'COMPUESTO', 
            label1: 'N° Días Perdidos por AT',
            label2: 'N° Días Cargados',
            labelDen: 'N° Trabajadores en el mes',
            constante: 100,
            metaDefault: 100,
            frecuencia: 'Mensual',
            tipoGrafica: 'Line',
            operadorMeta: '<='
        },
        'Frecuencia de Accidentalidad': {
            tipo: 'SIMPLE',
            labelNum: 'N° Accidentes de Trabajo',
            labelDen: 'N° Trabajadores en el periodo',
            constante: 100,
            metaDefault: 8, 
            frecuencia: 'Mensual',
            tipoGrafica: 'Line',
            operadorMeta: '<='
        },
        'Proporción de Accidentes Mortales': {
            tipo: 'SIMPLE',
            labelNum: 'N° Accidentes Mortales',
            labelDen: 'Total Accidentes de Trabajo',
            constante: 100,
            metaDefault: 0,
            frecuencia: 'Anual',
            tipoGrafica: 'Bar',
            operadorMeta: '=='
        },
        'Prevalencia de Enfermedad Laboral': {
            tipo: 'SIMPLE',
            labelNum: 'N° Casos (Nuevos + Antiguos)',
            labelDen: 'Promedio Total Trabajadores',
            constante: 100000,
            metaDefault: 0,
            frecuencia: 'Anual',
            tipoGrafica: 'Bar',
            operadorMeta: '=='
        },
        'Incidencia de Enfermedad Laboral': {
            tipo: 'SIMPLE',
            labelNum: 'N° Casos Nuevos',
            labelDen: 'Promedio Total Trabajadores',
            constante: 100000,
            metaDefault: 0,
            frecuencia: 'Anual',
            tipoGrafica: 'Bar',
            operadorMeta: '=='
        },
        'Ausentismo por Incapacidades': {
            tipo: 'SIMPLE',
            labelNum: 'N° Días Ausencia',
            labelDen: 'N° Días Trabajo Programados',
            constante: 100,
            metaDefault: 2, 
            frecuencia: 'Mensual',
            tipoGrafica: 'Line',
            operadorMeta: '<='
        },
        'Indicadores de Estructura': {
            tipo: 'SIMPLE',
            labelNum: 'Total Ítems Cumplidos',
            labelDen: 'Total Ítems a Evaluar',
            constante: 100,
            metaDefault: 95,
            frecuencia: 'Anual',
            tipoGrafica: 'Bar',
            operadorMeta: '>='
        },
        'Indicadores de Proceso': {
            tipo: 'SIMPLE',
            labelNum: 'Total Ítems Cumplidos',
            labelDen: 'Total Ítems a Evaluar',
            constante: 100,
            metaDefault: 95,
            frecuencia: 'Anual',
            tipoGrafica: 'Bar',
            operadorMeta: '>='
        },
        'Indicadores de Resultado': {
            tipo: 'SIMPLE',
            labelNum: 'Total Ítems Cumplidos',
            labelDen: 'Total Ítems a Evaluar',
            constante: 100,
            metaDefault: 95,
            frecuencia: 'Anual',
            tipoGrafica: 'Bar',
            operadorMeta: '>='
        }
    };

    const [form, setForm] = useState({
        nombreIndicador: 'Severidad de Accidentalidad',
        mes: new Date().getMonth() + 1,
        val1: '', 
        val2: '', 
        numerador: '', 
        denominador: '',
        meta: 100,
        analisis: ''
    });

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    useEffect(() => {
        cargarDatos();
    }, [anio]);

    const cargarDatos = async () => {
        try {
            const datosRaw = await getIndicadoresAnuales(anio);
            const datosOrdenados = [...datosRaw].sort((a, b) => b.Mes - a.Mes);
            setDataRaw(datosOrdenados);
            procesarDatosParaGrafica(datosRaw);
        } catch (error) {
            console.error(error);
        }
    };

    const procesarDatosParaGrafica = (datos) => {
        const chartData = meses.map((mesNombre, index) => ({
            name: mesNombre,
            ...Object.keys(CONFIG_INDICADORES).reduce((acc, key) => ({ ...acc, [key]: 0, [`Meta_${key}`]: 0 }), {})
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

    const handleIndicadorChange = (nuevoIndicador) => {
        const config = CONFIG_INDICADORES[nuevoIndicador];
        setForm(prev => ({
            ...prev,
            nombreIndicador: nuevoIndicador,
            meta: config.metaDefault,
            numerador: '',
            denominador: '',
            val1: '',
            val2: ''
        }));
    };

    // --- ABRIR MODAL ---
    const abrirDetalle = (indicador) => {
        setIndicadorSeleccionado({ ...indicador, Anio: anio });
        setModalDetalleAbierto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const config = CONFIG_INDICADORES[form.nombreIndicador];
            
            let numFinal = 0;
            let analisisFinal = form.analisis;

            if (config.tipo === 'COMPUESTO') {
                const v1 = parseFloat(form.val1 || 0);
                const v2 = parseFloat(form.val2 || 0);
                numFinal = v1 + v2;
                const desglose = `[Cálculo: ${v1} Días Perdidos + ${v2} Días Cargados = ${numFinal} Total]`;
                analisisFinal = analisisFinal ? `${desglose}. ${analisisFinal}` : desglose;
            } else {
                numFinal = parseFloat(form.numerador || 0);
            }

            const denFinal = parseFloat(form.denominador || 0);
            if (denFinal === 0) {
                Swal.fire('Error', 'El denominador no puede ser 0', 'warning');
                setIsLoading(false);
                return;
            }

            const payload = {
                nombreIndicador: form.nombreIndicador,
                mes: form.mes,
                anio: anio,
                numerador: numFinal,
                denominador: denFinal,
                constante: config.constante,
                meta: parseFloat(form.meta || 0),
                analisis: analisisFinal
            };
            
            await guardarIndicador(payload);
            
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
            cargarDatos();
            setForm(prev => ({...prev, numerador: '', denominador: '', val1: '', val2: '', analisis: ''}));

        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const configActual = CONFIG_INDICADORES[form.nombreIndicador];

    const cumpleMeta = (valor, meta, indicador) => {
        const valSeguro = valor || 0;
        const metaSegura = meta || 0;
        const config = CONFIG_INDICADORES[indicador];
        if (!config) return true;
        if (config.operadorMeta === '<=') return valSeguro <= metaSegura;
        if (config.operadorMeta === '>=') return valSeguro >= metaSegura;
        return valSeguro === metaSegura;
    };

    const registrosFiltrados = dataRaw.filter(row => {
        const texto = filtroTabla.toLowerCase();
        return (
            row.NombreIndicador.toLowerCase().includes(texto) ||
            (row.Analisis && row.Analisis.toLowerCase().includes(texto)) ||
            meses[row.Mes - 1].toLowerCase().includes(texto)
        );
    });

    const RenderGrafica = ({ titulo, dataKey, tipo }) => (
        <div className="page-content-card" style={{marginBottom:'1rem', minWidth: '0'}}>
            <h4 style={{fontSize:'0.9rem', color:'#666', textTransform:'uppercase', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
                {titulo}
            </h4>
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
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{fontWeight:'bold'}}>Año:</span>
                    <input 
                        type="number" className="form-control" 
                        value={anio} onChange={(e) => setAnio(e.target.value)} 
                        style={{width:'80px', padding:'5px'}} 
                    />
                </div>
            </div>

            {/* 1. FORMULARIO */}
            <div className="page-content-card" style={{borderTop: '5px solid var(--color-acento)', marginBottom: '2rem'}}>
                <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}>
                    <BsCalendarCheck /> Registrar Medición Mensual
                </h3>
                
                <form onSubmit={handleSubmit}>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
                        <div className="form-group">
                            <label>Seleccione Indicador</label>
                            <select className="form-control" value={form.nombreIndicador} onChange={(e) => handleIndicadorChange(e.target.value)}>
                                {Object.keys(CONFIG_INDICADORES).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <div style={{marginTop:'5px', fontSize:'0.8rem', color:'#666', display:'flex', gap:'10px'}}>
                                <span>Frecuencia: <strong>{configActual.frecuencia}</strong></span>
                                <span>K: <strong>{configActual.constante.toLocaleString()}</strong></span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Mes de Reporte</label>
                            <select className="form-control" value={form.mes} onChange={(e) => setForm({...form, mes: parseInt(e.target.value)})}>
                                {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{marginTop:'1rem', backgroundColor:'#f8f9fa', padding:'1.5rem', borderRadius:'8px', border:'1px solid #dee2e6'}}>
                        {configActual.tipo === 'COMPUESTO' ? (
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem'}}>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label>{configActual.label1}</label>
                                    <input type="number" step="0.01" className="form-control" required value={form.val1} onChange={(e) => setForm({...form, val1: e.target.value})} placeholder="0" />
                                </div>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label>{configActual.label2}</label>
                                    <input type="number" step="0.01" className="form-control" required value={form.val2} onChange={(e) => setForm({...form, val2: e.target.value})} placeholder="0" />
                                </div>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label>{configActual.labelDen}</label>
                                    <input type="number" step="0.01" className="form-control" required value={form.denominador} onChange={(e) => setForm({...form, denominador: e.target.value})} placeholder="0" />
                                </div>
                            </div>
                        ) : (
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label>{configActual.labelNum}</label>
                                    <input type="number" step="0.01" className="form-control" required value={form.numerador} onChange={(e) => setForm({...form, numerador: e.target.value})} placeholder="0" />
                                </div>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label>{configActual.labelDen}</label>
                                    <input type="number" step="0.01" className="form-control" required value={form.denominador} onChange={(e) => setForm({...form, denominador: e.target.value})} placeholder="0" />
                                </div>
                            </div>
                        )}
                        <div className="form-group" style={{marginTop:'1rem'}}>
                            <label>Meta Establecida</label>
                            <input type="number" step="0.01" className="form-control" required value={form.meta} onChange={(e) => setForm({...form, meta: e.target.value})} style={{width:'150px'}} />
                        </div>
                    </div>
                    
                    <div className="form-group" style={{marginTop: '1rem'}}>
                        <label>Análisis Cualitativo</label>
                        <textarea className="form-control" rows="2" value={form.analisis} onChange={(e) => setForm({...form, analisis: e.target.value})} placeholder="Causas, desviaciones o planes de acción..." />
                    </div>

                    <div style={{textAlign:'right', marginTop:'1rem'}}>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            <BsSave /> {isLoading ? 'Guardando...' : 'Guardar y Calcular'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 2. GRÁFICAS */}
            <h2 style={{color:'#333', fontSize:'1.5rem', marginBottom:'1.5rem', borderBottom:'2px solid #eee', paddingBottom:'10px'}}>
                <BsGraphUp /> Tablero de Control
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {Object.keys(CONFIG_INDICADORES).map(key => {
                    const tieneDatos = dataRaw.some(d => d.NombreIndicador === key);
                    if (!tieneDatos) return null;
                    return (
                        <RenderGrafica 
                            key={key} 
                            titulo={key} 
                            dataKey={key} 
                            tipo={CONFIG_INDICADORES[key].tipoGrafica} 
                        />
                    );
                })}
            </div>

            {/* 3. TABLA DETALLADA (AL FINAL) */}
            <div className="page-content-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                    <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}>
                        <BsTable /> Detalle de Registros {anio}
                    </h3>
                    <div className="search-input-container" style={{maxWidth:'300px'}}>
                        <BsSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        <input 
                            type="text" className="form-control" 
                            placeholder="Filtrar por indicador..." 
                            style={{ paddingLeft: '30px', height: '35px' }}
                            value={filtroTabla} onChange={(e) => setFiltroTabla(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Indicador</th>
                                <th>Fórmula Aplicada</th>
                                <th>Resultado</th>
                                <th>Meta</th>
                                <th>Estado</th>
                                <th>Análisis / Desglose</th>
                                <th>Acción</th> {/* COLUMNA NUEVA */}
                            </tr>
                        </thead>
                        <tbody>
                            {registrosFiltrados.length === 0 ? (
                                <tr><td colSpan="8" style={{textAlign:'center'}}>No se encontraron registros.</td></tr>
                            ) : (
                                registrosFiltrados.map((row) => (
                                    <tr key={row.ID_Indicador}>
                                        <td>{meses[row.Mes - 1]}</td>
                                        <td><strong>{row.NombreIndicador}</strong></td>
                                        
                                        <td style={{fontFamily: 'monospace', fontSize: '0.85rem', color: '#555'}}>
                                            ({(row.Numerador || 0).toLocaleString()} ÷ {(row.Denominador || 0).toLocaleString()}) × {row.Constante}
                                        </td>

                                        <td style={{fontWeight:'bold', color: '#005A5B'}}>
                                            {(row.Resultado || 0).toFixed(2)}
                                        </td>
                                        <td>{row.Meta}</td>
                                        <td>
                                            {cumpleMeta(row.Resultado, row.Meta, row.NombreIndicador) ? (
                                                <span className="status-pill status-activo">Cumple</span>
                                            ) : (
                                                <span className="status-pill status-inactivo">No Cumple</span>
                                            )}
                                        </td>
                                        <td title={row.Analisis}>
                                            {row.Analisis ? (
                                                <div style={{maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                                    {row.Analisis}
                                                </div>
                                            ) : '--'}
                                        </td>
                                        
                                        {/* --- BOTÓN VER DETALLE --- */}
                                        <td style={{textAlign:'center'}}>
                                            <button 
                                                className="btn btn-sm btn-secondary" 
                                                onClick={() => abrirDetalle(row)}
                                                style={{ 
                                                    backgroundColor: '#fff', 
                                                    color: '#007BFF', 
                                                    border: '1px solid #007BFF',
                                                    padding: '5px 10px',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {dataRaw.length === 0 && (
                <div style={{textAlign:'center', padding:'3rem', color:'#999'}}>
                    <p>Comience registrando un indicador para ver las gráficas y la tabla.</p>
                </div>
            )}

            {/* MODAL DE DETALLE */}
            {modalDetalleAbierto && (
                <ModalVerIndicador 
                    indicador={indicadorSeleccionado} 
                    alCerrar={() => setModalDetalleAbierto(false)} 
                />
            )}
        </div>
    );
};

export default IndicadoresPage;