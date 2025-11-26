// backend/controllers/notificationController.js
import { poolPromise, mssql } from '../config/dbConfig.js';

const getMisNotificaciones = async (req, res) => {
    const { id, rol } = req.usuario;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idUsuario', mssql.Int, id)
            .input('rolUsuario', mssql.NVarChar, rol)
            .query('EXEC SP_GET_MisNotificaciones @idUsuario, @rolUsuario');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener notificaciones');
    }
};

const marcarLeida = async (req, res) => {
    const { id } = req.params; 
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idNotificacion', mssql.Int, id)
            .query('EXEC SP_MARK_NotificacionLeida @idNotificacion');
        res.json({ msg: 'Leída' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
};

// --- NUEVA FUNCIÓN: OCULTAR (SOFT DELETE) ---
const ocultarNotificacion = async (req, res) => {
    const { id } = req.params; 
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idNotificacion', mssql.Int, id)
            .query('EXEC SP_HIDE_Notificacion @idNotificacion');
        res.json({ msg: 'Notificación eliminada de la vista' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
};

export default { getMisNotificaciones, marcarLeida, ocultarNotificacion };