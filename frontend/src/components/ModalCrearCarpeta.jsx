// frontend/src/componentes/ModalCrearCarpeta.jsx
import React, { useState } from 'react';
import { crearCarpeta } from '../services/documentService';
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; // <-- Importar

const ModalCrearCarpeta = ({ idCarpetaPadre, alCerrar, alExito }) => {
    const [nombreCarpeta, setNombreCarpeta] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setIsLoading(true);
        try {
            await crearCarpeta(nombreCarpeta, idCarpetaPadre);
            Swal.fire({ title: '¡Éxito!', text: 'Carpeta creada exitosamente.', icon: 'success', timer: 2000, showConfirmButton: false });
            alExito(); 
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={alCerrar}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Crear Nueva Carpeta</h2><button onClick={alCerrar} className="modal-close-button">&times;</button></div>
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="form-group"><label htmlFor="nombreCarpeta">Nombre de la Carpeta *</label><input type="text" id="nombreCarpeta" name="nombreCarpeta" value={nombreCarpeta} onChange={(e) => setNombreCarpeta(e.target.value)} autoFocus required /></div>
                    {error && <p className="modal-error">{error}</p>}
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Carpeta'}</button></div>
            </form>
        </div></div>
    );
};
export default ModalCrearCarpeta;