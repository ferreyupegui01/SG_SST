// frontend/src/services/requestService.js

import { apiFetch } from './apiService';

// URL Base (Ajusta si tu puerto cambia)
const API_URL = 'http://localhost:5000/api';

// Obtener lista de solicitudes (SST ve las suyas, Admin ve todas)
export const getSolicitudes = async () => {
    return apiFetch('/solicitudes');
};

// Responder una solicitud (Solo Admin)
export const responderSolicitud = async (idSolicitud, estado, comentario) => {
    return apiFetch('/solicitudes/responder', {
        method: 'PUT',
        body: JSON.stringify({ idSolicitud, estado, comentario })
    });
};

// Enviar nueva solicitud con archivo adjunto (SST)
export const crearSolicitud = async (formData) => {
    const token = localStorage.getItem('token');
    
    // Usamos fetch directo aquí porque FormData requiere headers especiales
    // que apiFetch podría sobreescribir con 'application/json'
    const response = await fetch(`${API_URL}/solicitudes`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // NO agregamos 'Content-Type' para que el navegador ponga el 'multipart/form-data' con el boundary correcto
        },
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.msg || 'Error al enviar la solicitud');
    }

    return data;
};