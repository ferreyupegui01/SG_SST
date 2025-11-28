// backend/routes/collabDocsRoutes.js

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import collabDocsController from '../controllers/collabDocsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- CONFIGURACIÓN DE MULTER (ALMACENAMIENTO) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Carpeta donde se guardarán los documentos
        const dir = 'uploads/colaboradores/';
        // Si no existe, la creamos recursivamente
        if (!fs.existsSync(dir)){ 
            fs.mkdirSync(dir, { recursive: true }); 
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Generamos un nombre único: TIMESTAMP-RANDOM-NOMBREORIGINAL
        // Esto evita que se sobrescriban archivos con el mismo nombre
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --- DEFINICIÓN DE RUTAS ---

// 1. Obtener lista de documentos de un colaborador (por Cédula)
router.get('/:cedula', [protect], collabDocsController.getDocumentosPorCedula);

// 2. Descargar un documento (Force Download)
router.get('/download/:id', [protect], collabDocsController.descargarDocumento);

// 3. Visualizar un documento en el navegador (Inline View)
router.get('/view/:id', [protect], collabDocsController.verDocumento);

// 4. Eliminar un documento (Solo Admins)
router.delete('/:id', [protect, admin], collabDocsController.eliminarDocumento);

// 5. Subir un nuevo documento
// 'archivo' es el nombre del campo que debe enviar el Frontend en el FormData
router.post('/', [protect, admin], upload.single('archivo'), collabDocsController.subirDocumento);

export default router;