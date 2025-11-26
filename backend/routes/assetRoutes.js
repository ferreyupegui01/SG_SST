// backend/routes/assetRoutes.js

import express from 'express';
import { check } from 'express-validator';
import assetController from '../controllers/assetController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/activos/tipos
 * @desc    Obtener lista de tipos de activos
 * @access  Privado (Admin) - Se usa para crear activos
 */
router.get(
    '/tipos',
    [ protect, admin ],
    assetController.getTiposDisponibles
);

/**
 * @route   GET /api/activos/tipo/:tipo
 * @desc    Obtener lista de activos filtrados por tipo
 * @access  Privado (Cualquier rol logueado)
 */
router.get(
    '/tipo/:tipo',
    [ protect ], 
    assetController.getActivosPorTipo
);

/**
 * @route   GET /api/activos
 * @desc    Obtener lista de TODOS los activos
 * @access  Privado (Cualquier rol logueado) <--- CAMBIO IMPORTANTE
 */
router.get(
    '/',
    [ protect ], // <--- Antes tenía [protect, admin]. Ahora cualquiera puede ver la lista para reportar.
    assetController.getActivosTodos
);

/**
 * @route   POST /api/activos
 * @desc    Crear un nuevo activo
 * @access  Privado (Admin)
 */
router.post(
    '/',
    [ protect, admin ],
    [
        check('tipoActivo', 'El tipo de activo es obligatorio').not().isEmpty(),
        check('codigoIdentificador', 'El código identificador es obligatorio').not().isEmpty(),
        check('nombreDescriptivo', 'El nombre descriptivo es obligatorio').not().isEmpty()
    ],
    assetController.crearActivo
);

/**
 * @route   PUT /api/activos/:id
 * @desc    Actualizar un activo
 * @access  Privado (Admin)
 */
router.put(
    '/:id',
    [ protect, admin ],
    [
        check('tipoActivo', 'El tipo de activo es obligatorio').not().isEmpty(),
        check('codigoIdentificador', 'El código identificador es obligatorio').not().isEmpty(),
        check('nombreDescriptivo', 'El nombre descriptivo es obligatorio').not().isEmpty()
    ],
    assetController.actualizarActivo
);

/**
 * @route   DELETE /api/activos/:id
 * @desc    Eliminar un activo
 * @access  Privado (Admin)
 */
router.delete(
    '/:id',
    [ protect, admin ],
    assetController.eliminarActivo
);

export default router;