// frontend/src/services/pesvService.js
import { apiFetch } from './apiService.js';

// --- CONDUCTORES ---
export const getConductoresPESV = async () => {
    return apiFetch('/pesv/conductores');
};

export const guardarInfoConductor = async (datos) => {
    return apiFetch('/pesv/conductores', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
};

// --- MANTENIMIENTOS ---
export const getMantenimientos = async (idActivo = null) => {
    const query = idActivo ? `?idActivo=${idActivo}` : '';
    return apiFetch(`/pesv/mantenimientos${query}`);
};

export const crearMantenimiento = async (datos) => {
    return apiFetch('/pesv/mantenimientos', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
};