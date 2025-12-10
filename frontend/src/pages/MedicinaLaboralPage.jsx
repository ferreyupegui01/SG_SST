// frontend/src/pages/MedicinaLaboralPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getHistorialExamenes } from '../services/medicalService';
import '../index.css';
import { BsPlusLg, BsSearch, BsFileEarmarkPdf, BsEyeFill, BsHeartPulseFill } from 'react-icons/bs';

// Importamos los modales
import ModalRegistrarExamen from '../components/ModalRegistrarExamen';
import ModalVerExamen from '../components/ModalVerExamen';
import ModalGenerarPdfMedico from '../components/ModalGenerarPdfMedico';

const MedicinaLaboralPage = () => {
    // --- ESTADOS ---
    const [examenes, setExamenes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // Estados de Modales
    const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false);
    const [modalVerOpen, setModalVerOpen] = useState(false);
    const [modalPdfOpen, setModalPdfOpen] = useState(false);
    
    // Examen seleccionado para Ver o Generar PDF
    const [examenSeleccionado, setExamenSeleccionado] = useState(null);

    // --- CARGA DE DATOS ---
    const cargarExamenes = async () => {
        setIsLoading(true);
        try {
            const data = await getHistorialExamenes();
            setExamenes(data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar el historial médico.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarExamenes();
    }, []);

    // --- FILTRADO ---
    const examenesFiltrados = useMemo(() => {
        const texto = busqueda.toLowerCase();
        return examenes.filter(ex => 
            ex.NombreColaborador.toLowerCase().includes(texto) ||
            ex.CedulaColaborador.includes(texto) ||
            ex.TipoExamen.toLowerCase().includes(texto)
        );
    }, [examenes, busqueda]);

    // --- MANEJADORES ---
    const handleExamenRegistrado = () => {
        setModalRegistrarOpen(false);
        cargarExamenes();
    };

    const abrirModalVer = (examen) => {
        setExamenSeleccionado(examen);
        setModalVerOpen(true);
    };

    const abrirModalPdf = (examen) => {
        setExamenSeleccionado(examen);
        setModalPdfOpen(true);
    };

    // Formatear fecha para visualización
    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '--';
        return new Date(fechaISO).toLocaleDateString('es-CO');
    };

    // Color según concepto
    const getConceptoClass = (concepto) => {
        if (concepto === 'Apto') return 'status-activo';
        if (concepto === 'Apto con restricciones') return 'status-proceso'; // Azul o Amarillo
        return 'status-inactivo'; // Rojo (No Apto)
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Medicina Laboral</h1>
                <button className="btn btn-primary" onClick={() => setModalRegistrarOpen(true)}>
                    <BsPlusLg /> Registrar Examen
                </button>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="filters-bar" style={{marginBottom:'1.5rem'}}>
                <div className="search-input-container" style={{maxWidth:'400px', position:'relative'}}>
                    <BsSearch style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'#999'}}/>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Buscar por nombre, cédula o tipo..." 
                        style={{paddingLeft:'40px', borderRadius:'20px'}}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading ? <p>Cargando exámenes...</p> : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Colaborador</th>
                                    <th>Cédula</th>
                                    <th>Tipo Examen</th>
                                    <th>Concepto</th>
                                    <th style={{textAlign:'center'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examenesFiltrados.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'#999'}}>No se encontraron registros.</td></tr>
                                ) : (
                                    examenesFiltrados.map((ex) => (
                                        <tr key={ex.ID_ExamenMedico}>
                                            <td>{formatearFecha(ex.FechaExamen)}</td>
                                            <td><strong>{ex.NombreColaborador}</strong></td>
                                            <td>{ex.CedulaColaborador}</td>
                                            <td><span style={{display:'flex', alignItems:'center', gap:'5px'}}><BsHeartPulseFill style={{color:'#e91e63'}}/> {ex.TipoExamen}</span></td>
                                            <td>
                                                <span className={`status-pill ${getConceptoClass(ex.ConceptoAptitud)}`}>
                                                    {ex.ConceptoAptitud}
                                                </span>
                                            </td>
                                            <td style={{textAlign:'center'}}>
                                                <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                                    {/* Botón VER DETALLE */}
                                                    <button 
                                                        className="btn btn-sm btn-secondary" 
                                                        onClick={() => abrirModalVer(ex)}
                                                        title="Ver Detalle Completo"
                                                    >
                                                        <BsEyeFill />
                                                    </button>

                                                    {/* Botón GENERAR PDF */}
                                                    <button 
                                                        className="btn btn-sm btn-warning" 
                                                        onClick={() => abrirModalPdf(ex)}
                                                        title="Generar Acta/PDF"
                                                        style={{color:'#333'}}
                                                    >
                                                        <BsFileEarmarkPdf />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- MODALES --- */}
            
            {modalRegistrarOpen && (
                <ModalRegistrarExamen 
                    alCerrar={() => setModalRegistrarOpen(false)} 
                    alExito={handleExamenRegistrado} 
                />
            )}

            {modalVerOpen && examenSeleccionado && (
                <ModalVerExamen 
                    examenId={examenSeleccionado.ID_ExamenMedico} 
                    alCerrar={() => setModalVerOpen(false)} 
                />
            )}

            {/* CORRECCIÓN: Renderizado Condicional Seguro */}
            {modalPdfOpen && examenSeleccionado && (
                <ModalGenerarPdfMedico 
                    examen={examenSeleccionado} 
                    alCerrar={() => setModalPdfOpen(false)} 
                />
            )}

        </div>
    );
};

export default MedicinaLaboralPage;