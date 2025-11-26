// frontend/src/componentes/ModalGestionarACPM.jsx
import React, { useState } from 'react';
import { gestionarACPM } from '../services/acpmService';
import '../style/Modal.css';
import '../index.css';
import '../style/InspeccionesPage.css'; 
import Swal from 'sweetalert2'; // <-- Importar

const ModalGestionarACPM = ({ acpm, alCerrar, alExito }) => {
    const [estadoACPM, setEstadoACPM] = useState(acpm.EstadoACPM);
    const [comentariosSeguimiento, setComentariosSeguimiento] = useState(''); 
    const [evidenciaCierre, setEvidenciaCierre] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const handleFileChange = (e) => { setEvidenciaCierre(e.target.files[0]); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (estadoACPM === 'Cerrada' && !evidenciaCierre) {
            setError('Se requiere un archivo de evidencia para cerrar la acción.');
            return;
        }
        setIsLoading(true);
        const formData = new FormData();
        formData.append('estadoACPM', estadoACPM);
        formData.append('comentariosSeguimiento', comentariosSeguimiento);
        if (evidenciaCierre) { formData.append('evidenciaCierre', evidenciaCierre); }
        try {
            await gestionarACPM(acpm.ID_ACPM, formData);
            Swal.fire({ title: '¡Éxito!', text: 'Acción ACPM gestionada exitosamente.', icon: 'success', timer: 2000, showConfirmButton: false });
            alExito(); 
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}><div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Gestionar Acción ACPM (ID: {acpm.ID_ACPM})</h2><button onClick={alCerrar} className="modal-close-button">&times;</button></div>
            <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className="detail-section"><strong>Descripción del Problema:</strong><p className="detail-box">{acpm.DescripcionProblema}</p></div>
                    {acpm.ComentariosSeguimiento && ( <div className="detail-section"><strong>Historial de Seguimiento:</strong><pre className="detail-box" style={{ fontFamily: 'inherit', fontSize: '0.9rem' }}>{acpm.ComentariosSeguimiento}</pre></div> )}
                    <div className="form-group"><label htmlFor="estadoACPM">Cambiar Estado *</label><select id="estadoACPM" name="estadoACPM" value={estadoACPM} onChange={(e) => setEstadoACPM(e.target.value)} required><option value="Abierta">Abierta</option><option value="En Proceso">En Proceso</option><option value="Cerrada">Cerrada</option></select></div>
                    <div className="form-group"><label htmlFor="comentariosSeguimiento">Añadir Nuevo Comentario de Seguimiento</label><textarea id="comentariosSeguimiento" name="comentariosSeguimiento" value={comentariosSeguimiento} onChange={(e) => setComentariosSeguimiento(e.target.value)} rows="3" placeholder="Añada aquí el nuevo seguimiento..." /></div>
                    <div className="form-group"><label htmlFor="evidenciaCierre">Adjuntar Evidencia (Cierre o Seguimiento)</label><input type="file" id="evidenciaCierre" name="evidenciaCierre" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />{estadoACPM === 'Cerrada' && !evidenciaCierre && (<small style={{ color: '#D32F2F', fontWeight: 'bold' }}>¡Obligatorio para cerrar!</small>)}</div>
                    {error && <p className="modal-error">{error}</p>}
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Gestión'}</button></div>
            </form>
        </div></div>
    );
};
export default ModalGestionarACPM;