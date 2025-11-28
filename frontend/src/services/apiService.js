// frontend/src/services/apiService.js

// Ajusta la ruta según donde tengas tu authService
import { getCurrentToken } from './authService';

const BASE_URL = 'http://localhost:5000/api';

/**
 * Función 1: Para peticiones de datos (JSON)
 * Usada en: Login, Listados, Crear usuarios, etc.
 */
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
        
        // Intentamos leer la respuesta como JSON
        let data;
        // Si la respuesta no tiene contenido (204), no intentamos parsear
        if (response.status !== 204) {
            try {
                data = await response.json();
            // eslint-disable-next-line no-unused-vars
            } catch (jsonError) {
                // Si falla el parseo (ej. error 500 html), capturamos el texto
                data = { msg: `Error inesperado: ${response.statusText}` };
            }
        }

        if (!response.ok) {
            throw new Error(data?.msg || data?.errors?.[0]?.msg || 'Error en la petición a la API');
        }

        return data;

    } catch (error) {
        console.error(`Error en apiFetch (${endpoint}):`, error);
        throw error; 
    }
};

/**
 * Función 2: Para DESCARGAR archivos (Blob/Binarios)
 * Usada en: Descargar PDF de exámenes, Descargar documentos adjuntos.
 * IMPORTANTE: No espera JSON, espera un "Blob" (archivo crudo).
 */
export const apiFetchBlob = async (endpoint, options = {}) => {
    const token = getCurrentToken(); 

    const config = {
        ...options,
        headers: {
            // Nota: AQUÍ NO PONEMOS 'Content-Type': 'application/json'
            ...options.headers,
        },
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            throw new Error(`Error al descargar el archivo: ${response.status} ${response.statusText}`);
        }

        // Retornamos el archivo crudo (Blob)
        return await response.blob();

    } catch (error) {
        console.error(`Error en apiFetchBlob (${endpoint}):`, error);
        throw error;
    }
};