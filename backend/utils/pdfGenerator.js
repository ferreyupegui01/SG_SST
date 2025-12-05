// backend/utils/pdfGenerator.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generarActaPDF = (configuracion, datosUsuario, rutaSalida) => {
    return new Promise((resolve, reject) => {
        try {
            const directorio = path.dirname(rutaSalida);
            if (!fs.existsSync(directorio)) {
                fs.mkdirSync(directorio, { recursive: true });
            }

            // Margen de 40 puntos
            const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
            const stream = fs.createWriteStream(rutaSalida);

            doc.pipe(stream);

            const fontBold = 'Helvetica-Bold';
            const fontReg = 'Helvetica';
            const black = '#000000';

            // ==========================================
            // 1. ENCABEZADO ESTRUCTURADO (TABLA)
            // ==========================================
            
            const startY = 40; 
            const startX = 40; // Margen izquierdo
            const col1W = 100; // Ancho Logo
            const col2W = 280; // Ancho Título
            const col3W = 150; // Ancho Datos Control
            const hHeader = 70; // Altura Total Header
            
            // Ancho útil de la página para el texto (Ancho total - Márgenes)
            // Letter width ~612. Margin 40 left + 40 right = 80. Content Width = 532.
            const contentWidth = 530; 

            // Dibujar Líneas de la Tabla del Encabezado
            doc.rect(startX, startY, col1W + col2W + col3W, hHeader).stroke(); // Borde exterior
            doc.moveTo(startX + col1W, startY).lineTo(startX + col1W, startY + hHeader).stroke(); // Divisor Logo-Título
            doc.moveTo(startX + col1W + col2W, startY).lineTo(startX + col1W + col2W, startY + hHeader).stroke(); // Divisor Título-Datos
            
            // Líneas horizontales de la columna de datos
            const rowH = hHeader / 4;
            doc.moveTo(startX + col1W + col2W, startY + rowH).lineTo(startX + col1W + col2W + col3W, startY + rowH).stroke();
            doc.moveTo(startX + col1W + col2W, startY + rowH * 2).lineTo(startX + col1W + col2W + col3W, startY + rowH * 2).stroke();
            doc.moveTo(startX + col1W + col2W, startY + rowH * 3).lineTo(startX + col1W + col2W + col3W, startY + rowH * 3).stroke();

            // --- LOGO ---
            const logoPath = path.resolve(__dirname, '..', 'assets', 'logo.png');
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, startX + 10, startY + 4, { width: 80 }); 
                } catch (imgErr) { console.warn('Error cargando logo:', imgErr); }
            }

            // --- TÍTULO CENTRAL ---
            doc.font(fontBold).fontSize(11).fillColor(black)
               .text('PLAN ESTRATÉGICO DE SEGURIDAD VIAL (PESV)', startX + col1W, startY + 20, { width: col2W, align: 'center' });
            
            // Subtítulo dinámico
            doc.fontSize(10).font(fontReg)
               .text(configuracion.titulo.toUpperCase(), startX + col1W, startY + 40, { width: col2W, align: 'center' });

            // --- DATOS DE CONTROL (DERECHA) ---
            doc.font(fontBold).fontSize(8);
            doc.text(`CÓDIGO: ${configuracion.codigo || 'PESV-FTO-001'}`, startX + col1W + col2W + 5, startY + 7);
            doc.text(`FECHA EMISIÓN: ${configuracion.fechaEmision || ''}`, startX + col1W + col2W + 5, startY + rowH + 7);
            doc.text(`FECHA REVISIÓN: ${configuracion.fechaRevision || ''}`, startX + col1W + col2W + 5, startY + (rowH * 2) + 7);
            doc.text(`VERSIÓN: ${configuracion.version || '1'}`, startX + col1W + col2W + 5, startY + (rowH * 3) + 7);

            // ==========================================
            // 2. CUERPO DEL DOCUMENTO (CORREGIDO)
            // ==========================================

            // --- IMPORTANTE: RESETEAR CURSOR ---
            // Forzamos X al margen izquierdo y Y debajo del header con un espacio
            doc.x = startX;
            doc.y = startY + hHeader + 40; 

            // --- CUERPO FIJO ---
            if (configuracion.cuerpo) {
                doc.font(fontReg).fontSize(11)
                   .text(configuracion.cuerpo, { 
                       align: 'justify', 
                       lineGap: 4,
                       width: contentWidth // Forzamos el ancho para que ocupe toda la página
                   });
                doc.moveDown(1.5);
            }

            // --- CAMPOS DINÁMICOS ---
            if (configuracion.camposLlenos && configuracion.camposLlenos.length > 0) {
                // Título de sección
                doc.font(fontBold).fontSize(11).text('INFORMACIÓN ESPECÍFICA:', { underline: true });
                doc.moveDown(0.5);

                // Lista de campos
                configuracion.camposLlenos.forEach(campo => {
                    // Usamos continued: true para que valor quede al lado de la etiqueta
                    doc.font(fontBold).text(`• ${campo.label}: `, { continued: true });
                    doc.font(fontReg).text(campo.valor);
                    doc.moveDown(0.3);
                });
                doc.moveDown(2);
            }

            // ==========================================
            // 3. FIRMAS
            // ==========================================
            
            // Verificar espacio disponible para firmas
            if (doc.y > 600) doc.addPage();
            
            const yFirmas = doc.y + 60; // Un poco más de aire antes de las firmas

            // Firma 1 (Izquierda)
            doc.text('_____________________________', startX, yFirmas);
            doc.font(fontBold).text('LÍDER DEL PESV', startX, yFirmas + 15);
            
            // Firma 2 (Derecha - si aplica)
            const campoNombre = configuracion.camposLlenos.find(c => c.label.toLowerCase().includes('nombre') || c.label.toLowerCase().includes('responsable'));
            
            if (campoNombre) {
                const firmaDerechaX = 350;
                doc.text('_____________________________', firmaDerechaX, yFirmas);
                doc.font(fontBold).text(campoNombre.valor.toUpperCase(), firmaDerechaX, yFirmas + 15);
                doc.font(fontReg).text('Firma Responsable', firmaDerechaX, yFirmas + 30);
            }

            // ==========================================
            // 4. NUMERACIÓN DE PÁGINAS (PIE)
            // ==========================================
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#6c757d')
                   .text(`Página ${i + 1} de ${range.count}`, 0, 730, { align: 'center', width: 612 }); // Centrado en página (612pt)
            }

            doc.end();
            stream.on('finish', () => resolve(true));
            stream.on('error', (err) => reject(err));

        } catch (error) { reject(error); }
    });
};