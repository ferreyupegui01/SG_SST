// frontend/src/componentes/ModalConfirmarAccion.jsx

import React, { useState } from 'react';
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; // <-- 1. Importar

const ModalConfirmarAccion = ({ 
    titulo, 
    mensaje, 
    enConfirmar, // Esta es la función async que llama a la API
    alCerrar, 
    textoBotonConfirmar = "Confirmar", 
    claseBoton = "btn-danger" 
}) => {
    
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirmar = async () => {
        setIsLoading(true);
        try {
            await enConfirmar(); // Llama a la acción (ej. eliminarActividad)
            
            // --- 2. MOSTRAR ÉXITO (SUTIL) ---
            Swal.fire({
                title: '¡Hecho!',
                text: `La acción "${textoBotonConfirmar}" se completó exitosamente.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            
            alCerrar(); // Cierra el modal si tiene éxito
        } catch (err) {
            // --- 3. MOSTRAR ERROR ---
            Swal.fire({
                title: 'Error',
                text: err.message || 'Ocurrió un error al realizar la acción',
                icon: 'error'
            });
            setIsLoading(false); // Permite reintentar
        } 
        // No ponemos 'finally' porque solo queremos que se quite el loading en error
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{titulo}</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p>{mensaje}</p>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                    <button type="button" className={`btn ${claseBoton}`} onClick={handleConfirmar} disabled={isLoading}>
                        {isLoading ? 'Procesando...' : textoBotonConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalConfirmarAccion;