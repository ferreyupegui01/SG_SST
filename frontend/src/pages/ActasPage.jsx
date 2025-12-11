// frontend/src/pages/ActasPage.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getActas, actualizarArchivoActa, subirFirmasActa, descargarActa } from '../services/committeeService';
import ModalCrearActa from '../components/ModalCrearActa';
import '../index.css';
import Swal from 'sweetalert2';
import { BsPlusLg, BsSearch, BsCloudUpload, BsDownload, BsEye, BsPen } from 'react-icons/bs';

const ActasPage = () => {
    const [actas, setActas] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    // Estados para subida de archivos
    const fileInputRef = useRef(null);
    const [actaSeleccionada, setActaSeleccionada] = useState(null);
    const [tipoCarga, setTipoCarga] = useState(''); // 'ORIGINAL' o 'FIRMAS'

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

    // --- DESCARGA DIRECTA (SIN PESTAÑA) ---
    const handleDescargar = async (idActa, tipo, nombreArchivo) => {
        try {
            const blob = await descargarActa(idActa, tipo);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            Swal.fire('Error', 'No se pudo descargar el archivo.', 'error');
        }
    };

    // --- VER EN NAVEGADOR ---
    const handleVer = (ruta) => {
        if (!ruta) return;
        window.open(`${API_URL}/${ruta.replace(/\\/g, '/')}`, '_blank');
    };

    // --- SUBIR ARCHIVO ---
    const iniciarCarga = (acta, tipo) => {
        setActaSeleccionada(acta);
        setTipoCarga(tipo); 
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click(); 
        }
    };

    const handleArchivoSeleccionado = async (e) => {
        const file = e.target.files[0];
        if (!file || !actaSeleccionada) return;

        const esFirmas = tipoCarga === 'FIRMAS';
        const titulo = esFirmas ? 'Subir Acta Firmada' : 'Reemplazar Original';
        const texto = esFirmas 
            ? `Se agregará el documento de firmas para el Acta ${actaSeleccionada.NumeroActa}.`
            : `Se sobrescribirá el archivo original del Acta ${actaSeleccionada.NumeroActa}.`;

        const result = await Swal.fire({
            title: titulo,
            text: texto,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#007BFF',
            confirmButtonText: 'Sí, subir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const formData = new FormData();
                if (esFirmas) {
                    formData.append('archivoFirmas', file);
                    await subirFirmasActa(actaSeleccionada.ID_Acta, formData);
                } else {
                    formData.append('archivo', file);
                    await actualizarArchivoActa(actaSeleccionada.ID_Acta, formData);
                }
                
                Swal.fire('Éxito', 'Archivo subido correctamente.', 'success');
                cargarActas();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', error.message, 'error');
            }
        }
        setActaSeleccionada(null);
        setTipoCarga('');
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Actas de Comité</h1>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    <BsPlusLg /> Crear Acta
                </button>
            </div>

            <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".pdf" onChange={handleArchivoSeleccionado} />

            <div className="filters-bar" style={{marginBottom: '1.5rem'}}>
                <div className="search-input-container" style={{maxWidth: '400px', position: 'relative'}}>
                    <BsSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input 
                        type="text" className="form-control" 
                        placeholder="Buscar por N° Acta..." 
                        style={{ paddingLeft: '40px', height: '45px', borderRadius: '50px' }}
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
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
                                    <th>Fecha</th>
                                    <th>Objetivo</th>
                                    <th style={{textAlign: 'center', width: '180px'}}>Acta Original</th>
                                    <th style={{textAlign: 'center', width: '180px'}}>Acta Firmada</th>
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
                                            <td title={acta.Objetivo}>{acta.Objetivo.substring(0, 40)}...</td>
                                            
                                            {/* COLUMNA 1: ORIGINAL */}
                                            <td style={{textAlign: 'center'}}>
                                                {acta.RutaArchivo ? (
                                                    <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => handleVer(acta.RutaArchivo)} title="Ver">
                                                            <BsEye />
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-secondary" 
                                                            onClick={() => handleDescargar(acta.ID_Acta, 'original', `Acta_${acta.NumeroActa}.pdf`)} 
                                                            title="Descargar"
                                                        >
                                                            <BsDownload />
                                                        </button>
                                                        <button className="btn btn-sm btn-warning" onClick={() => iniciarCarga(acta, 'ORIGINAL')} title="Reemplazar">
                                                            <BsPen />
                                                        </button>
                                                    </div>
                                                ) : <span style={{color:'#999', fontSize:'0.8rem'}}>--</span>}
                                            </td>

                                            {/* COLUMNA 2: FIRMADA */}
                                            <td style={{textAlign: 'center'}}>
                                                {acta.RutaArchivoFirmas ? (
                                                    <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                                        <button className="btn btn-sm btn-success" onClick={() => handleVer(acta.RutaArchivoFirmas)} title="Ver Firmado">
                                                            <BsEye />
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-success" 
                                                            onClick={() => handleDescargar(acta.ID_Acta, 'firmas', `Acta_Firmada_${acta.NumeroActa}.pdf`)} 
                                                            title="Descargar Firmado"
                                                        >
                                                            <BsDownload />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        className="btn btn-sm"
                                                        style={{border:'1px dashed #007BFF', color:'#007BFF', background:'white'}}
                                                        onClick={() => iniciarCarga(acta, 'FIRMAS')}
                                                        title="Subir Firmas"
                                                    >
                                                        <BsCloudUpload /> Subir
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

            {modalOpen && <ModalCrearActa alCerrar={() => setModalOpen(false)} alExito={() => { setModalOpen(false); cargarActas(); }} />}
        </div>
    );
};

export default ActasPage;