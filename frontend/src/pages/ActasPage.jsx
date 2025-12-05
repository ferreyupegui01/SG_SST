// frontend/src/pages/ActasPage.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getActas, actualizarArchivoActa } from '../services/committeeService';
import ModalCrearActa from '../components/ModalCrearActa';
import '../index.css';
import Swal from 'sweetalert2';
// Importamos los iconos necesarios
import { BsPlusLg, BsFileEarmarkPdf, BsSearch, BsCloudUpload, BsDownload, BsEye } from 'react-icons/bs';

const ActasPage = () => {
    const [actas, setActas] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Filtro
    const [busqueda, setBusqueda] = useState('');

    // Lógica para actualizar archivo
    const fileInputRef = useRef(null);
    const [actaParaActualizar, setActaParaActualizar] = useState(null);

    const API_URL = 'http://localhost:5000';

    const cargarActas = async () => {
        setIsLoading(true);
        try {
            const data = await getActas();
            setActas(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { cargarActas(); }, []);

    // --- FILTRO DE BÚSQUEDA ---
    const actasFiltradas = useMemo(() => {
        return actas.filter(acta => {
            const texto = busqueda.toLowerCase();
            return (
                acta.NumeroActa.toLowerCase().includes(texto) ||
                acta.Lugar.toLowerCase().includes(texto) ||
                acta.Objetivo.toLowerCase().includes(texto)
            );
        });
    }, [actas, busqueda]);

    // --- MANEJADORES DE DESCARGA ---
    const handleDescargar = (ruta) => {
        // Crea un link temporal para forzar descarga
        const link = document.createElement('a');
        link.href = `${API_URL}/${ruta.replace(/\\/g, '/')}`;
        link.setAttribute('download', ''); // Atributo para indicar descarga
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- MANEJADORES DE ACTUALIZACIÓN DE ARCHIVO ---
    const handleClicActualizar = (acta) => {
        setActaParaActualizar(acta);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Limpiar input
            fileInputRef.current.click(); // Abrir selector
        }
    };

    const handleArchivoSeleccionado = async (e) => {
        const file = e.target.files[0];
        if (!file || !actaParaActualizar) return;

        // Confirmación
        const result = await Swal.fire({
            title: '¿Reemplazar Acta?',
            text: `Se actualizará el archivo del Acta N° ${actaParaActualizar.NumeroActa}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#007BFF',
            confirmButtonText: 'Sí, subir nuevo',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const formData = new FormData();
                formData.append('archivo', file);

                await actualizarArchivoActa(actaParaActualizar.ID_Acta, formData);
                
                Swal.fire('Actualizado', 'El archivo del acta se ha actualizado correctamente.', 'success');
                cargarActas();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', error.message, 'error');
            }
        }
        setActaParaActualizar(null);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Actas de Comité</h1>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    <BsPlusLg /> Crear Acta
                </button>
            </div>

            {/* --- INPUT OCULTO PARA SUBIDA --- */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display:'none'}} 
                accept=".pdf" 
                onChange={handleArchivoSeleccionado} 
            />

            {/* --- BARRA DE FILTROS --- */}
            <div className="filters-bar" style={{marginBottom: '1.5rem'}}>
                <div className="search-input-container" style={{maxWidth: '400px', position: 'relative'}}>
                    <BsSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Buscar por N° Acta, Lugar u Objetivo..." 
                        style={{ paddingLeft: '40px', height: '45px', borderRadius: '50px' }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading ? <p>Cargando actas...</p> : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>N° Acta</th>
                                    <th>Fecha Reunión</th>
                                    <th>Lugar</th>
                                    <th>Objetivo</th>
                                    <th style={{textAlign: 'center'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actasFiltradas.length === 0 ? (
                                    <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#999'}}>No se encontraron actas.</td></tr>
                                ) : (
                                    actasFiltradas.map(acta => (
                                        <tr key={acta.ID_Acta}>
                                            <td><strong>{acta.NumeroActa}</strong></td>
                                            <td>{new Date(acta.FechaReunion).toLocaleDateString()}</td>
                                            <td>{acta.Lugar}</td>
                                            <td title={acta.Objetivo}>{acta.Objetivo.substring(0, 50)}...</td>
                                            
                                            <td style={{textAlign: 'center'}}>
                                                {acta.RutaArchivo ? (
                                                    <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                                                        
                                                        {/* BOTÓN VER (OJO) */}
                                                        <a 
                                                            href={`${API_URL}/${acta.RutaArchivo.replace(/\\/g, '/')}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="btn btn-sm btn-secondary"
                                                            title="Ver en navegador"
                                                        >
                                                            <BsEye />
                                                        </a>

                                                        {/* BOTÓN DESCARGAR */}
                                                        <button 
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleDescargar(acta.RutaArchivo)}
                                                            title="Descargar archivo"
                                                        >
                                                            <BsDownload />
                                                        </button>

                                                        {/* BOTÓN ACTUALIZAR (SUBIR NUEVO) */}
                                                        <button 
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() => handleClicActualizar(acta)}
                                                            title="Actualizar PDF (Ej: Firmado)"
                                                        >
                                                            <BsCloudUpload />
                                                        </button>

                                                    </div>
                                                ) : (
                                                    <span style={{color:'#999', fontSize:'0.8rem'}}>Sin archivo</span>
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

            {modalOpen && <ModalCrearActa alCerrar={() => setModalOpen(false)} alExito={() => { setModalOpen(false); cargarActas(); }} />}
        </div>
    );
};

export default ActasPage;