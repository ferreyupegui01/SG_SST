// frontend/src/services/userService.js

import { apiFetch } from './apiService.js';

export const getColaboradores = async () => {
    return apiFetch('/usuarios');
};

export const getTodosUsuarios = async () => {
    return apiFetch('/usuarios/todos');
};

export const getUsuarioByCedula = async (cedula) => {
    return apiFetch(`/usuarios/cedula/${cedula}`);
};

// --- NUEVA FUNCIÓN: Obtener roles ---
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