// backend/controllers/pesvController.js

import { poolPromise, mssql } from '../config/dbConfig.js';
import { generarActaPDF } from '../utils/pdfGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- GESTIÓN DE ARCHIVOS ---
const descargarArchivo = (req, res) => {
    const { filename } = req.params;
    const rutaArchivo = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(rutaArchivo)) {
        res.download(rutaArchivo); 
    } else {
        res.status(404).send('Archivo no encontrado');
    }
};

const getDocumentosGenerados = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_DocumentosInternos');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

// --- NUEVO: REEMPLAZAR EVIDENCIA ---
const reemplazarEvidencia = async (req, res) => {
    const { idEvidencia } = req.body;
    const nuevoArchivo = req.file;

    if (!nuevoArchivo) return res.status(400).json({ msg: 'No se subió archivo' });

    try {
        const nombreArchivo = nuevoArchivo.originalname;
        const rutaArchivo = nuevoArchivo.path.replace(/\\/g, '/'); // Normalizar ruta

        const pool = await poolPromise;
        await pool.request()
            .input('idEvidencia', mssql.Int, idEvidencia)
            .input('nombreArchivo', mssql.NVarChar, nombreArchivo)
            .input('rutaArchivo', mssql.NVarChar, rutaArchivo)
            .query('EXEC SP_UPDATE_Evidencia_Archivo @idEvidencia, @nombreArchivo, @rutaArchivo');

        res.json({ msg: 'Evidencia actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error reemplazando evidencia');
    }
};

// --- CONDUCTORES ---
const getConductoresPESV = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_ConductoresPESV');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const guardarInfoConductor = async (req, res) => {
    const { idUsuario, numeroLicencia, categoria, vencimiento } = req.body;
    const archivoLicencia = req.file ? req.file.path.replace(/\\/g, '/') : null;
    try {
        const pool = await poolPromise;
        await pool.request().input('idUsuario', mssql.Int, idUsuario).input('numeroLicencia', mssql.NVarChar, numeroLicencia).input('categoria', mssql.NVarChar, categoria).input('vencimiento', mssql.Date, vencimiento).input('rutaLicencia', mssql.NVarChar, archivoLicencia).query('EXEC SP_SAVE_InfoConductor @idUsuario, @numeroLicencia, @categoria, @vencimiento, @rutaLicencia');
        res.json({ msg: 'Guardado' });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

// --- MANTENIMIENTOS ---
const crearMantenimiento = async (req, res) => {
    const { idActivo, tipo, fecha, kilometraje, descripcion, taller, costo } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request().input('idActivo', mssql.Int, idActivo).input('tipo', mssql.NVarChar, tipo).input('fecha', mssql.Date, fecha).input('kilometraje', mssql.Int, kilometraje).input('descripcion', mssql.NVarChar, descripcion).input('taller', mssql.NVarChar, taller).input('costo', mssql.Decimal(18, 2), costo).query('EXEC SP_CREATE_Mantenimiento @idActivo, @tipo, @fecha, @kilometraje, @descripcion, @taller, @costo');
        res.json({ msg: 'Registrado' });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const getMantenimientos = async (req, res) => {
    const { idActivo } = req.query; 
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('idActivo', mssql.Int, idActivo || null).query('EXEC SP_GET_Mantenimientos @idActivo');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

// --- PASOS PESV ---
const getPasosPESV = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_PasosPESV');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const getEvidenciasPorPaso = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('idPaso', mssql.Int, id).query('EXEC SP_GET_Evidencias_Por_Paso @idPaso');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const actualizarPasoPESV = async (req, res) => {
    const { idPaso, estado } = req.body;
    const archivoEvidencia = req.file; 
    try {
        const pool = await poolPromise;
        const request = pool.request().input('idPaso', mssql.Int, idPaso).input('estado', mssql.NVarChar, estado);
        if (archivoEvidencia) {
            request.input('nombreArchivo', mssql.NVarChar, archivoEvidencia.originalname);
            request.input('rutaArchivo', mssql.NVarChar, archivoEvidencia.path.replace(/\\/g, '/'));
        } else {
            request.input('nombreArchivo', mssql.NVarChar, null);
            request.input('rutaArchivo', mssql.NVarChar, null);
        }
        await request.query('EXEC SP_UPDATE_PasoPESV @idPaso, @estado, @nombreArchivo, @rutaArchivo');
        res.json({ msg: 'Actualizado' });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

// --- GENERACIÓN ---
const guardarConfiguracionPlantilla = async (req, res) => {
    const { idPaso, titulo, cuerpo, campos } = req.body; 
    try {
        const pool = await poolPromise;
        const jsonCampos = JSON.stringify(campos);
        await pool.request().input('idPaso', mssql.Int, idPaso).input('titulo', mssql.NVarChar, titulo).input('cuerpo', mssql.NVarChar, cuerpo).input('jsonCampos', mssql.NVarChar(mssql.MAX), jsonCampos).query('EXEC SP_SAVE_PlantillaPESV @idPaso, @titulo, @cuerpo, @jsonCampos');
        res.json({ msg: 'Guardado' });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const getPlantillaPaso = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('idPaso', mssql.Int, id).query('EXEC SP_GET_PlantillaPaso @idPaso');
        if (result.recordsets[0].length === 0) return res.json({ existe: false });
        res.json({ existe: true, config: result.recordsets[0][0], campos: result.recordsets[1] });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const generarDocumentoPaso = async (req, res) => {
    const { idPaso, datosFormulario } = req.body; 
    try {
        const pool = await poolPromise;
        const resultConfig = await pool.request().input('idPaso', mssql.Int, idPaso).query('EXEC SP_GET_PlantillaPaso @idPaso');
        if (resultConfig.recordsets[0].length === 0) return res.status(400).json({ msg: 'No hay plantilla' });

        const configBD = resultConfig.recordsets[0][0];
        const camposBD = resultConfig.recordsets[1];
        const camposLlenos = camposBD.map(c => ({ label: c.Etiqueta, valor: datosFormulario[c.Etiqueta] || '---' }));

        const nombreArchivo = `Generado_Paso${idPaso}_${Date.now()}.pdf`;
        const rutaAbsoluta = path.join(__dirname, '../uploads', nombreArchivo);
        const rutaRelativa = `uploads/${nombreArchivo}`;

        await generarActaPDF({ titulo: configBD.TituloDocumento, cuerpo: configBD.CuerpoInicial, camposLlenos: camposLlenos }, null, rutaAbsoluta);

        await pool.request()
            .input('idPaso', mssql.Int, idPaso).input('estado', mssql.NVarChar, 'Realizado')
            .input('nombreArchivo', mssql.NVarChar, nombreArchivo).input('rutaArchivo', mssql.NVarChar, rutaRelativa)
            .query('EXEC SP_UPDATE_PasoPESV @idPaso, @estado, @nombreArchivo, @rutaArchivo');

        res.json({ msg: 'Generado', filename: nombreArchivo, ruta: rutaRelativa });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

// --- CRUD PASOS ---
const crearPaso = async (req, res) => {
    const { numeroPaso, nombrePaso, descripcionNorma } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request().input('numeroPaso', mssql.Int, numeroPaso).input('nombrePaso', mssql.NVarChar, nombrePaso).input('descripcionNorma', mssql.NVarChar, descripcionNorma).query('EXEC SP_CREATE_PasoPESV @numeroPaso, @nombrePaso, @descripcionNorma');
        res.json({ msg: 'Creado' });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const editarPasoInfo = async (req, res) => {
    const { idPaso, numeroPaso, nombrePaso, descripcionNorma } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request().input('idPaso', mssql.Int, idPaso).input('numeroPaso', mssql.Int, numeroPaso).input('nombrePaso', mssql.NVarChar, nombrePaso).input('descripcionNorma', mssql.NVarChar, descripcionNorma).query('EXEC SP_UPDATE_PasoPESV_Info @idPaso, @numeroPaso, @nombrePaso, @descripcionNorma');
        res.json({ msg: 'Actualizado' });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

const eliminarPaso = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('idPaso', mssql.Int, id).query('EXEC SP_DELETE_PasoPESV @idPaso');
        res.json({ msg: 'Eliminado' });
    } catch (err) { console.error(err); res.status(500).send('Error'); }
};

export default {
    getConductoresPESV,
    guardarInfoConductor,
    crearMantenimiento, 
    getMantenimientos,
    getPasosPESV, 
    getEvidenciasPorPaso, 
    actualizarPasoPESV,
    guardarConfiguracionPlantilla, 
    getPlantillaPaso,
    generarDocumentoPaso,
    crearPaso, 
    editarPasoInfo, 
    eliminarPaso,
    descargarArchivo, 
    getDocumentosGenerados,
    reemplazarEvidencia // <--- Exportar
};