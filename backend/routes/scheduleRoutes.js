// backend/src/routes/scheduleRoutes.js

import express from 'express';
import { check } from 'express-validator';
import scheduleController from '../controllers/scheduleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/cronogramas (Crear Cronograma)
router.post(
    '/',
    [ protect, admin ],
    [
        check('nombreCronograma', 'El nombre del cronograma es obligatorio').not().isEmpty()
    ],
    scheduleController.crearCronograma
);

// GET /api/cronogramas (Listar Cronogramas Activos)
router.get(
    '/',
    [ protect, admin ],
    scheduleController.getCronogramas
);

/**
 * @route   DELETE /api/cronogramas/:id
 * @desc    Eliminar (Soft Delete) un cronograma
 * @access  Privado (Admin)
 */
router.delete(
    '/:id',
    [ protect, admin ],
    scheduleController.eliminarCronograma // <--- NUEVA RUTA
);


// --- Rutas de Actividades ---
router.post(
    '/:id/actividades',
    [ protect, admin ],
    [
        check('nombreActividad', 'El nombre de la actividad es obligatorio').not().isEmpty(),
        check('fechaLimite', 'La fecha límite es obligatoria y debe ser una fecha válida').isISO8601(),
        check('idUsuarioResponsable', 'El responsable es obligatorio').isInt()
    ],
    scheduleController.crearActividad
);

router.get(
    '/:id/actividades',
    [ protect, admin ],
    scheduleController.getActividadesPorCronograma
);

export default router;