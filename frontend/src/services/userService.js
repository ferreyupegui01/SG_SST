// frontend/src/services/userService.js

import { apiFetch } from './apiService.js';

// --- CRUD DE USUARIOS LOCALES ---
export const getColaboradores = async () => {
    return apiFetch('/usuarios');
};

export const getTodosUsuarios = async () => {
    return apiFetch('/usuarios/todos');
};

export const getUsuarioByCedula = async (cedula) => {
    return apiFetch(`/usuarios/cedula/${cedula}`);
};

export const getRoles = async () => {
    return apiFetch('/usuarios/roles');
};

export const crearColaborador = async (datosUsuario) => {
    return apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify(datosUsuario),
    });
};

export const editarColaborador = async (id, datosUsuario) => {
    const { nombreCompleto, area, cargo } = datosUsuario;
    return apiFetch(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombreCompleto, area, cargo }),
    });
};

export const cambiarEstadoColaborador = async (id, estado) => {
    return apiFetch(`/usuarios/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });
};

export const resetPasswordColaborador = async (id, password) => {
    return apiFetch(`/usuarios/${id}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
    });
};

// --- BÚSQUEDA EN DIRECTORIO EXTERNO (GOSEN) ---
export const buscarUsuarioExterno = async (query) => {
    // Llama a tu backend, el cual llama al microservicio
    // Si query está vacío, el backend se encarga de traer los default
    const safeQuery = query || '';
    return apiFetch(`/usuarios/externos/buscar?query=${safeQuery}`);
};