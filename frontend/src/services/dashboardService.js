// frontend/src/services/dashboardService.js

import { apiFetch } from './apiService.js';

/**
 * @service getAdminKPIs
 * @desc Obtiene los 4 KPIs (contadores) para el dashboard del Admin
 */
export const getAdminKPIs = async () => {
    return apiFetch('/dashboard/admin-kpis');
};

/**
 * @service getAdminActividadesPendientes
 * @desc Obtiene la lista Top 5 de actividades pendientes
 */
export const getAdminActividadesPendientes = async () => {
    return apiFetch('/dashboard/admin-actividades');
};

/**
 * @service getAdminActividadesEstado
 * @desc Obtiene los datos para la gráfica de pastel de actividades (NUEVO)
 */
export const getAdminActividadesEstado = async () => {
    return apiFetch('/dashboard/admin-actividades-estado');
};

/**
 * @service getAdminReportesRecientes
 * @desc Obtiene la lista Top 5 de reportes nuevos
 */
export const getAdminReportesRecientes = async () => {
    return apiFetch('/dashboard/admin-reportes');
};