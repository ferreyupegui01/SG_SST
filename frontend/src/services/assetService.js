// frontend/src/services/assetService.js

import { apiFetch } from './apiService.js';

export const getActivosTodos = async () => {
    return apiFetch('/activos');
};

export const getActivosPorTipo = async (tipoActivo) => {
    return apiFetch(`/activos/tipo/${tipoActivo}`);
};

/**
 * @service getTiposActivosDisponibles
 * @desc Obtiene la lista de tipos de activos (dinámica desde la BD)
 */
export const getTiposActivosDisponibles = async () => {
    return apiFetch('/activos/tipos'); // GET /api/activos/tipos
};

export const crearActivo = async (datosActivo) => {
    return apiFetch('/activos', { method: 'POST', body: JSON.stringify(datosActivo) });
};

export const actualizarActivo = async (idActivo, datosActivo) => {
    return apiFetch(`/activos/${idActivo}`, { method: 'PUT', body: JSON.stringify(datosActivo) });
};

export const eliminarActivo = async (idActivo) => {
    return apiFetch(`/activos/${idActivo}`, { method: 'DELETE' });
};