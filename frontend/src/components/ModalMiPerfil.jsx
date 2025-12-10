// frontend/src/components/ModalMiPerfil.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import '../style/Modal.css';
import Swal from 'sweetalert2';
import { BsEnvelopeAt, BsInfoCircle } from 'react-icons/bs';

const ModalMiPerfil = ({ alCerrar }) => {
    const { usuario, logout } = useAuth();
    
    // Estado inicial del correo
    const [email, setEmail] = useState(usuario.email || '');
    const [isLoading, setIsLoading] = useState(false);

    // Verificar Rol
    const esColaborador = usuario?.rol === 'Colaborador';

    useEffect(() => {
        if (usuario && usuario.email) {
            setEmail(usuario.email);
        }
    }, [usuario]);

    const handleGuardar = async (e) => {
        e.preventDefault();
        
        // Doble seguridad: Si es colaborador, no hace nada
        if (esColaborador) return;

        if (!email.includes('@') || !email.includes('.')) {
            Swal.fire('Error', 'Ingrese un correo válido', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await apiFetch('/usuarios/perfil/email', {
                method: 'PATCH',
                body: JSON.stringify({ email })
            });

            Swal.fire({
                title: '¡Correo Guardado!',
                text: 'Para aplicar los cambios, reinicia tu sesión.',
                icon: 'success',
                confirmButtonText: 'Cerrar Sesión Ahora',
                confirmButtonColor: '#005A5B',
                showCancelButton: true,
                cancelButtonText: 'Hacerlo luego'
            }).then((result) => {
                if (result.isConfirmed) {
                    logout(); 
                } else {
                    alCerrar(); 
                }
            });

        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message || 'No se pudo guardar', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:'450px'}}>
                <div className="modal-header">
                    <h2>Mi Perfil</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                <form onSubmit={handleGuardar}>
                    <div className="modal-body">
                        
                        {/* Tarjeta de Usuario Visual */}
                        <div style={{
                            textAlign:'center', marginBottom:'1.5rem', padding:'1rem', 
                            backgroundColor:'#f8f9fa', borderRadius:'8px', border:'1px solid #eee'
                        }}>
                            <div style={{
                                width:'70px', height:'70px', backgroundColor:'#005A5B', 
                                borderRadius:'50%', margin:'0 auto 10px auto', display:'flex', 
                                alignItems:'center', justifyContent:'center', fontSize:'2rem', color:'white', fontWeight:'bold'
                            }}>
                                {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <h3 style={{margin:0, color:'#333', fontSize:'1.1rem'}}>{usuario.nombre}</h3>
                            <div style={{color:'#666', fontSize:'0.9rem'}}>{usuario.rol}</div>
                            <div style={{color:'#888', fontSize:'0.8rem'}}>C.C. {usuario.cedula}</div>
                        </div>

                        {/* Campo Email */}
                        <div className="form-group">
                            <label htmlFor="email" style={{display:'flex', alignItems:'center', gap:'8px', color:'#005A5B'}}>
                                <BsEnvelopeAt /> Correo Electrónico
                            </label>
                            
                            <input 
                                type="email" 
                                id="email" 
                                className="form-control"
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                placeholder={esColaborador ? "No habilitado" : "ejemplo@empresa.com.co"}
                                required={!esColaborador}
                                disabled={esColaborador} // <--- BLOQUEADO PARA COLABORADORES
                                style={{
                                    fontSize:'1rem', 
                                    padding:'10px',
                                    backgroundColor: esColaborador ? '#e9ecef' : 'white',
                                    cursor: esColaborador ? 'not-allowed' : 'text'
                                }}
                            />
                            
                            {/* Mensaje Informativo según el rol */}
                            {!esColaborador ? (
                                <small style={{display:'block', marginTop:'8px', color:'#666', fontSize:'0.85rem'}}>
                                    Recibirás notificaciones de seguridad a este correo.
                                </small>
                            ) : (
                                <div style={{marginTop:'10px', color:'#856404', backgroundColor:'#fff3cd', padding:'8px', borderRadius:'4px', fontSize:'0.85rem', display:'flex', gap:'5px'}}>
                                    <BsInfoCircle style={{marginTop:'2px'}}/> 
                                    <span>Tu rol no requiere configuración de correo electrónico.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={alCerrar}>
                            {esColaborador ? 'Cerrar' : 'Cancelar'}
                        </button>
                        
                        {/* Botón Guardar SOLO si NO es colaborador */}
                        {!esColaborador && (
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? 'Guardando...' : 'Guardar y Actualizar'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalMiPerfil;