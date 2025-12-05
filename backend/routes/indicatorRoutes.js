// backend/routes/indicatorRoutes.js
import express from 'express';
import indicatorController from '../controllers/indicatorController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', [protect, admin], indicatorController.guardarIndicador);
router.get('/:anio', [protect, admin], indicatorController.getIndicadoresAnuales);
router.delete('/registro/:id', [protect, admin], indicatorController.eliminarRegistro);

// Rutas de Configuración
router.get('/config/todos', [protect, admin], indicatorController.getConfiguraciones);
router.post('/config', [protect, admin], indicatorController.crearConfiguracion);
router.put('/config/:id', [protect, admin], indicatorController.editarConfiguracion); // <--- NUEVA RUTA
router.delete('/config/:id', [protect, admin], indicatorController.eliminarConfiguracion);

export default router;