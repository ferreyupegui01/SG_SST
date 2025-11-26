// backend/routes/notificationRoutes.js
import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', [protect], notificationController.getMisNotificaciones);
router.patch('/:id/leida', [protect], notificationController.marcarLeida);
router.patch('/:id/ocultar', [protect], notificationController.ocultarNotificacion); // <--- NUEVA RUTA

export default router;