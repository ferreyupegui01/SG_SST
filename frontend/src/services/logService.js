// frontend/src/services/logService.js
import { apiFetch } from './apiService.js';

/**
 * @service buscarLogs
 * @desc (Admin) Obtiene la lista de registros de auditoría filtrados
 * @param {object} filtros - { idUsuario, accion, fechaInicio, fechaFin }
 */
export const buscarLogs = async (filtros) => {
    return apiFetch('/logs/buscar', {
        method: 'POST',
        body: JSON.stringify(filtros || {}),
    }); // POST /api/logs/buscar
};

/**
 * @service getLogFiltros
 * @desc (Admin) Obtiene las listas de usuarios y acciones para los filtros
 */
export const getLogFiltros = async () => {
    return apiFetch('/logs/filtros'); // GET /api/logs/filtros
};