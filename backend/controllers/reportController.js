// backend/src/controllers/reportController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import path from 'path'; 
import { fileURLToPath } from 'url';
import { logAction } from '../services/logService.js';
import { crearNotificacion } from '../services/notificationService.js'; // Servicio de Notificaciones

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const crearReporteMaquina = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { idActivo, estadoReportado, descripcionProblema, datosReporte, kilometraje } = req.body;
    const idUsuarioReporta = req.usuario.id;
    const archivoFoto = req.file ? req.file.path : null;

    try {
        const pool = await poolPromise;
        
        // 1. Guardar Reporte
        await pool.request()
            .input('idActivo', mssql.Int, idActivo)
            .input('idUsuarioReporta', mssql.Int, idUsuarioReporta)
            .input('estadoReportado', mssql.NVarChar, estadoReportado)
            .input('descripcionProblema', mssql.NVarChar, descripcionProblema || null)
            .input('rutaFotoAdjunta', mssql.NVarChar, archivoFoto)
            .input('datosReporte', mssql.NVarChar(mssql.MAX), datosReporte || null) 
            .input('kilometraje', mssql.Int, kilometraje || null)
            .query('EXEC SP_CREATE_ReporteMaquina @idActivo, @idUsuarioReporta, @estadoReportado, @descripcionProblema, @rutaFotoAdjunta, @datosReporte, @kilometraje');

        // 2. Obtener nombre del activo para la notificación (Consulta rápida)
        const activoResult = await pool.request().input('id', mssql.Int, idActivo).query('SELECT NombreDescriptivo FROM ActivosInspeccionables WHERE ID_Activo = @id');
        const nombreEquipo = activoResult.recordset[0]?.NombreDescriptivo || 'Equipo';

        // --- NOTIFICACIÓN: REPORTE DE MÁQUINA ---
        if (estadoReportado === 'Con Problema') {
            await crearNotificacion({
                rolDestino: 'Administrador SST', // También podrías enviar a 'Mantenimiento' si existiera el rol
                titulo: `🔴 Falla Reportada: ${nombreEquipo}`,
                mensaje: `El equipo ${nombreEquipo} reporta fallas. Revisar urgente. Reportado por: ${req.usuario.nombre}`,
                ruta: '/reportes'
            });
        }
        // ----------------------------------------

        res.status(201).json({ msg: 'Reporte enviado exitosamente' });
    } catch (err) {
        if (err.message.includes('Se debe describir el problema')) {
            return res.status(400).json({ msg: 'Debe describir el problema si el estado es "Con Problema"' });
        }
        console.error('Error en crearReporteMaquina:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const crearReporteSeguridad = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tipoReporte, ubicacionArea, descripcion } = req.body;
    const idUsuarioReporta = req.usuario.id;
    const archivoFoto = req.file ? req.file.path : null;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idUsuarioReporta', mssql.Int, idUsuarioReporta)
            .input('tipoReporte', mssql.NVarChar, tipoReporte)
            .input('ubicacionArea', mssql.NVarChar, ubicacionArea)
            .input('descripcion', mssql.NVarChar, descripcion)
            .input('rutaFotoAdjunta', mssql.NVarChar, archivoFoto) 
            .query('EXEC SP_CREATE_ReporteSeguridad @idUsuarioReporta, @tipoReporte, @ubicacionArea, @descripcion, @rutaFotoAdjunta');

        // --- NOTIFICACIÓN: REPORTE SEGURIDAD ---
        // Se notifica a SST y Super Admin
        const mensajeAlerta = `⚠️ Nuevo reporte de seguridad en ${ubicacionArea}. Tipo: ${tipoReporte}.`;
        
        await crearNotificacion({
            rolDestino: 'Administrador SST',
            titulo: `Reporte de ${tipoReporte}`,
            mensaje: mensajeAlerta,
            ruta: '/reportes'
        });

        await crearNotificacion({
            rolDestino: 'Super Admin',
            titulo: `Alerta SST: ${tipoReporte}`,
            mensaje: mensajeAlerta,
            ruta: '/reportes'
        });
        // ---------------------------------------

        res.status(201).json({ msg: 'Reporte de seguridad enviado exitosamente' });
    } catch (err) {
        console.error('Error en crearReporteSeguridad:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getReportesMaquina = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_ReportesMaquina');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getReportesMaquina:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getReportesSeguridad = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_ReportesSeguridad');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getReportesSeguridad:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getReporteMaquinaDetalle = async (req, res) => {
    const { id: idReporte } = req.params;
    const esAdmin = ['Administrador SST', 'Super Admin', 'Gestion de Calidad'].includes(req.usuario.rol);
    const marcarRevisado = esAdmin ? 1 : 0;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idReporteMaquina', mssql.Int, idReporte)
            .input('marcarRevisado', mssql.Bit, marcarRevisado)
            .query('EXEC SP_GET_ReporteMaquinaDetalle @idReporteMaquina, @marcarRevisado');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Reporte de máquina no encontrado' });
        }

        if (esAdmin && result.recordset[0].EstadoRevision === 'Revisado') {
             await logAction(req.usuario.id, req.usuario.nombre, 'REVISAR_REPORTE_MAQUINA', `Revisó el reporte de máquina ID: ${idReporte}`);
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getReporteMaquinaDetalle:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getReporteSeguridadDetalle = async (req, res) => {
    const { id: idReporte } = req.params;
    const esAdmin = ['Administrador SST', 'Super Admin', 'Gestion de Calidad'].includes(req.usuario.rol);
    const marcarRevisado = esAdmin ? 1 : 0;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idReporteSeguridad', mssql.Int, idReporte)
            .input('marcarRevisado', mssql.Bit, marcarRevisado)
            .query('EXEC SP_GET_ReporteSeguridadDetalle @idReporteSeguridad, @marcarRevisado');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Reporte de seguridad no encontrado' });
        }

        if (esAdmin && result.recordset[0].EstadoRevision === 'Revisado') {
            await logAction(req.usuario.id, req.usuario.nombre, 'REVISAR_REPORTE_SEGURIDAD', `Revisó el reporte de seguridad ID: ${idReporte}`);
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getReporteSeguridadDetalle:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getMisReportesMaquina = async (req, res) => {
    const idUsuario = req.usuario.id;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('idUsuario', mssql.Int, idUsuario).query('EXEC SP_GET_MisReportesMaquina @idUsuario');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getMisReportesMaquina:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getMisReportesSeguridad = async (req, res) => {
    const idUsuario = req.usuario.id;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('idUsuario', mssql.Int, idUsuario).query('EXEC SP_GET_MisReportesSeguridad @idUsuario');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getMisReportesSeguridad:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const reportController = {
    crearReporteMaquina,
    crearReporteSeguridad,
    getReportesMaquina,
    getReportesSeguridad,
    getReporteMaquinaDetalle,
    getReporteSeguridadDetalle,
    getMisReportesMaquina,
    getMisReportesSeguridad
};

export default reportController;