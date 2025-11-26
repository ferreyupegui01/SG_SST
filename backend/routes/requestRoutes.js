// backend/routes/requestRoutes.js

import express from 'express';
import requestController from '../controllers/requestController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/fileUpload.js';

const router = express.Router();

// Crear solicitud (SST envía archivo opcional)
router.post('/', 
    [protect], 
    upload.single('archivo'), 
    requestController.crearSolicitud
);

// Leer solicitudes
router.get('/', 
    [protect], 
    requestController.getSolicitudes
);

// Responder y Firmar (Super Admin envía imagen de firma opcional)
router.put('/responder', 
    [protect, admin], 
    upload.single('firma'), 
    requestController.responderSolicitud
);

// Actualizar documento firmado manualmente (Reemplazar archivo)
router.post('/actualizar-doc', 
    [protect, admin], 
    upload.single('archivo'), 
    requestController.actualizarDocumentoFirmado
);

export default router;