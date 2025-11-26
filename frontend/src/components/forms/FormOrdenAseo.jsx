// frontend/src/componentes/forms/FormOrdenAseo.jsx

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

const FormSection = ({ title, children }) => (
    <> 
        <h3 className="form-section-header">{title}</h3> 
        <div className="form-checklist-container">{children}</div> 
    </>
);

const FormOrdenAseo = ({ onFormChange, onResultadoChange }) => {
    const sections = {
        clasificar: [{ id: 'cla_necesarios', label: 'Se conservan solo elementos necesarios' }, { id: 'cla_obsoletos', label: 'Se retiran elementos obsoletos' }],
        ordenar: [{ id: 'ord_lugar', label: 'Un lugar para cada cosa y cada cosa en su lugar' }, { id: 'ord_identificados', label: 'Áreas y elementos identificados' }, { id: 'ord_pasillos', label: 'Pasillos y accesos despejados' }],
        limpiar: [{ id: 'lim_pisos', label: 'Pisos, paredes y techos limpios' }, { id: 'lim_maquinas', label: 'Maquinaria y equipos limpios' }, { id: 'lim_puntos', label: 'Puntos ecológicos/residuos limpios y ordenados' }],
        estandarizar: [{ id: 'est_controles', label: 'Existen controles visuales y recordatorios' }, { id: 'est_rutinas', label: 'Se siguen rutinas de orden y aseo' }],
        disciplina: [{ id: 'dis_habito', label: 'El personal demuestra hábito de orden y aseo' }, { id: 'dis_epp', label: 'Uso de EPP según área' }]
    };

    // Generamos el estado inicial
    const initialState = Object.values(sections).flat().reduce((acc, item) => {
        acc[item.id] = { respuesta: '', observacion: '' };
        return acc;
    }, {});

    const [respuestas, setRespuestas] = useState(initialState);

    useEffect(() => {
        const tieneHallazgos = Object.values(respuestas).some(v => v.respuesta === 'R' || v.respuesta === 'M');
        onResultadoChange(tieneHallazgos ? 'Con Hallazgos' : 'OK');
        onFormChange({ checklist: respuestas }); // Solo checklist
    }, [respuestas, onFormChange, onResultadoChange]);

    const handleRespuestaChange = (item, valor) => {
        setRespuestas(prev => ({ ...prev, [item]: { ...prev[item], respuesta: valor } }));
    };
    const handleObservacionChange = (item, valor) => {
        setRespuestas(prev => ({ ...prev, [item]: { ...prev[item], observacion: valor } }));
    };

    return (
        <>
            <FormSection title="1S - CLASIFICAR (SEIRI)">{sections.clasificar.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="2S - ORDENAR (SEITON)">{sections.ordenar.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="3S - LIMPIAR (SEISO)">{sections.limpiar.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="4S - ESTANDARIZAR (SEIKETSU)">{sections.estandarizar.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="5S - DISCIPLINA (SHITSUKE)">{sections.disciplina.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            
            {/* SE ELIMINÓ EL TEXTAREA DE OBSERVACIONES GENERALES */}
        </>
    );
};

export default FormOrdenAseo;