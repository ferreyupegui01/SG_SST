// frontend/src/pages/MedicinaLaboralPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getHistorialExamenes, generarPdfExamen } from '../services/medicalService';
import { BsPlusLg, BsFileEarmarkPdfFill, BsSearch } from 'react-icons/bs';
import '../index.css'; 

import ModalRegistrarExamen from '../components/ModalRegistrarExamen';
import ModalVerExamen from '../components/ModalVerExamen'; 

const MedicinaLaboralPage = () => {
    // --- Estados ---
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDownloading, setIsDownloading] = useState(null); 
    
    // --- Filtros (NUEVO) ---
    const [busqueda, setBusqueda] = useState('');
    const [filtroConcepto, setFiltroConcepto] = useState('');

    // --- Estados de Modales ---
    const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false); 
    const [examenSeleccionadoId, setExamenSeleccionadoId] = useState(null); 

    // --- Carga Inicial del Historial ---
    const cargarHistorial = async () => {
        try {
            setIsLoading(true);
            const data = await getHistorialExamenes();
            setHistorial(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []); 

    // --- LÓGICA DE FILTRADO (NUEVA) ---
    const historialFiltrado = useMemo(() => {
        return historial.filter(examen => {
            const texto = busqueda.toLowerCase();
            
            // 1. Búsqueda por Nombre, Cédula o Tipo de Examen
            const matchTexto = 
                examen.NombreColaborador.toLowerCase().includes(texto) ||
                examen.CedulaColaborador.includes(texto) ||
                examen.TipoExamen.toLowerCase().includes(texto);

            // 2. Filtro por Concepto
            const matchConcepto = filtroConcepto ? examen.ConceptoAptitud === filtroConcepto : true;

            return matchTexto && matchConcepto;
        });
    }, [historial, busqueda, filtroConcepto]);

    // --- Manejadores ---
    const handleExamenRegistrado = () => {
        setModalRegistroAbierto(false); 
        cargarHistorial(); 
    };
    
    const abrirModalVer = (id) => {
        setExamenSeleccionadoId(id);
        setModalVerAbierto(true);
    };
    const cerrarModalVer = () => {
        setModalVerAbierto(false);
        setExamenSeleccionadoId(null);
    };

    const handleGenerarPDF = async (examen) => {
        setIsDownloading(examen.ID_ExamenMedico);
        try {
            await generarPdfExamen(examen.ID_ExamenMedico, examen.CedulaColaborador);
        } catch (err) {
            console.error(err);
            alert(`Error al generar el PDF: ${err.message}`);
        } finally {
            setIsDownloading(null);
        }
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        const fecha = new Date(fechaISO.split('T')[0] + 'T00:00:00');
        return fecha.toLocaleDateString('es-CO');
    };
    
    const getConceptoClass = (concepto) => {
        if (concepto === 'Apto') return 'status-activo'; 
        if (concepto === 'Apto con restricciones') return 'status-pendiente'; 
        if (concepto === 'No Apto') return 'status-inactivo'; 
        return '';
    };

    return (
        <div className="page-container">
            {/* --- Encabezado --- */}
            <div className="page-header">
                <h1>Medicina Laboral - Exámenes</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => setModalRegistroAbierto(true)}
                >
                    <BsPlusLg /> Registrar Examen
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
                        placeholder="Buscar por nombre, cédula o tipo..." 
                        style={{ paddingLeft: '35px', height: '40px' }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {/* Select Concepto */}
                <div className="filter-select-container" style={{ minWidth: '220px' }}>
                    <select 
                        className="form-control"
                        style={{ height: '40px' }}
                        value={filtroConcepto}
                        onChange={(e) => setFiltroConcepto(e.target.value)}
                    >
                        <option value="">Todos los Conceptos</option>
                        <option value="Apto">Apto</option>
                        <option value="Apto con restricciones">Apto con restricciones</option>
                        <option value="No Apto">No Apto</option>
                    </select>
                </div>
            </div>

            {/* --- Tarjeta de Contenido (Tabla) --- */}
            <div className="page-content-card">
                <h2>Historial de Exámenes Registrados</h2>
                
                <div className="table-wrapper">
                    {isLoading && <p>Cargando historial...</p>}
                    {error && <p className="error-message">Error: {error}</p>}
                    
                    {!isLoading && !error && (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Cédula</th>
                                    <th>Tipo de Examen</th>
                                    <th>Fecha Examen</th>
                                    <th>Concepto Aptitud</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialFiltrado.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No se encontraron exámenes.</td></tr>
                                ) : (
                                    historialFiltrado.map((examen) => (
                                        <tr key={examen.ID_ExamenMedico}>
                                            <td>{examen.NombreColaborador}</td>
                                            <td>{examen.CedulaColaborador}</td>
                                            <td>{examen.TipoExamen}</td>
                                            <td>{formatearFecha(examen.FechaExamen)}</td>
                                            <td>
                                                <span className={`status-pill ${getConceptoClass(examen.ConceptoAptitud)}`}>
                                                    {examen.ConceptoAptitud}
                                                </span>
                                            </td>
                                            <td className="action-buttons">
                                                <button 
                                                    className="btn btn-secondary"
                                                    onClick={() => abrirModalVer(examen.ID_ExamenMedico)}
                                                >
                                                    Ver Detalle
                                                </button>
                                                <button 
                                                    className="btn btn-icon"
                                                    title="Generar Carta de Recomendaciones"
                                                    onClick={() => handleGenerarPDF(examen)}
                                                    disabled={isDownloading === examen.ID_ExamenMedico}
                                                >
                                                    <BsFileEarmarkPdfFill />
                                                    {isDownloading === examen.ID_ExamenMedico ? '...' : 'PDF'}
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
            
            {/* --- Renderizado de Modales --- */}
            {modalRegistroAbierto && (
                <ModalRegistrarExamen
                    alCerrar={() => setModalRegistroAbierto(false)}
                    alExito={handleExamenRegistrado}
                />
            )}
            
            {modalVerAbierto && (
                <ModalVerExamen
                    examenId={examenSeleccionadoId}
                    alCerrar={cerrarModalVer}
                />
            )}
        </div>
    );
};

export default MedicinaLaboralPage;