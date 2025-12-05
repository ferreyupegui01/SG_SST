// backend/routes/committeeRoutes.js
import express from 'express';
import committeeController from '../controllers/committeeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configurar subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/actas/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Nombre único con timestamp
        cb(null, `Acta_${Date.now()}_${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Rutas
router.post('/', [protect], upload.single('archivoManual'), committeeController.crearActa);
router.get('/', [protect], committeeController.getActas);

// --- RUTA NUEVA: ACTUALIZAR ARCHIVO ---
// Usamos upload.single('archivo') porque así lo llamaremos desde el front
router.put('/:id/archivo', [protect, admin], upload.single('archivo'), committeeController.actualizarArchivoActa);

export default router;