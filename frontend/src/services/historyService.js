// frontend/src/services/historyService.js
import { apiFetch } from './apiService';

// CAMBIO: Recibe cedula
export const getHistorialColaborador = async (cedula) => {
    return apiFetch(`/historial/colaborador/${cedula}`);
};

export const getHistorialActivo = async (idActivo) => {
    return apiFetch(`/historial/activo/${idActivo}`);
};