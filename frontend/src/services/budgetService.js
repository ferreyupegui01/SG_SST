import { apiFetch } from './apiService';

export const getPresupuestos = async (anio) => {
    return apiFetch(`/presupuesto?anio=${anio}`);
};

export const getDetalleGastos = async (idPresupuesto) => {
    return apiFetch(`/presupuesto/${idPresupuesto}/gastos`);
};

export const crearPresupuesto = async (datos) => {
    return apiFetch('/presupuesto/asignar', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
};

export const registrarGasto = async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/presupuesto/gastar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Sin Content-Type por ser FormData
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Error registrando gasto');
    return data;
};

export const editarPresupuesto = async (id, datos) => {
    return apiFetch(`/presupuesto/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
};

export const eliminarPresupuesto = async (id) => {
    return apiFetch(`/presupuesto/${id}`, {
        method: 'DELETE'
    });
};