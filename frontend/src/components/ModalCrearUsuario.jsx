// frontend/src/components/ModalCrearUsuario.jsx

import React, { useState, useEffect } from 'react';
import { crearColaborador, getRoles, buscarUsuarioExterno } from '../services/userService'; 
import { useAuth } from '../context/AuthContext'; 
import '../style/Modal.css';
import '../index.css'; 
import Swal from 'sweetalert2'; 
import { BsCloudDownload, BsSearch, BsPersonPlusFill, BsPersonBadge, BsBuilding, BsBriefcase } from 'react-icons/bs';

const ModalCrearUsuario = ({ alCerrar, alExito }) => {
    const { usuario } = useAuth();

    const [formData, setFormData] = useState({
        nombreCompleto: '', cedula: '', password: '',
        idRol: '', area: '', cargo: ''
    });
    
    const [modo, setModo] = useState('IMPORTAR');
    const [busquedaExterna, setBusquedaExterna] = useState('');
    const [resultadosExternos, setResultadosExternos] = useState([]);
    const [buscando, setBuscando] = useState(false);

    const [rolesDisponibles, setRolesDisponibles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarRoles = async () => {
            try {
                const rolesData = await getRoles();
                if (usuario.rol === 'Super Admin') {
                    setRolesDisponibles(rolesData);
                } else {
                    const rolColaborador = rolesData.filter(r => r.NombreRol === 'Colaborador');
                    setRolesDisponibles(rolColaborador);
                    if (rolColaborador.length > 0) {
                        setFormData(prev => ({ ...prev, idRol: rolColaborador[0].ID_Rol }));
                    }
                }
            // eslint-disable-next-line no-unused-vars
            } catch (err) { setError("No se pudieron cargar los roles."); }
        };
        cargarRoles();
    }, [usuario]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleBuscarExterno = async (e) => {
        e.preventDefault();
        if (!busquedaExterna.trim()) return;
        
        setBuscando(true);
        setResultadosExternos([]); 
        
        try {
            const data = await buscarUsuarioExterno(busquedaExterna);
            setResultadosExternos(data);
            
            if (data.length === 0) {
                setError('No se encontraron coincidencias en la base de datos de Gestión Humana.');
            } else {
                setError('');
            }
        } catch (error) {
            console.error(error);
            setError('Error de conexión con la base de datos externa.');
        } finally {
            setBuscando(false);
        }
    };

    const seleccionarImportado = (usuarioExterno) => {
        setFormData(prev => ({
            ...prev,
            nombreCompleto: usuarioExterno.Nombre,
            cedula: usuarioExterno.Cedula,
            area: usuarioExterno.Area || '',
            cargo: usuarioExterno.Cargo || '',
            password: usuarioExterno.Cedula 
        }));
        setModo('MANUAL'); 
        
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: 'Datos del colaborador importados', showConfirmButton: false, timer: 3000, timerProgressBar: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.idRol) { setError('El rol es obligatorio.'); return; }

        setIsLoading(true);
        try {
            const payload = { ...formData, idRol: parseInt(formData.idRol) };
            await crearColaborador(payload);
            Swal.fire({ title: '¡Éxito!', text: 'Usuario creado exitosamente.', icon: 'success', timer: 2000, showConfirmButton: false });
            alExito(); 
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
                
                <div className="modal-header">
                    <h2>{modo === 'IMPORTAR' ? 'Importar Colaborador' : 'Crear Nuevo Usuario'}</h2>
                    <button onClick={alCerrar} className="modal-close-button">&times;</button>
                </div>

                {/* PESTAÑAS */}
                <div style={{display:'flex', marginBottom:'1.5rem', borderBottom:'1px solid #eee'}}>
                    <button 
                        type="button"
                        onClick={() => setModo('IMPORTAR')}
                        style={{
                            flex:1, padding:'10px', background:'none', border:'none', borderBottom: modo === 'IMPORTAR' ? '3px solid #007BFF' : '3px solid transparent',
                            color: modo === 'IMPORTAR' ? '#007BFF' : '#666', fontWeight:'bold', cursor:'pointer'
                        }}
                    >
                        {/* --- CAMBIO DE NOMBRE --- */}
                        <BsCloudDownload /> Importar Colaborador
                    </button>
                    <button 
                        type="button"
                        onClick={() => setModo('MANUAL')}
                        style={{
                            flex:1, padding:'10px', background:'none', border:'none', borderBottom: modo === 'MANUAL' ? '3px solid #007BFF' : '3px solid transparent',
                            color: modo === 'MANUAL' ? '#007BFF' : '#666', fontWeight:'bold', cursor:'pointer'
                        }}
                    >
                        <BsPersonPlusFill /> Crear Manualmente
                    </button>
                </div>

                {/* VISTA 1: BUSCADOR EXTERNO */}
                {modo === 'IMPORTAR' ? (
                    <div className="modal-body">
                        <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'1rem'}}>
                            Busque el colaborador en la base de datos externa por <strong>Cédula</strong> o <strong>Nombre</strong>.
                        </p>

                        <form onSubmit={handleBuscarExterno} style={{display:'flex', gap:'10px', marginBottom:'1rem'}}>
                            <input 
                                className="form-control" 
                                placeholder="Ej: 1036... o Pepito Pérez" 
                                value={busquedaExterna}
                                onChange={e => setBusquedaExterna(e.target.value)}
                                autoFocus
                            />
                            <button className="btn btn-primary" type="submit" disabled={buscando}>
                                {buscando ? '...' : <BsSearch />}
                            </button>
                        </form>
                        
                        <div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #eee', borderRadius:'8px', backgroundColor:'#f9f9f9'}}>
                            
                            {!buscando && resultadosExternos.length === 0 && !error && (
                                <div style={{padding:'2rem', textAlign:'center', color:'#ccc'}}>
                                    <BsSearch style={{fontSize:'2rem', marginBottom:'10px'}}/><br/>
                                    Los resultados aparecerán aquí.
                                </div>
                            )}

                            {resultadosExternos.map((u, idx) => (
                                <div key={idx} onClick={() => seleccionarImportado(u)} 
                                     style={{
                                         padding:'12px', borderBottom:'1px solid #eee', cursor:'pointer', 
                                         backgroundColor:'white', display:'flex', alignItems:'center', gap:'1rem',
                                         transition:'background 0.2s'
                                     }}
                                     onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                                     onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <div style={{
                                        width:'40px', height:'40px', borderRadius:'50%', backgroundColor:'#e9ecef', 
                                        color:'#005A5B', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'
                                    }}>
                                        {u.Nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{fontWeight:'bold', color:'#333'}}>{u.Nombre}</div>
                                        <div style={{fontSize:'0.8rem', color:'#666', display:'flex', gap:'10px'}}>
                                            <span title="Cédula"><BsPersonBadge/> {u.Cedula}</span>
                                            <span title="Cargo"><BsBriefcase/> {u.Cargo}</span>
                                        </div>
                                    </div>
                                    <div style={{marginLeft:'auto'}}>
                                        <span className="btn btn-sm btn-secondary" style={{fontSize:'0.7rem'}}>Seleccionar</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {error && <p className="modal-error" style={{marginTop:'1rem'}}>{error}</p>}
                    </div>
                ) : (
                    /* VISTA 2: FORMULARIO NORMAL */
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body" style={{maxHeight:'60vh', overflowY:'auto'}}>
                            <div className="form-group">
                                <label>Nombre Completo *</label>
                                <input type="text" name="nombreCompleto" className="form-control" value={formData.nombreCompleto} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Cédula (Usuario) *</label>
                                <input type="text" name="cedula" className="form-control" value={formData.cedula} onChange={handleChange} required />
                            </div>
                            
                            <div style={{display:'flex', gap:'1rem'}}>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Área / Dpto</label>
                                    <div style={{position:'relative'}}>
                                        <BsBuilding style={{position:'absolute', top:'12px', left:'10px', color:'#999'}}/>
                                        <input type="text" name="area" className="form-control" style={{paddingLeft:'30px'}} value={formData.area} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Cargo</label>
                                    <div style={{position:'relative'}}>
                                        <BsBriefcase style={{position:'absolute', top:'12px', left:'10px', color:'#999'}}/>
                                        <input type="text" name="cargo" className="form-control" style={{paddingLeft:'30px'}} value={formData.cargo} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{backgroundColor:'#fff3cd', padding:'10px', borderRadius:'6px', border:'1px solid #ffeeba'}}>
                                <label style={{color:'#856404'}}>Asignar Rol en SST *</label>
                                <select name="idRol" className="form-control" value={formData.idRol} onChange={handleChange} required>
                                    <option value="">-- Seleccione un Rol --</option>
                                    {rolesDisponibles.map(rol => (
                                        <option key={rol.ID_Rol} value={rol.ID_Rol}>{rol.NombreRol}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Contraseña*</label>
                                <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres" />
                                <small style={{color:'#666'}}>Por defecto se sugiere la cédula.</small>
                            </div>
                            
                            {error && <p className="modal-error">{error}</p>}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={isLoading}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Usuario'}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
export default ModalCrearUsuario;