// backend/routes/userRoutes.js

import express from 'express';
import { check } from 'express-validator';
import userController from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. RUTA PARA API EXTERNA (GOSEN)
router.get(
    '/externos/buscar', 
    [ protect, admin ], 
    userController.buscarDirectorioExterno
);

// 2. OBTENER ROLES
router.get(
    '/roles',
    [ protect, admin ],
    userController.getRoles
);

// 3. OBTENER CARGOS (NUEVA RUTA)
// IMPORTANTE: Debe ir antes de las rutas con :id para no confundirse
router.get(
    '/cargos',
    [ protect, admin ],
    userController.getCargosEmpresa
);

// 4. CREAR USUARIO
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

// 5. LISTAR USUARIOS (Gestión)
router.get(
    '/',
    [ protect, admin ],
    userController.getColaboradores
);

// 6. LISTAR TODOS (Selectores)
router.get(
    '/todos',
    [ protect, admin ], 
    userController.getTodosUsuarios
);

// 7. OBTENER POR CÉDULA
router.get(
    '/cedula/:cedula',
    [ protect, admin ],
    userController.getUsuarioPorCedula
);

// 8. EDITAR USUARIO
router.put(
    '/:id', 
    [ protect, admin ],
    [
        check('nombreCompleto', 'El nombre completo es obligatorio').not().isEmpty()
    ],
    userController.editarColaborador
);

// 9. CAMBIAR ESTADO (ACTIVAR/INACTIVAR)
router.patch(
    '/:id/estado',
    [ protect, admin ],
    [
        check('estado', 'El estado es obligatorio').isIn(['Activo', 'Inactivo'])
    ],
    userController.cambiarEstadoColaborador
);

// 10. RESETEAR PASSWORD
router.patch(
    '/:id/reset-password',
    [ protect, admin ],
    [
        check('password', 'La nueva contraseña es obligatoria').not().isEmpty()
    ],
    userController.resetPasswordColaborador
);

// 11. ACTUALIZAR EMAIL (PERFIL)
router.patch(
    '/perfil/email',
    [ protect ], // Cualquier usuario logueado puede actualizar su email
    userController.actualizarPerfilEmail
);

export default router;