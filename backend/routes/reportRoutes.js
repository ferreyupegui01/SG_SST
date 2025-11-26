// backend/routes/reportRoutes.js

import express from 'express';
import { check } from 'express-validator';
import reportController from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js'; 
import upload from '../middleware/fileUpload.js'; 

const router = express.Router();

// --- Rutas Colaborador (Crear Reportes) ---
router.post('/maquina', 
    [ protect ], 
    upload.single('fotoReporte'), 
    [ 
        check('idActivo', 'Debe seleccionar una máquina').not().isEmpty().isInt(),
        check('estadoReportado', 'El estado es obligatorio').isIn(['OK', 'Con Problema'])
    ],
    reportController.crearReporteMaquina
);

router.post('/seguridad', 
    [ protect ], 
    upload.single('fotoReporte'), 
    [
        check('tipoReporte', 'Obligatorio').not().isEmpty(),
        check('ubicacionArea', 'Obligatorio').not().isEmpty(),
        check('descripcion', 'Obligatorio').not().isEmpty()
    ],
    reportController.crearReporteSeguridad
);

// --- Rutas Colaborador (Ver Mis Reportes) ---
router.get('/maquina/mis-reportes', [ protect ], reportController.getMisReportesMaquina);
router.get('/seguridad/mis-reportes', [ protect ], reportController.getMisReportesSeguridad);

// --- Rutas Generales (Admin Listas) ---
router.get('/maquina', [ protect, admin ], reportController.getReportesMaquina);
router.get('/seguridad', [ protect, admin ], reportController.getReportesSeguridad);

// --- Rutas Detalle (Acceso mixto: Admin revisa, Colaborador solo lee) ---
// NOTA: Se quitó el middleware 'admin' para permitir acceso al colaborador
router.get('/maquina/:id', [ protect ], reportController.getReporteMaquinaDetalle);
router.get('/seguridad/:id', [ protect ], reportController.getReporteSeguridadDetalle);

export default router;