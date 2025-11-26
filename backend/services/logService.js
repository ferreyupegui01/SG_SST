// backend/src/services/logService.js
import { poolPromise, mssql } from '../config/dbConfig.js';

/**
 * @service   logAction
 * @desc      Registra una acción de administrador en la tabla AuditLog.
 * @param {number} idUsuario - El ID del usuario que realiza la acción (del token).
 * @param {string} nombreUsuario - El nombre del usuario (del token).
 * @param {string} accion - Un código de acción (ej. "CREAR_USUARIO").
 * @param {string} descripcion - Un texto legible (ej. "Creó al usuario Pepito Perez (ID: 12)").
 */
export const logAction = async (idUsuario, nombreUsuario, accion, descripcion) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idUsuario', mssql.Int, idUsuario)
            .input('nombreUsuario', mssql.NVarChar, nombreUsuario)
            .input('accion', mssql.NVarChar, accion)
            .input('descripcion', mssql.NVarChar, descripcion)
            .query('EXEC SP_CREATE_AuditLog @idUsuario, @nombreUsuario, @accion, @descripcion');
    } catch (err) {
        // Si el log falla, no queremos que la aplicación principal se caiga.
        // Solo lo registramos en la consola del servidor.
        console.error('CRITICAL: Falla al escribir en AuditLog.', err.message);
    }
};