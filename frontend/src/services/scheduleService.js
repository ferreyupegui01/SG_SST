// frontend/src/services/scheduleService.js

import { apiFetch } from './apiService.js';

export const crearCronograma = async (datos) => {
    return apiFetch('/cronogramas', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
};

export const getCronogramas = async () => {
    return apiFetch('/cronogramas');
};

export const eliminarCronograma = async (idCronograma) => {
    return apiFetch(`/cronogramas/${idCronograma}`, {
        method: 'DELETE'
    });
};

export const crearActividad = async (idCronograma, datos) => {
    return apiFetch(`/cronogramas/${idCronograma}/actividades`, {
        method: 'POST',
        body: JSON.stringify(datos),
    });
};

export const getActividadesPorCronograma = async (idCronograma) => {
    return apiFetch(`/cronogramas/${idCronograma}/actividades`);
};

export const editarActividad = async (idActividad, datos) => {
    return apiFetch(`/actividades/${idActividad}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
    });
};

export const eliminarActividad = async (idActividad) => {
    return apiFetch(`/actividades/${idActividad}`, {
        method: 'DELETE',
    });
};

export const gestionarActividad = async (idActividad, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/actividades/${idActividad}/estado`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Error al gestionar actividad');
    return data;
};

/**
 * @service getActividadDetalle
 * @desc Obtiene el detalle de una sola actividad
 */
export const getActividadDetalle = async (idActividad) => {
    return apiFetch(`/actividades/${idActividad}`);
};

// --- AQUÍ ESTÁ LA FUNCIÓN EXPORTADA ---
export const getEvidenciasActividad = async (idActividad) => {
    return apiFetch(`/actividades/${idActividad}/evidencias`);
};