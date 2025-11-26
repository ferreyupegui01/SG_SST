// frontend/src/services/reportService.js

import { apiFetch } from './apiService.js';

// --- Para el Administrador ---

export const getReportesMaquina = async () => {
    return apiFetch('/reportes/maquina'); 
};
export const getReportesSeguridad = async () => {
    return apiFetch('/reportes/seguridad'); 
};
export const getReporteMaquinaDetalle = async (idReporte) => {
    return apiFetch(`/reportes/maquina/${idReporte}`);
};
export const getReporteSeguridadDetalle = async (idReporte) => {
    return apiFetch(`/reportes/seguridad/${idReporte}`); 
};

// --- Para el Colaborador ---

/**
 * @service crearReporteMaquina
 * @desc Envía un nuevo reporte de estado de máquina (CU-07)
 * @param {FormData} formData - FormData con los datos y el archivo
 */
export const crearReporteMaquina = async (formData) => {
    // Usa fetch directo para FormData
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/reportes/maquina', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.msg || 'Error al enviar el reporte');
    }
    return data;
};

/**
 * @service crearReporteSeguridad
 * @desc Envía un nuevo reporte de seguridad con foto opcional (CU-08)
 */
export const crearReporteSeguridad = async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/reportes/seguridad', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Error al enviar el reporte');
    return data;
};

export const getMisReportesMaquina = async () => {
    return apiFetch('/reportes/maquina/mis-reportes');
};
export const getMisReportesSeguridad = async () => {
    return apiFetch('/reportes/seguridad/mis-reportes');
};