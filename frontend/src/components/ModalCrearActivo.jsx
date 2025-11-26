// frontend/src/components/ModalCrearActivo.jsx

import React, { useState, useEffect } from 'react';
import { crearActivo, getTiposActivosDisponibles } from '../services/assetService';
import { getColaboradores } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import '../style/Modal.css';
import '../index.css';
import Swal from 'sweetalert2';

const ModalCrearActivo = ({ alCerrar, alExito }) => {
    // eslint-disable-next-line no-unused-vars
    const { usuario } = useAuth(); 

    const [formData, setFormData] = useState({
        tipoActivo: '',
        codigoIdentificador: '',
        nombreDescriptivo: '',
        ubicacion: '',
        // Campos extra para Vehículos
        marca: '',
        modelo: '',
        soatVencimiento: '',
        tecnoVencimiento: '',
        kilometrajeInicial: 0,
        idConductor: ''
    });

    const [listaTipos, setListaTipos] = useState([]); // Array de objetos { TipoActivoAsociado, Categoria }
    const [listaConductores, setListaConductores] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 1. Cargar Tipos (Ahora trae la categoría)
                const tipos = await getTiposActivosDisponibles();
                setListaTipos(tipos);
                
                // Pre-seleccionar el primer tipo si existe
                if (tipos.length > 0) {
                    setFormData(prev => ({ ...prev, tipoActivo: tipos[0].TipoActivoAsociado }));
                }

                // 2. Cargar Usuarios (Para asignar como conductores)
                const users = await getColaboradores(); 
                setListaConductores(users);

            } catch (err) {
                console.error("Error cargando datos:", err);
                setError('Error cargando las listas de configuración.');
            }
        };
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    // --- LÓGICA INTELIGENTE ---
    // Busca el objeto completo en la lista para ver su categoría
    const esVehiculo = () => {
        const tipoSeleccionado = listaTipos.find(t => t.TipoActivoAsociado === formData.tipoActivo);
        // Si la categoría en BD es 'Vehiculo', mostramos los campos
        return tipoSeleccionado?.Categoria === 'Vehiculo';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Preparar payload: Limpiar datos numéricos si están vacíos
            const payload = {
                ...formData,
                kilometrajeInicial: formData.kilometrajeInicial || 0,
                idConductor: formData.idConductor || null
            };

            await crearActivo(payload);
            
            Swal.fire({
                title: '¡Éxito!',
                text: 'Activo creado exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            alExito(); 
            
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>Crear Nuevo Activo</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                        
                        <div className="form-group">
                            <label htmlFor="tipoActivo">Tipo de Activo *</label>
                            {listaTipos.length === 0 ? (
                                <p style={{color: 'orange'}}>Cargando tipos...</p>
                            ) : (
                                <select 
                                    id="tipoActivo" 
                                    name="tipoActivo" 
                                    value={formData.tipoActivo} 
                                    onChange={handleChange} 
                                    required
                                >
                                    {listaTipos.map((t, index) => (
                                        <option key={index} value={t.TipoActivoAsociado}>{t.TipoActivoAsociado}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* CAMPOS COMUNES */}
                        <div className="form-group">
                            <label>{esVehiculo() ? 'Placa del Vehículo *' : 'Código Identificador *'}</label>
                            <input type="text" name="codigoIdentificador" value={formData.codigoIdentificador} onChange={handleChange} placeholder={esVehiculo() ? "Ej: ABC-123" : "Ej: MAQ-01"} required />
                        </div>
                        <div className="form-group">
                            <label>Nombre Descriptivo *</label>
                            <input type="text" name="nombreDescriptivo" value={formData.nombreDescriptivo} onChange={handleChange} placeholder={esVehiculo() ? "Ej: Camioneta N300 - Repartos" : "Ej: Taladro de Banco"} required />
                        </div>
                        <div className="form-group">
                            <label>Ubicación / Área</label>
                            <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ej: Parqueadero / Bodega" />
                        </div>

                        {/* --- SECCIÓN DINÁMICA DE VEHÍCULOS --- */}
                        {esVehiculo() && (
                            <div style={{backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #dee2e6', marginTop: '1rem'}}>
                                <h4 style={{marginTop:0, color: 'var(--color-primario)', borderBottom: '1px solid #ddd', paddingBottom: '5px'}}>Datos del Vehículo</h4>
                                
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <div className="form-group" style={{flex: 1}}>
                                        <label>Marca</label>
                                        <input type="text" name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej: Chevrolet" />
                                    </div>
                                    <div className="form-group" style={{flex: 1}}>
                                        <label>Modelo</label>
                                        <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej: 2024" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Conductor Asignado</label>
                                    <select name="idConductor" value={formData.idConductor} onChange={handleChange}>
                                        <option value="">-- Sin asignar --</option>
                                        {listaConductores.map(u => (
                                            <option key={u.ID_Usuario} value={u.ID_Usuario}>{u.NombreCompleto} ({u.CedulaUsuario})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Kilometraje Inicial</label>
                                    <input type="number" name="kilometrajeInicial" value={formData.kilometrajeInicial} onChange={handleChange} placeholder="0" />
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
                        {/* --- FIN SECCIÓN VEHÍCULOS --- */}

                        {error && <p className="modal-error">{error}</p>}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Creando...' : 'Crear Activo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCrearActivo;