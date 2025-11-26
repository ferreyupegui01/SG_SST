// frontend/src/services/apiService.js

import { getCurrentToken } from './authService';

const BASE_URL = 'http://localhost:5000/api';

export const apiFetch = async (endpoint, options = {}) => {
    const token = getCurrentToken(); 

    const config = {
        ...options, 
        headers: {
            'Content-Type': 'application/json',
            ...options.headers, 
        },
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        // --- CAMBIO AQUÍ ---
        // Intentamos leer la respuesta como JSON
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            // Si falla (ej. 500 y envía texto plano "Error del servidor")
            // creamos nuestro propio objeto de error.
            data = { msg: `Error: ${response.statusText}` };
        }
        // --- FIN DEL CAMBIO ---


        if (!response.ok) {
            throw new Error(data.msg || data.errors?.[0]?.msg || 'Error en la petición a la API');
        }

        return data;

    } catch (error) {
        console.error(`Error en apiFetch (${endpoint}):`, error);
        throw error; 
    }
};