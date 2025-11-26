// frontend/src/componentes/forms/FormSustanciasQuimicas.jsx

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
    <> <h3 className="form-section-header">{title}</h3> <div className="form-checklist-container">{children}</div> </>
);

const FormSustanciasQuimicas = ({ onFormChange, onResultadoChange }) => {
    const sections = {
        almacenamiento: [{ id: 'alm_area', label: 'Área de almacenamiento ventilada y señalizada' }, { id: 'alm_compatibilidad', label: 'Incompatibilidades químicas separadas' }, { id: 'alm_envases', label: 'Envases rotulados y en buen estado' }, { id: 'alm_hojas_seg', label: 'Hojas de seguridad (MSDS) disponibles' }, { id: 'alm_diques', label: 'Sistemas de contención/diques para derrames' },],
        manipulacion: [{ id: 'man_trasvase', label: 'Trasvase seguro (embudos, bombas)' }, { id: 'man_personal', label: 'Personal capacitado en riesgos químicos' },],
        epp: [{ id: 'epp_guantes', label: 'Guantes de nitrilo/caucho' }, { id: 'epp_gafas', label: 'Gafas de seguridad / Monogafas' }, { id: 'epp_respirador', label: 'Protección respiratoria (si aplica)' },],
        emergencia: [{ id: 'em_kit', label: 'Kit anti-derrames disponible y completo' }, { id: 'em_ducha', label: 'Ducha de emergencia / Lavaojos funcional' },]
    };
    
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
            <FormSection title="ALMACENAMIENTO">{sections.almacenamiento.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="MANIPULACIÓN">{sections.manipulacion.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="EPP ESPECÍFICO">{sections.epp.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="EMERGENCIA">{sections.emergencia.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            {/* SE ELIMINÓ EL TEXTAREA DE OBSERVACIONES GENERALES */}
        </>
    );
};
export default FormSustanciasQuimicas;