// frontend/src/services/documentService.js

import { apiFetch } from './apiService.js';
import Swal from 'sweetalert2';

/**
 * @service getContenidoCarpeta
 * @desc Obtiene las carpetas y archivos de un ID de carpeta
 */
export const getContenidoCarpeta = async (idCarpeta) => {
    return apiFetch(`/documentos/carpeta/${idCarpeta}`); 
};

/**
 * @service crearCarpeta
 * @desc Crea una nueva carpeta (CU-25)
 */
export const crearCarpeta = async (nombreCarpeta, idCarpetaPadre) => {
    return apiFetch('/documentos/carpeta', {
        method: 'POST',
        body: JSON.stringify({ nombreCarpeta, idCarpetaPadre }),
    }); 
};

/**
 * @service subirArchivos
 * @desc Sube uno o más archivos (CU-26)
 */
export const subirArchivos = async (formData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/documentos/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.msg || 'Error al subir los archivos');
    }
    return data;
};

/**
 * @service descargarDocumento
 * @desc Descarga un archivo de forma segura usando token (CU-27)
 */
export const descargarDocumento = async (idDocumento, nombreOriginal) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/documentos/descargar/${idDocumento}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        try { const errData = await response.json(); throw new Error(errData.msg || 'No se pudo descargar');} 
        // eslint-disable-next-line no-unused-vars
        catch (e) { throw new Error(`Error ${response.status}: No se pudo descargar el archivo.`); }
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreOriginal; 
    document.body.appendChild(a); 
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * @service getDocumentoBlob
 * @desc Obtiene un archivo como un Blob para visualización (Tanda 3.D)
 * @param {number} idDocumento
 */
export const getDocumentoBlob = async (idDocumento) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/documentos/stream/${idDocumento}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('No se pudo cargar el documento para visualización.');
    }
    return await response.blob();
};


/**
 * @service eliminarDocumento
 * @desc Elimina un documento (CU-28)
 */
export const eliminarDocumento = async (idDocumento) => {
    return apiFetch(`/documentos/documento/${idDocumento}`, {
        method: 'DELETE',
    }); 
};

/**
 * @service eliminarCarpeta
 * @desc Elimina una carpeta (CU-25)
 */
export const eliminarCarpeta = async (idCarpeta) => {
    return apiFetch(`/documentos/carpeta/${idCarpeta}`, {
        method: 'DELETE',
    }); 
};