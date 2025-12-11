// frontend/src/services/committeeService.js
import { apiFetch, apiFetchBlob } from './apiService';

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

export const actualizarArchivoActa = async (idActa, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/actas/${idActa}/archivo`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Error al actualizar archivo');
    return data;
};

// --- NUEVAS FUNCIONES ---

export const subirFirmasActa = async (idActa, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/actas/${idActa}/firmas`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Error al subir firmas');
    return data;
};

export const descargarActa = async (idActa, tipo) => {
    // Tipo puede ser 'original' o 'firmas'
    return apiFetchBlob(`/actas/${idActa}/download?tipo=${tipo}`);
};