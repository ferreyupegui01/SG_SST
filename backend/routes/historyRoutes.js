// backend/routes/historyRoutes.js
import express from 'express';
import historyController from '../controllers/historyController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// CAMBIO: El parámetro ahora se llama :cedula
router.get('/colaborador/:cedula', [protect, admin], historyController.getHistorialColaborador);
router.get('/activo/:id', [protect, admin], historyController.getHistorialActivo);

export default router;