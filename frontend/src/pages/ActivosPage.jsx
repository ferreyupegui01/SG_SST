// frontend/src/pages/ActivosPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getActivosTodos, eliminarActivo, getTiposActivosDisponibles } from '../services/assetService';
import '../index.css';
import { BsPlusLg, BsSearch, BsPencilSquare, BsTrash, BsEyeFill } from 'react-icons/bs';

import ModalCrearActivo from '../components/ModalCrearActivo';
import ModalEditarActivo from '../components/ModalEditarActivo';
import ModalConfirmarAccion from '../components/ModalConfirmarAccion';
import ModalVerDetalleActivo from '../components/ModalVerDetalleActivo';
import Swal from 'sweetalert2';

const ActivosPage = () => {
    const [activos, setActivos] = useState([]);
    const [tiposDisponibles, setTiposDisponibles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');

    // Modales
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
    const [modalVerDetalleAbierto, setModalVerDetalleAbierto] = useState(false);
    
    const [activoSeleccionado, setActivoSeleccionado] = useState(null);

    const cargarActivos = async () => {
        try {
            setIsLoading(true);
            const [dataActivos, dataTipos] = await Promise.all([
                getActivosTodos(),
                getTiposActivosDisponibles()
            ]);
            setActivos(dataActivos);
            setTiposDisponibles(dataTipos);
            setError(null);
        } catch (err) {
            console.error("Error:", err.message);
            setError("No se pudieron cargar los activos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarActivos();
    }, []);

    const activosFiltrados = useMemo(() => {
        return activos.filter((activo) => {
            const texto = busqueda.toLowerCase();
            const matchTexto = 
                activo.NombreDescriptivo.toLowerCase().includes(texto) ||
                activo.CodigoIdentificador.toLowerCase().includes(texto) ||
                (activo.Ubicacion && activo.Ubicacion.toLowerCase().includes(texto));

            const matchTipo = filtroTipo ? activo.TipoActivo === filtroTipo : true;
            return matchTexto && matchTipo;
        });
    }, [activos, busqueda, filtroTipo]);

    // Manejadores
    const handleActivoCreado = () => { setModalCrearAbierto(false); cargarActivos(); };
    
    const abrirModalEditar = (activo) => { setActivoSeleccionado(activo); setModalEditarAbierto(true); };
    const cerrarModalEditar = () => { setModalEditarAbierto(false); setActivoSeleccionado(null); };
    const handleActivoEditado = () => { cerrarModalEditar(); cargarActivos(); };

    const abrirModalEliminar = (activo) => { setActivoSeleccionado(activo); setModalConfirmarAbierto(true); };
    const cerrarModalEliminar = () => { setModalConfirmarAbierto(false); setActivoSeleccionado(null); };
    
    const abrirModalVer = (activo) => { setActivoSeleccionado(activo); setModalVerDetalleAbierto(true); };
    const cerrarModalVer = () => { setModalVerDetalleAbierto(false); setActivoSeleccionado(null); };

    const handleConfirmarEliminar = async () => {
        if (!activoSeleccionado) return;
        try {
            await eliminarActivo(activoSeleccionado.ID_Activo);
            cerrarModalEliminar();
            Swal.fire({ title: 'Eliminado', text: 'Activo eliminado.', icon: 'success', timer: 1500, showConfirmButton: false });
            cargarActivos(); 
        } catch (err) {
            cerrarModalEliminar();
            Swal.fire('Error', err.message, 'error');
        }
    };

    // Helper visual para la píldora de estado
    const getTipoClass = (tipo) => {
        if (!tipo) return 'status-pendiente';
        const t = tipo.toLowerCase();
        if (t.includes('vehiculo') || t.includes('moto') || t.includes('montacarga')) return 'status-proceso';
        if (t.includes('extintor') || t.includes('botiquin')) return 'status-activo';
        return 'status-pendiente';
    };

    const esVehiculo = (tipo) => {
        if (!tipo) return false;
        const t = tipo.toLowerCase().trim();
        return ['vehiculo', 'moto', 'montacarga', 'carro', 'camion', 'tractomula', 'furgon'].some(clave => t.includes(clave));
    };

    // Estilo base para botones de la tabla
    const btnBaseStyle = {
        padding: '0.35rem 0.75rem',
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gestión de Activos</h1>
                <button className="btn btn-primary" onClick={() => setModalCrearAbierto(true)}>
                    <BsPlusLg /> Crear Nuevo Activo
                </button>
            </div>

            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="search-input-container" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input 
                        type="text" className="form-control" 
                        placeholder="Buscar por nombre, código o ubicación..." 
                        style={{ paddingLeft: '35px', height: '40px' }}
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div className="filter-select-container" style={{ minWidth: '200px' }}>
                    <select className="form-control" style={{ height: '40px' }} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                        <option value="">Todos los Tipos</option>
                        {tiposDisponibles.map((tipoObj, idx) => {
                            const valor = typeof tipoObj === 'object' ? tipoObj.TipoActivoAsociado : tipoObj;
                            return <option key={idx} value={valor}>{valor}</option>;
                        })}
                    </select>
                </div>
            </div>

            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading && <p>Cargando activos...</p>}
                    {!isLoading && !error && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Código / Placa</th>
                                    <th>Nombre Descriptivo</th>
                                    <th>Ubicación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activosFiltrados.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>No se encontraron activos.</td></tr>
                                ) : (
                                    activosFiltrados.map((activo) => (
                                        <tr key={activo.ID_Activo}>
                                            <td>
                                                <span className={`status-pill ${getTipoClass(activo.TipoActivo)}`}>
                                                    {activo.TipoActivo}
                                                </span>
                                            </td>
                                            <td><strong>{activo.CodigoIdentificador}</strong></td>
                                            <td>{activo.NombreDescriptivo}</td>
                                            <td>{activo.Ubicacion || 'N/A'}</td>
                                            <td className="action-buttons" style={{display: 'flex', gap: '8px'}}>
                                                
                                                {/* 1. VER (Gris Acero - Sólido) */}
                                                {esVehiculo(activo.TipoActivo) && (
                                                    <button 
                                                        title="Ver Ficha Técnica" 
                                                        onClick={() => abrirModalVer(activo)}
                                                        style={{ 
                                                            ...btnBaseStyle,
                                                            backgroundColor: '#546e7a' // Gris Azulado Oscuro
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#455a64'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#546e7a'}
                                                    >
                                                        <BsEyeFill /> Ver
                                                    </button>
                                                )}

                                                {/* 2. EDITAR (Amarillo Ocre - Sólido y legible) */}
                                                <button 
                                                    title="Editar" 
                                                    onClick={() => abrirModalEditar(activo)}
                                                    style={{
                                                        ...btnBaseStyle,
                                                        backgroundColor: '#f0ad4e' // Amarillo Ocre (Bootstrap Warning)
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ec971f'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f0ad4e'}
                                                >
                                                    <BsPencilSquare /> Editar
                                                </button>
                                                
                                                {/* 3. ELIMINAR (Rojo Ladrillo - Sólido) */}
                                                <button 
                                                    title="Eliminar" 
                                                    onClick={() => abrirModalEliminar(activo)}
                                                    style={{
                                                        ...btnBaseStyle,
                                                        backgroundColor: '#d9534f' // Rojo Ladrillo Suave
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c9302c'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d9534f'}
                                                >
                                                    <BsTrash /> Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            {/* Modales */}
            {modalCrearAbierto && <ModalCrearActivo alCerrar={() => setModalCrearAbierto(false)} alExito={handleActivoCreado} />}
            
            {modalEditarAbierto && <ModalEditarActivo activo={activoSeleccionado} alCerrar={cerrarModalEditar} alExito={handleActivoEditado} />}
            
            {modalVerDetalleAbierto && (
                <ModalVerDetalleActivo 
                    activo={activoSeleccionado} 
                    alCerrar={cerrarModalVer} 
                />
            )}

            {modalConfirmarAbierto && (
                <ModalConfirmarAccion
                    titulo="Eliminar Activo"
                    mensaje={`¿Estás seguro de que deseas eliminar "${activoSeleccionado?.NombreDescriptivo}"?`}
                    enConfirmar={handleConfirmarEliminar}
                    alCerrar={cerrarModalEliminar}
                    textoBotonConfirmar="Eliminar"
                    claseBoton="btn-danger"
                />
            )}
        </div>
    );
};

export default ActivosPage;