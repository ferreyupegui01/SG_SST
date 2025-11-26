// backend/src/routes/logRoutes.js

import express from 'express';
import logController from '../controllers/logController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/logs/filtros
 * @desc    Obtener las listas para los dropdowns de filtro
 * @access  Privado (Admin)
 */
router.get(
    '/filtros',
    [ protect, admin ],
    logController.getLogFiltros
);

/**
 * @route   POST /api/logs/buscar
 * @desc    Obtener el historial de auditoría (filtrado)
 * @access  Privado (Admin)
 */
router.post(
    '/buscar', // Cambiado de GET / a POST /buscar
    [ protect, admin ],
    logController.getLogs
);

export default router;