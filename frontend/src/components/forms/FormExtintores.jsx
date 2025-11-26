// frontend/src/componentes/forms/FormExtintores.jsx

import React, { useState, useEffect } from 'react';
import '../../style/InspeccionesPage.css'; 
import '../../index.css';

const initialState = {
    item1_ubicacion: { respuesta: '', observacion: '' },
    item2_senalizacion: { respuesta: '', observacion: '' },
    item3_acceso: { respuesta: '', observacion: '' },
    item4_manometro: { respuesta: '', observacion: '' },
    item5_seguro: { respuesta: '', observacion: '' },
    item6_manguera: { respuesta: '', observacion: '' },
    item7_etiqueta_vencimiento: { respuesta: '', observacion: '' },
};

const ChecklistItem = ({ id, label, value, onRespuestaChange, onObservacionChange }) => (
    <div className="checklist-item-wrapper">
        <div className="checklist-item">
            <label className="item-label">{label}</label>
            <div className="checklist-options">
                {['B', 'R', 'M', 'NA'].map(val => (
                    <label key={val} className="radio-label">
                        <input 
                            type="radio" name={id} value={val} 
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
                placeholder="Observación..."
            />
        </div>
    </div>
);

const FormExtintores = ({ onFormChange, onResultadoChange }) => {
    const [respuestas, setRespuestas] = useState(initialState);

    useEffect(() => {
        const tieneHallazgos = Object.values(respuestas).some(v => v.respuesta === 'R' || v.respuesta === 'M');
        onResultadoChange(tieneHallazgos ? 'Con Hallazgos' : 'OK');
        onFormChange({ checklist: respuestas }); // Solo enviamos el checklist
    }, [respuestas, onFormChange, onResultadoChange]);

    const handleRespuestaChange = (item, valor) => {
        setRespuestas(prev => ({ ...prev, [item]: { ...prev[item], respuesta: valor } }));
    };

    const handleObservacionChange = (item, valor) => {
        setRespuestas(prev => ({ ...prev, [item]: { ...prev[item], observacion: valor } }));
    };

    const items = [
        { id: 'item1_ubicacion', label: '1. ¿Está en la ubicación asignada?' },
        { id: 'item2_senalizacion', label: '2. ¿La señalización es visible y adecuada?' },
        { id: 'item3_acceso', label: '3. ¿El acceso al extintor está libre de obstáculos?' },
        { id: 'item4_manometro', label: '4. ¿El manómetro indica la presión adecuada (en verde)?' },
        { id: 'item5_seguro', label: '5. ¿El seguro (pasador) y sello de garantía están intactos?' },
        { id: 'item6_manguera', label: '6. ¿La manguera y boquilla están en buen estado?' },
        { id: 'item7_etiqueta_vencimiento', label: '7. ¿La etiqueta de vencimiento de carga está vigente?' },
    ];

    return (
        <div className="form-checklist-container">
            {items.map(item => (
                <ChecklistItem 
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

export default FormExtintores;