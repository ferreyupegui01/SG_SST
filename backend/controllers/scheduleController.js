// backend/src/controllers/scheduleController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import { logAction } from '../services/logService.js'; 

const crearCronograma = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { nombreCronograma, anioAplicacion, descripcion } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('nombreCronograma', mssql.NVarChar, nombreCronograma)
            .input('anioAplicacion', mssql.Int, anioAplicacion || null)
            .input('descripcion', mssql.NVarChar, descripcion || null)
            .query('EXEC SP_CREATE_Cronograma @nombreCronograma, @anioAplicacion, @descripcion'); 
        const nuevoCronogramaId = result.recordset[0].ID_Cronograma;

        await logAction(req.usuario.id, req.usuario.nombre, 'CREAR_CRONOGRAMA', `Creó el cronograma: '${nombreCronograma}' (ID: ${nuevoCronogramaId})`);

        res.status(201).json({ 
            msg: 'Cronograma creado exitosamente',
            idCronograma: nuevoCronogramaId 
        });
    } catch (err) {
        if (err.message.includes('Ya existe un cronograma')) { 
             return res.status(400).json({ msg: 'Ya existe un cronograma con ese nombre y año de aplicación' });
        }
        console.error('Error en crearCronograma:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getCronogramas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_Cronogramas'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getCronogramas:', err.message);
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  eliminarCronograma
 * @desc        Marca un cronograma como Inactivo (Con Validación)
 */
const eliminarCronograma = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        
        // Obtenemos el nombre antes de intentar borrar (para el log)
        const check = await pool.request().input('id', mssql.Int, id).query('SELECT NombreCronograma FROM Cronogramas WHERE ID_Cronograma = @id');
        if (check.recordset.length === 0) {
            return res.status(404).json({ msg: 'Cronograma no encontrado' });
        }
        const nombreCronograma = check.recordset[0].NombreCronograma;

        // Intentamos eliminar
        await pool.request()
            .input('idCronograma', mssql.Int, id)
            .query('EXEC SP_DELETE_Cronograma @idCronograma');

        // Si no hubo error en el SP, guardamos el log
        await logAction(req.usuario.id, req.usuario.nombre, 'ELIMINAR_CRONOGRAMA', `Eliminó (archivó) el cronograma: '${nombreCronograma}' (ID: ${id})`);

        res.json({ msg: 'Cronograma eliminado exitosamente' });

    } catch (err) {
        // --- CORRECCIÓN AQUÍ ---
        // Si el error viene del SP (RAISERROR), lo enviamos al frontend
        if (err.message.includes('No se puede eliminar')) {
            return res.status(400).json({ msg: err.message });
        }
        
        console.error('Error en eliminarCronograma:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const crearActividad = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id: idCronograma } = req.params; 
    const { nombreActividad, fechaLimite, idUsuarioResponsable, descripcion } = req.body;

    try {
        const pool = await poolPromise;
        const fechaLimiteDate = new Date(fechaLimite);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); 
        if (fechaLimiteDate < hoy) {
            return res.status(400).json({ msg: 'La fecha límite no puede ser anterior a la fecha actual' });
        }
        const checkCronograma = await pool.request().input('idCronograma', mssql.Int, idCronograma).query('SELECT ID_Cronograma FROM dbo.Cronogramas WHERE ID_Cronograma = @idCronograma');
        if (checkCronograma.recordset.length === 0) {
            return res.status(404).json({ msg: 'Cronograma no encontrado' });
        }

        const result = await pool.request()
            .input('idCronograma', mssql.Int, idCronograma)
            .input('nombreActividad', mssql.NVarChar, nombreActividad)
            .input('descripcionActividad', mssql.NVarChar, descripcion || null)
            .input('idUsuarioResponsable', mssql.Int, idUsuarioResponsable)
            .input('fechaLimite', mssql.Date, fechaLimiteDate)
            .query('EXEC SP_CREATE_Actividad @idCronograma, @nombreActividad, @descripcionActividad, @idUsuarioResponsable, @fechaLimite');
        
        const nuevaActividadId = result.recordset[0].ID_Actividad;
        await logAction(req.usuario.id, req.usuario.nombre, 'CREAR_ACTIVIDAD', `Creó la actividad: '${nombreActividad}' (ID: ${nuevaActividadId})`);

        res.status(201).json({ msg: 'Actividad creada exitosamente', idActividad: nuevaActividadId });
    } catch (err) {
        console.error('Error en crearActividad:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getActividadesPorCronograma = async (req, res) => {
    const { id: idCronograma } = req.params; 
    try {
        const pool = await poolPromise;
        const checkCronograma = await pool.request().input('idCronograma', mssql.Int, idCronograma).query('SELECT ID_Cronograma FROM dbo.Cronogramas WHERE ID_Cronograma = @idCronograma');
        if (checkCronograma.recordset.length === 0) {
            return res.status(404).json({ msg: 'Cronograma no encontrado' });
        }
        const result = await pool.request()
            .input('idCronograma', mssql.Int, idCronograma)
            .query('EXEC SP_GET_ActividadesPorCronograma @idCronograma'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getActividadesPorCronograma:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const scheduleController = {
    crearCronograma,
    getCronogramas,
    eliminarCronograma, 
    crearActividad,
    getActividadesPorCronograma
};

export default scheduleController;