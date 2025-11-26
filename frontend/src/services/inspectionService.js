// frontend/src/services/inspectionService.js

import { apiFetch } from './apiService.js';

export const getInspeccionesHistorial = async () => {
    return apiFetch('/inspecciones');
};

export const crearInspeccion = async (payload) => {
    return apiFetch('/inspecciones', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const getInspeccionDetalle = async (id) => {
    return apiFetch(`/inspecciones/${id}`);
};

export const crearNuevoFormulario = async (datos) => {
    return apiFetch('/inspecciones/formularios', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
};

export const getFormularios = async () => {
    return apiFetch('/inspecciones/formularios');
};

export const getPreguntasFormulario = async (idFormulario) => {
    return apiFetch(`/inspecciones/formularios/${idFormulario}/preguntas`);
};

export const agregarPregunta = async (idFormulario, textoPregunta) => {
    return apiFetch(`/inspecciones/formularios/${idFormulario}/preguntas`, {
        method: 'POST',
        body: JSON.stringify({ textoPregunta })
    });
};

export const eliminarPregunta = async (idPregunta) => {
    return apiFetch(`/inspecciones/preguntas/${idPregunta}`, {
        method: 'DELETE'
    });
};

export const toggleVisibilidadFormulario = async (idFormulario, visible) => {
    return apiFetch(`/inspecciones/formularios/${idFormulario}/visibilidad`, {
        method: 'PATCH',
        body: JSON.stringify({ visible })
    });
};

// --- NUEVAS FUNCIONES ---

export const getTiposActivosUnicos = async () => {
    return apiFetch('/inspecciones/activos/tipos-unicos');
};

export const editarFormulario = async (idFormulario, datos) => {
    return apiFetch(`/inspecciones/formularios/${idFormulario}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
};

export const eliminarFormulario = async (idFormulario) => {
    return apiFetch(`/inspecciones/formularios/${idFormulario}`, {
        method: 'DELETE'
    });
};