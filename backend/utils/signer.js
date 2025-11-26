// backend/utils/signer.js

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'; // Importamos rgb y fonts
import fs from 'fs';

export const estamparFirmaEnPDF = async (rutaPdfOriginal, rutaImagenFirma, rutaSalida, nombreFirmante, cargoFirmante) => {
    try {
        const pdfBytes = fs.readFileSync(rutaPdfOriginal);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const firmaBytes = fs.readFileSync(rutaImagenFirma);
        let firmaImage;
        
        if (rutaImagenFirma.endsWith('.png')) {
            firmaImage = await pdfDoc.embedPng(firmaBytes);
        } else {
            firmaImage = await pdfDoc.embedJpg(firmaBytes);
        }

        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1]; // Firmamos en la última página
        const { width, height } = lastPage.getSize();

        // --- CONFIGURACIÓN DE POSICIÓN ---
        // Escalar firma (ajusta el 0.4 según el tamaño de tus imágenes)
        const scale = 0.4; 
        const firmaDims = firmaImage.scale(scale);

        // Coordenadas: Abajo a la derecha
        const margenDerecho = 50;
        const margenInferior = 120; // Subimos un poco para dejar espacio al texto
        
        const xPos = width - firmaDims.width - margenDerecho;
        const yPos = margenInferior;

        // 1. DIBUJAR LA IMAGEN DE LA FIRMA
        lastPage.drawImage(firmaImage, {
            x: xPos,
            y: yPos,
            width: firmaDims.width,
            height: firmaDims.height,
        });
        
        // 2. DIBUJAR EL TEXTO DEBAJO ("FIRMADO POR...")
        const fechaFirma = new Date().toLocaleString('es-CO');
        
        // Línea divisoria
        lastPage.drawLine({
            start: { x: xPos, y: yPos - 5 },
            end: { x: xPos + firmaDims.width, y: yPos - 5 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Texto
        lastPage.drawText(`FIRMADO POR: ${cargoFirmante.toUpperCase()}`, {
            x: xPos,
            y: yPos - 20,
            size: 8,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        lastPage.drawText(`Nombre: ${nombreFirmante}`, {
            x: xPos,
            y: yPos - 32,
            size: 8,
            font: helveticaFont,
            color: rgb(0.4, 0.4, 0.4),
        });

        lastPage.drawText(`Fecha: ${fechaFirma}`, {
            x: xPos,
            y: yPos - 44,
            size: 7,
            font: helveticaFont,
            color: rgb(0.6, 0.6, 0.6),
        });

        const pdfFirmadoBytes = await pdfDoc.save();
        fs.writeFileSync(rutaSalida, pdfFirmadoBytes);

        return true;

    } catch (error) {
        console.error("Error estampando firma:", error);
        throw new Error("No se pudo estampar la firma en el documento.");
    }
};