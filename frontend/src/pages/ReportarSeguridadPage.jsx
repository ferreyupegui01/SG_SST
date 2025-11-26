// frontend/src/pages/ReportarSeguridadPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- 1. Importar Link
import { crearReporteSeguridad } from '../services/reportService'; 
import '../index.css'; 
import '../style/ReportarPage.css'; 
import Swal from 'sweetalert2'; // <-- Importar Swal
import { BsArrowLeftCircle } from 'react-icons/bs'; // <-- 2. Importar icono

const ReportarSeguridadPage = () => {
    // (Estados sin cambios)
    const [tipoReporte, setTipoReporte] = useState('Condicion'); 
    const [ubicacionArea, setUbicacionArea] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fotoReporte, setFotoReporte] = useState(null); 
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const [error, setError] = useState('');

    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFotoReporte(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoadingSubmit(true);

        const formData = new FormData();
        formData.append('tipoReporte', tipoReporte);
        formData.append('ubicacionArea', ubicacionArea);
        formData.append('descripcion', descripcion);
        if (fotoReporte) {
            formData.append('fotoReporte', fotoReporte);
        }

        try {
            await crearReporteSeguridad(formData);
            
            // --- 3. REEMPLAZAR 'alert()' ---
            Swal.fire({
                title: '¡Éxito!',
                text: 'Reporte de seguridad enviado exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            
            setTipoReporte('Condicion');
            setUbicacionArea('');
            setDescripcion('');
            setFotoReporte(null);
            e.target.reset(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Reportar Incidente / Condición Insegura</h1>
                {/* --- 4. AÑADIR BOTÓN DE VOLVER --- */}
                <Link to="/dashboard" className="btn btn-secondary">
                    <BsArrowLeftCircle /> Volver al Inicio
                </Link>
            </div>

            <div className="page-content-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    <p>Utilice este formulario para reportar cualquier acto, condición insegura, incidente o accidente.</p>
                    
                    {/* (Resto del formulario sin cambios) */}
                    <div className="form-group"><label htmlFor="tipoReporte">Tipo de Reporte *</label><select id="tipoReporte" name="tipoReporte" value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)} required><option value="Condicion">Condición Insegura (Ej: piso mojado, cable expuesto)</option><option value="Acto">Acto Inseguro (Ej: no usar EPP)</option><option value="Incidente">Incidente (Casi accidente)</option><option value="Accidente">Accidente</option><option value="Sugerencia">Sugerencia de Mejora</option></select></div>
                    <div className="form-group"><label htmlFor="ubicacionArea">Ubicación / Área donde ocurrió *</label><input type="text" id="ubicacionArea" name="ubicacionArea" value={ubicacionArea} onChange={(e) => setUbicacionArea(e.target.value)} placeholder="Ej: Pasillo Bodega MP, Máquina Troqueladora" required /></div>
                    <div className="form-group"><label htmlFor="descripcion">Descripción detallada de lo ocurrido *</label><textarea id="descripcion" name="descripcion" rows="5" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Sea lo más específico posible..." required /></div>
                    <div className="form-group"><label htmlFor="fotoReporte">Adjuntar Foto (Opcional)</label><input type="file" id="fotoReporte" name="fotoReporte" onChange={handleFileChange} accept=".jpg,.jpeg,.png" /></div>

                    <div className="form-footer">
                        <button type="submit" className="btn btn-primary" disabled={isLoadingSubmit}>
                            {isLoadingSubmit ? 'Enviando...' : 'Enviar Reporte de Seguridad'}
                        </button>
                    </div>
                    {error && <p className="modal-error" style={{marginTop: '1rem'}}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default ReportarSeguridadPage;