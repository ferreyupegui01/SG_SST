// backend/src/controllers/logController.js

import { poolPromise, mssql } from '../config/dbConfig.js';

/**
 * @controller  getLogs
 * @desc        Obtiene la lista de todos los registros de auditoría (filtrados)
 */
const getLogs = async (req, res) => {
    // Los filtros ahora vienen en el body
    const { idUsuario, accion, fechaInicio, fechaFin } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idUsuario', mssql.Int, idUsuario || null)
            .input('accion', mssql.NVarChar(100), accion || null)
            .input('fechaInicio', mssql.Date, fechaInicio || null)
            .input('fechaFin', mssql.Date, fechaFin || null)
            .query('EXEC SP_GET_AuditLog @idUsuario, @accion, @fechaInicio, @fechaFin');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getLogs:', err.message);
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  getLogFiltros
 * @desc        Obtiene las listas de usuarios y acciones para los filtros
 */
const getLogFiltros = async (req, res) => {
    try {
        const pool = await poolPromise;
        // El SP devuelve 2 tablas: [0] = Usuarios, [1] = Acciones
        const result = await pool.request().query('EXEC SP_GET_AuditLog_Filtros');
        
        res.json({
            usuarios: result.recordsets[0] || [],
            acciones: result.recordsets[1] || []
        });
    } catch (err) {
        console.error('Error en getLogFiltros:', err.message);
        res.status(500).send('Error del servidor');
    }
};


const logController = {
    getLogs,
    getLogFiltros // <-- AÑADIDO
};

export default logController;