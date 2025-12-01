/* eslint-disable no-unused-vars */
// frontend/src/components/forms/FormularioGenericoRenderer.jsx

import React, { useState, useEffect } from 'react';
import '../../style/InspeccionesPage.css';
import '../../index.css';

const ChecklistItem = ({ id, label, value, onRespuestaChange, onObservacionChange }) => (
    <div className="checklist-item-wrapper">
        <div className="checklist-item">
            <label className="item-label">{label}</label>
            <div className="checklist-options">
                {/* Opciones Estandarizadas: C (Cumple), NC (No Cumple), NA (No Aplica) */}
                {['C', 'NC', 'NA'].map(val => (
                    <label key={val} className={`radio-label-cn ${val === 'C' ? 'radio-cumple' : val === 'NC' ? 'radio-nocumple' : ''}`}>
                        <input 
                            type="radio" 
                            name={id} 
                            value={val} 
                            checked={value.respuesta === val} 
                            onChange={() => onRespuestaChange(id, val)} 
                        />
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
    
    // Inicializamos el estado usando las preguntas que llegan de la BD
    const initialState = preguntas.reduce((acc, p) => {
        acc[p.CodigoPregunta] = { 
            respuesta: '', 
            observacion: '',
            // --- ESTO ES LO NUEVO: Guardamos el texto para persistencia en JSON ---
            textoPregunta: p.TextoPregunta 
        };
        return acc;
    }, {});

    const [respuestas, setRespuestas] = useState(initialState);

    useEffect(() => {
        // Lógica automática de resultado (Si hay un No Cumple, el resultado es Con Hallazgos)
        const tieneHallazgos = Object.values(respuestas).some(v => v.respuesta === 'NC' || v.respuesta === 'M' || v.respuesta === 'R');
        onResultadoChange(tieneHallazgos ? 'Con Hallazgos' : 'OK');
        
        // Enviamos el objeto completo (incluyendo textoPregunta) al padre para guardar en BD
        onFormChange({ checklist: respuestas });
    }, [respuestas, onFormChange, onResultadoChange]);

    const handleRespuestaChange = (key, valor) => {
        setRespuestas(prev => ({ 
            ...prev, 
            [key]: { ...prev[key], respuesta: valor } 
        }));
    };
    
    const handleObservacionChange = (key, valor) => {
        setRespuestas(prev => ({ 
            ...prev, 
            [key]: { ...prev[key], observacion: valor } 
        }));
    };

    if (!preguntas || preguntas.length === 0) return <p>No hay preguntas configuradas.</p>;

    return (
        <div className="form-checklist-container">
            {preguntas.map((p, index) => (
                <ChecklistItem 
                    key={p.ID_Pregunta} 
                    id={p.CodigoPregunta} 
                    // Mostramos "1. Pregunta..."
                    label={`${p.Orden ? p.Orden + '.' : ''} ${p.TextoPregunta}`}
                    // Pasamos el estado actual o un objeto vacío seguro
                    value={respuestas[p.CodigoPregunta] || { respuesta: '', observacion: '' }}
                    onRespuestaChange={handleRespuestaChange}
                    onObservacionChange={handleObservacionChange}
                />
            ))}
        </div>
    );
};

export default FormularioGenericoRenderer;