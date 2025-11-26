// frontend/src/componentes/forms/FormSeguridadGeneral.jsx

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

const FormSeguridadGeneral = ({ onFormChange, onResultadoChange }) => {
    const sections = {
        maquinas: [{ id: 'maq_guardas', label: 'Guardas de seguridad instaladas y en uso' }, { id: 'maq_parada_e', label: 'Paradas de emergencia visibles y funcionales' }, { id: 'maq_mantenimiento', label: 'Mantenimiento preventivo (sin fugas, ruidos)' },],
        escaleras: [{ id: 'esc_estado', label: 'Escaleras fijas (barandas, antideslizante)' }, { id: 'esc_manuales', label: 'Escaleras manuales (estado, zapatas)' }, { id: 'esc_andamios', label: 'Andamios (estabilidad, plataformas)' },],
        instalaciones: [{ id: 'inst_pisos', label: 'Pisos (sin huecos, antideslizantes)' }, { id: 'inst_iluminacion', label: 'Iluminación adecuada' }, { id: 'inst_ventilacion', label: 'Ventilación adecuada' },],
        almacenamiento: [{ id: 'alm_estanterias', label: 'Estanterías (sin sobrecarga, ancladas)' }, { id: 'alm_materiales', label: 'Materiales bien apilados' },],
        epp: [{ id: 'epp_uso', label: 'Uso correcto de EPP por el personal' }, { id: 'epp_estado', label: 'Disponibilidad y estado de EPP' },],
        emergencia: [{ id: 'em_rutas', label: 'Rutas de evacuación despejadas' }, { id: 'em_salidas', label: 'Salidas de emergencia funcionales' }, { id: 'em_extintores', label: 'Extintores (accesibles, cargados)' }, { id: 'em_botiquin', label: 'Botiquín (visible, con dotación)' },]
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
            <FormSection title="MAQUINAS, EQUIPOS Y HERRAMIENTAS">{sections.maquinas.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="ESCALERAS Y ANDAMIOS">{sections.escaleras.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="INSTALACIONES LOCATIVAS">{sections.instalaciones.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="ALMACENAMIENTO">{sections.almacenamiento.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)">{sections.epp.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="PREVENCIÓN Y ATENCIÓN DE EMERGENCIAS">{sections.emergencia.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            {/* SE ELIMINÓ EL TEXTAREA DE OBSERVACIONES GENERALES */}
        </>
    );
};

export default FormSeguridadGeneral;