// backend/utils/pdfGenerator.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generarActaPDF = (configuracion, datosUsuario, rutaSalida) => {
    return new Promise((resolve, reject) => {
        try {
            const directorio = path.dirname(rutaSalida);
            if (!fs.existsSync(directorio)) {
                fs.mkdirSync(directorio, { recursive: true });
            }

            const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
            const stream = fs.createWriteStream(rutaSalida);

            doc.pipe(stream);

            // --- ENCABEZADO ---
            doc.rect(50, 40, 510, 70).stroke();
            
            doc.fontSize(16).font('Helvetica-Bold').text('EMPAQUETADOS EL TRECE S.A.S', 60, 55, { align: 'center', width: 490 });
            doc.fontSize(10).font('Helvetica').text('NIT: 900.123.456-7', { align: 'center' });
            doc.fontSize(10).font('Helvetica-Oblique').text('PLAN ESTRATÉGICO DE SEGURIDAD VIAL (PESV)', { align: 'center' });
            doc.moveDown(3);

            // --- TÍTULO ---
            doc.fontSize(14).font('Helvetica-Bold').text(configuracion.titulo.toUpperCase(), { align: 'center', underline: true });
            doc.moveDown();

            // --- FECHA (SIN CIUDAD) ---
            const fechaActual = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            doc.fontSize(11).font('Helvetica').text(`Fecha de emisión: ${fechaActual}`, { align: 'right' });
            doc.moveDown(2);

            // --- CUERPO FIJO ---
            if (configuracion.cuerpo) {
                doc.fontSize(11).font('Helvetica').text(configuracion.cuerpo, { align: 'justify', lineGap: 4 });
                doc.moveDown();
            }

            // --- CAMPOS DINÁMICOS ---
            if (configuracion.camposLlenos && configuracion.camposLlenos.length > 0) {
                doc.font('Helvetica-Bold').text('INFORMACIÓN ESPECÍFICA:', { underline: true });
                doc.moveDown(0.5);

                configuracion.camposLlenos.forEach(campo => {
                    doc.font('Helvetica-Bold').text(`• ${campo.label}: `, { continued: true });
                    doc.font('Helvetica').text(campo.valor);
                    doc.moveDown(0.3);
                });
                doc.moveDown(2);
            }

            // --- FIRMAS ---
            if (doc.y > 600) doc.addPage();
            
            const yFirmas = doc.y + 50;

            // Firma 1
            doc.text('_____________________________', 50, yFirmas);
            doc.font('Helvetica-Bold').text('RESPONSABLE PESV', 50, yFirmas + 15);
            
            // Firma 2 (Si detectamos un nombre en los campos)
            const campoNombre = configuracion.camposLlenos.find(c => c.label.toLowerCase().includes('nombre') || c.label.toLowerCase().includes('presidente'));
            
            if (campoNombre) {
                doc.text('_____________________________', 350, yFirmas);
                doc.font('Helvetica-Bold').text(campoNombre.valor.toUpperCase(), 350, yFirmas + 15);
                doc.font('Helvetica').text('Aceptante', 350, yFirmas + 30);
            }

            // --- PIE DE PÁGINA ---
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(`Página ${i + 1}`, 50, 750, { align: 'center', color: 'gray' });
            }

            doc.end();
            stream.on('finish', () => resolve(true));
            stream.on('error', (err) => reject(err));

        } catch (error) { reject(error); }
    });
};