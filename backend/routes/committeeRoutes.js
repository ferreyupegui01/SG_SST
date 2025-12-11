// backend/routes/committeeRoutes.js
import express from 'express';
import committeeController from '../controllers/committeeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/actas/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const prefix = file.fieldname === 'archivoFirmas' ? 'Firmas_' : 'Acta_';
        cb(null, `${prefix}${Date.now()}_${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Rutas existentes
router.post('/', [protect], upload.single('archivoManual'), committeeController.crearActa);
router.get('/', [protect], committeeController.getActas);
router.put('/:id/archivo', [protect, admin], upload.single('archivo'), committeeController.actualizarArchivoActa);

// --- RUTAS NUEVAS ---
// Subir firmas
router.put('/:id/firmas', [protect, admin], upload.single('archivoFirmas'), committeeController.subirFirmasActa);
// Descargar (Forzar descarga directa)
router.get('/:id/download', [protect], committeeController.descargarActa);

export default router;