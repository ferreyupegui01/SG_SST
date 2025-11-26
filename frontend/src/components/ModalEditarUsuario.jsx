// frontend/src/componentes/ModalEditarUsuario.jsx

import React, { useState, useEffect } from 'react';
import { editarColaborador } from '../services/userService';
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; // <-- 1. Importar

const ModalEditarUsuario = ({ usuario, alCerrar, alExito }) => {
    
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        area: '',
        cargo: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (usuario) {
            setFormData({
                nombreCompleto: usuario.NombreCompleto || '',
                area: usuario.AreaDepartamento || '',
                cargo: usuario.Cargo || ''
            });
        }
    }, [usuario]);

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
        setIsLoading(true);

        try {
            await editarColaborador(usuario.ID_Usuario, formData);
            
            // --- 2. REEMPLAZAR 'alert()' ---
            Swal.fire({
                title: '¡Éxito!',
                text: 'Usuario actualizado exitosamente.',
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
                    <h2>Editar Usuario</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Cédula (Usuario)</label>
                            <input type="text" value={usuario?.CedulaUsuario || ''} disabled />
                        </div>
                        <div className="form-group">
                            <label htmlFor="nombreCompleto">Nombre Completo *</label>
                            <input type="text" id="nombreCompleto" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="area">Área / Departamento (Opcional)</label>
                            <input type="text" id="area" name="area" value={formData.area} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cargo">Cargo (Opcional)</label>
                            <input type="text" id="cargo" name="cargo" value={formData.cargo} onChange={handleChange} />
                        </div>
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

export default ModalEditarUsuario;