// backend/controllers/requestController.js

import { poolPromise, mssql } from '../config/dbConfig.js';
import { estamparFirmaEnPDF } from '../utils/signer.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { crearNotificacion } from '../services/notificationService.js'; // Notificaciones

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CREAR SOLICITUD (SST) ---
const crearSolicitud = async (req, res) => {
    const { tipo, mensaje, rutaDocumentoInterno } = req.body;
    const idUsuario = req.usuario.id;
    
    let rutaDocFinal = null;
    if (req.file) {
        rutaDocFinal = req.file.path.replace(/\\/g, '/');
    } else if (rutaDocumentoInterno) {
        rutaDocFinal = rutaDocumentoInterno;
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idUsuario', mssql.Int, idUsuario)
            .input('tipo', mssql.NVarChar, tipo)
            .input('mensaje', mssql.NVarChar, mensaje)
            .input('rutaDoc', mssql.NVarChar, rutaDocFinal)
            .query('EXEC SP_CREATE_Solicitud @idUsuario, @tipo, @mensaje, @rutaDoc');
        
        // --- NOTIFICACIÓN: NUEVA SOLICITUD DE FIRMA ---
        await crearNotificacion({
            rolDestino: 'Super Admin',
            titulo: '🖊️ Nueva Solicitud de Firma',
            mensaje: `Solicitud pendiente: ${req.usuario.nombre} requiere firma de documento.`,
            ruta: '/solicitudes'
        });
        // ----------------------------------------------

        res.json({ msg: 'Solicitud enviada al Super Admin' });
    } catch (err) {
        console.error(err); res.status(500).send('Error enviando solicitud');
    }
};

// --- 2. OBTENER SOLICITUDES ---
const getSolicitudes = async (req, res) => {
    const { id, rol } = req.usuario;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idUsuario', mssql.Int, id)
            .input('rolUsuario', mssql.NVarChar, rol)
            .query('EXEC SP_GET_Solicitudes @idUsuario, @rolUsuario');
        res.json(result.recordset);
    } catch (err) {
        console.error(err); res.status(500).send('Error obteniendo solicitudes');
    }
};

// --- 3. RESPONDER Y FIRMAR (SUPER ADMIN) ---
const responderSolicitud = async (req, res) => {
    const { idSolicitud, estado, comentario, rutaDocumentoOriginal } = req.body;
    const archivoFirma = req.file; 
    const nombreFirmante = req.usuario.nombre; 
    const cargoFirmante = "GERENTE DE OPERACIONES"; 

    let rutaFirmadoFinal = null;

    try {
        // Lógica de firma (si aplica)
        if (estado === 'Aprobado' && rutaDocumentoOriginal && archivoFirma) {
            const nombrePdfFirmado = `Firmado_Solicitud${idSolicitud}_${Date.now()}.pdf`;
            let rutaRelativaLimpia = rutaDocumentoOriginal.startsWith('backend/') 
                ? rutaDocumentoOriginal.replace('backend/', '') 
                : rutaDocumentoOriginal;

            const pathOriginal = path.join(__dirname, '../', rutaRelativaLimpia); 
            const pathSalida = path.join(__dirname, '../uploads', nombrePdfFirmado);
            const pathFirma = archivoFirma.path;

            if (fs.existsSync(pathOriginal)) {
                await estamparFirmaEnPDF(pathOriginal, pathFirma, pathSalida, nombreFirmante, cargoFirmante);
                rutaFirmadoFinal = `uploads/${nombrePdfFirmado}`;
                try { fs.unlinkSync(pathFirma); } catch(e){}
            } else {
                return res.status(404).json({ msg: 'No se encontró el documento original.' });
            }
        }

        const pool = await poolPromise;
        await pool.request()
            .input('idSolicitud', mssql.Int, idSolicitud)
            .input('estado', mssql.NVarChar, estado)
            .input('comentario', mssql.NVarChar, comentario)
            .input('rutaFirmado', mssql.NVarChar, rutaFirmadoFinal)
            .query('EXEC SP_UPDATE_ResponderSolicitud @idSolicitud, @estado, @comentario, @rutaFirmado');
        
        // --- NOTIFICACIÓN: RESPUESTA DE SOLICITUD ---
        // 1. Averiguar quién pidió la solicitud
        const ownerResult = await pool.request()
            .input('idSolicitud', mssql.Int, idSolicitud)
            .query('EXEC SP_GET_Owner_Solicitud @idSolicitud');
        
        const idSolicitante = ownerResult.recordset[0]?.ID_UsuarioSolicitante;

        if (idSolicitante) {
            const icono = estado === 'Aprobado' ? '✅' : '❌';
            await crearNotificacion({
                idUsuarioDestino: idSolicitante,
                titulo: `Solicitud ${estado}`,
                mensaje: `${icono} Tu solicitud fue ${estado} por la Gerencia.`,
                ruta: '/solicitudes'
            });
        }
        // --------------------------------------------

        res.json({ msg: 'Respuesta registrada correctamente', rutaFirmado: rutaFirmadoFinal });

    } catch (err) {
        console.error('Error respondiendo:', err);
        res.status(500).send('Error al procesar la solicitud: ' + err.message);
    }
};

// --- 4. ACTUALIZAR DOCUMENTO MANUALMENTE ---
const actualizarDocumentoFirmado = async (req, res) => {
    const { idSolicitud } = req.body;
    const archivo = req.file;

    if (!archivo) return res.status(400).json({ msg: 'No se subió ningún archivo' });

    try {
        const rutaFinal = archivo.path.replace(/\\/g, '/');
        const pool = await poolPromise;
        await pool.request()
            .input('idSolicitud', mssql.Int, idSolicitud)
            .input('rutaNuevoDoc', mssql.NVarChar, rutaFinal)
            .query('EXEC SP_UPDATE_Solicitud_DocFirmado @idSolicitud, @rutaNuevoDoc');

        res.json({ msg: 'Documento actualizado correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error actualizando documento');
    }
};

export default { crearSolicitud, getSolicitudes, responderSolicitud, actualizarDocumentoFirmado };