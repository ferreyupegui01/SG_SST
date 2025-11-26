// frontend/src/pages/LogsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { buscarLogs, getLogFiltros } from '../services/logService';
import '../index.css'; // Estilos globales
import '../style/LogsPage.css'; // <-- 1. Importar el nuevo CSS
import { BsSearch, BsArrowCounterclockwise } from 'react-icons/bs';

// Estado inicial vacío para los filtros
const filtrosVacios = {
    idUsuario: '',
    accion: '',
    fechaInicio: '',
    fechaFin: ''
};

const LogsPage = () => {
    // --- Estados ---
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados de Filtros ---
    const [filtros, setFiltros] = useState(filtrosVacios);
    const [listasFiltros, setListasFiltros] = useState({ usuarios: [], acciones: [] });

    // --- Carga Inicial de Datos (Logs y Filtros) ---
    
    // 1. Carga los dropdowns de filtros (solo una vez)
    useEffect(() => {
        const cargarListas = async () => {
            try {
                const data = await getLogFiltros();
                setListasFiltros(data);
            } catch (err) {
                console.error("Error cargando filtros:", err);
            }
        };
        cargarListas();
    }, []);

    // 2. Carga los logs (depende de 'filtros')
    const cargarLogs = useCallback(async (filtrosActuales) => {
        try {
            setIsLoading(true);
            const data = await buscarLogs(filtrosActuales);
            setLogs(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []); // Ya no depende de 'filtros'

    // 3. Carga inicial de logs (con filtros vacíos)
    useEffect(() => {
        cargarLogs(filtros);
    }, [filtros, cargarLogs]);

    // --- Manejadores de Filtros ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleBuscar = (e) => {
        e.preventDefault(); // Previene que el form recargue la pág
        cargarLogs(filtros); 
    };

    const handleLimpiar = () => {
        setFiltros(filtrosVacios);
        // La recarga se disparará automáticamente por el useEffect [filtros]
    };

    // Formatear la fecha para la tabla
    const formatearFechaHora = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        return new Date(fechaISO).toLocaleString('es-CO', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    return (
        <div className="page-container">
            {/* --- Encabezado --- */}
            <div className="page-header">
                <h1>Registro de Auditoría (Logs)</h1>
            </div>

            {/* --- 2. TARJETA DE FILTROS (Actualizada con CSS) --- */}
            <div className="page-content-card logs-filter-card">
                {/* Usamos <form> para que 'Enter' funcione en la búsqueda */}
                <form className="logs-filter-bar" onSubmit={handleBuscar}>
                    
                    <div className="filter-item">
                        <label htmlFor="idUsuario">Filtrar por Usuario:</label>
                        <select name="idUsuario" value={filtros.idUsuario} onChange={handleChange}>
                            <option value="">-- Todos los Usuarios --</option>
                            {listasFiltros.usuarios.map(u => (
                                <option key={u.ID_Usuario} value={u.ID_Usuario}>{u.NombreUsuario}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="accion">Filtrar por Acción:</label>
                        <select name="accion" value={filtros.accion} onChange={handleChange}>
                            <option value="">-- Todas las Acciones --</option>
                            {listasFiltros.acciones.map(a => (
                                <option key={a.Accion} value={a.Accion}>{a.Accion}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-item">
                        <label htmlFor="fechaInicio">Fecha Desde:</label>
                        <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleChange} />
                    </div>

                    <div className="filter-item">
                        <label htmlFor="fechaFin">Fecha Hasta:</label>
                        <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleChange} />
                    </div>

                    <div className="filter-buttons">
                        <button type="submit" className="btn btn-primary">
                            <BsSearch /> Buscar
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleLimpiar}>
                            <BsArrowCounterclockwise /> Limpiar
                        </button>
                    </div>
                </form>
            </div>
            {/* --- FIN DE LA TARJETA DE FILTROS --- */}


            {/* --- Tarjeta de Contenido (Tabla) --- */}
            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading && <p>Cargando registros...</p>}
                    {error && <p className="error-message">Error: {error}</p>}
                    
                    {!isLoading && !error && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha y Hora</th>
                                    <th>Usuario Admin</th>
                                    <th>Acción</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No se encontraron registros con esos filtros.</td></tr>
                                ) : (
                                    logs.slice(0, 100).map((log) => ( // Limita a 100
                                        <tr key={log.ID_Log}>
                                            <td>{formatearFechaHora(log.FechaHora)}</td>
                                            <td>{log.NombreUsuario}</td>
                                            <td>
                                                <span className="status-pill status-proceso">
                                                    {log.Accion}
                                                </span>
                                            </td>
                                            <td>{log.Descripcion}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogsPage;