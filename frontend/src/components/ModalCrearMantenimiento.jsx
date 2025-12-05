// frontend/src/components/ModalCrearMantenimiento.jsx

import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { crearMantenimiento } from '../services/pesvService'; // Asegúrate que esta función acepte FormData o modifícala si es necesario
import '../style/Modal.css';
import Swal from 'sweetalert2';

const ModalCrearMantenimiento = ({ vehiculos, alCerrar, alExito }) => {
    const [form, setForm] = useState({
        idActivo: '',
        tipo: 'Preventivo',
        fecha: new Date().toISOString().split('T')[0],
        kilometraje: '',
        descripcion: '',
        taller: '',
        costo: 0
    });
    
    // Estado para el archivo
    const [archivo, setArchivo] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        // Usamos FormData para enviar archivo + datos
        const formData = new FormData();
        formData.append('idActivo', form.idActivo);
        formData.append('tipo', form.tipo);
        formData.append('fecha', form.fecha);
        formData.append('kilometraje', form.kilometraje);
        formData.append('descripcion', form.descripcion);
        formData.append('taller', form.taller);
        formData.append('costo', form.costo);
        
        if (archivo) {
            formData.append('evidencia', archivo);
        }

        try {
            // NOTA: crearMantenimiento en pesvService debe cambiarse ligeramente 
            // para aceptar el segundo argumento o manejar que le pasamos formData directo.
            // Para asegurar, llamamos a la API directamente aquí o ajustamos el servicio.
            // Opción Mejor: Ajustar el servicio abajo. Aquí asumimos que el servicio ya lo soporta.
            
            // Si tu servicio 'crearMantenimiento' usa apiFetch con JSON, fallará con FormData.
            // Haremos el fetch aquí directo para garantizar compatibilidad rápida.
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/pesv/mantenimientos', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // NO poner Content-Type
                body: formData
            });

            if(response.ok) {
                Swal.fire('Registrado', 'Mantenimiento guardado exitosamente.', 'success');
                alExito();
            } else {
                throw new Error('Error al guardar');
            }

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Registrar Mantenimiento</h3>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{maxHeight:'70vh', overflowY:'auto'}}>
                        <div className="form-group">
                            <label>Vehículo *</label>
                            <select className="form-control" required value={form.idActivo} onChange={e => setForm({...form, idActivo: e.target.value})}>
                                <option value="">-- Seleccione --</option>
                                {vehiculos.map(v => <option key={v.ID_Activo} value={v.ID_Activo}>{v.NombreDescriptivo} ({v.CodigoIdentificador})</option>)}
                            </select>
                        </div>
                        <div style={{display:'flex', gap:'1rem'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label>Tipo</label>
                                <select className="form-control" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                                    <option>Preventivo</option>
                                    <option>Correctivo</option>
                                </select>
                            </div>
                            <div className="form-group" style={{flex:1}}>
                                <label>Fecha *</label>
                                <input type="date" className="form-control" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Kilometraje al momento *</label>
                            <input type="number" className="form-control" required value={form.kilometraje} onChange={e => setForm({...form, kilometraje: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Descripción del trabajo *</label>
                            <textarea className="form-control" rows="3" required value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
                        </div>
                        <div style={{display:'flex', gap:'1rem'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label>Taller / Proveedor</label>
                                <input type="text" className="form-control" value={form.taller} onChange={e => setForm({...form, taller: e.target.value})} />
                            </div>
                            <div className="form-group" style={{flex:1}}>
                                <label>Costo Total ($)</label>
                                <input type="number" className="form-control" value={form.costo} onChange={e => setForm({...form, costo: e.target.value})} />
                            </div>
                        </div>

                        {/* --- CAMPO PARA SUBIR EVIDENCIA --- */}
                        <div className="form-group" style={{marginTop:'1rem', background:'#f8f9fa', padding:'10px', borderRadius:'8px'}}>
                            <label>Adjuntar Factura / Reporte (Opcional)</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setArchivo(e.target.files[0])}
                            />
                        </div>

                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCrearMantenimiento;