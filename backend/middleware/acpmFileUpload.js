// backend/middleware/acpmFileUpload.js

import multer from 'multer';
import path from 'path';

// 1. Dónde y cómo guardar los archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Usa la misma carpeta 'uploads/'
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único para ACPM
        // Formato: acpm-IDACPM-timestamp.extension
        const idACPM = req.params.id; // Asume que el ID está en la URL
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        
        cb(null, `acpm-${idACPM}-${timestamp}${extension}`);
    }
});

// 2. Filtro de archivos (igual al anterior)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Error: Solo se permiten archivos .jpg, .png o .pdf'), false);
    }
};

// 3. Creación del middleware de subida
const acpmUpload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // Límite de 10 MB
    fileFilter: fileFilter
});

// Exportamos como 'default'
export default acpmUpload;