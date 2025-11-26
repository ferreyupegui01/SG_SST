// frontend/src/components/ModalEditarActivo.jsx

import React, { useState, useEffect } from 'react';
import { actualizarActivo, getTiposActivosDisponibles } from '../services/assetService';
import { getColaboradores } from '../services/userService';
import '../style/Modal.css';
import '../index.css';
import Swal from 'sweetalert2';

const ModalEditarActivo = ({ activo, alCerrar, alExito }) => {
    
    const formatInputDate = (isoString) => {
        if (!isoString) return '';
        return isoString.split('T')[0];
    };

    const [formData, setFormData] = useState({
        tipoActivo: '',
        codigoIdentificador: '',
        nombreDescriptivo: '',
        ubicacion: '',
        marca: '',
        modelo: '',
        idConductor: '',
        soatVencimiento: '',
        tecnoVencimiento: ''
    });

    const [listaTipos, setListaTipos] = useState([]);
    const [listaConductores, setListaConductores] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const TIPOS_VEHICULO = ['Vehiculo', 'Moto', 'Montacarga'];

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [tipos, users] = await Promise.all([
                    getTiposActivosDisponibles(),
                    getColaboradores()
                ]);
                setListaTipos(tipos);
                setListaConductores(users);

                if (activo) {
                    setFormData({
                        tipoActivo: activo.TipoActivo,
                        codigoIdentificador: activo.CodigoIdentificador,
                        nombreDescriptivo: activo.NombreDescriptivo,
                        ubicacion: activo.Ubicacion || '',
                        marca: activo.Marca || '',
                        modelo: activo.Modelo || '',
                        idConductor: buscarIdConductor(users, activo.NombreConductor),
                        soatVencimiento: formatInputDate(activo.SOAT_Vencimiento),
                        tecnoVencimiento: formatInputDate(activo.Tecno_Vencimiento)
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };
        cargarDatos();
    }, [activo]);

    const buscarIdConductor = (users, nombre) => {
        if (!nombre) return '';
        const user = users.find(u => u.NombreCompleto === nombre);
        return user ? user.ID_Usuario : '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const esVehiculo = () => TIPOS_VEHICULO.includes(formData.tipoActivo);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await actualizarActivo(activo.ID_Activo, formData);
            Swal.fire('Actualizado', 'Activo actualizado correctamente.', 'success');
            alExito(); 
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Activo</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{maxHeight:'70vh', overflowY:'auto'}}>
                        
                        <div className="form-group">
                            <label>Tipo de Activo</label>
                            <select name="tipoActivo" value={formData.tipoActivo} onChange={handleChange} required>
                                {listaTipos.map((t, i) => (
                                    // Manejo para si viene como objeto o string
                                    <option key={i} value={t.TipoActivoAsociado || t}>{t.TipoActivoAsociado || t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>{esVehiculo() ? 'Placa *' : 'Código *'}</label>
                            <input type="text" name="codigoIdentificador" value={formData.codigoIdentificador} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Nombre Descriptivo *</label>
                            <input type="text" name="nombreDescriptivo" value={formData.nombreDescriptivo} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Ubicación</label>
                            <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} />
                        </div>

                        {esVehiculo() && (
                            <div style={{backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #dee2e6', marginTop: '1rem'}}>
                                <h4 style={{marginTop:0, color: 'var(--color-primario)', borderBottom: '1px solid #ddd'}}>Datos del Vehículo</h4>
                                
                                <div style={{display:'flex', gap:'10px'}}>
                                    <div className="form-group" style={{flex:1}}>
                                        <label>Marca</label>
                                        <input type="text" name="marca" value={formData.marca} onChange={handleChange} />
                                    </div>
                                    <div className="form-group" style={{flex:1}}>
                                        <label>Modelo</label>
                                        <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Conductor Asignado</label>
                                    <select name="idConductor" value={formData.idConductor} onChange={handleChange}>
                                        <option value="">-- Sin Asignar --</option>
                                        {listaConductores.map(u => (
                                            <option key={u.ID_Usuario} value={u.ID_Usuario}>{u.NombreCompleto}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{display: 'flex', gap: '10px'}}>
                                    <div className="form-group" style={{flex: 1}}>
                                        <label>Vencimiento SOAT</label>
                                        <input type="date" name="soatVencimiento" value={formData.soatVencimiento} onChange={handleChange} />
                                    </div>
                                    <div className="form-group" style={{flex: 1}}>
                                        <label>Venc. Tecnomecánica</label>
                                        <input type="date" name="tecnoVencimiento" value={formData.tecnoVencimiento} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        )}

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

export default ModalEditarActivo;