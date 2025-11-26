// backend/routes/dashboardRoutes.js

import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard/admin-kpis
 * @desc    Obtener los 4 KPIs (contadores)
 */
router.get(
    '/admin-kpis',
    [ protect, admin ],
    dashboardController.getAdminKPIs
);

/**
 * @route   GET /api/dashboard/admin-actividades
 * @desc    Obtener lista Top 5 de actividades pendientes
 */
router.get(
    '/admin-actividades',
    [ protect, admin ],
    dashboardController.getAdminActividadesPendientes
);

/**
 * @route   GET /api/dashboard/admin-reportes
 * @desc    Obtener lista Top 5 de reportes nuevos
 */
router.get(
    '/admin-reportes',
    [ protect, admin ],
    dashboardController.getAdminReportesRecientes
);

/**
 * @route   GET /api/dashboard/super-admin
 * @desc    Data completa para Super Admin
 */
router.get(
    '/super-admin',
    [ protect, admin ], // Reutilizamos 'admin' ya que Super Admin también pasa por ahí
    dashboardController.getSuperAdminData
);

export default router;