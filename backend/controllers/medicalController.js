// backend/controllers/medicalController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// (getHistorialExamenes - sin cambios)
const getHistorialExamenes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_ExamenesHistorial');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getHistorialExamenes:', err.message);
        res.status(500).send('Error del servidor');
    }
};

// (crearExamenMedico - sin cambios)
const crearExamenMedico = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
        idUsuarioColaborador, tipoExamen, fechaExamen, conceptoAptitud,
        recomendacionesGenerales, observaciones, recomendacionesOcupacionales, 
        medicoEspecialista, entidadEmite, duracionRecomendaciones, resumenCaso, compromisos
    } = req.body;
    const idUsuarioAdminRegistra = req.usuario.id;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idUsuarioColaborador', mssql.Int, idUsuarioColaborador)
            .input('idUsuarioAdminRegistra', mssql.Int, idUsuarioAdminRegistra)
            .input('tipoExamen', mssql.NVarChar, tipoExamen)
            .input('fechaExamen', mssql.Date, fechaExamen)
            .input('conceptoAptitud', mssql.NVarChar, conceptoAptitud)
            .input('recomendacionesGenerales', mssql.NVarChar, recomendacionesGenerales || null)
            .input('observaciones', mssql.NVarChar, observaciones || null)
            .input('recomendacionesOcupacionales', mssql.NVarChar, recomendacionesOcupacionales || null)
            .input('medicoEspecialista', mssql.NVarChar, medicoEspecialista || null)
            .input('entidadEmite', mssql.NVarChar, entidadEmite || null)
            .input('duracionRecomendaciones', mssql.NVarChar, duracionRecomendaciones || null)
            .input('resumenCaso', mssql.NVarChar, resumenCaso || null)
            .input('compromisos', mssql.NVarChar, compromisos || null)
            .query('EXEC SP_CREATE_ExamenMedico @idUsuarioColaborador, @idUsuarioAdminRegistra, @tipoExamen, @fechaExamen, @conceptoAptitud, @recomendacionesGenerales, @observaciones, @recomendacionesOcupacionales, @medicoEspecialista, @entidadEmite, @duracionRecomendaciones, @resumenCaso, @compromisos');

        res.status(201).json({ msg: 'Examen médico registrado exitosamente' });
    } catch (err) {
        console.error('Error en crearExamenMedico:', err.message);
        res.status(500).send('Error del servidor');
    }
};

// (getExamenMedicoDetalle - sin cambios)
const getExamenMedicoDetalle = async (req, res) => {
    const { id: idExamenMedico } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idExamenMedico', mssql.Int, idExamenMedico)
            .query('EXEC SP_GET_ExamenMedicoDetalle @idExamenMedico');
        if (result.recordset.length === 0) return res.status(404).json({ msg: 'Examen médico no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getExamenMedicoDetalle:', err.message);
        res.status(500).send('Error del servidor');
    }
};

