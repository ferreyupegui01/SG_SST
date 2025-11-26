// frontend/src/componentes/ModalCrearUsuario.jsx

import React, { useState, useEffect } from 'react';
import { crearColaborador, getRoles } from '../services/userService'; // Importamos getRoles
import { useAuth } from '../context/AuthContext'; // Importamos el contexto
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; 

const ModalCrearUsuario = ({ alCerrar, alExito }) => {
    const { usuario } = useAuth(); // Datos del usuario logueado

    const [formData, setFormData] = useState({
        nombreCompleto: '', cedula: '', password: '',
        idRol: '', area: '', cargo: ''
    });
    const [rolesDisponibles, setRolesDisponibles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Cargar roles al iniciar
    useEffect(() => {
        const cargarRoles = async () => {
            try {
                const rolesData = await getRoles();
                
                // Lógica de permisos:
                if (usuario.rol === 'Super Admin') {
                    // Super Admin ve todos los roles
                    setRolesDisponibles(rolesData);
                } else {
                    // Admin SST solo puede crear Colaboradores (Rol ID 2, o por nombre)
                    const rolColaborador = rolesData.filter(r => r.NombreRol === 'Colaborador');
                    setRolesDisponibles(rolColaborador);
                    
                    // Seleccionar automáticamente si solo hay una opción
                    if (rolColaborador.length > 0) {
                        setFormData(prev => ({ ...prev, idRol: rolColaborador[0].ID_Rol }));
                    }
                }
            } catch (err) {
                console.error("Error al cargar roles", err);
                setError("No se pudieron cargar los roles.");
            }
        };
        cargarRoles();
    }, [usuario]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.idRol) {
            setError('El rol es obligatorio.');
            return;
        }

        setIsLoading(true);
        try {
            const payload = { ...formData, idRol: parseInt(formData.idRol) };
            await crearColaborador(payload);
            
            Swal.fire({
                title: '¡Éxito!',
                text: 'Usuario creado exitosamente.',
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
                    <h2>Crear Nuevo Usuario</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="nombreCompleto">Nombre Completo *</label>
                            <input type="text" id="nombreCompleto" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cedula">Cédula (Usuario) *</label>
                            <input type="text" id="cedula" name="cedula" value={formData.cedula} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Contraseña Temporal *</label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        
                        {/* Selector de Rol Dinámico */}
                        <div className="form-group">
                            <label htmlFor="idRol">Rol del Usuario *</label>
                            <select id="idRol" name="idRol" value={formData.idRol} onChange={handleChange} required>
                                <option value="">-- Seleccione un Rol --</option>
                                {rolesDisponibles.map(rol => (
                                    <option key={rol.ID_Rol} value={rol.ID_Rol}>{rol.NombreRol}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="area">Área / Departamento (Opcional)</label>
                            <input type="text" id="area" name="area" value={formData.area} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cargo">Cargo (Opcional)</label>
                            <input type="text" id="cargo" name="cargo" value={formData.cargo} onChange={handleChange} />
                        </div>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Usuario'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCrearUsuario;