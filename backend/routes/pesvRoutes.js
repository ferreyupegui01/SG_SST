// backend/routes/pesvRoutes.js

import express from 'express';
import pesvController from '../controllers/pesvController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/fileUpload.js';

const router = express.Router();

// Conductores
router.get('/conductores', [protect, admin], pesvController.getConductoresPESV);
router.post('/conductores', [protect, admin], upload.single('archivoLicencia'), pesvController.guardarInfoConductor);

// Mantenimientos
router.get('/mantenimientos', [protect, admin], pesvController.getMantenimientos);

// --- CAMBIO AQUÍ: Agregamos upload.single('evidencia') ---
router.post('/mantenimientos', 
    [protect, admin], 
    upload.single('evidencia'), // Permite recibir el archivo
    pesvController.crearMantenimiento
);

// Pasos PESV
router.get('/pasos', [protect, admin], pesvController.getPasosPESV);
router.get('/pasos/:id/evidencias', [protect, admin], pesvController.getEvidenciasPorPaso);

// Documentos Internos
router.get('/documentos-internos', [protect], pesvController.getDocumentosGenerados);

// Actualizaciones
router.post('/pasos/actualizar', [protect, admin], upload.single('evidencia'), pesvController.actualizarPasoPESV);
router.put('/evidencias/reemplazar', [protect, admin], upload.single('evidencia'), pesvController.reemplazarEvidencia);

// Plantillas y Generación
router.post('/plantilla', [protect, admin], pesvController.guardarConfiguracionPlantilla);
router.get('/plantilla/:id', [protect, admin], pesvController.getPlantillaPaso);
router.post('/pasos/generar', [protect, admin], pesvController.generarDocumentoPaso);

// CRUD Pasos
router.post('/pasos/crear', [protect, admin], pesvController.crearPaso);
router.put('/pasos/editar', [protect, admin], pesvController.editarPasoInfo);
router.delete('/pasos/:id', [protect, admin], pesvController.eliminarPaso);

// Descarga
router.get('/download/:filename', pesvController.descargarArchivo);

export default router;