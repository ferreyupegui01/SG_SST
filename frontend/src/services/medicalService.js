// frontend/src/services/medicalService.js

import { apiFetch } from './apiService.js';

/**
 * @service getHistorialExamenes
 * @desc Obtiene la lista de todos los exámenes médicos registrados
 */
export const getHistorialExamenes = async () => {
    return apiFetch('/medicina'); // GET /api/medicina
};

/**
 * @service registrarExamen
 * @desc Registra un nuevo examen médico (RF-029)
 * @param {object} datosExamen
 */
export const registrarExamen = async (datosExamen) => {
    return apiFetch('/medicina', {
        method: 'POST',
        body: JSON.stringify(datosExamen),
    }); // POST /api/medicina
};

/**
 * @service generarPdfExamen
 * @desc Descarga el PDF de recomendaciones (RF-030)
 * @param {number} idExamenMedico
 * @param {string} cedulaColaborador - Para el nombre del archivo
 */
export const generarPdfExamen = async (idExamenMedico, cedulaColaborador) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/medicina/${idExamenMedico}/pdf`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        try { const errData = await response.json(); throw new Error(errData.msg || 'No se pudo generar el PDF');} 
        // eslint-disable-next-line no-unused-vars
        catch (e) { throw new Error(`Error ${response.status}: No se pudo generar el PDF.`); }
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recomendaciones-${cedulaColaborador}.pdf`; 
    document.body.appendChild(a); 
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * @service getExamenMedicoDetalle
 * @desc Obtiene el detalle completo de UN examen (para el modal)
 * @param {number} idExamenMedico
 */
export const getExamenMedicoDetalle = async (idExamenMedico) => {
    // Esta es la función que faltaba exportar
    return apiFetch(`/medicina/${idExamenMedico}`); // GET /api/medicina/:id
};