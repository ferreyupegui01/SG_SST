// frontend/src/pages/UsuariosPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getColaboradores, cambiarEstadoColaborador } from '../services/userService.js'; 
import '../index.css'; 
import { BsPlusLg, BsSearch } from 'react-icons/bs'; 

import ModalCrearUsuario from '../components/ModalCrearUsuario.jsx'; 
import ModalEditarUsuario from '../components/ModalEditarUsuario.jsx';
import ModalConfirmarAccion from '../components/ModalConfirmarAccion.jsx';
import ModalResetPassword from '../components/ModalResetPassword.jsx'; 

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null); 
    
    // --- Filtros (NUEVOS) ---
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // --- Modales ---
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
    const [modalResetAbierto, setModalResetAbierto] = useState(false); 
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [accionConfirmar, setAccionConfirmar] = useState(null); 

    const cargarUsuarios = async () => {
        try {
            setIsLoading(true);
            const data = await getColaboradores();
            setUsuarios(data);
            setError(null);
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    useEffect(() => { cargarUsuarios(); }, []); 

    // --- LÓGICA DE FILTRADO ---
    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter(u => {
            const texto = busqueda.toLowerCase();
            
            // 1. Búsqueda por Texto
            const matchTexto = 
                u.NombreCompleto.toLowerCase().includes(texto) || 
                u.CedulaUsuario.includes(texto) ||
                (u.Cargo && u.Cargo.toLowerCase().includes(texto));
            
            // 2. Filtro por Estado
            const matchEstado = filtroEstado ? u.EstadoCuenta === filtroEstado : true;

            return matchTexto && matchEstado;
        });
    }, [usuarios, busqueda, filtroEstado]);

    // --- Manejadores ---
    const handleUsuarioCreado = () => { setModalCrearAbierto(false); cargarUsuarios(); };
    const abrirModalEditar = (usuario) => { setUsuarioSeleccionado(usuario); setModalEditarAbierto(true); };
    const cerrarModalEditar = () => { setModalEditarAbierto(false); setUsuarioSeleccionado(null); };
    const handleUsuarioEditado = () => { cerrarModalEditar(); cargarUsuarios(); };
    
    const abrirModalConfirmar = (usuario) => {
        setUsuarioSeleccionado(usuario);
        const proximaAccion = usuario.EstadoCuenta === 'Activo' ? 'Inactivar' : 'Activar';
        setAccionConfirmar(proximaAccion);
        setModalConfirmarAbierto(true);
    };
    const cerrarModalConfirmar = () => { setModalConfirmarAbierto(false); setUsuarioSeleccionado(null); setAccionConfirmar(null); };
    
    const handleConfirmarCambioEstado = async () => {
        if (!usuarioSeleccionado || !accionConfirmar) return;
        const nuevoEstado = (accionConfirmar === 'Inactivar') ? 'Inactivo' : 'Activo';
        // eslint-disable-next-line no-useless-catch
        try {
            await cambiarEstadoColaborador(usuarioSeleccionado.ID_Usuario, nuevoEstado);
            cargarUsuarios();
        } catch (err) { throw err; }
    };
    
    const abrirModalReset = (usuario) => { setUsuarioSeleccionado(usuario); setModalResetAbierto(true); };
    const cerrarModalReset = () => { setModalResetAbierto(false); setUsuarioSeleccionado(null); };
    const handlePasswordReseteado = () => { cerrarModalReset(); };
    
    const getRolClass = (rol) => {
        if (rol === 'Administrador SST') return 'status-proceso'; 
        if (rol === 'Colaborador') return 'status-inactivo'; 
        return 'status-inactivo';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gestión de Usuarios</h1>
                <button className="btn btn-primary" onClick={() => setModalCrearAbierto(true)}>
                    <BsPlusLg /> Crear Nuevo Usuario
                </button>
            </div>

            {/* --- BARRA DE FILTROS (NUEVA) --- */}
            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="search-input-container" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Buscar por nombre, cédula o cargo..." 
                        style={{ paddingLeft: '35px', height: '40px' }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div className="filter-select-container" style={{ minWidth: '200px' }}>
                    <select 
                        className="form-control" 
                        style={{ height: '40px' }}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="Activo">Activos</option>
                        <option value="Inactivo">Inactivos</option>
                    </select>
                </div>
            </div>

            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading && <p>Cargando usuarios...</p>}
                    {error && <p className="error-message">Error al cargar usuarios: {error}</p>}
                    
                    {!isLoading && !error && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>Cédula (Usuario)</th>
                                    <th>Rol</th>
                                    <th>Área/Dpto.</th>
                                    <th>Cargo</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center' }}>No se encontraron usuarios.</td></tr>
                                ) : (
                                    usuariosFiltrados.map((user) => (
                                        <tr key={user.ID_Usuario}>
                                            <td>{user.NombreCompleto}</td>
                                            <td>{user.CedulaUsuario}</td>
                                            <td>
                                                <span className={`status-pill ${getRolClass(user.NombreRol)}`}>
                                                    {user.NombreRol}
                                                </span>
                                            </td>
                                            <td>{user.AreaDepartamento || 'N/A'}</td>
                                            <td>{user.Cargo || 'N/A'}</td>
                                            <td>
                                                <span className={`status-pill ${user.EstadoCuenta === 'Activo' ? 'status-activo' : 'status-inactivo'}`}>
                                                    {user.EstadoCuenta}
                                                </span>
                                            </td>
                                            <td className="action-buttons">
                                                <button className="btn btn-secondary" onClick={() => abrirModalEditar(user)}>Editar</button>
                                                <button 
                                                    className={`btn ${user.EstadoCuenta === 'Activo' ? 'btn-danger' : 'btn-success'}`}
                                                    onClick={() => abrirModalConfirmar(user)}
                                                >
                                                    {user.EstadoCuenta === 'Activo' ? 'Inactivar' : 'Activar'}
                                                </button>
                                                <button className="btn btn-warning" onClick={() => abrirModalReset(user)}>Reset Pass</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            {modalCrearAbierto && ( <ModalCrearUsuario alCerrar={() => setModalCrearAbierto(false)} alExito={handleUsuarioCreado} /> )}
            {modalEditarAbierto && ( <ModalEditarUsuario usuario={usuarioSeleccionado} alCerrar={cerrarModalEditar} alExito={handleUsuarioEditado} /> )}
            {modalConfirmarAbierto && ( <ModalConfirmarAccion titulo={`${accionConfirmar} Usuario`} mensaje={`¿Estás seguro de que deseas ${accionConfirmar.toLowerCase()} a ${usuarioSeleccionado?.NombreCompleto}?`} enConfirmar={handleConfirmarCambioEstado} alCerrar={cerrarModalConfirmar} textoBotonConfirmar={accionConfirmar} claseBoton={accionConfirmar === 'Inactivar' ? 'btn-danger' : 'btn-success'} /> )}
            {modalResetAbierto && ( <ModalResetPassword usuario={usuarioSeleccionado} alCerrar={cerrarModalReset} alExito={handlePasswordReseteado} /> )}
        </div>
    );
};
export default UsuariosPage;