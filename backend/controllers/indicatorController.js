// backend/src/controllers/indicatorController.js

import { poolPromise, mssql } from '../config/dbConfig.js';

const guardarIndicador = async (req, res) => {
    const { 
        nombreIndicador, mes, anio, 
        constante, meta, analisis,
        resultadoCalculado 
    } = req.body;
    
    try {
        const valConstante = parseInt(constante) || 100;
        const valMeta = parseFloat(meta) || 0;
        const valResultado = (resultadoCalculado !== undefined && resultadoCalculado !== null) ? parseFloat(resultadoCalculado) : 0;

        const pool = await poolPromise;
        
        await pool.request()
            .input('nombreIndicador', mssql.NVarChar, nombreIndicador)
            .input('mes', mssql.Int, parseInt(mes))
            .input('anio', mssql.Int, parseInt(anio))
            .input('constante', mssql.Int, valConstante)
            .input('meta', mssql.Decimal(18, 2), valMeta)
            .input('analisis', mssql.NVarChar, analisis || '')
            .input('resultadoManual', mssql.Decimal(18, 4), valResultado)
            .input('numerador', mssql.Decimal(18, 2), 0)
            .input('denominador', mssql.Decimal(18, 2), 1)
            .query('EXEC SP_SAVE_Indicador @nombreIndicador, @mes, @anio, @constante, @meta, @analisis, @resultadoManual, @numerador, @denominador');

        res.json({ msg: 'Indicador guardado exitosamente' });

    } catch (err) {
        console.error('Error en guardarIndicador:', err.message);
        
        // Si el error viene del SP (RAISERROR), lo enviamos como 400 Bad Request
        if (err.message.includes('Ya existe un registro ACTIVO')) {
            return res.status(400).json({ msg: err.message });
        }

        res.status(500).send('Error del servidor: ' + err.message);
    }
};

const getIndicadoresAnuales = async (req, res) => {
    const { anio } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('anio', mssql.Int, anio).query('EXEC SP_GET_IndicadoresAnuales @anio');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

const getConfiguraciones = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_ConfigIndicadores');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error obteniendo configuraciones');
    }
};

const crearConfiguracion = async (req, res) => {
    const { nombre, tipo, constante, meta, frecuencia, grafica, operador, formula, variables } = req.body;
    try {
        const pool = await poolPromise;
        const jsonVariables = variables ? JSON.stringify(variables) : null;

        await pool.request()
            .input('NombreIndicador', mssql.NVarChar, nombre)
            .input('Tipo', mssql.NVarChar, tipo)
            .input('Constante', mssql.Int, constante)
            .input('MetaDefault', mssql.Decimal(10,2), meta)
            .input('Frecuencia', mssql.NVarChar, frecuencia || 'Mensual')
            .input('TipoGrafica', mssql.NVarChar, grafica || 'Bar')
            .input('OperadorMeta', mssql.NVarChar, operador || '>=')
            .input('FormulaCalculo', mssql.NVarChar, formula || null)
            .input('VariablesJSON', mssql.NVarChar(mssql.MAX), jsonVariables)
            .query('EXEC SP_CREATE_ConfigIndicador @NombreIndicador, @Tipo, @Constante, @MetaDefault, @Frecuencia, @TipoGrafica, @OperadorMeta, @FormulaCalculo, @VariablesJSON');
        
        res.json({ msg: 'Indicador configurado correctamente' });
    } catch (err) {
        console.error(err);
        if(err.message.includes('UNIQUE')) return res.status(400).json({msg: 'Ya existe un indicador con ese nombre'});
        res.status(500).send('Error creando configuración');
    }
};

const editarConfiguracion = async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo, constante, meta, frecuencia, grafica, operador, formula, variables } = req.body;
    try {
        const valConstante = (constante === '' || constante === undefined || constante === null) ? 100 : parseInt(constante);
        const valMeta = (meta === '' || meta === undefined || meta === null) ? 0 : parseFloat(meta);

        const pool = await poolPromise;
        const jsonVariables = variables ? JSON.stringify(variables) : null;

        await pool.request()
            .input('ID_Config', mssql.Int, id)
            .input('NombreIndicador', mssql.NVarChar, nombre)
            .input('Tipo', mssql.NVarChar, tipo)
            .input('Constante', mssql.Int, valConstante)
            .input('MetaDefault', mssql.Decimal(10,2), valMeta)
            .input('Frecuencia', mssql.NVarChar, frecuencia || 'Mensual') 
            .input('TipoGrafica', mssql.NVarChar, grafica || 'Bar')
            .input('OperadorMeta', mssql.NVarChar, operador || '>=')
            .input('FormulaCalculo', mssql.NVarChar, formula || null)
            .input('VariablesJSON', mssql.NVarChar(mssql.MAX), jsonVariables)
            .query('EXEC SP_UPDATE_ConfigIndicador @ID_Config, @NombreIndicador, @Tipo, @Constante, @MetaDefault, @Frecuencia, @TipoGrafica, @OperadorMeta, @FormulaCalculo, @VariablesJSON');
        
        res.json({ msg: 'Indicador actualizado correctamente' });
    } catch (err) {
        console.error("Error backend update:", err);
        res.status(500).send('Error actualizando configuración: ' + err.message);
    }
};

const eliminarConfiguracion = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('ID_Config', mssql.Int, id).query('EXEC SP_DELETE_ConfigIndicador @ID_Config');
        res.json({ msg: 'Indicador inactivado del sistema' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error eliminando configuración');
    }
};

const eliminarRegistro = async (req, res) => {
    const { id } = req.params; 
    try {
        const pool = await poolPromise;
        await pool.request().input('ID_Indicador', mssql.Int, id).query('EXEC SP_DELETE_IndicadorRegistro @ID_Indicador');
        res.json({ msg: 'Registro inactivado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error eliminando registro');
    }
};

const indicatorController = {
    guardarIndicador,
    getIndicadoresAnuales,
    getConfiguraciones,
    crearConfiguracion,
    editarConfiguracion,
    eliminarConfiguracion,
    eliminarRegistro
};

export default indicatorController;