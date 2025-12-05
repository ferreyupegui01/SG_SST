// backend/controllers/medicalController.js

import { validationResult } from 'express-validator';
import { poolPromise, mssql } from '../config/dbConfig.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // Asegúrate de importar fs
import { logAction } from '../services/logService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- OBTENER HISTORIAL ---
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

// --- CREAR EXAMEN ---
const crearExamenMedico = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
        idUsuarioColaborador, nombreColaborador, cedulaColaborador,
        tipoExamen, fechaExamen, conceptoAptitud,
        recomendacionesGenerales, observaciones, recomendacionesOcupacionales, 
        medicoEspecialista, entidadEmite, resumenCaso, compromisos,
        fechaFinRecomendaciones 
    } = req.body;
    
    const idUsuarioAdminRegistra = req.usuario.id;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('idUsuarioColaborador', mssql.Int, idUsuarioColaborador || null)
            .input('idUsuarioAdminRegistra', mssql.Int, idUsuarioAdminRegistra)
            .input('nombreColaborador', mssql.NVarChar, nombreColaborador)
            .input('cedulaColaborador', mssql.NVarChar, cedulaColaborador)
            .input('tipoExamen', mssql.NVarChar, tipoExamen)
            .input('fechaExamen', mssql.Date, fechaExamen)
            .input('conceptoAptitud', mssql.NVarChar, conceptoAptitud)
            .input('recomendacionesGenerales', mssql.NVarChar, recomendacionesGenerales || null)
            .input('observaciones', mssql.NVarChar, observaciones || null)
            .input('recomendacionesOcupacionales', mssql.NVarChar, recomendacionesOcupacionales || null)
            .input('medicoEspecialista', mssql.NVarChar, medicoEspecialista || null)
            .input('entidadEmite', mssql.NVarChar, entidadEmite || null)
            .input('resumenCaso', mssql.NVarChar, resumenCaso || null)
            .input('compromisos', mssql.NVarChar, compromisos || null)
            .input('fechaFinRecomendaciones', mssql.Date, fechaFinRecomendaciones || null)
            .query('EXEC SP_CREATE_ExamenMedico @idUsuarioColaborador, @idUsuarioAdminRegistra, @tipoExamen, @fechaExamen, @conceptoAptitud, @recomendacionesGenerales, @observaciones, @recomendacionesOcupacionales, @medicoEspecialista, @entidadEmite, @fechaFinRecomendaciones, @resumenCaso, @compromisos, @nombreColaborador, @cedulaColaborador');

        await logAction(req.usuario.id, req.usuario.nombre, 'CREAR_EXAMEN', `Registró examen para: ${nombreColaborador}`);
        res.status(201).json({ msg: 'Examen médico registrado exitosamente' });
    } catch (err) {
        console.error('Error en crearExamenMedico:', err.message);
        res.status(500).send('Error del servidor');
    }
};

// --- OBTENER DETALLE ---
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

