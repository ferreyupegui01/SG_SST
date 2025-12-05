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
        // 1. Validaciones de Fechas Requeridas
        if (!fechaReunion) {
            return res.status(400).json({ msg: "La 'Fecha de Reunión' es obligatoria." });
        }

        // Parseo seguro de fechas
        const valFechaEmision = fechaEmision ? new Date(fechaEmision) : null;
        const valFechaRevision = fechaRevision ? new Date(fechaRevision) : null;
        const valFechaReunion = new Date(fechaReunion);

        // 2. Parseo de Listas
        let arrAsistentes = [];
        let arrCompromisos = [];
        try {
            arrAsistentes = typeof asistentes === 'string' ? JSON.parse(asistentes) : asistentes;
            arrCompromisos = typeof compromisos === 'string' ? JSON.parse(compromisos) : compromisos;
        } catch (e) { console.warn("Error JSON:", e.message); }

        if (!Array.isArray(arrAsistentes)) arrAsistentes = [];
        if (!Array.isArray(arrCompromisos)) arrCompromisos = [];

        // 3. PDF
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

        // 4. BD
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

// --- NUEVA FUNCIÓN: ACTUALIZAR ARCHIVO ---
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

        res.json({ msg: 'Archivo del acta actualizado correctamente' });

    } catch (error) {
        console.error("❌ Error actualizando archivo acta:", error);
        res.status(500).send('Error al actualizar el archivo');
    }
};

export default { crearActa, getActas, actualizarArchivoActa };