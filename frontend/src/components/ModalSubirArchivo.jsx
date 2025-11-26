// frontend/src/componentes/ModalSubirArchivo.jsx
import React, { useState } from 'react';
import { subirArchivos } from '../services/documentService';
import '../style/Modal.css';
import '../index.css';
import { BsFileEarmarkArrowUpFill } from 'react-icons/bs';
import Swal from 'sweetalert2'; // <-- Importar

const ModalSubirArchivo = ({ idCarpetaDestino, alCerrar, alExito }) => {
    const [archivos, setArchivos] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const handleFileChange = (e) => { setArchivos(e.target.files); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (!archivos || archivos.length === 0) { setError('Por favor, seleccione al menos un archivo.'); return; }
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('idCarpeta', idCarpetaDestino);
            for (let i = 0; i < archivos.length; i++) { formData.append('archivos', archivos[i]); }
            
            const resultado = await subirArchivos(formData); // Captura el mensaje de éxito
            
            Swal.fire({ title: '¡Éxito!', text: resultado.msg || 'Archivos subidos exitosamente.', icon: 'success', timer: 2000, showConfirmButton: false });
            alExito(); 
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Subir Documentos</h2><button onClick={alCerrar} className="modal-close-button">&times;</button></div>
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="form-group"><label htmlFor="archivos">Seleccione archivos (PDF, Word, Excel, XML)</label><input type="file" id="archivos" name="archivos" onChange={handleFileChange} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/xml,text/xml" /></div>
                    {archivos && archivos.length > 0 && (<div style={{fontSize: '0.9rem'}}><strong>Archivos seleccionados:</strong><ul>{Array.from(archivos).map(file => (<li key={file.name}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>))}</ul></div>)}
                    {error && <p className="modal-error">{error}</p>}
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={isLoading}><BsFileEarmarkArrowUpFill /> {isLoading ? 'Subiendo...' : 'Subir Archivos'}</button></div>
            </form>
        </div></div>
    );
};
export default ModalSubirArchivo;