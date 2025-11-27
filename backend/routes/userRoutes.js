// backend/src/routes/userRoutes.js
import express from 'express';
import { check } from 'express-validator';
import userController from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- RUTA NUEVA PARA API EXTERNA (ANTES DE LOS IDs) ---
router.get(
    '/externos/buscar', 
    [ protect, admin ], 
    userController.buscarDirectorioExterno
);

// POST /api/usuarios (Crear)
router.post(
    '/',
    [ protect, admin ],
    [
        check('nombreCompleto', 'El nombre completo es obligatorio').not().isEmpty(),
        check('cedula', 'La cédula (usuario) es obligatoria').not().isEmpty(),
        check('password', 'La contraseña temporal es obligatoria').not().isEmpty(),
        check('idRol', 'El rol es obligatorio').isInt()
    ],
    userController.crearColaborador
);

// GET /api/usuarios (Lista gestión)
router.get(
    '/',
    [ protect, admin ],
    userController.getColaboradores
);

// GET /api/usuarios/todos (Lista selectores)
router.get(
    '/todos',
    [ protect, admin ], 
    userController.getTodosUsuarios
);

// Obtener Roles
router.get(
    '/roles',
    [ protect, admin ],
    userController.getRoles
);

// Obtener por Cédula
router.get(
    '/cedula/:cedula',
    [ protect, admin ],
    userController.getUsuarioPorCedula
);

// PUT /api/usuarios/:id (Editar)
router.put(
    '/:id', 
    [ protect, admin ],
    [
        check('nombreCompleto', 'El nombre completo es obligatorio').not().isEmpty()
    ],
    userController.editarColaborador
);

// PATCH /api/usuarios/:id/estado (Activar/Inactivar)
router.patch(
    '/:id/estado',
    [ protect, admin ],
    [
        check('estado', 'El estado es obligatorio').isIn(['Activo', 'Inactivo'])
    ],
    userController.cambiarEstadoColaborador
);

// PATCH /api/usuarios/:id/reset-password (Resetear)
router.patch(
    '/:id/reset-password',
    [ protect, admin ],
    [
        check('password', 'La nueva contraseña es obligatoria').not().isEmpty()
    ],
    userController.resetPasswordColaborador
);

export default router;