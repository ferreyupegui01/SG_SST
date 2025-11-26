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