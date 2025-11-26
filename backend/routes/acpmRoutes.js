// backend/routes/acpmRoutes.js

import express from 'express';
import { check } from 'express-validator';
import acpmController from '../controllers/acpmController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import acpmUpload from '../middleware/acpmFileUpload.js';

const router = express.Router();

// POST /api/acpm (Crear ACPM)
router.post(
    '/',
    [ protect, admin ], 
    [
        check('tipoAccion', 'El tipo de acción es obligatorio').isIn(['Correctiva', 'Preventiva', 'Mejora']),
        check('origen', 'El origen es obligatorio').not().isEmpty(),
        check('descripcionProblema', 'La descripción del problema es obligatoria').not().isEmpty(),
        check('planAccion', 'El plan de acción es obligatorio').not().isEmpty(),
        // --- CAMBIO: Validación de ID ---
        check('idUsuarioResponsable', 'El responsable es obligatorio').isInt(),
        check('fechaLimite', 'La fecha límite es obligatoria').isISO8601()
    ],
    acpmController.crearACPM
);

// GET /api/acpm (Listar ACPM)
router.get(
    '/',
    [ protect, admin ], 
    acpmController.getACPMs
);

// GET /api/acpm/:id (Ver Detalle)
router.get(
    '/:id', 
    [ protect, admin ], 
    acpmController.getACPMDetalle
);

// PATCH /api/acpm/:id (Gestionar/Cerrar)
router.patch(
    '/:id', 
    [ protect, admin ], 
    acpmUpload.single('evidenciaCierre'), 
    [
        check('estadoACPM', 'El estado es obligatorio').isIn(['Abierta', 'En Proceso', 'Cerrada'])
    ],
    acpmController.gestionarACPM
);

// GET /api/acpm/:id/evidencias (Ver Evidencias)
router.get(
    '/:id/evidencias',
    [ protect, admin ],
    acpmController.getEvidenciasACPM
);

export default router;