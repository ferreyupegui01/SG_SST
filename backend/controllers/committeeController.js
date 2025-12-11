// backend/controllers/committeeController.js

import { poolPromise, mssql } from '../config/dbConfig.js';
import { generarActaComitePDF } from '../utils/committeePdfGenerator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const crearActa = async (req, res) => {
    const {
        codigoDocumento, fechaEmision, fechaRevision, version, numeroActa, lugar, fechaReunion,
        horaInicio, horaFin, objetivo, desarrollo, nombrePresidente, nombreSecretario,
        asistentes, compromisos
    } = req.body;

    const archivoSubido = req.file;

    try {
        if (!fechaReunion) {
            return res.status(400).json({ msg: "La 'Fecha de Reunión' es obligatoria." });
        }

        const valFechaEmision = fechaEmision ? new Date(fechaEmision) : null;
        const valFechaRevision = fechaRevision ? new Date(fechaRevision) : null;
        const valFechaReunion = new Date(fechaReunion);

        let arrAsistentes = [];
        let arrCompromisos = [];
        try {
            arrAsistentes = typeof asistentes === 'string' ? JSON.parse(asistentes) : asistentes;
            arrCompromisos = typeof compromisos === 'string' ? JSON.parse(compromisos) : compromisos;
        } catch (e) { console.warn("Error JSON:", e.message); }

        if (!Array.isArray(arrAsistentes)) arrAsistentes = [];
        if (!Array.isArray(arrCompromisos)) arrCompromisos = [];

        let rutaArchivo = '';
        const jsonAsistentesSQL = JSON.stringify(arrAsistentes);
        const jsonCompromisosSQL = JSON.stringify(arrCompromisos);

        if (archivoSubido) {
            rutaArchivo = archivoSubido.path.replace(/\\/g, '/');
        } else {
            const nombrePDF = `Acta_${numeroActa || 'SinNum'}_${Date.now()}.pdf`;
            const dirActas = path.join(__dirname, '../uploads/actas');
            if (!fs.existsSync(dirActas)) fs.mkdirSync(dirActas, { recursive: true });

            const rutaRelativa = `uploads/actas/${nombrePDF}`;
            const rutaAbsoluta = path.join(dirActas, nombrePDF);
            
            const datosActa = {
                codigoDocumento, fechaEmision, fechaRevision, version, numeroActa, 
                lugar, fechaReunion, horaInicio, horaFin, 
                objetivo, desarrollo, nombrePresidente, nombreSecretario
            };

            await generarActaComitePDF(datosActa, arrAsistentes, arrCompromisos, rutaAbsoluta);
            rutaArchivo = rutaRelativa;
        }

        const pool = await poolPromise;
        await pool.request()
            .input('CodigoDocumento', mssql.NVarChar, codigoDocumento)
            .input('FechaEmision', mssql.Date, valFechaEmision)
            .input('FechaRevision', mssql.Date, valFechaRevision)
            .input('Version', mssql.NVarChar, version)
            .input('NumeroActa', mssql.NVarChar, numeroActa)
            .input('Lugar', mssql.NVarChar, lugar)
            .input('FechaReunion', mssql.Date, valFechaReunion)
            .input('HoraInicio', mssql.NVarChar, horaInicio)
            .input('HoraFin', mssql.NVarChar, horaFin)
            .input('Objetivo', mssql.NVarChar, objetivo)
            .input('Desarrollo', mssql.NVarChar, desarrollo)
            .input('NombrePresidente', mssql.NVarChar, nombrePresidente)
            .input('NombreSecretario', mssql.NVarChar, nombreSecretario)
            .input('RutaArchivo', mssql.NVarChar, rutaArchivo)
            .input('JsonAsistentes', mssql.NVarChar(mssql.MAX), jsonAsistentesSQL)
            .input('JsonCompromisos', mssql.NVarChar(mssql.MAX), jsonCompromisosSQL)
            .query('EXEC SP_CREATE_ActaComite @CodigoDocumento, @FechaEmision, @FechaRevision, @Version, @NumeroActa, @Lugar, @FechaReunion, @HoraInicio, @HoraFin, @Objetivo, @Desarrollo, @NombrePresidente, @NombreSecretario, @RutaArchivo, @JsonAsistentes, @JsonCompromisos');

        res.json({ msg: 'Acta guardada correctamente', ruta: rutaArchivo });

    } catch (error) {
        console.error("❌ Error en crearActa:", error);
        res.status(500).send('Error al guardar el acta: ' + error.message);
    }
};