// --- GENERAR PDF ---
const generarPdfRecomendaciones = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idExamenMedico', mssql.Int, id)
            .query('EXEC SP_GET_ExamenMedicoDetalle @idExamenMedico');

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Examen médico no encontrado' });
        }

        const data = result.recordset[0];
        
        // 1. BUFFER PAGES (Paginación automática)
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

        const filename = `Recomendaciones-${data.CedulaColaborador || 'NA'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        const startX = 50;
        let y = 40; 

        // === LOGO ===
        const logoPath = path.resolve(__dirname, '..', 'assets', 'logo.png');
        let logoHeight = 0;
        try {
            doc.image(logoPath, 60, 10, { width: 120 });
            logoHeight = 60;
        } catch {
            doc.font('Helvetica-Bold').text('EMPRESA', startX, y);
            logoHeight = 20;
        }

        // === ENCABEZADO ===
        const headerX = startX + 120;
        const headerWidth = 390;
        
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000')
           .text('Acta de notificación de restricciones y/o recomendaciones médicas',
               headerX, y + 5, { align: 'center', width: headerWidth });
        
        doc.moveDown(0.3);
        
        // Guardar posición Y para la paginación (debajo del título)
        const subtitleY = doc.y; 
        doc.fontSize(9);
        doc.moveDown(1); // Espacio reservado

        doc.moveDown(2);
        doc.y = y + logoHeight + 30;
        doc.fillColor('#000000'); 

        const seccion = (titulo) => {
            doc.moveDown(1);
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
                .text(titulo.toUpperCase(), startX);
            doc.moveDown(0.4);
            doc.font('Helvetica').fontSize(10).fillColor('#000000');
        };

        // === DATOS ===
        let contentX = 50;
        let contentY = doc.y;
        doc.y = contentY;

        seccion("Datos del colaborador");
        doc.text(`Nombre: ${data.NombreColaborador || ''}`, contentX);
        doc.text(`C.C: ${data.CedulaColaborador || ''}`, contentX);
        
        const fechaExamenStr = new Date(data.FechaExamen).toLocaleDateString('es-CO', { timeZone: 'UTC' });
        doc.text(`Fecha del Examen: ${fechaExamenStr}`, contentX);
        
        doc.text(`Tipo de Examen: ${data.TipoExamen || ''}`, contentX);
        doc.text(`Concepto de Aptitud: ${data.ConceptoAptitud || ''}`, contentX);

        seccion("Información del concepto");
        doc.text(`Persona que emite el concepto (Médico): ${data.MedicoEspecialista || 'No registra'}`, contentX);
        doc.text(`Entidad que emite el concepto (ARL/EPS): ${data.EntidadEmite || 'No registra'}`, contentX);
        doc.text(`Duración de las recomendaciones: ${data.DuracionRecomendaciones || 'No registra'}`, contentX);

        seccion("Temas tratados: breve resumen del caso");
        doc.text(data.ResumenCaso || 'No se registró un resumen del caso.', contentX, doc.y, { width: 480, align: 'justify' });

        seccion("Ampliación de las recomendaciones médicas (no ocupacionales)");
        doc.text(data.RecomendacionesGenerales || 'Sin recomendaciones médicas generales.', contentX, doc.y, { width: 480, align: 'justify' });

        seccion("Recomendaciones ocupacionales (para el trabajo)");
        doc.text(data.RecomendacionesOcupacionales || 'Sin recomendaciones ocupacionales específicas.', contentX, doc.y, { width: 480, align: 'justify' });

        seccion("Compromisos");
        doc.text(data.Compromisos || 'Sin compromisos registrados.', contentX, doc.y, { width: 480, align: 'justify' });

        // === FIRMAS (Restaurado al formato ORIGINAL) ===
        
        if (doc.y > 600) doc.addPage(); 

        doc.moveDown(4);
        seccion("En constancia de lo anterior se firma por parte de los asistentes:");
        doc.moveDown(3);
        doc.font('Helvetica').fontSize(10);
        
        // Formato vertical exacto como pediste
        doc.text('___________________________________', contentX);
        doc.text('Nombre:', contentX);
        doc.text('Cargo/Empresa:', contentX);
        doc.text('N° Identificación:', contentX);
        doc.text('Firma:', contentX);

        // === 2. ESCRITURA FINAL DE PÁGINAS ===
        const range = doc.bufferedPageRange();
        const totalPages = range.count;

        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);

            if (i === 0) {
                const fechaEmision = new Date().toLocaleDateString('es-CO');
                doc.font('Helvetica').fontSize(9).fillColor('#6c757d')
                   .text(
                       `Fecha Emisión: ${fechaEmision}    Fecha Revisión: ${fechaEmision}    Páginas: ${i + 1} de ${totalPages}`,
                       headerX, 
                       subtitleY, 
                       { align: 'center', width: headerWidth }
                   );
            } else {
                doc.font('Helvetica').fontSize(9).fillColor('#6c757d')
                   .text(`Página ${i + 1} de ${totalPages}`, 50, 30, { align: 'right' });
            }
        }

        doc.end();

    } catch (err) {
        console.error('Error en generarPdfRecomendaciones:', err.message);
        if (!res.headersSent) {
            res.status(500).send('Error del servidor al generar el PDF');
        }
    }
};

const medicalController = {
    getHistorialExamenes,
    crearExamenMedico,
    getExamenMedicoDetalle, 
    generarPdfRecomendaciones
};

export default medicalController;