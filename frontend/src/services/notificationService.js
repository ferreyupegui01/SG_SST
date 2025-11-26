// backend/services/notificationService.js
import { poolPromise, mssql } from '../config/dbConfig.js';

/**
 * @desc Crea una notificación en la BD
 * @param {Object} data - { idUsuarioDestino, rolDestino, titulo, mensaje, ruta }
 */
export const crearNotificacion = async ({ idUsuarioDestino, rolDestino, titulo, mensaje, ruta }) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idUsuarioDestino', mssql.Int, idUsuarioDestino || null)
            .input('rolDestino', mssql.NVarChar, rolDestino || null)
            .input('titulo', mssql.NVarChar, titulo)
            .input('mensaje', mssql.NVarChar, mensaje)
            .input('rutaAccion', mssql.NVarChar, ruta || null)
            .query('EXEC SP_CREATE_Notificacion @idUsuarioDestino, @rolDestino, @titulo, @mensaje, @rutaAccion');
    } catch (err) {
        console.error('Error creando notificación interna:', err.message);
        // No lanzamos error para no interrumpir el flujo principal
    }
};