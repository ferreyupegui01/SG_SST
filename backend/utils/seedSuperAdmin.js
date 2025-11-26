// backend/utils/seedSuperAdmin.js

import bcrypt from 'bcryptjs';
import { poolPromise, mssql } from '../config/dbConfig.js';
import 'dotenv/config'; // Carga las variables del .env

const seedSuperAdmin = async () => {
    console.log('--- Configurando Super Admin (Modo Seguro) ---');

    // 1. Leer credenciales del entorno
    const usuario = process.env.SUPER_ADMIN_CEDULA;
    const passwordPlano = process.env.SUPER_ADMIN_PASSWORD;

    // Validación de seguridad: Si no están en el .env, detenemos el script
    if (!usuario || !passwordPlano) {
        console.error('❌ ERROR DE SEGURIDAD: Las variables SUPER_ADMIN_CEDULA o SUPER_ADMIN_PASSWORD no están definidas en el archivo .env');
        process.exit(1);
    }

    try {
        const pool = await poolPromise;

        // 2. Buscar ID del Rol "Super Admin"
        const roleResult = await pool.request()
            .query("SELECT ID_Rol FROM Roles WHERE NombreRol = 'Super Admin'");
        
        if (roleResult.recordset.length === 0) {
            console.error('❌ ERROR: No existe el rol "Super Admin" en la BD. Ejecuta primero el script SQL de roles.');
            process.exit(1);
        }
        const idRolSuper = roleResult.recordset[0].ID_Rol;

        // 3. Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordPlano, salt);

        // 4. Verificar existencia del usuario
        const userCheck = await pool.request()
            .input('cedula', mssql.NVarChar, usuario)
            .query('SELECT ID_Usuario FROM Usuarios WHERE CedulaUsuario = @cedula');

        if (userCheck.recordset.length > 0) {
            console.log('El usuario ya existe. Actualizando credenciales...');
            await pool.request()
                .input('cedula', mssql.NVarChar, usuario)
                .input('pass', mssql.NVarChar, passwordHash)
                .query(`UPDATE Usuarios SET PasswordHash = @pass, EstadoCuenta = 'Activo' WHERE CedulaUsuario = @cedula`);
        } else {
            console.log('Creando nuevo Super Admin...');
            await pool.request()
                .input('cedula', mssql.NVarChar, usuario)
                .input('pass', mssql.NVarChar, passwordHash)
                .input('rol', mssql.Int, idRolSuper)
                .query(`INSERT INTO Usuarios (NombreCompleto, CedulaUsuario, PasswordHash, ID_Rol, Cargo, EstadoCuenta) 
                        VALUES ('Super Administrador', @cedula, @pass, @rol, 'Gerencia TI', 'Activo')`);
        }

        console.log('✅ ÉXITO: Super Admin configurado desde variables de entorno.');
        process.exit(0);

    } catch (err) {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    }
};

seedSuperAdmin();