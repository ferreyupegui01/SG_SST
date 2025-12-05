// frontend/src/services/medicalService.js

import { apiFetch } from './apiService.js';

export const getHistorialExamenes = async () => {
    return apiFetch('/medicina'); 
};

export const registrarExamen = async (datosExamen) => {
    return apiFetch('/medicina', {
        method: 'POST',
        body: JSON.stringify(datosExamen),
    }); 
};

export const getExamenMedicoDetalle = async (idExamenMedico) => {
    return apiFetch(`/medicina/${idExamenMedico}`); 
};

/**
 * @service generarPdfExamen
 * @desc Genera y descarga el PDF enviando los datos del encabezado
 */
export const generarPdfExamen = async (idExamenMedico, cedulaColaborador, headerData) => {
    const token = localStorage.getItem('token');
    
    // Usamos POST para enviar el JSON con los datos del encabezado
    const response = await fetch(`http://localhost:5000/api/medicina/${idExamenMedico}/pdf`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(headerData)
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo generar el PDF.`);
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