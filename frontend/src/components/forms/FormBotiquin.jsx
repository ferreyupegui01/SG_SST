// frontend/src/componentes/forms/FormBotiquin.jsx

import React, { useState, useEffect } from 'react';
import '../../style/InspeccionesPage.css';
import '../../index.css';

const initialState = {
    item_gasas: { respuesta: '', observacion: '' },
    item_esparadrapo: { respuesta: '', observacion: '' },
    item_baja_lenguas: { respuesta: '', observacion: '' },
    item_curas: { respuesta: '', observacion: '' },
    item_venda_ela_2: { respuesta: '', observacion: '' },
    item_venda_ela_3: { respuesta: '', observacion: '' },
    item_venda_alg: { respuesta: '', observacion: '' },
    item_yodopovidona: { respuesta: '', observacion: '' },
    item_sol_salina: { respuesta: '', observacion: '' },
    item_guantes: { respuesta: '', observacion: '' },
    item_tijeras: { respuesta: '', observacion: '' },
    item_termometro: { respuesta: '', observacion: '' },
};

// Usamos C (Cumple) / NC (No Cumple) / NA (No Aplica)
const ChecklistItemCN = ({ id, label, value, onRespuestaChange, onObservacionChange }) => (
    <div className="checklist-item-wrapper">
        <div className="checklist-item">
            <label className="item-label">{label}</label>
            <div className="checklist-options">
                {['C', 'NC', 'NA'].map(val => (
                    <label key={val} className="radio-label-cn">
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
            <input 
                type="text" id={`${id}_obs`} 
                value={value.observacion} 
                onChange={(e) => onObservacionChange(id, e.target.value)}
                placeholder="Cantidades, fechas..."
            />
        </div>
    </div>
);

const FormBotiquin = ({ onFormChange, onResultadoChange }) => {
    const [respuestas, setRespuestas] = useState(initialState);

    useEffect(() => {
        const tieneHallazgos = Object.values(respuestas).some(v => v.respuesta === 'NC');
        onResultadoChange(tieneHallazgos ? 'Con Hallazgos' : 'OK');
        // Ya no enviamos observacionesFormulario desde aquí, solo el checklist
        onFormChange({ checklist: respuestas });
    }, [respuestas, onFormChange, onResultadoChange]);

    const handleRespuestaChange = (item, valor) => {
        setRespuestas(prev => ({ ...prev, [item]: { ...prev[item], respuesta: valor } }));
    };
    const handleObservacionChange = (item, valor) => {
        setRespuestas(prev => ({ ...prev, [item]: { ...prev[item], observacion: valor } }));
    };

    const items = [
        { id: 'item_gasas', label: 'Gasas limpias (paquete)' },
        { id: 'item_esparadrapo', label: 'Esparadrapo de tela' },
        { id: 'item_baja_lenguas', label: 'Baja lenguas (paquete)' },
        { id: 'item_curas', label: 'Curitas (paquete)' },
        { id: 'item_venda_ela_2', label: 'Venda elástica 2x5' },
        { id: 'item_venda_ela_3', label: 'Venda elástica 3x5' },
        { id: 'item_venda_alg', label: 'Venda de algodón 3x5' },
        { id: 'item_yodopovidona', label: 'Yodopovidona (jabón)' },
        { id: 'item_sol_salina', label: 'Solución salina (250 o 500ml)' },
        { id: 'item_guantes', label: 'Guantes de látex (caja)' },
        { id: 'item_tijeras', label: 'Tijeras' },
        { id: 'item_termometro', label: 'Termómetro' },
    ];

    return (
        <div className="form-checklist-container">
            {items.map(item => (
                <ChecklistItemCN 
                    key={item.id} 
                    {...item} 
                    value={respuestas[item.id]} 
                    onRespuestaChange={handleRespuestaChange}
                    onObservacionChange={handleObservacionChange}
                />
            ))}
            {/* SE ELIMINÓ EL TEXTAREA DE OBSERVACIONES GENERALES */}
        </div>
    );
};

export default FormBotiquin;