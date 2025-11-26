/* eslint-disable no-unused-vars */
// frontend/src/componentes/forms/FormularioGenericoRenderer.jsx

import React, { useState, useEffect } from 'react';
import '../../style/InspeccionesPage.css';
import '../../index.css';

const ChecklistItem = ({ id, label, value, onRespuestaChange, onObservacionChange }) => (
    <div className="checklist-item-wrapper">
        <div className="checklist-item">
            <label className="item-label">{label}</label>
            <div className="checklist-options">
                {['B', 'R', 'M', 'NA'].map(val => (
                    <label key={val} className="radio-label">
                        <input type="radio" name={id} value={val} checked={value.respuesta === val} onChange={() => onRespuestaChange(id, val)} />
                        <span>{val}</span>
                    </label>
                ))}
            </div>
        </div>
        <div className="checklist-item-observacion">
            <label htmlFor={`${id}_obs`}>Obs:</label>
            <input type="text" id={`${id}_obs`} value={value.observacion} onChange={(e) => onObservacionChange(id, e.target.value)} placeholder="Observación..." />
        </div>
    </div>
);

const FormularioGenericoRenderer = ({ preguntas, onFormChange, onResultadoChange }) => {
    
    const initialState = preguntas.reduce((acc, p) => {
        acc[p.CodigoPregunta] = { respuesta: '', observacion: '' };
        return acc;
    }, {});

    const [respuestas, setRespuestas] = useState(initialState);

    useEffect(() => {
        const tieneHallazgos = Object.values(respuestas).some(v => v.respuesta === 'R' || v.respuesta === 'M' || v.respuesta === 'NC');
        onResultadoChange(tieneHallazgos ? 'Con Hallazgos' : 'OK');
        
        // Comunicar cambios al padre (SOLO checklist)
        onFormChange({ checklist: respuestas });
    }, [respuestas, onFormChange, onResultadoChange]);

    const handleRespuestaChange = (key, valor) => {
        setRespuestas(prev => ({ ...prev, [key]: { ...prev[key], respuesta: valor } }));
    };
    const handleObservacionChange = (key, valor) => {
        setRespuestas(prev => ({ ...prev, [key]: { ...prev[key], observacion: valor } }));
    };

    if (!preguntas || preguntas.length === 0) return <p>No se encontraron preguntas para este formulario. Verifique la estructura en el backend.</p>;

    return (
        <div className="form-checklist-container">
            <h3>Checklist Dinámico</h3>
            {preguntas.map((p, index) => (
                <ChecklistItem 
                    key={p.ID_Pregunta} 
                    id={p.CodigoPregunta} 
                    label={`${p.Orden}. ${p.TextoPregunta}`}
                    value={respuestas[p.CodigoPregunta] || { respuesta: '', observacion: '' }}
                    onRespuestaChange={handleRespuestaChange}
                    onObservacionChange={handleObservacionChange}
                />
            ))}
            {/* SE ELIMINÓ EL TEXTAREA DE OBSERVACIONES GENERALES */}
        </div>
    );
};

export default FormularioGenericoRenderer;