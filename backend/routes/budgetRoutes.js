// backend/routes/budgetRoutes.js
import express from 'express';
import budgetController from '../controllers/budgetController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/fileUpload.js'; // Reusamos tu middleware de subida

const router = express.Router();

// Obtener resumen (Todos los admins pueden ver)
router.get('/', [protect, admin], budgetController.getPresupuestos);

// Obtener detalle de gastos de un presupuesto
router.get('/:id/gastos', [protect, admin], budgetController.getDetalleGastos);

// Crear Presupuesto (Super Admin y Admin SST pueden, pero idealmente Super Admin asigna)
router.post('/asignar', [protect, admin], budgetController.crearPresupuesto);

// Registrar Gasto (Con evidencia)
router.post('/gastar', [protect, admin], upload.single('evidencia'), budgetController.registrarGasto);

router.put('/:id', [protect, admin], budgetController.editarPresupuesto);
router.delete('/:id', [protect, admin], budgetController.eliminarPresupuesto);

export default router;