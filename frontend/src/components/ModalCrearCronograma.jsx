// frontend/src/componentes/ModalCrearCronograma.jsx

import React, { useState } from 'react';
import { crearCronograma } from '../services/scheduleService';
import '../style/Modal.css';
import '../index.css';
import Swal from 'sweetalert2'; // <-- 1. Importar

const ModalCrearCronograma = ({ alCerrar, alExito }) => {
    const [formData, setFormData] = useState({
        nombreCronograma: '',
        anioAplicacion: new Date().getFullYear(),
        descripcion: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(''); // (Lo mantenemos para errores en línea)

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await crearCronograma(formData);
            
            // --- 2. REEMPLAZAR 'alert()' ---
            Swal.fire({
                title: '¡Éxito!',
                text: 'Cronograma creado exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            alExito(); 
        } catch (err) {
            setError(err.message); // Muestra el error en el modal
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Crear Nuevo Cronograma</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* (Inputs del formulario sin cambios) */}
                        <div className="form-group"><label htmlFor="nombreCronograma">Nombre del Cronograma *</label><input type="text" id="nombreCronograma" name="nombreCronograma" value={formData.nombreCronograma} onChange={handleChange} placeholder="Ej: Plan Anual SST 2025" required /></div>
                        <div className="form-group"><label htmlFor="anioAplicacion">Año de Aplicación (Opcional)</label><input type="number" id="anioAplicacion" name="anioAplicacion" value={formData.anioAplicacion} onChange={handleChange} placeholder="Ej: 2025" /></div>
                        <div className="form-group"><label htmlFor="descripcion">Descripción (Opcional)</label><input type="text" id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} /></div>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Cronograma'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCrearCronograma;