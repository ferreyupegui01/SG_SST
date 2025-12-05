// frontend/src/services/indicatorService.js
import { apiFetch } from './apiService.js';

export const guardarIndicador = async (datos) => {
    return apiFetch('/indicadores', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
};

export const getIndicadoresAnuales = async (anio) => {
    return apiFetch(`/indicadores/${anio}`);
};

export const eliminarRegistroIndicador = async (idRegistro) => {
    return apiFetch(`/indicadores/registro/${idRegistro}`, {
        method: 'DELETE'
    });
};

// --- Configuraciones ---
export const getConfiguracionesIndicadores = async () => {
    return apiFetch('/indicadores/config/todos');
};

export const crearConfiguracionIndicador = async (datos) => {
    return apiFetch('/indicadores/config', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
};

export const editarConfiguracionIndicador = async (idConfig, datos) => {
    return apiFetch(`/indicadores/config/${idConfig}`, { // <--- NUEVA
        method: 'PUT',
        body: JSON.stringify(datos)
    });
};

export const eliminarConfiguracionIndicador = async (idConfig) => {
    return apiFetch(`/indicadores/config/${idConfig}`, {
        method: 'DELETE'
    });
};