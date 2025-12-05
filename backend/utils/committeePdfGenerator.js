// backend/utils/committeePdfGenerator.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generarActaComitePDF = (data, asistentes, compromisos, rutaSalida) => {
    return new Promise((resolve, reject) => {
        try {
            const listaAsistentes = Array.isArray(asistentes) ? asistentes : [];
            const listaCompromisos = Array.isArray(compromisos) ? compromisos : [];

            const directorio = path.dirname(rutaSalida);
            if (!fs.existsSync(directorio)) fs.mkdirSync(directorio, { recursive: true });

            const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
            const stream = fs.createWriteStream(rutaSalida);
            doc.pipe(stream);

            const fontBold = 'Helvetica-Bold';
            const fontReg = 'Helvetica';
            const black = '#000000';

            // --- 1. ENCABEZADO ---
            const logoPath = path.resolve(__dirname, '..', 'assets', 'logo.png'); 
            const startY = 40; // Posición vertical donde empieza todo
            const startX = 40;
            const col1W = 100; 
            const col2W = 280; 
            const col3W = 150; 
            const hHeader = 70;

            // Bordes Tabla Encabezado
            doc.rect(startX, startY, col1W + col2W + col3W, hHeader).stroke();
            doc.moveTo(startX + col1W, startY).lineTo(startX + col1W, startY + hHeader).stroke();
            doc.moveTo(startX + col1W + col2W, startY).lineTo(startX + col1W + col2W, startY + hHeader).stroke();
            
            const rowH = hHeader / 4;
            doc.moveTo(startX + col1W + col2W, startY + rowH).lineTo(startX + col1W + col2W + col3W, startY + rowH).stroke();
            doc.moveTo(startX + col1W + col2W, startY + rowH * 2).lineTo(startX + col1W + col2W + col3W, startY + rowH * 2).stroke();
            doc.moveTo(startX + col1W + col2W, startY + rowH * 3).lineTo(startX + col1W + col2W + col3W, startY + rowH * 3).stroke();

            // --- LOGO (Ajustado) ---
            // Si quieres subirlo más, disminuye el valor sumado a startY (ej: startY + 1)
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, startX + 10, startY + 6, { width: 80 }); 
                } catch (imgErr) { console.warn('Error cargando logo:', imgErr); }
            }
            
            // Título Central
            doc.font(fontBold).fontSize(12).text('ACTA DE REUNIÓN DE COMITÉ', startX + col1W, startY + 30, { width: col2W, align: 'center' });

            // Datos Control
            doc.font(fontBold).fontSize(8);
            doc.text(`CÓDIGO: ${data.codigoDocumento || ''}`, startX + col1W + col2W + 5, startY + 7);
            doc.text(`FECHA EMISIÓN: ${data.fechaEmision || ''}`, startX + col1W + col2W + 5, startY + rowH + 7);
            doc.text(`FECHA REVISIÓN: ${data.fechaRevision || ''}`, startX + col1W + col2W + 5, startY + (rowH * 2) + 7);
            doc.text(`VERSIÓN: ${data.version || ''}`, startX + col1W + col2W + 5, startY + (rowH * 3) + 7);

            doc.moveDown(5);

            // --- 2. DATOS GENERALES ---
            let y = doc.y;
            const labelX = 40;
            const valX = 110;
            
            doc.font(fontBold).fontSize(10).text('LUGAR:', labelX, y);
            doc.font(fontReg).text(data.lugar || '', valX, y);
            
            doc.font(fontBold).text('FECHA:', 280, y);
            doc.font(fontReg).text(data.fechaReunion || '', 330, y);

            doc.font(fontBold).text('N° ACTA:', 430, y);
            doc.font(fontReg).text(data.numeroActa || '', 480, y);
            
            y += 20;
            doc.font(fontBold).text('HORA INICIO:', labelX, y);
            doc.font(fontReg).text(data.horaInicio || '', valX, y);

            doc.font(fontBold).text('HORA FIN:', 280, y);
            doc.font(fontReg).text(data.horaFin || '', 330, y);

            y += 30;

            // --- 3. VERIFICACIÓN QUORUM ---
            doc.font(fontBold).fontSize(11).fillColor(black).text('1. VERIFICACIÓN DE QUORUM', 40, y);
            y += 20;
            doc.font(fontReg).fontSize(10).text('En el momento de dar inicio se deja constancia de los siguientes asistentes:', 40, y);
            y += 20;

            const asisCol1 = 180; 
            const asisCol2 = 150; 
            const rowHeight = 25;

            // Encabezados Tabla
            doc.rect(40, y, 530, 20).fill('#f0f0f0').stroke();
            doc.fillColor(black).font(fontBold).text('NOMBRE', 45, y + 6);
            doc.text('CARGO', 40 + asisCol1 + 5, y + 6);
            doc.text('FIRMA', 40 + asisCol1 + asisCol2 + 5, y + 6);
            y += 20;

            // Filas Asistentes
            doc.font(fontReg);
            listaAsistentes.forEach(asis => {
                // Margen de seguridad aumentado (680) para evitar salto automático al borde
                if (y + rowHeight > 680) { doc.addPage(); y = 50; }

                doc.rect(40, y, 530, rowHeight).stroke();
                doc.text(asis.Nombre || '', 45, y + 8, { width: asisCol1 - 10 });
                doc.moveTo(40 + asisCol1, y).lineTo(40 + asisCol1, y + rowHeight).stroke();
                doc.text(asis.Cargo || '', 40 + asisCol1 + 5, y + 8, { width: asisCol2 - 10 });
                doc.moveTo(40 + asisCol1 + asisCol2, y).lineTo(40 + asisCol1 + asisCol2, y + rowHeight).stroke();
                y += rowHeight;
            });

            y += 15;
            
            if (y + 20 > 680) { doc.addPage(); y = 50; }
            doc.font(fontReg).text('Por lo anterior se determina que existe el quorum para proceder y dar inicio a la reunión convocada.', 40, y);
            y += 30;

            // --- 4. OBJETIVO ---
            if (y + 60 > 680) { doc.addPage(); y = 50; }
            doc.font(fontBold).fontSize(11).text('2. OBJETIVO', 40, y);
            y += 15;
            doc.font(fontReg).fontSize(10).text(data.objetivo || 'Sin objetivo registrado.', 40, y, { align: 'justify', width: 510 });
            y = doc.y + 20;

            // --- 5. DESARROLLO ---
            if (y + 60 > 680) { doc.addPage(); y = 50; }
            doc.font(fontBold).fontSize(11).text('3. DESARROLLO DE LA REUNIÓN', 40, y);
            y += 15;
            doc.font(fontReg).fontSize(10).text(data.desarrollo || 'Sin desarrollo registrado.', 40, y, { align: 'justify', width: 510 });
            y = doc.y + 20;

            // --- 6. COMPROMISOS ---
            if (y + 60 > 680) { doc.addPage(); y = 50; }
            doc.font(fontBold).fontSize(11).text('4. COMPROMISOS Y ACTIVIDADES PENDIENTES', 40, y);
            y += 15;

            const compCol1 = 270; 
            const compCol2 = 150; 
            
            // Encabezado Tabla
            doc.rect(40, y, 530, 20).fill('#f0f0f0').stroke();
            doc.fillColor(black).font(fontBold).text('COMPROMISO', 45, y + 6);
            doc.text('RESPONSABLE', 40 + compCol1 + 5, y + 6);
            doc.text('FECHA', 40 + compCol1 + compCol2 + 5, y + 6);
            y += 20;

            doc.font(fontReg);
            if (listaCompromisos.length === 0) {
                doc.rect(40, y, 530, 25).stroke();
                doc.text('No se establecieron compromisos.', 45, y + 8);
                y += 25;
            } else {
                listaCompromisos.forEach(comp => {
                    const textHeight = doc.heightOfString(comp.Compromiso || '', { width: compCol1 - 10 });
                    const currentRowH = Math.max(25, textHeight + 10);

                    // Verificación proactiva de espacio
                    if (y + currentRowH > 680) {
                        doc.addPage(); y = 50;
                        doc.rect(40, y, 530, 20).fill('#f0f0f0').stroke();
                        doc.fillColor(black).font(fontBold).text('COMPROMISO', 45, y + 6);
                        doc.text('RESPONSABLE', 40 + compCol1 + 5, y + 6);
                        doc.text('FECHA', 40 + compCol1 + compCol2 + 5, y + 6);
                        y += 20;
                    }

                    doc.rect(40, y, 530, currentRowH).stroke();
                    doc.text(comp.Compromiso || '', 45, y + 5, { width: compCol1 - 10 });
                    doc.moveTo(40 + compCol1, y).lineTo(40 + compCol1, y + currentRowH).stroke();
                    doc.text(comp.Responsable || '', 40 + compCol1 + 5, y + 8, { width: compCol2 - 10 });
                    doc.moveTo(40 + compCol1 + compCol2, y).lineTo(40 + compCol1 + compCol2, y + currentRowH).stroke();
                    doc.text(comp.FechaEjecucion || '', 40 + compCol1 + compCol2 + 5, y + 8);
                    y += currentRowH;
                });
            }
            y += 30;

            // --- 7. CIERRE Y FIRMAS ---
            // Calculamos si caben las firmas (aprox 150px de altura necesaria)
            if (y + 150 > 680) { 
                doc.addPage(); 
                y = 50; 
            }
            
            doc.font(fontBold).fontSize(11).text('5. CIERRE DE LA REUNIÓN', 40, y);
            y += 15;
            doc.font(fontReg).fontSize(10).text(`Siendo las ${data.horaFin || '...'} se da por terminada la reunión.`, 40, y);
            
            y += 80; // Espacio para firmar

            const firmaY = y;
            
            // Firma 1
            doc.text('_______________________________', 40, firmaY);
            doc.font(fontBold).text('PRESIDENTE', 40, firmaY + 10);
            doc.font(fontReg).text(data.nombrePresidente || '', 40, firmaY + 25);

            // Firma 2
            doc.text('_______________________________', 350, firmaY);
            doc.font(fontBold).text('SECRETARIO', 350, firmaY + 10);
            doc.font(fontReg).text(data.nombreSecretario || '', 350, firmaY + 25);

            // --- 8. NUMERACIÓN DE PÁGINAS ---
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(i);
                // Pie de página
                doc.font(fontReg).fontSize(8).text(
                    `Página ${i + 1} de ${range.count}`, 
                    0, 
                    730, // Subí un poco el pie de página para alejarlo del borde
                    { align: 'center', width: 612 }
                );
            }

            doc.end();
            stream.on('finish', () => resolve(rutaSalida));
            stream.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};