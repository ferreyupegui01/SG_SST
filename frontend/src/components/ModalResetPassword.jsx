// frontend/src/componentes/ModalResetPassword.jsx

import React, { useState } from 'react';
import { resetPasswordColaborador } from '../services/userService';
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; // <-- Importar

const ModalResetPassword = ({ usuario, alCerrar, alExito }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { 
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        setIsLoading(true);
        try {
            await resetPasswordColaborador(usuario.ID_Usuario, password);
            
            // --- REEMPLAZAR 'alert()' ---
            Swal.fire({
                title: '¡Contraseña Actualizada!',
                text: `Por favor, informa al colaborador su nueva contraseña temporal: ${password}`,
                icon: 'success',
                confirmButtonText: 'Entendido'
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
                    <h2>Resetear Contraseña</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p>Estás asignando una nueva contraseña temporal para <strong>{usuario.NombreCompleto}</strong>.</p>
                        <div className="form-group">
                            <label htmlFor="password">Nueva Contraseña Temporal *</label>
                            <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Asignar Contraseña'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalResetPassword;