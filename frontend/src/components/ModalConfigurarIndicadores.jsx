// frontend/src/components/ModalConfigurarIndicadores.jsx

import React, { useState } from 'react';
import { crearConfiguracionIndicador, editarConfiguracionIndicador, eliminarConfiguracionIndicador } from '../services/indicatorService';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsTrash, BsPlusCircle, BsCalculator, BsDashCircle, BsPencil } from 'react-icons/bs';

const ModalConfigurarIndicadores = ({ configs, alCerrar, alActualizar }) => {
    const [view, setView] = useState('LIST'); 
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Estado variables
    const [variablesDinamicas, setVariablesDinamicas] = useState([
        { id: 1, code: 'v1', label: '' },
        { id: 2, code: 'v2', label: '' }
    ]);

    // Estado formulario
    const [form, setForm] = useState({
        nombre: '',
        tipo: 'PERSONALIZADO', 
        formula: '', 
        constante: 100,
        meta: 0,
        operador: '>=',
        frecuencia: 'Mensual',
        grafica: 'Bar'
    });

    const resetForm = () => {
        setForm({
            nombre: '',
            tipo: 'PERSONALIZADO', 
            formula: '', 
            constante: 100,
            meta: 0,
            operador: '>=',
            frecuencia: 'Mensual',
            grafica: 'Bar'
        });
        setVariablesDinamicas([
            { id: 1, code: 'v1', label: '' },
            { id: 2, code: 'v2', label: '' }
        ]);
        setIsEditing(false);
        setEditingId(null);
    };

    const handleNuevaConfig = () => {
        resetForm();
        setView('FORM');
    };

    const handleEditarConfig = (config) => {
        setIsEditing(true);
        setEditingId(config.ID_Config);
        
        let vars = [];
        // Intentamos leer variables desde el objeto (Soporte doble chequeo por si viene del mapeo o crudo)
        if (config.variables && config.variables.length > 0) {
            vars = config.variables.map((v, i) => ({ id: i+1, code: v.code, label: v.label }));
        } else if (config.VariablesJSON) {
             try {
                 const parsed = JSON.parse(config.VariablesJSON);
                 vars = parsed.map((v, i) => ({ id: i+1, code: v.code, label: v.label }));
             // eslint-disable-next-line no-unused-vars
             } catch(e) { vars = [{ id: 1, code: 'v1', label: '' }]; }
        } else {
            vars = [{ id: 1, code: 'v1', label: '' }];
        }

        setVariablesDinamicas(vars);
        
        setForm({
            nombre: config.NombreIndicador,
            tipo: 'PERSONALIZADO',
            // Usamos || '' para evitar undefined
            formula: config.formula || config.FormulaCalculo || '', 
            // Usamos || 100 para evitar nulos en Constante
            constante: (config.constante !== undefined && config.constante !== null) ? config.constante : (config.Constante || 100),
            meta: (config.metaDefault !== undefined && config.metaDefault !== null) ? config.metaDefault : (config.MetaDefault || 0),
            
            operador: config.operadorMeta || config.OperadorMeta || '>=',
            frecuencia: config.frecuencia || config.Frecuencia || 'Mensual',
            grafica: config.tipoGrafica || config.TipoGrafica || 'Bar'
        });
        setView('FORM');
    };

    // --- MÉTODOS PARA VARIABLES DINÁMICAS ---
    const agregarVariable = () => {
        const nuevoId = variablesDinamicas.length + 1;
        const nuevoCodigo = `v${nuevoId}`;
        setVariablesDinamicas([...variablesDinamicas, { id: nuevoId, code: nuevoCodigo, label: '' }]);
    };

    const quitarVariable = (index) => {
        if (variablesDinamicas.length <= 1) return;
        const nuevas = variablesDinamicas.filter((_, i) => i !== index);
        const reordenadas = nuevas.map((v, i) => ({ ...v, code: `v${i + 1}` }));
        setVariablesDinamicas(reordenadas);
    };

    const handleVariableChange = (index, valor) => {
        const nuevas = [...variablesDinamicas];
        nuevas[index].label = valor;
        setVariablesDinamicas(nuevas);
    };
    // ----------------------------------------

    const handleEliminar = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Inactivar Indicador?',
            text: `Se ocultará la definición de "${nombre}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, inactivar'
        });

        if (result.isConfirmed) {
            try {
                await eliminarConfiguracionIndicador(id);
                Swal.fire('Inactivado', 'Indicador eliminado del listado.', 'success');
                alActualizar();
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        
        if(variablesDinamicas.some(v => !v.label.trim())){
            Swal.fire('Atención', 'Todas las variables deben tener nombre.', 'warning');
            return;
        }

        try {
            const payload = {
                ...form,
                variables: variablesDinamicas 
            };

            if (isEditing) {
                await editarConfiguracionIndicador(editingId, payload);
                Swal.fire('Actualizado', 'Indicador modificado correctamente.', 'success');
            } else {
                await crearConfiguracionIndicador(payload);
                Swal.fire('Creado', 'Nuevo indicador configurado.', 'success');
            }
            
            alActualizar();
            setView('LIST');
            resetForm();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message, 'error');
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{view === 'LIST' ? 'Gestionar Indicadores' : (isEditing ? 'Editar Indicador' : 'Crear Nuevo Indicador')}</h2>
                    <button className="modal-close-button" onClick={alCerrar}>&times;</button>
                </div>

                <div className="modal-body" style={{maxHeight:'70vh', overflowY:'auto'}}>
                    
                    {view === 'LIST' ? (
                        <>
                            <div style={{marginBottom:'1rem', textAlign:'right'}}>
                                <button className="btn btn-primary" onClick={handleNuevaConfig}>
                                    <BsPlusCircle /> Crear Nuevo
                                </button>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Fórmula</th>
                                        <th>Frecuencia</th>
                                        <th style={{textAlign:'center'}}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {configs.map(c => (
                                        <tr key={c.ID_Config}>
                                            <td>{c.NombreIndicador}</td>
                                            <td style={{fontFamily:'monospace', fontSize:'0.85rem', color:'#555'}}>
                                                {c.formula || c.FormulaCalculo || c.Tipo}
                                            </td>
                                            <td>{c.frecuencia || c.Frecuencia}</td>
                                            <td style={{textAlign:'center', display:'flex', gap:'5px', justifyContent:'center'}}>
                                                <button className="btn btn-sm btn-warning" onClick={() => handleEditarConfig(c)} title="Editar configuración">
                                                    <BsPencil />
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(c.ID_Config, c.NombreIndicador)} title="Inactivar indicador">
                                                    <BsTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {configs.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No hay indicadores configurados.</td></tr>}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <form onSubmit={handleGuardar}>
                            <div className="form-group">
                                <label>Nombre del Indicador *</label>
                                <input className="form-control" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Cumplimiento de Capacitaciones"/>
                            </div>

                            <div style={{backgroundColor:'#f8f9fa', padding:'1rem', borderRadius:'8px', marginBottom:'1rem', border:'1px solid #eee'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                                    <h4 style={{marginTop:0, margin:0, color:'#005A5B'}}>Definir Variables</h4>
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={agregarVariable}>
                                        <BsPlusCircle /> Añadir Variable
                                    </button>
                                </div>
                                
                                <div style={{display: 'flex', flexDirection:'column', gap:'10px'}}>
                                    {variablesDinamicas.map((v, index) => (
                                        <div key={index} style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                            <span style={{fontWeight:'bold', color:'#007BFF', width:'30px'}}>{v.code}</span>
                                            <input 
                                                className="form-control" 
                                                placeholder={`Nombre de la variable ${v.code} (Ej: Total Horas)`} 
                                                value={v.label}
                                                onChange={e => handleVariableChange(index, e.target.value)}
                                                required
                                            />
                                            {variablesDinamicas.length > 1 && (
                                                <button type="button" className="btn btn-sm btn-danger" onClick={() => quitarVariable(index)} title="Quitar">
                                                    <BsDashCircle />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group" style={{marginTop:'1.5rem'}}>
                                    <label style={{color: '#d63384'}}><BsCalculator/> Fórmula Matemática</label>
                                    <input 
                                        className="form-control" 
                                        required 
                                        value={form.formula} 
                                        onChange={e => setForm({...form, formula: e.target.value})} 
                                        placeholder={`Ej: (${variablesDinamicas.map(v => v.code).join(' + ')}) / 100`} 
                                        style={{fontFamily:'monospace', fontWeight:'bold', fontSize:'1.1rem'}}
                                    />
                                    <small style={{color:'#666'}}>
                                        Usa los códigos <b>{variablesDinamicas.map(v => v.code).join(', ')}</b> y operadores (+ - * /).
                                    </small>
                                </div>
                                
                                <div className="form-group" style={{marginTop:'1rem'}}>
                                    <label>Constante (K)</label>
                                    <input type="number" className="form-control" value={form.constante} onChange={e => setForm({...form, constante: e.target.value})} style={{width:'100px'}}/>
                                </div>
                            </div>

                            <div style={{display:'flex', gap:'1rem'}}>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Meta por Defecto</label>
                                    <input type="number" step="0.01" className="form-control" value={form.meta} onChange={e => setForm({...form, meta: e.target.value})}/>
                                </div>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Condición Meta</label>
                                    <select className="form-control" value={form.operador} onChange={e => setForm({...form, operador: e.target.value})}>
                                        <option value=">=">Mayor o Igual ({'>='})</option>
                                        <option value="<=">Menor o Igual ({'<='})</option>
                                        <option value="==">Igual (==)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{display:'flex', gap:'1rem'}}>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Frecuencia</label>
                                    <select className="form-control" value={form.frecuencia} onChange={e => setForm({...form, frecuencia: e.target.value})}>
                                        <option>Mensual</option>
                                        <option>Anual</option>
                                        <option>Trimestral</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Tipo Gráfica</label>
                                    <select className="form-control" value={form.grafica} onChange={e => setForm({...form, grafica: e.target.value})}>
                                        <option value="Bar">Barras</option>
                                        <option value="Line">Línea</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setView('LIST')}>Volver a Lista</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    )}
                </div>
                
                {view === 'LIST' && (
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={alCerrar}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalConfigurarIndicadores;