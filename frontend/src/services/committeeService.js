// frontend/src/services/committeeService.js
import { apiFetch } from './apiService';

export const crearActa = async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/actas', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Error al guardar');
    return data;
};

export const getActas = async () => {
    return apiFetch('/actas');
};

// --- NUEVA FUNCIÓN ---
export const actualizarArchivoActa = async (idActa, formData) => {
    const token = localStorage.getItem('token');
    // PUT /api/actas/:id/archivo
    const response = await fetch(`http://localhost:5000/api/actas/${idActa}/archivo`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Error al actualizar archivo');
    return data;
};