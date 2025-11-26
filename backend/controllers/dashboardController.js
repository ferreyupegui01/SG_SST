// backend/controllers/dashboardController.js

import { poolPromise, mssql } from '../config/dbConfig.js';

/**
 * @controller  getAdminKPIs
 * @desc        Obtiene los 4 KPIs (contadores) para el dashboard del Admin
 */
const getAdminKPIs = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_Dashboard_Admin_KPIs');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getAdminKPIs:', err.message);
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  getAdminActividadesPendientes
 * @desc        Obtiene la lista Top 5 de actividades pendientes
 */
const getAdminActividadesPendientes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_Dashboard_ActividadesPendientes');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getAdminActividadesPendientes:', err.message);
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  getAdminReportesRecientes
 * @desc        Obtiene la lista Top 5 de reportes nuevos
 */
const getAdminReportesRecientes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_Dashboard_ReportesRecientes');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getAdminReportesRecientes:', err.message);
        res.status(500).send('Error del servidor');
    }
};



/**
 * @controller  getSuperAdminData
 * @desc        Obtiene toda la data para el dashboard del Super Admin
 */
const getSuperAdminData = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_SuperAdmin_Dashboard');
        
        // El SP devuelve 3 tablas (recordsets)
        const kpis = result.recordsets[0][0];       // Tabla 1: KPIs
        const grafica = result.recordsets[1];       // Tabla 2: Datos Gráfica
        const logs = result.recordsets[2];          // Tabla 3: Logs Recientes

        res.json({
            kpis,
            grafica,
            logs
        });
    } catch (err) {
        console.error('Error en getSuperAdminData:', err.message);
        res.status(500).send('Error del servidor');
    }
};



const dashboardController = {
    getAdminKPIs,
    getAdminActividadesPendientes,
    getAdminReportesRecientes,
    getSuperAdminData
};

export default dashboardController;