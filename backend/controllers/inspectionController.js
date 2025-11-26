// backend/src/controllers/inspectionController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import { logAction } from '../services/logService.js';

// --- CREAR INSPECCIÓN (Diligenciar) ---
const crearInspeccion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { idFormulario, idActivoInspeccionado, datosDiligenciados, observacionesGenerales, resultadoGeneral } = req.body;
    const idUsuarioRealizo = req.usuario.id;

    try {
        const pool = await poolPromise;
        let datosJsonString = typeof datosDiligenciados === 'object' ? JSON.stringify(datosDiligenciados) : datosDiligenciados;

        await pool.request()
            .input('idFormulario', mssql.NVarChar, idFormulario)
            .input('idActivoInspeccionado', mssql.Int, idActivoInspeccionado || null)
            .input('idUsuarioRealizo', mssql.Int, idUsuarioRealizo)
            .input('datosDiligenciados', mssql.NVarChar(mssql.MAX), datosJsonString)
            .input('observacionesGenerales', mssql.NVarChar(mssql.MAX), observacionesGenerales || null)
            .input('resultadoGeneral', mssql.NVarChar, resultadoGeneral)
            .query('EXEC SP_CREATE_Inspeccion @idFormulario, @idActivoInspeccionado, @idUsuarioRealizo, @datosDiligenciados, @observacionesGenerales, @resultadoGeneral');

        await logAction(req.usuario.id, req.usuario.nombre, 'DILIGENCIAR_INSPECCION', `Diligenció formulario '${idFormulario}'.`);
        res.status(201).json({ msg: 'Inspección registrada exitosamente' });
    } catch (err) {
        console.error('Error en crearInspeccion:', err.message);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- OBTENER HISTORIAL ---
const getInspeccionesHistorial = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_InspeccionesHistorial');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- OBTENER DETALLE (CORREGIDO: Validación de ID) ---
const getInspeccionDetalle = async (req, res) => {
    const { id } = req.params;

    // 1. Validar que sea un número antes de llamar a SQL
    const idNumerico = parseInt(id);
    if (isNaN(idNumerico)) {
        console.warn(`Intento de obtener detalle con ID inválido: ${id}`);
        return res.status(400).json({ msg: 'ID de inspección inválido' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idInspeccion', mssql.Int, idNumerico) // Usamos el valor validado
            .query('EXEC SP_GET_InspeccionDetalle @idInspeccion');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Inspección no encontrada' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getInspeccionDetalle:', err.message);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- CREAR NUEVO FORMULARIO (Estructura) ---
const crearNuevoFormulario = async (req, res) => {
    const { idFormulario, nombreFormulario, descripcion, tipoActivoAsociado, preguntas, categoria, visibleColaborador } = req.body;
    try {
        const pool = await poolPromise;
        const jsonPreguntas = JSON.stringify(preguntas);
        
        await pool.request()
            .input('idFormulario', mssql.NVarChar, idFormulario)
            .input('nombreFormulario', mssql.NVarChar, nombreFormulario)
            .input('descripcion', mssql.NVarChar, descripcion)
            .input('tipoActivoAsociado', mssql.NVarChar, tipoActivoAsociado)
            .input('jsonPreguntas', mssql.NVarChar(mssql.MAX), jsonPreguntas)
            .input('categoria', mssql.NVarChar, categoria || 'General')
            .input('visibleColaborador', mssql.Bit, visibleColaborador ? 1 : 0)
            .query('EXEC SP_CREATE_NuevoFormulario @idFormulario, @nombreFormulario, @descripcion, @tipoActivoAsociado, @jsonPreguntas, @categoria, @visibleColaborador');
        
        await logAction(req.usuario.id, req.usuario.nombre, 'CREAR_FORMULARIO', `Creó el formulario '${nombreFormulario}'`);
        res.status(201).json({ msg: 'Formulario creado exitosamente' });
    } catch (err) {
        console.error('Error en crearNuevoFormulario:', err.message);
        if (err.message.includes('El código del formulario ya existe')) return res.status(400).json({ msg: err.message });
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- OBTENER LISTA DE FORMULARIOS ---
const getFormularios = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Este SP ahora filtra por Estado = 'Activo'
        const result = await pool.request().query('EXEC SP_GET_Formularios');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- OBTENER PREGUNTAS ---
const getPreguntasFormulario = async (req, res) => {
    const { idFormulario } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idFormulario', mssql.NVarChar, idFormulario)
            .query('EXEC SP_GET_PreguntasPorFormulario @idFormulario');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- AGREGAR PREGUNTA ---
const agregarPregunta = async (req, res) => {
    const { id: idFormulario } = req.params;
    const { textoPregunta } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idFormulario', mssql.NVarChar, idFormulario)
            .input('textoPregunta', mssql.NVarChar, textoPregunta)
            .query('EXEC SP_ADD_Pregunta @idFormulario, @textoPregunta');
        res.status(201).json({ msg: 'Pregunta agregada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- ELIMINAR PREGUNTA ---
const eliminarPregunta = async (req, res) => {
    const { id: idPregunta } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idPregunta', mssql.Int, idPregunta)
            .query('EXEC SP_DELETE_Pregunta @idPregunta');
        res.json({ msg: 'Pregunta eliminada' });
    } catch (err) {
        if (err.message.includes('ya ha sido respondida')) return res.status(400).json({ msg: err.message });
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- CAMBIAR VISIBILIDAD ---
const toggleVisibilidad = async (req, res) => {
    const { id } = req.params;
    const { visible } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idFormulario', mssql.NVarChar, id)
            .input('visible', mssql.Bit, visible ? 1 : 0)
            .query('EXEC SP_UPDATE_Formulario_Visibilidad @idFormulario, @visible');
        res.json({ msg: 'Visibilidad actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- NUEVO: EDITAR FORMULARIO ---
const editarFormulario = async (req, res) => {
    const { id: idFormulario } = req.params;
    const { nombreFormulario, descripcion, tipoActivoAsociado, categoria, visibleColaborador } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idFormulario', mssql.NVarChar, idFormulario)
            .input('nombreFormulario', mssql.NVarChar, nombreFormulario)
            .input('descripcion', mssql.NVarChar, descripcion)
            .input('tipoActivoAsociado', mssql.NVarChar, tipoActivoAsociado)
            .input('categoria', mssql.NVarChar, categoria)
            .input('visibleColaborador', mssql.Bit, visibleColaborador ? 1 : 0)
            .query('EXEC SP_UPDATE_Formulario @idFormulario, @nombreFormulario, @descripcion, @tipoActivoAsociado, @categoria, @visibleColaborador');

        await logAction(req.usuario.id, req.usuario.nombre, 'EDITAR_FORMULARIO', `Editó el formulario '${nombreFormulario}'`);
        res.json({ msg: 'Formulario actualizado exitosamente' });
    } catch (err) {
        console.error('Error en editarFormulario:', err.message);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- NUEVO: ELIMINAR FORMULARIO ---
const eliminarFormulario = async (req, res) => {
    const { id: idFormulario } = req.params;
    try {
        const pool = await poolPromise;
        
        // Verificar existencia para el log
        const check = await pool.request().input('id', mssql.NVarChar, idFormulario).query("SELECT NombreFormulario FROM FormulariosInspeccion WHERE ID_Formulario = @id");
        const nombre = check.recordset[0]?.NombreFormulario || idFormulario;

        await pool.request()
            .input('idFormulario', mssql.NVarChar, idFormulario)
            .query('EXEC SP_DELETE_Formulario @idFormulario');

        await logAction(req.usuario.id, req.usuario.nombre, 'ELIMINAR_FORMULARIO', `Eliminó (inactivó) el formulario '${nombre}'`);
        res.json({ msg: 'Formulario eliminado exitosamente' });

    } catch (err) {
        if (err.message.includes('ya tiene inspecciones asociadas')) {
            return res.status(400).json({ msg: err.message });
        }
        console.error('Error en eliminarFormulario:', err.message);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// --- NUEVO: OBTENER TIPOS DE ACTIVOS ÚNICOS ---
const getTiposUnicos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_TiposActivosUnicos');
        const tipos = result.recordset.map(row => row.TipoActivo);
        res.json(tipos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

const inspectionController = {
    crearInspeccion,
    getInspeccionesHistorial,
    getInspeccionDetalle,
    crearNuevoFormulario,
    getFormularios,
    getPreguntasFormulario,
    agregarPregunta,
    eliminarPregunta,
    toggleVisibilidad,
    editarFormulario,
    eliminarFormulario,
    getTiposUnicos
};

export default inspectionController;