// --- GENERAR PDF CON NUEVO ENCABEZADO (ACTUALIZADO) ---
const generarPdfRecomendaciones = async (req, res) => {
    const { id } = req.params;
    
    // Recibimos los datos del encabezado desde el body (POST)
    const { codigo, version, fechaEmision, fechaRevision } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idExamenMedico', mssql.Int, id)
            .query('EXEC SP_GET_ExamenMedicoDetalle @idExamenMedico');

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Examen médico no encontrado' });
        }

        const data = result.recordset[0];
        
        // Configuración Documento
        const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true }); // Margen ajustado a 40 para coincidir
        const filename = `Recomendaciones-${data.CedulaColaborador || 'NA'}.pdf`;
        
        // Headers para descarga directa
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        const fontBold = 'Helvetica-Bold';
        const fontReg = 'Helvetica';
        const black = '#000000';

        // ==========================================
        // 1. ENCABEZADO ESTRUCTURADO (TABLA)
        // ==========================================
        const startY = 40; 
        const startX = 40;
        const col1W = 100; // Logo
        const col2W = 280; // Título
        const col3W = 150; // Datos Control
        const hHeader = 70;

        // Bordes Tabla
        doc.rect(startX, startY, col1W + col2W + col3W, hHeader).stroke();
        doc.moveTo(startX + col1W, startY).lineTo(startX + col1W, startY + hHeader).stroke();
        doc.moveTo(startX + col1W + col2W, startY).lineTo(startX + col1W + col2W, startY + hHeader).stroke();
        
        const rowH = hHeader / 4;
        doc.moveTo(startX + col1W + col2W, startY + rowH).lineTo(startX + col1W + col2W + col3W, startY + rowH).stroke();
        doc.moveTo(startX + col1W + col2W, startY + rowH * 2).lineTo(startX + col1W + col2W + col3W, startY + rowH * 2).stroke();
        doc.moveTo(startX + col1W + col2W, startY + rowH * 3).lineTo(startX + col1W + col2W + col3W, startY + rowH * 3).stroke();

        // --- LOGO ---
        const logoPath = path.resolve(__dirname, '..', 'assets', 'logo.png');
        if (fs.existsSync(logoPath)) {
            try { doc.image(logoPath, startX + 10, startY + 4, { width: 80 }); } 
            catch (e) { console.warn('Logo error', e); }
        }

        // --- TÍTULO CENTRAL ---
        // Título Principal del Sistema
        doc.font(fontBold).fontSize(10).fillColor(black)
           .text('SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO (SG-SST)', startX + col1W, startY + 18, { width: col2W, align: 'center' });
        
        // Título del Documento Específico
        doc.font(fontBold).fontSize(10)
           .text('ACTA DE NOTIFICACIÓN DE RECOMENDACIONES MÉDICAS', startX + col1W, startY + 42, { width: col2W, align: 'center' });

        // --- DATOS DE CONTROL (DERECHA) ---
        doc.font(fontBold).fontSize(8);
        doc.text(`CÓDIGO: ${codigo || 'SST-FTO-001'}`, startX + col1W + col2W + 5, startY + 7);
        doc.text(`FECHA EMISIÓN: ${fechaEmision || ''}`, startX + col1W + col2W + 5, startY + rowH + 7);
        doc.text(`FECHA REVISIÓN: ${fechaRevision || ''}`, startX + col1W + col2W + 5, startY + (rowH * 2) + 7);
        doc.text(`VERSIÓN: ${version || '1'}`, startX + col1W + col2W + 5, startY + (rowH * 3) + 7);

        // ==========================================
        // 2. CUERPO DEL DOCUMENTO
        // ==========================================
        
        // Resetear cursor debajo del encabezado
        doc.x = startX;
        doc.y = startY + hHeader + 40;
        
        const contentWidth = 530; // Ancho útil

        const seccion = (titulo) => {
            doc.moveDown(1);
            doc.font(fontBold).fontSize(11).fillColor(black)
                .text(titulo.toUpperCase());
            doc.moveDown(0.4);
            doc.font(fontReg).fontSize(10).fillColor(black);
        };

        // --- DATOS DEL COLABORADOR ---
        doc.font(fontBold).text("DATOS GENERALES:", { underline: true });
        doc.moveDown(0.5);
        
        const fechaExamenStr = data.FechaExamen ? new Date(data.FechaExamen).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : 'N/A';
        let fechaFinStr = 'Indefinida / No aplica';
        if (data.FechaFinRecomendaciones) {
            fechaFinStr = new Date(data.FechaFinRecomendaciones).toLocaleDateString('es-CO', { timeZone: 'UTC' });
        }

        // Tabla visual simulada con tabulaciones
        doc.font(fontBold).fontSize(10);
        doc.text(`Nombre: `, { continued: true }); doc.font(fontReg).text(data.NombreColaborador);
        doc.font(fontBold).text(`Cédula: `, { continued: true }); doc.font(fontReg).text(data.CedulaColaborador);
        doc.font(fontBold).text(`Fecha del Examen: `, { continued: true }); doc.font(fontReg).text(fechaExamenStr);
        doc.font(fontBold).text(`Tipo de Examen: `, { continued: true }); doc.font(fontReg).text(data.TipoExamen);
        doc.font(fontBold).text(`Concepto: `, { continued: true }); doc.font(fontReg).text(data.ConceptoAptitud);
        
        doc.moveDown(0.5);
        doc.font(fontBold).text(`Médico Emisor: `, { continued: true }); doc.font(fontReg).text(data.MedicoEspecialista || 'No registra');
        doc.font(fontBold).text(`Entidad (EPS/ARL): `, { continued: true }); doc.font(fontReg).text(data.EntidadEmite || 'No registra');
        doc.font(fontBold).text(`Vigencia Recomendaciones: `, { continued: true }); doc.font(fontReg).text(fechaFinStr);

        seccion("Temas tratados: breve resumen del caso");
        doc.text(data.ResumenCaso || 'No se registró un resumen del caso.', { width: contentWidth, align: 'justify' });

        seccion("Ampliación de las recomendaciones médicas (no ocupacionales)");
        doc.text(data.RecomendacionesGenerales || 'Sin recomendaciones médicas generales.', { width: contentWidth, align: 'justify' });

        seccion("Recomendaciones ocupacionales (para el trabajo)");
        doc.text(data.RecomendacionesOcupacionales || 'Sin recomendaciones ocupacionales específicas.', { width: contentWidth, align: 'justify' });

        seccion("Compromisos");
        doc.text(data.Compromisos || 'Sin compromisos registrados.', { width: contentWidth, align: 'justify' });

        // === FIRMAS ===
        if (doc.y > 600) doc.addPage(); 

        doc.moveDown(4);
        seccion("En constancia de lo anterior se firma por parte de los asistentes:");
        doc.moveDown(3);
        doc.font(fontReg).fontSize(10);
        
        doc.text('___________________________________');
        doc.text('Nombre:');
        doc.text('Cargo/Empresa:');
        doc.text('N° Identificación:');
        doc.text('Firma:');

        // === NUMERACIÓN DE PÁGINAS ===
        const range = doc.bufferedPageRange();
        const totalPages = range.count;

        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#6c757d')
               .text(`Página ${i + 1} de ${totalPages}`, 0, 730, { align: 'center', width: 612 });
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