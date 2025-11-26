// backend/utils/seedAdmin.js

import bcrypt from 'bcryptjs';
import { poolPromise, mssql } from '../config/dbConfig.js';
import 'dotenv/config'; 

const seedAdmin = async () => {
    console.log('Iniciando script para sembrar Admin SST (Modo Seguro)...');

    // 1. Leer credenciales del entorno
    // Usamos los valores del .env, o un fallback seguro vacío para forzar el error si faltan
    const adminData = {
        nombre: "Administrador Principal",
        cedula: process.env.ADMIN_CEDULA,
        passwordPlano: process.env.ADMIN_PASSWORD
    };

    // Validación de seguridad
    if (!adminData.cedula || !adminData.passwordPlano) {
        console.error('❌ ERROR DE SEGURIDAD: Las variables ADMIN_CEDULA o ADMIN_PASSWORD no están definidas en el archivo .env');
        process.exit(1);
    }

    try {
        const pool = await poolPromise;

        // 2. Verificar si existe
        const checkUser = await pool.request()
            .input('cedula', mssql.NVarChar, adminData.cedula)
            .query('SELECT ID_Usuario FROM Usuarios WHERE CedulaUsuario = @cedula');

        if (checkUser.recordset.length > 0) {
            console.log(`ℹ️ El usuario '${adminData.cedula}' ya existe. No se realizaron cambios.`);
            process.exit(0); 
        }

        // 3. Hashear
        console.log('Hasheando contraseña...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminData.passwordPlano, salt);

        // 4. Insertar (ID_Rol = 1 es Admin SST)
        const insertQuery = `
            INSERT INTO Usuarios (NombreCompleto, CedulaUsuario, PasswordHash, ID_Rol, EstadoCuenta, Cargo)
            VALUES (@nombre, @cedula, @hash, 1, 'Activo', 'Jefe SST')
        `;

        await pool.request()
            .input('nombre', mssql.NVarChar, adminData.nombre)
            .input('cedula', mssql.NVarChar, adminData.cedula)
            .input('hash', mssql.NVarChar, passwordHash)
            .query(insertQuery);

        console.log('-------------------------------------------');
        console.log('✅ ¡Usuario Administrador SST Creado!');
        console.log(`   Usuario: ${adminData.cedula}`);
        console.log('-------------------------------------------');

        process.exit(0);

    } catch (err) {
        console.error('❌ Error durante el sembrado del admin:', err.message);
        process.exit(1);
    }
};

seedAdmin();