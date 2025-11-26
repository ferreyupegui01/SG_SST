// frontend/src/components/ModalGuardarPaso.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import '../style/Modal.css';
import Swal from 'sweetalert2';

const ModalGuardarPaso = ({ paso, alCerrar, alExito }) => {
    const [form, setForm] = useState({
        numeroPaso: '',
        nombrePaso: '',
        descripcionNorma: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (paso) {
            setForm({
                numeroPaso: paso.NumeroPaso,
                nombrePaso: paso.NombrePaso,
                descripcionNorma: paso.DescripcionNorma
            });
        }
    }, [paso]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const url = paso ? '/pesv/pasos/editar' : '/pesv/pasos/crear';
            const method = paso ? 'PUT' : 'POST';
            // Si es edición enviamos el ID, si es nuevo no
            const body = paso ? { idPaso: paso.ID_Paso, ...form } : form;

            await apiFetch(url, { method, body: JSON.stringify(body) });
            
            Swal.fire('Éxito', `Paso ${paso ? 'actualizado' : 'creado'} correctamente`, 'success');
            alExito();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{paso ? 'Editar Paso' : 'Crear Nuevo Paso'}</h3>
                    <button className="modal-close-button" onClick={alCerrar}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Número de Paso (Orden) *</label>
                            <input type="number" name="numeroPaso" className="form-control" required 
                                value={form.numeroPaso} onChange={handleChange} placeholder="Ej: 25" />
                        </div>
                        <div className="form-group">
                            <label>Nombre del Paso / Requisito *</label>
                            <textarea name="nombrePaso" className="form-control" required rows="2" 
                                value={form.nombrePaso} onChange={handleChange} placeholder="Ej: Plan de fatiga" />
                        </div>
                        <div className="form-group">
                            <label>Normativa / Descripción Legal</label>
                            <input type="text" name="descripcionNorma" className="form-control" 
                                value={form.descripcionNorma} onChange={handleChange} placeholder="Ej: Art 2.2.4.6.X" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalGuardarPaso;