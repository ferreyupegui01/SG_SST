// backend/src/controllers/assetController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';

const getActivosPorTipo = async (req, res) => {
    const { tipo } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tipoActivo', mssql.NVarChar, tipo)
            .query('EXEC SP_GET_ActivosPorTipo @tipoActivo');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getActivosPorTipo:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getActivosTodos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_Activos_Todos');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getActivosTodos:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const crearActivo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Extraemos todos los campos
    const { 
        tipoActivo, codigoIdentificador, nombreDescriptivo, ubicacion,
        marca, modelo, soatVencimiento, tecnoVencimiento, kilometrajeInicial, idConductor
    } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tipoActivo', mssql.NVarChar, tipoActivo)
            .input('codigoIdentificador', mssql.NVarChar, codigoIdentificador)
            .input('nombreDescriptivo', mssql.NVarChar, nombreDescriptivo)
            .input('ubicacion', mssql.NVarChar, ubicacion || null)
            .input('marca', mssql.NVarChar, marca || null)
            .input('modelo', mssql.NVarChar, modelo || null)
            .input('soatVencimiento', mssql.Date, soatVencimiento || null)
            .input('tecnoVencimiento', mssql.Date, tecnoVencimiento || null)
            .input('kilometrajeInicial', mssql.Int, kilometrajeInicial || 0)
            .input('idConductor', mssql.Int, idConductor || null)
            .query('EXEC SP_CREATE_Activo @tipoActivo, @codigoIdentificador, @nombreDescriptivo, @ubicacion, @marca, @modelo, @soatVencimiento, @tecnoVencimiento, @kilometrajeInicial, @idConductor');

        res.status(201).json({ msg: 'Activo creado exitosamente' });
    } catch (err) {
        if (err.message.includes('Ya existe un activo')) return res.status(400).json({ msg: err.message });
        console.error('Error en crearActivo:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const actualizarActivo = async (req, res) => {
    const { id } = req.params;
    const { 
        tipoActivo, codigoIdentificador, nombreDescriptivo, ubicacion,
        marca, modelo, soatVencimiento, tecnoVencimiento, idConductor
    } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idActivo', mssql.Int, id)
            .input('tipoActivo', mssql.NVarChar, tipoActivo)
            .input('codigoIdentificador', mssql.NVarChar, codigoIdentificador)
            .input('nombreDescriptivo', mssql.NVarChar, nombreDescriptivo)
            .input('ubicacion', mssql.NVarChar, ubicacion || null)
            .input('marca', mssql.NVarChar, marca || null)
            .input('modelo', mssql.NVarChar, modelo || null)
            .input('soatVencimiento', mssql.Date, soatVencimiento || null)
            .input('tecnoVencimiento', mssql.Date, tecnoVencimiento || null)
            .input('idConductor', mssql.Int, idConductor || null)
            .query('EXEC SP_UPDATE_Activo @idActivo, @tipoActivo, @codigoIdentificador, @nombreDescriptivo, @ubicacion, @marca, @modelo, @soatVencimiento, @tecnoVencimiento, @idConductor');

        res.json({ msg: 'Activo actualizado exitosamente' });
    } catch (err) {
        if (err.message.includes('Ya existe OTRO activo')) return res.status(400).json({ msg: err.message });
        console.error('Error en actualizarActivo:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const eliminarActivo = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('idActivo', mssql.Int, id).query('EXEC SP_DELETE_Activo @idActivo');
        res.json({ msg: 'Activo eliminado exitosamente' });
    } catch (err) {
        if (err.message.includes('referenciado') || err.message.includes('No se puede inactivar')) {
             return res.status(400).json({ msg: err.message });
        }
        console.error('Error en eliminarActivo:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getTiposDisponibles = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_TiposActivosDisponibles');
        
        // CAMBIO CLAVE: Devolvemos todo el recordset (objetos con Tipo y Categoría)
        // No hacemos .map() para que el frontend pueda leer la propiedad 'Categoria'
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getTiposDisponibles:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const assetController = {
    getActivosPorTipo,
    getActivosTodos,
    crearActivo,
    actualizarActivo,
    eliminarActivo,
    getTiposDisponibles
};

export default assetController;