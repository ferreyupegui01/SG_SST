// frontend/src/componentes/ModalCrearACPM.jsx

import React, { useState, useEffect } from 'react';
import { crearACPM } from '../services/acpmService'; 
import { getTodosUsuarios } from '../services/userService'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; 

/**
 * @component ModalCrearACPM
 * @desc Modal con formulario para crear una nueva ACPM (CU-03)
 * @param {function} alCerrar - Función para cerrar el modal
 * @param {function} alExito - Función que se llama si se crea exitosamente (devuelve el nuevo ID)
 * @param {object} initialData - (Opcional) Datos para pre-llenar el formulario
 */
const ModalCrearACPM = ({ alCerrar, alExito, initialData = {} }) => {
    
    // --- Estados del Formulario ---
    const [formData, setFormData] = useState({
        tipoAccion: initialData.tipoAccion || 'Correctiva', 
        origen: initialData.origen || '',
        descripcionProblema: initialData.descripcionProblema || '',
        planAccion: '',
        idUsuarioResponsable: '', // (Se carga desde el selector)
        fechaLimite: new Date().toISOString().split('T')[0], 
        analisisCausa: '',
        idInspeccionOrigen: initialData.idInspeccionOrigen || null,
        idReporteMaquinaOrigen: initialData.idReporteMaquinaOrigen || null,
        idReporteSeguridadOrigen: initialData.idReporteSeguridadOrigen || null,
    });
    
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Cargar Usuarios para el Selector ---
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
    }, []); // Se ejecuta solo una vez al montar

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // --- Validación (Bug de NaN) ---
        const idResponsableNum = parseInt(formData.idUsuarioResponsable);
        if (!idResponsableNum) {
            setError('Debe seleccionar un responsable válido.');
            return;
        }

        setIsLoading(true);

        try {
            const payload = { 
                ...formData, 
                idUsuarioResponsable: idResponsableNum // Envía el número
            };
            
            const respuesta = await crearACPM(payload);
            const nuevoIdACPM = respuesta.idACPM; // Obtenemos el ID
            
            Swal.fire({
                title: '¡Éxito!',
                text: 'Acción ACPM creada exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            
            alExito(nuevoIdACPM); // Devolvemos el ID al padre
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Crear Nueva Acción (ACPM)</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        
                        <div className="form-group"><label htmlFor="tipoAccion">Tipo de Acción *</label><select id="tipoAccion" name="tipoAccion" value={formData.tipoAccion} onChange={handleChange}><option value="Correctiva">Correctiva</option><option value="Preventiva">Preventiva</option><option value="Mejora">Mejora</option></select></div>
                        <div className="form-group"><label htmlFor="origen">Origen del Hallazgo *</label><input type="text" id="origen" name="origen" value={formData.origen} onChange={handleChange} placeholder="Ej: Inspección Extintores, Reporte Colaborador..." required /></div>
                        <div className="form-group"><label htmlFor="descripcionProblema">Descripción del Problema/Hallazgo *</label><textarea id="descripcionProblema" name="descripcionProblema" rows="3" value={formData.descripcionProblema} onChange={handleChange} required /></div>
                        <div className="form-group"><label htmlFor="planAccion">Plan de Acción *</label><textarea id="planAccion" name="planAccion" rows="3" value={formData.planAccion} onChange={handleChange} required /></div>
                        
                        <div className="form-group">
                            <label htmlFor="idUsuarioResponsable">Responsable de la Ejecución *</label>
                            <select id="idUsuarioResponsable" name="idUsuarioResponsable" value={formData.idUsuarioResponsable} onChange={handleChange} required>
                                <option value="">-- Seleccione un responsable --</option>
                                {listaUsuarios.map(user => (
                                    <option key={user.ID_Usuario} value={user.ID_Usuario}>
                                        {user.NombreCompleto}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group"><label htmlFor="fechaLimite">Fecha Límite *</label><input type="date" id="fechaLimite" name="fechaLimite" value={formData.fechaLimite} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required /></div>
                        <div className="form-group"><label htmlFor="analisisCausa">Análisis de Causa (Opcional)</label><textarea id="analisisCausa" name="analisisCausa" rows="3" value={formData.analisisCausa} onChange={handleChange} /></div>

                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Acción'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCrearACPM;