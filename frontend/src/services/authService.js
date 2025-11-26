// frontend/src/services/authService.js

// La URL base de tu API de backend
const API_URL = 'http://localhost:5000/api/auth';

/**
 * @service login
 * @desc Llama al endpoint /api/auth/login
 * @param {string} cedula
 * @param {string} password
 * @returns {object} { token }
 */
export const login = async (cedula, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cedula, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Si la respuesta no es 2xx, lanza un error (ej. "Credenciales inválidas")
            throw new Error(data.msg || 'Error al iniciar sesión');
        }

        // Si el login es exitoso (respuesta 200 OK)
        if (data.token) {
            // Guarda el token en el localStorage para persistir la sesión
            localStorage.setItem('token', data.token);
        }
        
        return data; // Devuelve { token }

    } catch (error) {
        console.error('Error en authService.login:', error);
        // Lanza el error para que el componente de la UI lo atrape
        throw error;
    }
};

/**
 * @service logout
 * @desc Cierra la sesión del usuario
 */
export const logout = () => {
    // Simplemente remueve el token del almacenamiento
    localStorage.removeItem('token');
};

/**
 * @service getCurrentToken
 * @desc Obtiene el token actual del localStorage
 */
export const getCurrentToken = () => {
    return localStorage.getItem('token');
};