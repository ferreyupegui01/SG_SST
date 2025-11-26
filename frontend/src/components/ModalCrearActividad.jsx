// frontend/src/componentes/ModalCrearActividad.jsx

import React, { useState, useEffect } from 'react';
import { crearActividad } from '../services/scheduleService';
import { getTodosUsuarios } from '../services/userService'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; // <-- 1. Importar

const ModalCrearActividad = ({ idCronograma, alCerrar, alExito }) => {
    const getManana = () => {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        return manana.toISOString().split('T')[0];
    };
    const [formData, setFormData] = useState({
        nombreActividad: '',
        idUsuarioResponsable: '',
        fechaLimite: getManana(),
        descripcion: ''
    });
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarUsuarios = async () => {
            try {
                const data = await getTodosUsuarios();
                setListaUsuarios(data);
            } catch (err) {
                console.error("Error cargando usuarios:", err);
                setError("No se pudo cargar la lista de responsables");
            }
        };
        cargarUsuarios();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const payload = { ...formData, idUsuarioResponsable: parseInt(formData.idUsuarioResponsable) };
            await crearActividad(idCronograma, payload);
            
            // --- 2. REEMPLAZAR 'alert()' ---
            Swal.fire({
                title: '¡Éxito!',
                text: 'Actividad creada exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            alExito(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Añadir Nueva Actividad</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* (Inputs del formulario sin cambios) */}
                        <div className="form-group"><label htmlFor="nombreActividad">Nombre de la Actividad *</label><input type="text" id="nombreActividad" name="nombreActividad" value={formData.nombreActividad} onChange={handleChange} placeholder="Ej: Capacitación Uso de EPP" required /></div>
                        <div className="form-group"><label htmlFor="idUsuarioResponsable">Responsable *</label><select id="idUsuarioResponsable" name="idUsuarioResponsable" value={formData.idUsuarioResponsable} onChange={handleChange} required><option value="">-- Seleccione un responsable --</option>{listaUsuarios.map(user => (<option key={user.ID_Usuario} value={user.ID_Usuario}>{user.NombreCompleto}</option>))}</select></div>
                        <div className="form-group"><label htmlFor="fechaLimite">Fecha Límite *</label><input type="date" id="fechaLimite" name="fechaLimite" value={formData.fechaLimite} onChange={handleChange} min={getManana()} required /></div>
                        <div className="form-group"><label htmlFor="descripcion">Descripción (Opcional)</label><input type="text" id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} /></div>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creando...' : 'Añadir Actividad'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCrearActividad;