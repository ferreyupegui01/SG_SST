// frontend/src/componentes/forms/FormVehiculos.jsx

import React, { useState, useEffect } from 'react';
import '../../index.css'; // Usa estilos globales

const initialState = {
    // Documentación
    doc_soat: { respuesta: '', observacion: '' },
    doc_tecnomecanica: { respuesta: '', observacion: '' },
    doc_licencia: { respuesta: '', observacion: '' },
    doc_tarjeta_op: { respuesta: '', observacion: '' },
    // Equipo
    eq_gato: { respuesta: '', observacion: '' },
    eq_cruceta: { respuesta: '', observacion: '' },
    eq_llanta_rep: { respuesta: '', observacion: '' },
    eq_herramienta: { respuesta: '', observacion: '' },
    eq_botiquin: { respuesta: '', observacion: '' },
    eq_extintor: { respuesta: '', observacion: '' },
    eq_tacos: { respuesta: '', observacion: '' },
    eq_senales: { respuesta: '', observacion: '' },
    // Revisión
    rev_luces_altas: { respuesta: '', observacion: '' },
    rev_direccionales: { respuesta: '', observacion: '' },
    rev_stop: { respuesta: '', observacion: '' },
    rev_reversa: { respuesta: '', observacion: '' },
    rev_frenos: { respuesta: '', observacion: '' },
    rev_llantas_est: { respuesta: '', observacion: '' },
    rev_limpiabrisas: { respuesta: '', observacion: '' },
    rev_espejos: { respuesta: '', observacion: '' },
    rev_pito: { respuesta: '', observacion: '' },
    // EPP
    epp_guantes: { respuesta: '', observacion: '' },
    epp_casco: { respuesta: '', observacion: '' },
    // Fluidos
    flu_aceite: { respuesta: '', observacion: '' },
    flu_liq_frenos: { respuesta: '', observacion: '' },
    flu_agua: { respuesta: '', observacion: '' },
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
            <label htmlFor={`${id}_obs`}>Observación:</label>
            <input 
                type="text" id={`${id}_obs`} 
                value={value.observacion} 
                onChange={(e) => onObservacionChange(id, e.target.value)}
                placeholder="Opcional..."
            />
        </div>
    </div>
);

const FormSection = ({ title, children }) => (
    <>
        <h3 className="form-section-header">{title}</h3>
        <div className="form-checklist-container">{children}</div>
    </>
);

const FormVehiculos = ({ onFormChange, onResultadoChange }) => {
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

    const sections = {
        documentos: [
            { id: 'doc_soat', label: 'SOAT Vigente' },
            { id: 'doc_tecnomecanica', label: 'Revisión Tecnomecánica' },
            { id: 'doc_licencia', label: 'Licencia de Conducción' },
            { id: 'doc_tarjeta_op', label: 'Tarjeta de Operación' },
        ],
        equipo: [
            { id: 'eq_gato', label: 'Gato' },
            { id: 'eq_cruceta', label: 'Cruceta' },
            { id: 'eq_llanta_rep', label: 'Llanta Repuesto' },
            { id: 'eq_herramienta', label: 'Herramienta Básica' },
            { id: 'eq_botiquin', label: 'Botiquín' },
            { id: 'eq_extintor', label: 'Extintor' },
            { id: 'eq_tacos', label: 'Tacos' },
            { id: 'eq_senales', label: 'Señales' },
        ],
        revision: [
            { id: 'rev_luces_altas', label: 'Luces Altas/Bajas' },
            { id: 'rev_direccionales', label: 'Direccionales' },
            { id: 'rev_stop', label: 'Stop' },
            { id: 'rev_reversa', label: 'Reversa' },
            { id: 'rev_frenos', label: 'Frenos' },
            { id: 'rev_llantas_est', label: 'Estado Llantas' },
            { id: 'rev_limpiabrisas', label: 'Limpiabrisas' },
            { id: 'rev_espejos', label: 'Espejos' },
            { id: 'rev_pito', label: 'Pito' },
        ],
        epp: [
            { id: 'epp_guantes', label: 'Guantes' },
            { id: 'epp_casco', label: 'Casco (Si aplica)' },
        ],
        fluidos: [
            { id: 'flu_aceite', label: 'Nivel Aceite' },
            { id: 'flu_liq_frenos', label: 'Nivel Liq. Frenos' },
            { id: 'flu_agua', label: 'Nivel Agua' },
        ]
    };

    return (
        <>
            <FormSection title="DOCUMENTOS">{sections.documentos.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="EQUIPO DE CARRETERA">{sections.equipo.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="REVISIÓN EXTERNA E INTERNA">{sections.revision.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="EPP">{sections.epp.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>
            <FormSection title="FLUIDOS">{sections.fluidos.map(item => <ChecklistItem key={item.id} {...item} value={respuestas[item.id]} onRespuestaChange={handleRespuestaChange} onObservacionChange={handleObservacionChange} />)}</FormSection>

            {/* SE ELIMINÓ EL TEXTAREA DE OBSERVACIONES GENERALES */}
        </>
    );
};

export default FormVehiculos;