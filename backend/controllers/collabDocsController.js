// backend/controllers/collabDocsController.js

import { poolPromise, mssql } from '../config/dbConfig.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SUBIR DOCUMENTO ---
const subirDocumento = async (req, res) => {
    const { cedula, nombreColaborador, tipoDocumento } = req.body;
    const archivo = req.file;
    const idUsuarioSubio = req.usuario.id;

    if (!archivo) return res.status(400).json({ msg: 'No se adjuntó ningún archivo' });

    try {
        // Guardamos la ruta relativa
        const rutaFinal = archivo.path.replace(/\\/g, '/');

        const pool = await poolPromise;
        await pool.request()
            .input('cedula', mssql.NVarChar, cedula)
            .input('nombreColaborador', mssql.NVarChar, nombreColaborador)
            .input('tipoDoc', mssql.NVarChar, tipoDocumento)
            .input('nombreArchivo', mssql.NVarChar, archivo.originalname)
            .input('rutaArchivo', mssql.NVarChar, rutaFinal)
            .input('idUsuarioSubio', mssql.Int, idUsuarioSubio)
            .query('EXEC SP_CREATE_DocColaborador @cedula, @nombreColaborador, @tipoDoc, @nombreArchivo, @rutaArchivo, @idUsuarioSubio');

        res.status(201).json({ msg: 'Documento adjuntado exitosamente' });

    } catch (err) {
        console.error('Error subiendo doc:', err);
        res.status(500).send('Error del servidor');
    }
};

// --- LISTAR DOCUMENTOS DE UNA CÉDULA ---
const getDocumentosPorCedula = async (req, res) => {
    const { cedula } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('cedula', mssql.NVarChar, cedula)
            .query('EXEC SP_GET_DocsPorCedula @cedula');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error listando docs:', err);
        res.status(500).send('Error del servidor');
    }
};

// --- DESCARGAR DOCUMENTO ---
const descargarDocumento = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', mssql.Int, id)
            .query('SELECT RutaArchivo, NombreArchivo FROM DocumentosColaboradores WHERE ID_Documento = @id');

        if (result.recordset.length === 0) return res.status(404).json({ msg: 'Documento no encontrado en BD' });

        const { RutaArchivo, NombreArchivo } = result.recordset[0];
        
        // Ajuste de ruta: quitamos 'backend/' si la BD lo guardó así, para usar path.resolve correctamente
        let rutaLimpia = RutaArchivo;
        if (RutaArchivo.startsWith('backend/')) rutaLimpia = RutaArchivo.replace('backend/', '');
        if (RutaArchivo.startsWith('backend\\')) rutaLimpia = RutaArchivo.replace('backend\\', '');

        const filePath = path.resolve(__dirname, '..', rutaLimpia);

        if (fs.existsSync(filePath)) {
            res.download(filePath, NombreArchivo);
        } else {
            res.status(404).json({ msg: 'El archivo físico no existe en el servidor.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al descargar');
    }
};

// --- ELIMINAR DOCUMENTO ---
const eliminarDocumento = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        // 1. Obtener ruta para borrar físico
        const result = await pool.request()
            .input('id', mssql.Int, id)
            .query('SELECT RutaArchivo FROM DocumentosColaboradores WHERE ID_Documento = @id');

        if (result.recordset.length > 0) {
            const ruta = result.recordset[0].RutaArchivo;
            let rutaLimpia = ruta.startsWith('backend') ? ruta.replace('backend/', '') : ruta;
            const filePath = path.resolve(__dirname, '..', rutaLimpia);

            // Borrar archivo físico (si existe)
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { console.warn('No se pudo borrar archivo físico:', e); }
        }

        // 2. Borrar registro BD
        await pool.request().input('idDocumento', mssql.Int, id).query('EXEC SP_DELETE_DocColaborador @idDocumento');

        res.json({ msg: 'Documento eliminado' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar');
    }
};

const verDocumento = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', mssql.Int, id)
            .query('SELECT RutaArchivo, NombreArchivo FROM DocumentosColaboradores WHERE ID_Documento = @id');

        if (result.recordset.length === 0) return res.status(404).json({ msg: 'Documento no encontrado' });

        const { RutaArchivo } = result.recordset[0];
        
        let rutaLimpia = RutaArchivo;
        if (RutaArchivo.startsWith('backend/')) rutaLimpia = RutaArchivo.replace('backend/', '');
        if (RutaArchivo.startsWith('backend\\')) rutaLimpia = RutaArchivo.replace('backend\\', '');

        const filePath = path.resolve(__dirname, '..', rutaLimpia);

        if (fs.existsSync(filePath)) {
            // "inline" le dice al navegador: "Intenta mostrarlo aquí mismo"
            res.setHeader('Content-Disposition', 'inline'); 
            res.sendFile(filePath);
        } else {
            res.status(404).json({ msg: 'El archivo físico no existe.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al visualizar');
    }
};
export default { subirDocumento, getDocumentosPorCedula, descargarDocumento, eliminarDocumento, verDocumento };