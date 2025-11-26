// backend/routes/authRoutes.js

import express from 'express';
import { check } from 'express-validator'; // Para validar los datos de entrada
import authController from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario (Admin o Colaborador) y obtener token
 * @access  Public
 */
router.post(
    '/login',
    [
        // Validaciones: no deben estar vacíos
        check('cedula', 'La cédula es obligatoria').not().isEmpty(),
        check('password', 'La contraseña es obligatoria').not().isEmpty()
    ],
    authController.login // Llama a la función 'login' del controlador
);

export default router;