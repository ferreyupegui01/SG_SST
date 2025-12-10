// backend/controllers/historyController.js
import { poolPromise, mssql } from '../config/dbConfig.js';

const getHistorialColaborador = async (req, res) => {
    // CAMBIO: Ahora recibimos la Cédula, no el ID
    const { cedula } = req.params; 
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Cedula', mssql.NVarChar, cedula) // <--- Cambio aquí
            .query('EXEC SP_GET_Historial_Colaborador @Cedula');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error obteniendo historial colaborador');
    }
};

const getHistorialActivo = async (req, res) => {
    const { id } = req.params; // ID Activo
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Activo', mssql.Int, id)
            .query('EXEC SP_GET_Historial_Activo @ID_Activo');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error obteniendo historial activo');
    }
};

export default { getHistorialColaborador, getHistorialActivo };