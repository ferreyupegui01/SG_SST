// backend/routes/activityRoutes.js

import express from 'express';
import { check } from 'express-validator';
import activityController from '../controllers/activityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/fileUpload.js';

const router = express.Router();

/**
 * @route   PUT /api/actividades/:id
 * @desc    Editar los detalles de una actividad (CU-10)
 */
router.put(
    '/:id', // :id es el ID_Actividad
    [ protect, admin ],
    [
        check('nombreActividad', 'El nombre de la actividad es obligatorio').not().isEmpty(),
        check('fechaLimite', 'La fecha límite es obligatoria y debe ser una fecha válida').isISO8601(),
        // --- CAMBIO: Validación de ID ---
        check('idUsuarioResponsable', 'El responsable es obligatorio').isInt()
    ],
    activityController.editarActividad
);

// DELETE /api/actividades/:id (Eliminar Actividad)
router.delete(
    '/:id', 
    [ protect, admin ], 
    activityController.eliminarActividad
);

// PATCH /api/actividades/:id/estado (Gestionar Estado/Evidencia)
router.patch(
    '/:id/estado',
    [ protect, admin ], 
    upload.single('evidenciaFile'), 
    [
        check('estado', 'El estado es obligatorio').isIn(['Pendiente', 'Realizada', 'Cancelada']),
        check('observaciones').optional().isString()
    ],
    activityController.gestionarActividad
);

// GET /api/actividades/:id/evidencias (Ver Evidencias)
router.get(
    '/:id/evidencias',
    [ protect, admin ],
    activityController.getEvidenciasActividad
);

/**
 * @route   GET /api/actividades/:id
 * @desc    Obtener el detalle completo de una actividad
 * @access  Privado (Admin)
 */
router.get(
    '/:id', 
    [ protect, admin ],
    activityController.getActividadDetalle // <-- NUEVA RUTA
);

export default router;