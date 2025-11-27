// backend/controllers/userController.js

import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { poolPromise, mssql } from '../config/dbConfig.js';
import { logAction } from '../services/logService.js';
import { buscarEnDirectorioExterno } from '../services/externalApiService.js';

// --- FUNCIÓN: BUSCAR EN API EXTERNA ---
const buscarDirectorioExterno = async (req, res) => {
    // Si no envían query, enviamos vacío para traer la lista por defecto
    const query = req.query.query || ''; 
    
    try {
        // 1. Axios llama a http://localhost:4000/api/gosen/empleados
        const resultados = await buscarEnDirectorioExterno(query);
        
        // 2. Mapeamos los datos (Traducimos las columnas de Gosen a tu Frontend)
        const datosFormateados = resultados.map(u => ({
            Nombre: u.NombreCompleto,
            Cedula: u.Cedula,
            // Mostramos el ID del cargo/área ya que la query SQL solo trae IDs
            Cargo: u.CargoID ? `Cargo ${u.CargoID}` : 'Sin asignar',
            Area: u.AreaID ? `Área ${u.AreaID}` : 'Operaciones',
            Email: u.Email || 'No registrado'
        }));

        res.json(datosFormateados);

    } catch (err) {
        console.error('Error en controlador externo:', err);
        res.status(500).json({ msg: 'Error consultando directorio externo' });
    }
};

// --- FUNCIONES CRUD EXISTENTES (Sin cambios) ---

const crearColaborador = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombreCompleto, cedula, password, idRol, area, cargo } = req.body;
    try {
        const pool = await poolPromise;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.request()
            .input('nombreCompleto', mssql.NVarChar, nombreCompleto)
            .input('cedula', mssql.NVarChar, cedula)
            .input('passwordHash', mssql.NVarChar, passwordHash)
            .input('idRol', mssql.Int, idRol) 
            .input('area', mssql.NVarChar, area || null)
            .input('cargo', mssql.NVarChar, cargo || null)
            .query('EXEC SP_CREATE_Colaborador @nombreCompleto, @cedula, @passwordHash, @idRol, @area, @cargo'); 

        await logAction(req.usuario.id, req.usuario.nombre, 'CREAR_USUARIO', `Creó al usuario: ${nombreCompleto} (Cédula: ${cedula})`);
        res.status(201).json({ msg: 'Usuario creado exitosamente' });
    } catch (err) {
        if (err.message.includes('La cédula ingresada ya existe')) return res.status(400).json({ msg: 'La cédula ingresada ya existe' });
        console.error('Error en crearColaborador:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getColaboradores = async (req, res) => {
    const idAdminLogueado = req.usuario.id;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('idAdminLogueado', mssql.Int, idAdminLogueado).query('EXEC SP_GET_Colaboradores @idAdminLogueado'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getColaboradores:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getTodosUsuarios = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC SP_GET_TodosUsuarios');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getTodosUsuarios:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getUsuarioPorCedula = async (req, res) => {
    const { cedula } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('cedula', mssql.NVarChar, cedula).query('EXEC SP_GET_UsuarioPorCedula @cedula');
        if (result.recordset.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado o inactivo' });
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en getUsuarioPorCedula:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const getRoles = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT ID_Rol, NombreRol FROM Roles ORDER BY ID_Rol ASC');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en getRoles:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const editarColaborador = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params; 
    const { nombreCompleto, area, cargo } = req.body; 
    try {
        const pool = await poolPromise;
        const checkUser = await pool.request().input('id', mssql.Int, id).query('SELECT ID_Usuario FROM dbo.Usuarios WHERE ID_Usuario = @id');
        if (checkUser.recordset.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado' });
        
        await pool.request()
            .input('idUsuario', mssql.Int, id)
            .input('nombreCompleto', mssql.NVarChar, nombreCompleto)
            .input('area', mssql.NVarChar, area || null)
            .input('cargo', mssql.NVarChar, cargo || null)
            .query('EXEC SP_UPDATE_Colaborador @idUsuario, @nombreCompleto, @area, @cargo'); 
        
        await logAction(req.usuario.id, req.usuario.nombre, 'EDITAR_USUARIO', `Editó al usuario: ${nombreCompleto} (ID: ${id})`);
        res.json({ msg: 'Colaborador actualizado exitosamente' });
    } catch (err) {
        console.error('Error en editarColaborador:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const cambiarEstadoColaborador = async (req, res) => {
    const { id } = req.params; 
    const { estado } = req.body; 
    try {
        const pool = await poolPromise;
        const checkUser = await pool.request().input('id', mssql.Int, id).query('SELECT ID_Usuario, NombreCompleto FROM dbo.Usuarios WHERE ID_Usuario = @id');
        if (checkUser.recordset.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado' });
        
        const nombreAfectado = checkUser.recordset[0].NombreCompleto;
        await pool.request()
            .input('idUsuario', mssql.Int, id)
            .input('estado', mssql.NVarChar, estado)
            .query('EXEC SP_UPDATE_EstadoUsuario @idUsuario, @estado'); 
        
        await logAction(req.usuario.id, req.usuario.nombre, 'CAMBIAR_ESTADO_USUARIO', `Cambió estado a '${estado}' para: ${nombreAfectado}`);
        res.json({ msg: `Usuario ${estado.toLowerCase()} exitosamente` });
    } catch (err) {
        console.error('Error en cambiarEstadoColaborador:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const resetPasswordColaborador = async (req, res) => {
    const { id } = req.params; 
    const { password } = req.body; 
    try {
        const pool = await poolPromise;
        const checkUser = await pool.request().input('id', mssql.Int, id).query('SELECT ID_Usuario, NombreCompleto FROM dbo.Usuarios WHERE ID_Usuario = @id');
        if (checkUser.recordset.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado' });
        
        const nombreAfectado = checkUser.recordset[0].NombreCompleto;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        await pool.request()
            .input('idUsuario', mssql.Int, id)
            .input('passwordHash', mssql.NVarChar, passwordHash)
            .query('EXEC SP_UPDATE_PasswordUsuario @idUsuario, @passwordHash'); 
        
        await logAction(req.usuario.id, req.usuario.nombre, 'RESETEAR_PASSWORD', `Reseteó contraseña para: ${nombreAfectado}`);
        res.json({ msg: 'Contraseña del colaborador actualizada exitosamente' });
    } catch (err) {
        console.error('Error en resetPasswordColaborador:', err.message);
        res.status(500).send('Error del servidor');
    }
};

const userController = {
    buscarDirectorioExterno, // <--- IMPORTANTE: Exportada
    crearColaborador,
    getColaboradores,
    getTodosUsuarios,
    getUsuarioPorCedula,
    getRoles,
    editarColaborador,
    cambiarEstadoColaborador,
    resetPasswordColaborador
};

export default userController;