// backend/src/controllers/activityController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import path from 'path'; 
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; 
import { logAction } from '../services/logService.js'; // Importar Log

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @controller  editarActividad
 * @desc        (CU-10) Edita los detalles de una actividad
 */
const editarActividad = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id: idActividad } = req.params; 
    const { nombreActividad, descripcionActividad, fechaLimite, idUsuarioResponsable } = req.body;

    try {
        const pool = await poolPromise;
        const checkActividad = await pool.request().input('idActividad', mssql.Int, idActividad).query('SELECT ID_Actividad FROM dbo.Actividades WHERE ID_Actividad = @idActividad');
        if (checkActividad.recordset.length === 0) {
            return res.status(404).json({ msg: 'Actividad no encontrada' });
        }
        
        await pool.request()
            .input('idActividad', mssql.Int, idActividad)
            .input('nombreActividad', mssql.NVarChar, nombreActividad)
            .input('descripcionActividad', mssql.NVarChar, descripcionActividad || null)
            .input('idUsuarioResponsable', mssql.Int, idUsuarioResponsable) 
            .input('fechaLimite', mssql.Date, new Date(fechaLimite))
            .query('EXEC SP_UPDATE_Actividad @idActividad, @nombreActividad, @descripcionActividad, @idUsuarioResponsable, @fechaLimite');
        
        await logAction(req.usuario.id, req.usuario.nombre, 'EDITAR_ACTIVIDAD', `Editó la actividad: '${nombreActividad}' (ID: ${idActividad})`);
        
        res.json({ msg: 'Actividad actualizada exitosamente' });
    } catch (err) {
        console.error('Error en editarActividad:', err.message);
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  eliminarActividad
 * @desc        (CU-11) Marca una actividad como Inactiva
 */
const eliminarActividad = async (req, res) => {
    const { id: idActividad } = req.params; 
    try {
        const pool = await poolPromise;
        const checkActividad = await pool.request().input('idActividad', mssql.Int, idActividad).query('SELECT NombreActividad FROM dbo.Actividades WHERE ID_Actividad = @idActividad');
        if (checkActividad.recordset.length === 0) {
            return res.status(404).json({ msg: 'Actividad no encontrada' });
        }
        const nombreActividad = checkActividad.recordset[0].NombreActividad;
        
        await pool.request()
            .input('idActividad', mssql.Int, idActividad)
            .query('EXEC SP_DELETE_Actividad @idActividad');
        
        await logAction(req.usuario.id, req.usuario.nombre, 'ELIMINAR_ACTIVIDAD', `Eliminó la actividad: '${nombreActividad}' (ID: ${idActividad})`);
        
        res.json({ msg: 'Actividad eliminada (archivada) exitosamente' });
    } catch (err) {
        console.error('Error en eliminarActividad:', err.message);
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  gestionarActividad
 * @desc        (CU-01) Gestiona el estado y la evidencia de una actividad
 */
const gestionarActividad = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id: idActividad } = req.params; 
    const { estado, observaciones } = req.body; 
    const idUsuario = req.usuario.id; 
    const archivoEvidencia = req.file; 
    
    // Validación: Si marca como realizada, debe subir evidencia
    if (estado === 'Realizada' && !archivoEvidencia) {
        // Nota: Esto asume que es obligatorio subir evidencia CADA VEZ que se marca realizada.
        // Si quieres permitir marcarla si YA TIENE evidencia previa, la lógica sería más compleja.
        return res.status(400).json({ msg: 'Se requiere un archivo de evidencia para marcar la actividad como "Realizada"' });
    }
    
    try {
        const pool = await poolPromise;
        const checkActividad = await pool.request().input('idActividad', mssql.Int, idActividad).query('SELECT ID_Actividad FROM dbo.Actividades WHERE ID_Actividad = @idActividad');
        if (checkActividad.recordset.length === 0) {
            return res.status(404).json({ msg: 'Actividad no encontrada' });
        }
        
        // 1. Actualizar Estado y Observaciones
        await pool.request()
            .input('idActividad', mssql.Int, idActividad)
            .input('estado', mssql.NVarChar, estado)
            .input('observaciones', mssql.NVarChar, observaciones || null) 
            .query('EXEC SP_UPDATE_ActividadEstado @idActividad, @estado, @observaciones');
        
        let logDescripcion = `Gestionó la actividad (ID: ${idActividad}), nuevo estado: ${estado}.`;

        // 2. Insertar Evidencia (si existe archivo)
        if (archivoEvidencia) {
            const nombreArchivo = archivoEvidencia.filename;
            const rutaArchivo = archivoEvidencia.path;
            const tipoArchivo = archivoEvidencia.mimetype; // Esto envía "application/pdf", etc.
            
            await pool.request()
                .input('idActividad', mssql.Int, idActividad)
                .input('nombreArchivo', mssql.NVarChar, nombreArchivo)
                .input('rutaArchivo', mssql.NVarChar, rutaArchivo)
                .input('tipoArchivo', mssql.NVarChar, tipoArchivo)
                .input('idUsuarioSubio', mssql.Int, idUsuario)
                .query('EXEC SP_CREATE_EvidenciaActividad @idActividad, @nombreArchivo, @rutaArchivo, @tipoArchivo, @idUsuarioSubio');
            
            logDescripcion += ` Se adjuntó evidencia.`;
        }
        
        await logAction(req.usuario.id, req.usuario.nombre, 'GESTIONAR_ACTIVIDAD', logDescripcion);
        
        res.json({ msg: 'Actividad gestionada exitosamente' });

    } catch (err) {
        console.error('Error en gestionarActividad:', err.message);
        
        // Atrapa el error de la BD si todavía hay problemas de constraints
        if (err.message.includes('conflicted with the CHECK constraint')) {
            return res.status(500).send('Error de BD: Restricción de tipo de archivo no actualizada. Ejecute el script SQL.');
        }
        
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  getEvidenciasActividad
 * @desc        Obtiene las evidencias de una actividad
 */
const getEvidenciasActividad = async (req, res) => {
    const { id: idActividad } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idActividad', mssql.Int, idActividad)
            .query('EXEC SP_GET_EvidenciasPorActividad @idActividad');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getEvidenciasActividad:', err.message);
        res.status(500).send('Error del servidor');
    }
};

/**
 * @controller  getActividadDetalle
 * @desc        (NUEVO) Obtiene el detalle completo de una actividad por ID
 */
const getActividadDetalle = async (req, res) => {
    const { id: idActividad } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idActividad', mssql.Int, idActividad)
            .query('EXEC SP_GET_ActividadDetalle @idActividad');

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Actividad no encontrada' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getActividadDetalle:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const activityController = {
    editarActividad,
    eliminarActividad,
    gestionarActividad,
    getEvidenciasActividad,
    getActividadDetalle
};

export default activityController;