const getActas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_ActasComite');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error obteniendo actas');
    }
};

const actualizarArchivoActa = async (req, res) => {
    const { id } = req.params;
    const archivoNuevo = req.file;

    if (!archivoNuevo) {
        return res.status(400).json({ msg: 'No se ha subido ningún archivo.' });
    }

    try {
        const rutaArchivo = archivoNuevo.path.replace(/\\/g, '/');
        const pool = await poolPromise;
        await pool.request()
            .input('idActa', mssql.Int, id)
            .input('rutaArchivo', mssql.NVarChar, rutaArchivo)
            .query('EXEC SP_UPDATE_ActaArchivo @idActa, @rutaArchivo');

        res.json({ msg: 'Archivo original actualizado correctamente' });
    } catch (error) {
        console.error("❌ Error actualizando archivo acta:", error);
        res.status(500).send('Error al actualizar el archivo');
    }
};

// --- NUEVA FUNCIÓN: SUBIR FIRMAS ---
const subirFirmasActa = async (req, res) => {
    const { id } = req.params;
    const archivoFirmas = req.file;

    if (!archivoFirmas) return res.status(400).json({ msg: 'No se ha subido ningún archivo de firmas.' });

    try {
        const rutaArchivo = archivoFirmas.path.replace(/\\/g, '/');
        const pool = await poolPromise;
        await pool.request()
            .input('idActa', mssql.Int, id)
            .input('rutaArchivo', mssql.NVarChar, rutaArchivo)
            .query('EXEC SP_UPLOAD_FirmasActa @idActa, @rutaArchivo');

        res.json({ msg: 'Documento de firmas subido correctamente' });
    } catch (error) {
        console.error("❌ Error subiendo firmas:", error);
        res.status(500).send('Error al subir el archivo de firmas');
    }
};

// --- NUEVA FUNCIÓN: DESCARGAR ARCHIVO ---
const descargarActa = async (req, res) => {
    const { id } = req.params;
    const { tipo } = req.query; // 'original' o 'firmas'

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', mssql.Int, id)
            .query('SELECT RutaArchivo, RutaArchivoFirmas, NumeroActa FROM ComiteActas WHERE ID_Acta = @id');

        if (result.recordset.length === 0) return res.status(404).json({ msg: 'Acta no encontrada' });

        const acta = result.recordset[0];
        let rutaRelativa = (tipo === 'firmas') ? acta.RutaArchivoFirmas : acta.RutaArchivo;

        if (!rutaRelativa) return res.status(404).json({ msg: 'Archivo no disponible' });

        // Limpiar ruta para evitar problemas de path
        if (rutaRelativa.startsWith('backend/')) rutaRelativa = rutaRelativa.replace('backend/', '');
        if (rutaRelativa.startsWith('backend\\')) rutaRelativa = rutaRelativa.replace('backend\\', '');

        const rutaAbsoluta = path.resolve(__dirname, '..', rutaRelativa);

        if (fs.existsSync(rutaAbsoluta)) {
            const sufijo = tipo === 'firmas' ? '_FIRMADO' : '';
            const nombreDescarga = `Acta_${acta.NumeroActa}${sufijo}.pdf`;
            
            // Forzamos la descarga con el nombre correcto
            res.download(rutaAbsoluta, nombreDescarga);
        } else {
            res.status(404).json({ msg: 'El archivo físico no existe en el servidor.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en descarga');
    }
};

export default { crearActa, getActas, actualizarArchivoActa, subirFirmasActa, descargarActa };