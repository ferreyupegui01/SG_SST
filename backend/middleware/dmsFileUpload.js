// backend/middleware/dmsFileUpload.js

import multer from 'multer';
import path from 'path';

// --- 1. Definir tipos de archivo permitidos (RNF-017) ---
const allowedMimeTypes = [
    'application/pdf', // .pdf
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/xml', // .xml
    'text/xml' // .xml
];

// --- 2. Dónde y cómo guardar ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Guarda en una subcarpeta 'dms' para no mezclar con evidencias
        cb(null, 'uploads/dms'); 
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único (timestamp + nombre original)
        const timestamp = Date.now();
        const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}-${safeOriginalName}`);
    }
});

// --- 3. Filtro de archivos ---
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Archivo permitido
    } else {
        // Archivo rechazado (RNF-017)
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
};

// --- 4. Creación del middleware de subida ---
// Usamos .array('archivos') para permitir subida múltiple
const dmsUpload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 25 // Límite de 25 MB (RNF-018)
    },
    fileFilter: fileFilter
});

export default dmsUpload;