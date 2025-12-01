// backend/services/externalApiService.js
import axios from 'axios';

// No necesitamos API Key para localhost por ahora
const API_URL = process.env.EXTERNAL_API_URL || 'http://localhost:4000/api/gosen';

export const buscarEnDirectorioExterno = async (termino) => {
    try {
        // Petición al microservicio: GET http://localhost:4000/api/gosen/empleados?q=...
        const response = await axios.get(`${API_URL}/empleados`, {
            params: { q: termino },
            timeout: 3000 // Si en 3 seg no responde, cancelamos
        });
        return response.data;
    } catch (error) {
        console.error("Error llamando a API Gosen (Búsqueda):", error.message);
        return []; // Retorna vacío si falla la conexión
    }
};

// --- NUEVA FUNCIÓN PARA PESV ---
export const obtenerConductoresGosen = async () => {
    try {
        const response = await axios.get(`${API_URL}/conductores-activos`, {
            timeout: 5000 
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo conductores de Gosen:", error.message);
        return []; 
    }
};