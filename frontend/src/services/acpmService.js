// frontend/src/services/acpmService.js

import { apiFetch } from './apiService.js';

/**
 * @service getACPMs
 * @desc Obtiene la lista de todas las acciones ACPM (Admin)
 */
export const getACPMs = async () => {
    return apiFetch('/acpm'); // GET /api/acpm
};

/**
 * @service getACPMDetalle
 * @desc Obtiene el detalle de una ACPM específica (Admin)
 * @param {number} idACPM
 */
export const getACPMDetalle = async (idACPM) => {
    return apiFetch(`/acpm/${idACPM}`); // GET /api/acpm/:id
};

/**
 * @service crearACPM
 * @desc Crea una nueva acción ACPM (CU-03)
 * @param {object} datosACPM
 */
export const crearACPM = async (datosACPM) => {
    return apiFetch('/acpm', {
        method: 'POST',
        body: JSON.stringify(datosACPM),
    }); // POST /api/acpm
};

/**
 * @service gestionarACPM
 * @desc Actualiza estado, comentarios y sube evidencia de cierre (CU-04)
 * @param {number} idACPM
 * @param {FormData} formData - FormData con estado, comentarios y archivo
 */
export const gestionarACPM = async (idACPM, formData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:5000/api/acpm/${idACPM}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.msg || 'Error al gestionar la ACPM');
    }
    return data;
};

/**
 * @service getEvidenciasPorACPM
 * @desc Obtiene la lista de archivos de evidencia de una ACPM
 * @param {number} idACPM
 */
export const getEvidenciasPorACPM = async (idACPM) => {
    return apiFetch(`/acpm/${idACPM}/evidencias`); // <--- NUEVA FUNCIÓN
};