// backend/routes/medicalRoutes.js

import express from 'express';
import { check } from 'express-validator';
import medicalController from '../controllers/medicalController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/medicina (Historial)
router.get(
    '/',
    [ protect, admin ],
    medicalController.getHistorialExamenes
);

// POST /api/medicina (Registrar)
router.post(
    '/',
    [ protect, admin ],
    [ 
        check('nombreColaborador', 'El nombre del colaborador es obligatorio').not().isEmpty(),
        check('cedulaColaborador', 'La cédula del colaborador es obligatoria').not().isEmpty(),
        check('tipoExamen', 'El tipo de examen es obligatorio').not().isEmpty(),
        check('fechaExamen', 'La fecha de examen es obligatoria').isISO8601(),
        check('conceptoAptitud', 'El concepto de aptitud es obligatorio').not().isEmpty()
    ],
    medicalController.crearExamenMedico
);

/**
 * @route   GET /api/medicina/:id
 * @desc    Obtener detalle de UN examen (para el modal "Ver Detalle")
 * @access  Privado (Admin)
 */
router.get(
    '/:id',
    [ protect, admin ],
    medicalController.getExamenMedicoDetalle // <-- ¡CORREGIDO!
);

// GET /api/medicina/:id/pdf (Generar PDF)
router.get(
    '/:id/pdf',
    [ protect, admin ],
    medicalController.generarPdfRecomendaciones 
);

export default router;