// backend/src/controllers/indicatorController.js

import { poolPromise, mssql } from '../config/dbConfig.js';

/**
 * @controller guardarIndicador
 * @desc Guarda un indicador asegurando tipos de datos numéricos
 */
const guardarIndicador = async (req, res) => {
    const { 
        nombreIndicador, mes, anio, 
        numerador, denominador, constante, meta, analisis 
    } = req.body;
    
    try {
        // 1. Sanitización (Convertir a números seguros)
        // Si viene vacío ('') o null, se convierte a 0
        const valNumerador = parseFloat(numerador) || 0;
        const valDenominador = parseFloat(denominador) || 1; // Evitar div/0
        const valConstante = parseInt(constante) || 100;
        const valMeta = parseFloat(meta) || 0;

        const pool = await poolPromise;
        
        await pool.request()
            .input('nombreIndicador', mssql.NVarChar, nombreIndicador)
            .input('mes', mssql.Int, parseInt(mes))
            .input('anio', mssql.Int, parseInt(anio))
            .input('numerador', mssql.Decimal(18, 2), valNumerador)
            .input('denominador', mssql.Decimal(18, 2), valDenominador)
            .input('constante', mssql.Int, valConstante)
            .input('meta', mssql.Decimal(18, 2), valMeta)
            .input('analisis', mssql.NVarChar, analisis || '')
            .query('EXEC SP_SAVE_Indicador @nombreIndicador, @mes, @anio, @numerador, @denominador, @constante, @meta, @analisis');

        res.json({ msg: 'Indicador guardado exitosamente' });

    } catch (err) {
        console.error('Error en guardarIndicador:', err.message);
        res.status(500).send('Error del servidor al guardar indicador: ' + err.message);
    }
};

const getIndicadoresAnuales = async (req, res) => {
    const { anio } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('anio', mssql.Int, anio)
            .query('EXEC SP_GET_IndicadoresAnuales @anio');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getIndicadoresAnuales:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const indicatorController = {
    guardarIndicador,
    getIndicadoresAnuales
};

export default indicatorController;