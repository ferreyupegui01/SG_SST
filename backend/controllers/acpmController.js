// backend/src/controllers/acpmController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; 
import { logAction } from '../services/logService.js'; 
import { crearNotificacion } from '../services/notificationService.js'; // <--- IMPORTAR

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @controller  crearACPM
 * @desc        (CU-03) Crea una nueva ACPM y NOTIFICA al responsable
 */
const crearACPM = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {
        tipoAccion, origen, descripcionProblema, planAccion,
        idUsuarioResponsable, fechaLimite, idInspeccionOrigen,
        idReporteMaquinaOrigen, idReporteSeguridadOrigen, 
        analisisCausa
    } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tipoAccion', mssql.NVarChar, tipoAccion)
            .input('origen', mssql.NVarChar, origen)
            .input('descripcionProblema', mssql.NVarChar, descripcionProblema)
            .input('planAccion', mssql.NVarChar, planAccion)
            .input('idUsuarioResponsable', mssql.Int, idUsuarioResponsable)
            .input('fechaLimite', mssql.Date, fechaLimite)
            .input('idInspeccionOrigen', mssql.Int, idInspeccionOrigen || null)
            .input('idReporteMaquinaOrigen', mssql.Int, idReporteMaquinaOrigen || null)
            .input('idReporteSeguridadOrigen', mssql.Int, idReporteSeguridadOrigen || null)
            .input('analisisCausa', mssql.NVarChar, analisisCausa || null)
            .query('EXEC SP_CREATE_AccionACPM @tipoAccion, @origen, @descripcionProblema, @planAccion, @idUsuarioResponsable, @fechaLimite, @idInspeccionOrigen, @idReporteMaquinaOrigen, @idReporteSeguridadOrigen, @analisisCausa');
        
        const nuevaAcpmId = result.recordset[0].ID_ACPM;

        // --- LOG ---
        await logAction(
            req.usuario.id, 
            req.usuario.nombre, 
            'CREAR_ACPM', 
            `Creó la ACPM (ID: ${nuevaAcpmId}) con origen: '${origen}'`
        );

        // --- NOTIFICACIÓN AL RESPONSABLE ---
        await crearNotificacion({
            idUsuarioDestino: idUsuarioResponsable,
            titulo: '📋 Nueva Acción Asignada',
            mensaje: `Se te ha asignado una acción ${tipoAccion} (Origen: ${origen}). Fecha límite: ${fechaLimite}.`,
            ruta: '/acpm'
        });
        // -----------------------------------

        res.status(201).json({
            msg: 'Acción ACPM creada exitosamente',
            idACPM: nuevaAcpmId
        });
    } catch (err) {
        if (err.message.includes('La fecha límite')) {
            return res.status(400).json({ msg: 'La fecha límite no puede ser anterior a la fecha actual' });
        }
        console.error('Error en crearACPM:', err.message);
        res.status(500).json({ msg: 'Error del servidor al crear ACPM' }); 
    }
};

/**
 * @controller  getACPMs
 */
const getACPMs = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_AccionesACPM');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getACPMs:', err.message);
        res.status(500).json({ msg: 'Error del servidor al obtener ACPMs' }); 
    }
};

/**
 * @controller  getACPMDetalle
 */
const getACPMDetalle = async (req, res) => {
    const { id: idACPM } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idACPM', mssql.Int, idACPM)
            .query('EXEC SP_GET_ACPMDetalle @idACPM');
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Acción ACPM no encontrada' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getACPMDetalle:', err.message);
        res.status(500).json({ msg: 'Error del servidor al obtener detalle' }); 
    }
};

/**
 * @controller  gestionarACPM
 */
const gestionarACPM = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id: idACPM } = req.params; 
    const { estadoACPM, comentariosSeguimiento } = req.body; 
    const idUsuario = req.usuario.id; 
    const nombreUsuario = req.usuario.nombre; 
    const archivoEvidencia = req.file; 
    
    if (estadoACPM === 'Cerrada' && !archivoEvidencia) {
        return res.status(400).json({ msg: 'Se requiere un archivo de evidencia para cerrar la acción' });
    }
    
    try {
        const pool = await poolPromise;
        
        const checkACPM = await pool.request()
            .input('idACPM', mssql.Int, idACPM)
            .query('SELECT ID_ACPM FROM dbo.AccionesACPM WHERE ID_ACPM = @idACPM'); 
        
        if (checkACPM.recordset.length === 0) {
            return res.status(404).json({ msg: 'Acción ACPM no encontrada' });
        }

        let comentarioFormateado = '';
        if (comentariosSeguimiento && comentariosSeguimiento.trim() !== '') {
            const fecha = new Date().toISOString().split('T')[0];
            comentarioFormateado = `\n[${fecha} - ${nombreUsuario}]: ${comentariosSeguimiento}`;
        }

        await pool.request()
            .input('idACPM', mssql.Int, idACPM)
            .input('estadoACPM', mssql.NVarChar, estadoACPM)
            .input('comentarioAdicional', mssql.NVarChar, comentarioFormateado)
            .query('EXEC SP_UPDATE_ACPMGestionar @idACPM, @estadoACPM, @comentarioAdicional');

        let logDescripcion = `Gestionó la ACPM (ID: ${idACPM}), nuevo estado: ${estadoACPM}.`;

        if (archivoEvidencia) {
            const nombreArchivo = archivoEvidencia.filename;
            const rutaArchivo = archivoEvidencia.path;
            let tipoArchivo = path.extname(archivoEvidencia.originalname).replace('.', '').toLowerCase();
            if (tipoArchivo === 'jpeg') tipoArchivo = 'jpg';

            const esEvidenciaDeCierre = (estadoACPM === 'Cerrada'); 
            
            await pool.request()
                .input('idACPM', mssql.Int, idACPM)
                .input('nombreArchivo', mssql.NVarChar, nombreArchivo)
                .input('rutaArchivo', mssql.NVarChar, rutaArchivo)
                .input('tipoArchivo', mssql.NVarChar, tipoArchivo) 
                .input('idUsuarioSubio', mssql.Int, idUsuario)
                .input('esEvidenciaDeCierre', mssql.Bit, esEvidenciaDeCierre)
                .query('EXEC SP_CREATE_EvidenciaACPM @idACPM, @nombreArchivo, @rutaArchivo, @tipoArchivo, @idUsuarioSubio, @esEvidenciaDeCierre');
            
            logDescripcion += ` Se adjuntó evidencia: ${nombreArchivo}.`;
        }

        await logAction(req.usuario.id, req.usuario.nombre, 'GESTIONAR_ACPM', logDescripcion);

        res.json({ msg: 'Acción ACPM gestionada exitosamente' });

    } catch (err) {
        console.error('Error en gestionarACPM:', err.message);
        if (err.message.includes('Solo se permiten')) {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).json({ 
            msg: 'Error del servidor al gestionar la ACPM',
            error: err.message 
        });
    }
};

/**
 * @controller  getEvidenciasACPM
 */
const getEvidenciasACPM = async (req, res) => {
    const { id: idACPM } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idACPM', mssql.Int, idACPM)
            .query('EXEC SP_GET_EvidenciasPorACPM @idACPM');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getEvidenciasACPM:', err.message);
        res.status(500).json({ msg: 'Error del servidor al obtener evidencias' }); 
    }
};

const acpmController = {
    crearACPM,
    getACPMs,
    getACPMDetalle,
    gestionarACPM,
    getEvidenciasACPM
};

export default acpmController;