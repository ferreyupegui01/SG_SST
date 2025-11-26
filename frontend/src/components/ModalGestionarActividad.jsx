// frontend/src/componentes/ModalGestionarActividad.jsx

import React, { useState } from 'react';
import { gestionarActividad } from '../services/scheduleService';
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; // <-- 1. Importar

const ModalGestionarActividad = ({ actividad, alCerrar, alExito }) => {
    const [estado, setEstado] = useState(actividad.EstadoActividad);
    const [observaciones, setObservaciones] = useState(actividad.Observaciones || '');
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setEvidenciaFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (estado === 'Realizada' && !evidenciaFile) {
            setError('Para marcar como "Realizada", debe adjuntar un nuevo archivo de evidencia.');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('estado', estado);
        formData.append('observaciones', observaciones);
        if (evidenciaFile) {
            formData.append('evidenciaFile', evidenciaFile); 
        }

        try {
            await gestionarActividad(actividad.ID_Actividad, formData);
            
            // --- 2. REEMPLAZAR 'alert()' ---
            Swal.fire({
                title: '¡Éxito!',
                text: 'Actividad gestionada exitosamente.',
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
                    <h2>Gestionar Actividad</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <h4>{actividad.NombreActividad}</h4>
                        {/* (Inputs del formulario sin cambios) */}
                        <div className="form-group"><label htmlFor="estado">Cambiar Estado *</label><select id="estado" name="estado" value={estado} onChange={(e) => setEstado(e.target.value)} required><option value="Pendiente">Pendiente</option><option value="Realizada">Realizada</option><option value="Cancelada">Cancelada</option></select></div>
                        <div className="form-group"><label htmlFor="observaciones">Observaciones / Motivo</label><textarea id="observaciones" name="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows="3" placeholder={estado === 'Cancelada' ? 'Especifique el motivo de la cancelación' : 'Añada observaciones...'} /></div>
                        <div className="form-group"><label htmlFor="evidenciaFile">Adjuntar Evidencia (.jpg, .png, .pdf)</label><input type="file" id="evidenciaFile" name="evidenciaFile" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />{estado === 'Realizada' && !evidenciaFile && (<small style={{ color: '#f57f17' }}>Se requiere evidencia para marcar como "Realizada".</small>)}</div>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Gestión'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalGestionarActividad;