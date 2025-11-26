// backend/routes/indicatorRoutes.js
import express from 'express';
import indicatorController from '../controllers/indicatorController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guardar indicador (Solo Admin SST/Super Admin)
router.post('/', [protect, admin], indicatorController.guardarIndicador);

// Obtener indicadores de un año
router.get('/:anio', [protect, admin], indicatorController.getIndicadoresAnuales);

export default router;