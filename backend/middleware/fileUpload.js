// backend/middleware/fileUpload.js

import multer from 'multer';
import path from 'path'; // Módulo 'path' de Node.js

/**
 * @middleware  fileUpload
 * @desc        Configuración de Multer para la subida de archivos
 */

// 1. Dónde y cómo guardar los archivos
const storage = multer.diskStorage({
    // Define la carpeta de destino
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de que la carpeta 'uploads/' exista
    },
    // Define el nombre del archivo
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único para evitar colisiones
        // Formato: actividad-IDActividad-timestamp.extension
        const idActividad = req.params.id; // Asume que el ID está en la URL
        const timestamp = Date.now();
        const extension = path.extname(file.originalname); // .jpg, .pdf
        
        cb(null, `actividad-${idActividad}-${timestamp}${extension}`);
    }
});

// 2. Filtro de archivos (basado en tu CU-01 y DB)
const fileFilter = (req, file, cb) => {
    // Define los tipos de archivo permitidos
    const allowedTypes = /jpeg|jpg|png|pdf/;
    
    // Comprueba la extensión del archivo
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    // Comprueba el 'mimetype'
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        // Archivo permitido
        cb(null, true);
    } else {
        // Archivo rechazado
        cb(new Error('Error: Solo se permiten archivos .jpg, .png o .pdf'), false);
    }
};

// 3. Creación del middleware de subida
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10 // Límite de 10 MB por archivo
    },
    fileFilter: fileFilter
});

export default upload;