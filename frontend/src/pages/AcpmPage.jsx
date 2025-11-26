// frontend/src/pages/AcpmPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getACPMs } from '../services/acpmService';
import '../index.css'; 
import { BsPlusLg, BsSearch } from 'react-icons/bs';

import ModalCrearACPM from '../components/ModalCrearACPM.jsx'; 
import ModalGestionarACPM from '../components/ModalGestionarACPM.jsx';
import ModalVerACPM from '../components/ModalVerACPM.jsx'; 

const AcpmPage = () => {
    // --- Estados ---
    const [acpmLista, setAcpmLista] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados de Filtros (NUEVOS) ---
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // --- Estados de Modales ---
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [modalGestionarAbierto, setModalGestionarAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false); 
    const [acpmSeleccionada, setAcpmSeleccionada] = useState(null); 

    // --- Carga Inicial ---
    const cargarACPMs = async () => {
        try {
            setIsLoading(true);
            const data = await getACPMs();
            setAcpmLista(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarACPMs();
    }, []);

    // --- LÓGICA DE FILTRADO (NUEVA) ---
    const acpmFiltradas = useMemo(() => {
        return acpmLista.filter((acpm) => {
            const texto = busqueda.toLowerCase();
            
            // 1. Búsqueda por Descripción, Origen o ID
            const matchTexto = 
                acpm.DescripcionProblema.toLowerCase().includes(texto) ||
                acpm.Origen.toLowerCase().includes(texto) ||
                acpm.ID_ACPM.toString().includes(texto);

            // 2. Filtro por Estado
            const matchEstado = filtroEstado ? acpm.EstadoACPM === filtroEstado : true;

            return matchTexto && matchEstado;
        });
    }, [acpmLista, busqueda, filtroEstado]);

    // --- Manejadores de Modal (Sin cambios) ---
    const handleAcpmCreada = () => { setModalCrearAbierto(false); cargarACPMs(); };
    
    const abrirModalGestionar = (acpm) => { setAcpmSeleccionada(acpm); setModalGestionarAbierto(true); };
    const cerrarModalGestionar = () => { setModalGestionarAbierto(false); setAcpmSeleccionada(null); };
    const handleAcpmGestionada = () => { cerrarModalGestionar(); cargarACPMs(); };

    const abrirModalVer = (acpm) => { setAcpmSeleccionada(acpm); setModalVerAbierto(true); };
    const cerrarModalVer = () => { setModalVerAbierto(false); setAcpmSeleccionada(null); };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        const fecha = new Date(fechaISO.split('T')[0] + 'T00:00:00');
        return fecha.toLocaleDateString('es-CO');
    };

    const getEstadoClass = (estado) => {
        if (estado === 'Abierta') return 'status-pendiente'; 
        if (estado === 'En Proceso') return 'status-proceso'; 
        if (estado === 'Cerrada') return 'status-activo'; 
        return 'status-inactivo'; 
    };

    return (
        <div className="page-container">
            {/* --- Encabezado --- */}
            <div className="page-header">
                <h1>Gestión de Acciones (ACPM)</h1>
                <button className="btn btn-primary" onClick={() => setModalCrearAbierto(true)}>
                    <BsPlusLg /> Crear Nueva ACPM
                </button>
            </div>

            {/* --- BARRA DE FILTROS (NUEVA) --- */}
            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {/* Input Búsqueda */}
                <div className="search-input-container" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Buscar por descripción, origen o ID..." 
                        style={{ paddingLeft: '35px', height: '40px' }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {/* Select Estado */}
                <div className="filter-select-container" style={{ minWidth: '200px' }}>
                    <select 
                        className="form-control"
                        style={{ height: '40px' }}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="Abierta">Abierta</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Cerrada">Cerrada</option>
                    </select>
                </div>
            </div>

            {/* --- Tabla --- */}
            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading && <p>Cargando acciones ACPM...</p>}
                    {error && <p className="error-message">Error: {error}</p>}
                    
                    {!isLoading && !error && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tipo</th>
                                    <th>Origen</th>
                                    <th>Descripción</th>
                                    <th>Responsable</th>
                                    <th>Fecha Límite</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {acpmFiltradas.length === 0 ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>No se encontraron acciones.</td></tr>
                                ) : (
                                    acpmFiltradas.map((acpm) => (
                                        <tr key={acpm.ID_ACPM}>
                                            <td>{acpm.ID_ACPM}</td>
                                            <td>{acpm.TipoAccion}</td>
                                            <td>{acpm.Origen}</td>
                                            <td title={acpm.DescripcionProblema}>{acpm.DescripcionProblema.substring(0, 30)}...</td>
                                            <td>{acpm.NombreResponsable}</td>
                                            <td>{formatearFecha(acpm.FechaLimite)}</td>
                                            <td>
                                                <span className={`status-pill ${getEstadoClass(acpm.EstadoACPM)}`}>
                                                    {acpm.EstadoACPM}
                                                </span>
                                            </td>
                                            <td className="action-buttons">
                                                <button 
                                                    className="btn btn-secondary"
                                                    onClick={() => abrirModalVer(acpm)} 
                                                >
                                                    Ver
                                                </button>
                                                {acpm.EstadoACPM !== 'Cerrada' && (
                                                    <button 
                                                        className="btn btn-warning"
                                                        onClick={() => abrirModalGestionar(acpm)} 
                                                    >
                                                        Gestionar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            {/* --- Modales --- */}
            {modalCrearAbierto && <ModalCrearACPM alCerrar={() => setModalCrearAbierto(false)} alExito={handleAcpmCreada} />}
            {modalGestionarAbierto && <ModalGestionarACPM acpm={acpmSeleccionada} alCerrar={cerrarModalGestionar} alExito={handleAcpmGestionada} />}
            {modalVerAbierto && <ModalVerACPM acpmId={acpmSeleccionada.ID_ACPM} alCerrar={cerrarModalVer} />}
        </div>
    );
};

export default AcpmPage;