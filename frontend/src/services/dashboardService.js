// frontend/src/services/dashboardService.js

import { apiFetch } from './apiService.js';

/**
 * @service getAdminKPIs
 * @desc Obtiene los 4 KPIs (contadores) para el dashboard del Admin
 */
export const getAdminKPIs = async () => {
    return apiFetch('/dashboard/admin-kpis'); // GET /api/dashboard/admin-kpis
};

/**
 * @service getAdminActividadesPendientes
 * @desc Obtiene la lista Top 5 de actividades pendientes
 */
export const getAdminActividadesPendientes = async () => {
    return apiFetch('/dashboard/admin-actividades'); // GET /api/dashboard/admin-actividades
};

/**
 * @service getAdminReportesRecientes
 * @desc Obtiene la lista Top 5 de reportes nuevos
 */
export const getAdminReportesRecientes = async () => {
    return apiFetch('/dashboard/admin-reportes'); // GET /api/dashboard/admin-reportes
};