// frontend/src/components/ModalCrearMantenimiento.jsx
import React, { useState } from 'react';
import { crearMantenimiento } from '../services/pesvService';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await crearMantenimiento(form);
            Swal.fire('Registrado', 'Mantenimiento guardado exitosamente.', 'success');
            alExito();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
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
                    <div className="modal-body" style={{maxHeight:'60vh', overflowY:'auto'}}>
                        <div className="form-group">
                            <label>Vehículo</label>
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
                                <label>Fecha</label>
                                <input type="date" className="form-control" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Kilometraje al momento</label>
                            <input type="number" className="form-control" required value={form.kilometraje} onChange={e => setForm({...form, kilometraje: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Descripción del trabajo</label>
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
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Registrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCrearMantenimiento;