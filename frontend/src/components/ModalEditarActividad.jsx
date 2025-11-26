// frontend/src/componentes/ModalEditarActividad.jsx

import React, { useState, useEffect } from 'react';
import { editarActividad } from '../services/scheduleService';
import { getTodosUsuarios } from '../services/userService'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; // <-- 1. Importar

const ModalEditarActividad = ({ actividad, alCerrar, alExito }) => {
    const formatInputDate = (fechaISO) => {
        if (!fechaISO) return '';
        return new Date(fechaISO).toISOString().split('T')[0];
    };
    const [formData, setFormData] = useState({
        nombreActividad: '',
        idUsuarioResponsable: '',
        fechaLimite: '',
        descripcionActividad: '' 
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
        if (actividad) {
            setFormData({
                nombreActividad: actividad.NombreActividad || '',
                idUsuarioResponsable: actividad.ID_UsuarioResponsable || '',
                fechaLimite: formatInputDate(actividad.FechaLimite),
                descripcionActividad: actividad.DescripcionActividad || ''
            });
        }
        cargarUsuarios();
    }, [actividad]); 

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
            await editarActividad(actividad.ID_Actividad, payload);
            
            // --- 2. REEMPLAZAR 'alert()' ---
            Swal.fire({
                title: '¡Éxito!',
                text: 'Actividad actualizada exitosamente.',
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
                    <h2>Editar Actividad</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* (Inputs del formulario sin cambios) */}
                        <div className="form-group"><label htmlFor="nombreActividad">Nombre de la Actividad *</label><input type="text" id="nombreActividad" name="nombreActividad" value={formData.nombreActividad} onChange={handleChange} required /></div>
                        <div className="form-group"><label htmlFor="idUsuarioResponsable">Responsable *</label><select id="idUsuarioResponsable" name="idUsuarioResponsable" value={formData.idUsuarioResponsable} onChange={handleChange} required><option value="">-- Seleccione un responsable --</option>{listaUsuarios.map(user => (<option key={user.ID_Usuario} value={user.ID_Usuario}>{user.NombreCompleto}</option>))}</select></div>
                        <div className="form-group"><label htmlFor="fechaLimite">Fecha Límite *</label><input type="date" id="fechaLimite" name="fechaLimite" value={formData.fechaLimite} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required /></div>
                        <div className="form-group"><label htmlFor="descripcionActividad">Descripción (Opcional)</label><input type="text" id="descripcionActividad" name="descripcionActividad" value={formData.descripcionActividad} onChange={handleChange} /></div>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalEditarActividad;