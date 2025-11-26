// backend/src/controllers/documentController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import path from 'path'; 
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; 
import mime from 'mime-types'; 
import { logAction } from '../services/logService.js'; // <-- 1. Importar

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getContenidoCarpeta = async (req, res) => {
    // (Lectura, no se loguea)
    const { id } = req.params; 
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idCarpeta', mssql.Int, id)
            .query('EXEC SP_GET_ContenidoCarpeta @idCarpeta');
        res.json({
            carpetas: result.recordsets[0] || [],
            archivos: result.recordsets[1] || []
        });
    } catch (err) {
        console.error('Error en getContenidoCarpeta:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const crearCarpeta = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { nombreCarpeta, idCarpetaPadre } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('nombreCarpeta', mssql.NVarChar, nombreCarpeta)
            .input('idCarpetaPadre', mssql.Int, idCarpetaPadre)
            .query('EXEC SP_CREATE_Carpeta @nombreCarpeta, @idCarpetaPadre');
        
        // --- 2. AÑADIR LOG ---
        await logAction(
            req.usuario.id, 
            req.usuario.nombre, 
            'CREAR_CARPETA_DMS', 
            `Creó la carpeta: '${nombreCarpeta}' (en ID Padre: ${idCarpetaPadre})`
        );
        // --- FIN DE LOG ---

        res.status(201).json({ msg: 'Carpeta creada exitosamente' });
    } catch (err) {
        if (err.message.includes('Ya existe una carpeta con ese nombre')) {
            return res.status(400).json({ msg: err.message });
        }
        console.error('Error en crearCarpeta:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const subirArchivos = async (req, res) => {
    const { idCarpeta } = req.body;
    const idUsuario = req.usuario.id;
    const files = req.files; 
    if (!idCarpeta) {
        return res.status(400).json({ msg: 'No se especificó la carpeta de destino.' });
    }
    if (!files || files.length === 0) {
        return res.status(400).json({ msg: 'No se seleccionaron archivos.' });
    }
    try {
        const pool = await poolPromise;
        let nombresDeArchivos = []; // Para el log
        
        for (const file of files) {
            const params = {
                idCarpeta: idCarpeta,
                idUsuarioSubio: idUsuario,
                nombreOriginal: file.originalname,
                nombreAlmacenado: file.filename,
                rutaArchivo: file.path,
                tipoArchivo: file.mimetype,
                tamanoArchivoKB: Math.round(file.size / 1024)
            };
            nombresDeArchivos.push(file.originalname); // Añadir al log
            await pool.request()
                .input('idCarpeta', mssql.Int, params.idCarpeta)
                .input('idUsuarioSubio', mssql.Int, params.idUsuarioSubio)
                .input('nombreOriginal', mssql.NVarChar, params.nombreOriginal)
                .input('nombreAlmacenado', mssql.NVarChar, params.nombreAlmacenado)
                .input('rutaArchivo', mssql.NVarChar, params.rutaArchivo)
                .input('tipoArchivo', mssql.NVarChar, params.tipoArchivo)
                .input('tamanoArchivoKB', mssql.Int, params.tamanoArchivoKB)
                .query('EXEC SP_CREATE_Documento @idCarpeta, @idUsuarioSubio, @nombreOriginal, @nombreAlmacenado, @rutaArchivo, @tipoArchivo, @tamanoArchivoKB');
        }
        
        // --- AÑADIR LOG ---
        await logAction(
            req.usuario.id, 
            req.usuario.nombre, 
            'SUBIR_DOCUMENTO_DMS', 
            `Subió ${files.length} archivo(s) a la carpeta ID ${idCarpeta}: ${nombresDeArchivos.join(', ')}`
        );
        // --- FIN DE LOG ---

        res.status(201).json({ msg: `${files.length} archivo(s) subidos exitosamente.` });
    } catch (err) {
        console.error('Error en subirArchivos:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const descargarDocumento = async (req, res) => {
    // (Lectura, no se loguea)
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idDocumento', mssql.Int, id)
            .query('EXEC SP_GET_DocumentoDetalle @idDocumento');
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Documento no encontrado' });
        }
        const doc = result.recordset[0];
        const rutaAbsoluta = path.resolve(__dirname, '..', doc.RutaArchivo);
        res.download(rutaAbsoluta, doc.NombreOriginal, (err) => {
            if (err) {
                console.error("Error al enviar el archivo:", err);
                res.status(404).send('Error: Archivo no encontrado en el servidor.');
            }
        });
    } catch (err) {
        console.error('Error en descargarDocumento:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const eliminarDocumento = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idDocumento', mssql.Int, id)
            .query('EXEC SP_GET_DocumentoDetalle @idDocumento');
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Documento no encontrado en la BD.' });
        }
        const doc = result.recordset[0];
        const rutaAbsoluta = path.resolve(__dirname, '..', doc.RutaArchivo);

        await pool.request()
            .input('idDocumento', mssql.Int, id)
            .query('EXEC SP_DELETE_Documento @idDocumento');
        
        try {
            await fs.unlink(rutaAbsoluta);
        } catch (fileErr) {
            console.warn(`Se eliminó el registro ${id}, pero el archivo físico no se encontró en: ${rutaAbsoluta}`);
        }
        
        // --- AÑADIR LOG ---
        await logAction(
            req.usuario.id, 
            req.usuario.nombre, 
            'ELIMINAR_DOCUMENTO_DMS', 
            `Eliminó el documento: '${doc.NombreOriginal}' (ID: ${id})`
        );
        // --- FIN DE LOG ---
        
        res.json({ msg: 'Documento eliminado exitosamente' });
    } catch (err) {
        console.error('Error en eliminarDocumento:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const eliminarCarpeta = async (req, res) => {
    const { id } = req.params;
    if (id === '1') {
        return res.status(400).json({ msg: 'No se puede eliminar la carpeta raíz.' });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idCarpeta', mssql.Int, id)
            .query('EXEC SP_DELETE_Carpeta @idCarpeta');
        
        // --- AÑADIR LOG ---
        await logAction(
            req.usuario.id, 
            req.usuario.nombre, 
            'ELIMINAR_CARPETA_DMS', 
            `Eliminó la carpeta (ID: ${id})`
        );
        // --- FIN DE LOG ---
        
        res.json({ msg: 'Carpeta eliminada exitosamente' });
    } catch (err) {
        if (err.message.includes('contiene subcarpetas') || err.message.includes('contiene archivos')) {
            return res.status(400).json({ msg: err.message });
        }
        console.error('Error en eliminarCarpeta:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const streamDocumento = async (req, res) => {
    // (Lectura, no se loguea)
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idDocumento', mssql.Int, id)
            .query('EXEC SP_GET_DocumentoDetalle @idDocumento');
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Documento no encontrado' });
        }
        const doc = result.recordset[0];
        const rutaAbsoluta = path.resolve(__dirname, '..', doc.RutaArchivo);
        const mimeType = doc.TipoArchivo || mime.lookup(rutaAbsoluta) || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${doc.NombreOriginal}"`);
        res.sendFile(rutaAbsoluta, (err) => {
            if (err) {
                console.error("Error al enviar el archivo:", err);
                res.status(404).send('Error: Archivo no encontrado en el servidor.');
            }
        });
    } catch (err) {
        console.error('Error en streamDocumento:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const documentController = {
    getContenidoCarpeta,
    crearCarpeta,
    subirArchivos,
    descargarDocumento,
    eliminarDocumento,
    eliminarCarpeta,
    streamDocumento 
};

export default documentController;