// frontend/src/componentes/forms/FormRiesgoElectrico.jsx

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

const FormRiesgoElectrico = ({ onFormChange, onResultadoChange }) => {
    const sections = {
        tableros: [{ id: 'tab_senalizados', label: 'Tableros eléctricos señalizados' }, { id: 'tab_libres', label: 'Acceso libre de obstáculos' }, { id: 'tab_tapas', label: 'Con tapas de protección y directorios' }, { id: 'tab_polo', label: 'Conexión a polo a tierra' },],
        conductores: [{ id: 'con_estado', label: 'Cables/Conductores en buen estado (sin uniones)' }, { id: 'con_canalizacion', label: 'Canalizados (no expuestos)' },],
        tomas: [{ id: 'tom_estado', label: 'Tomas e interruptores en buen estado (sin roturas)' }, { id: 'tom_sobrecarga', label: 'Sin sobrecarga (no usar "multitomas")' },],
        extensiones: [{ id: 'ext_uso', label: 'Uso de extensiones solo temporal' }, { id: 'ext_estado', label: 'Estado de extensiones (sin daños)' },],
        epp: [{ id: 'epp_dielectrico', label: 'Uso de EPP dieléctrico (si aplica)' },]
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
            <FormSection title="TABLEROS ELÉCTRICOS">{sections.tableros.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="CONDUCTORES">{sections.conductores.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="TOMAS E INTERRUPTORES">{sections.tomas.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="EXTENSIONES">{sections.extensiones.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="EPP">{sections.epp.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            {/* SE ELIMINÓ EL TEXTAREA DE OBSERVACIONES GENERALES */}
        </>
    );
};

export default FormRiesgoElectrico;