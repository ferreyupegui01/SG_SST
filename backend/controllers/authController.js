// backend/controllers/authController.js

import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import { poolPromise, mssql } from '../config/dbConfig.js';

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { cedula, password } = req.body;

    try {
        const pool = await poolPromise;
        
        // Ejecutamos el SP modificado (asegúrate de haber corrido el script SQL del paso anterior)
        const result = await pool.request()
            .input('cedula', mssql.NVarChar, cedula)
            .query('EXEC SP_AUTH_LoginUsuario @cedula');

        if (result.recordset.length === 0) {
            return res.status(401).json({ msg: 'Credenciales inválidas' });
        }

        const usuario = result.recordset[0];

        if (usuario.EstadoCuenta === 'Inactivo') {
            return res.status(403).json({ msg: 'Esta cuenta de usuario está inactiva.' });
        }

        const isMatch = await bcrypt.compare(password, usuario.PasswordHash);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Credenciales inválidas' });
        }

        // --- CREACIÓN DEL PAYLOAD DEL TOKEN ---
        const payload = {
            usuario: {
                id: usuario.ID_Usuario,
                nombre: usuario.NombreCompleto,
                rol: usuario.NombreRol,
                cedula: usuario.CedulaUsuario,
                email: usuario.Email // <--- ¡AQUÍ ESTABA EL ERROR! Ahora el token recordará el correo
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error('Error en login:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const authController = { login };
export default authController;