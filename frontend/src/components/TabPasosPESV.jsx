// frontend/src/components/TabPasosPESV.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService'; 
import { useAuth } from '../context/AuthContext'; 
import '../index.css';
import Swal from 'sweetalert2';
import { BsFileEarmarkPdf, BsMagic, BsUpload, BsEye, BsPencil, BsTrash, BsPlusLg, BsInputCursorText } from 'react-icons/bs';

import ModalGenerarDocumento from './ModalGenerarDocumento';
import ModalVerEvidencia from './ModalVerEvidencia';
import ModalGuardarPaso from './ModalGuardarPaso';         
import ModalConfigurarPlantilla from './ModalConfigurarPlantilla'; 

const TabPasosPESV = () => {
    const { usuario } = useAuth();
    const [pasos, setPasos] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados Modales
    const [pasoSeleccionado, setPasoSeleccionado] = useState(null);
    const [modalGenerarOpen, setModalGenerarOpen] = useState(false);
    const [modalGestionarOpen, setModalGestionarOpen] = useState(false);
    const [modalVerEvidenciaOpen, setModalVerEvidenciaOpen] = useState(false);
    const [modalCRUDOpen, setModalCRUDOpen] = useState(false); 
    const [modalConfigOpen, setModalConfigOpen] = useState(false); 

    // Estados Gestión Manual
    const [file, setFile] = useState(null);
    const [nuevoEstado, setNuevoEstado] = useState('');
    
    // Estados Visualizar
    const [evidenciasVisualizar, setEvidenciasVisualizar] = useState([]);
    const [nombrePasoVisualizar, setNombrePasoVisualizar] = useState('');

    const esSuperAdmin = usuario.rol === 'Super Admin';

    useEffect(() => { cargarPasos(); }, []);

    const cargarPasos = async () => {
        try {
            const data = await apiFetch('/pesv/pasos');
            setPasos(data);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    // --- CRUD PASOS ---
    const handleNuevoPaso = () => { setPasoSeleccionado(null); setModalCRUDOpen(true); };
    const handleEditarPaso = (paso) => { setPasoSeleccionado(paso); setModalCRUDOpen(true); };
    const handleDiseñarFormulario = (paso) => { setPasoSeleccionado(paso); setModalConfigOpen(true); };

    const handleEliminarPaso = async (paso) => {
        const result = await Swal.fire({
            title: '¿Eliminar paso?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            try {
                await apiFetch(`/pesv/pasos/${paso.ID_Paso}`, { method: 'DELETE' });
                Swal.fire('Eliminado', 'Paso eliminado.', 'success');
                cargarPasos();
            } catch (error) { Swal.fire('Error', error.message, 'error'); }
        }
    };

    // --- VER EVIDENCIAS ---
    const handleVerEvidencias = async (paso) => {
        if (paso.CantidadEvidencias === 0) return;
        try {
            const archivos = await apiFetch(`/pesv/pasos/${paso.ID_Paso}/evidencias`);
            setEvidenciasVisualizar(archivos);
            setNombrePasoVisualizar(paso.NombrePaso);
            setModalVerEvidenciaOpen(true);
        // eslint-disable-next-line no-unused-vars
        } catch (error) { Swal.fire('Error', 'No se cargaron archivos', 'error'); }
    };

    // --- GESTIÓN MANUAL ---
    const abrirGestionar = (paso) => {
        setPasoSeleccionado(paso);
        setNuevoEstado(paso.Estado);
        setFile(null);
        setModalGestionarOpen(true);
    };

    const handleGuardarManual = async () => {
        if (!pasoSeleccionado) return;
        const formData = new FormData();
        formData.append('idPaso', pasoSeleccionado.ID_Paso);
        formData.append('estado', nuevoEstado);
        if (file) formData.append('evidencia', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/pesv/pasos/actualizar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (response.ok) {
                Swal.fire('Actualizado', 'Paso actualizado.', 'success');
                setModalGestionarOpen(false);
                cargarPasos();
            } else throw new Error('Error');
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    const getEstadoColor = (estado) => {
        if (estado === 'Realizada' || estado === 'Realizado') return 'status-activo';
        if (estado === 'En Proceso') return 'status-proceso';
        return 'status-pendiente';
    };

    const avance = pasos.length > 0 ? Math.round((pasos.filter(p => p.Estado === 'Realizado').length / pasos.length) * 100) : 0;

    return (
        <div className="table-wrapper">
            <div style={{marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#eef2f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                    <h3 style={{margin:0, color: '#005A5B'}}>Avance PESV</h3>
                    <p style={{margin:0, color:'#666'}}>Ciclo PHVA</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    {esSuperAdmin && (
                        <button className="btn btn-primary" onClick={handleNuevoPaso}>
                            <BsPlusLg /> Nuevo Paso
                        </button>
                    )}
                    <div style={{textAlign:'right'}}>
                        <div style={{fontSize: '2rem', fontWeight: 'bold', color: avance === 100 ? '#28a745' : '#005A5B'}}>{avance}%</div>
                        <small>Cumplimiento</small>
                    </div>
                </div>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{width:'50px'}}>#</th>
                        <th>Requisito</th>
                        <th>Normativa</th>
                        <th>Evidencias</th>
                        <th>Estado</th>
                        <th style={{width:'200px'}}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {pasos.map(p => (
                        <tr key={p.ID_Paso}>
                            <td><strong>{p.NumeroPaso}</strong></td>
                            <td><strong>{p.NombrePaso}</strong></td>
                            <td style={{fontSize:'0.85rem', color:'#666'}}>{p.DescripcionNorma}</td>
                            
                            {/* COLUMNA EVIDENCIAS (CLICKEABLE) */}
                            <td style={{cursor: p.CantidadEvidencias > 0 ? 'pointer' : 'default'}} onClick={() => handleVerEvidencias(p)}>
                                {p.CantidadEvidencias > 0 ? (
                                    <div className="status-pill" style={{backgroundColor:'#e7f1ff', color:'#007BFF', display:'inline-flex', alignItems:'center', gap:'5px', border:'1px solid #007BFF'}}>
                                        <BsEye /> {p.CantidadEvidencias}
                                    </div>
                                ) : <span style={{color:'#999', fontSize:'0.8rem'}}>--</span>}
                            </td>

                            <td><span className={`status-pill ${getEstadoColor(p.Estado)}`}>{p.Estado}</span></td>
                            
                            <td>
                                <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                                    <button className="btn btn-sm btn-magic" title="Generar" onClick={() => { setPasoSeleccionado(p); setModalGenerarOpen(true); }}><BsMagic /></button>
                                    <button className="btn btn-sm btn-action" title="Gestionar" onClick={() => abrirGestionar(p)}><BsUpload /></button>
                                    
                                    {esSuperAdmin && (
                                        <>
                                            <button className="btn btn-sm" style={{backgroundColor:'#fd7e14', color:'white'}} title="Diseñar" onClick={() => handleDiseñarFormulario(p)}><BsInputCursorText /></button>
                                            <button className="btn btn-sm btn-warning" title="Editar" onClick={() => handleEditarPaso(p)}><BsPencil /></button>
                                            <button className="btn btn-sm btn-danger" title="Eliminar" onClick={() => handleEliminarPaso(p)}><BsTrash /></button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODALES */}
            {modalGestionarOpen && (
                <div className="modal-overlay" onClick={() => setModalGestionarOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Gestión Manual</h3><button className="modal-close-button" onClick={() => setModalGestionarOpen(false)}>&times;</button></div>
                        <div className="modal-body">
                            <div className="form-group"><label>Estado</label><select className="form-control" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}><option>Pendiente</option><option>En Proceso</option><option>Realizado</option></select></div>
                            <div className="form-group"><label>Evidencia</label><input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} /></div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModalGestionarOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleGuardarManual}>Guardar</button></div>
                    </div>
                </div>
            )}

            {modalGenerarOpen && <ModalGenerarDocumento paso={pasoSeleccionado} alCerrar={() => setModalGenerarOpen(false)} alExito={() => { setModalGenerarOpen(false); cargarPasos(); }} />}
            {modalVerEvidenciaOpen && <ModalVerEvidencia archivos={evidenciasVisualizar} pasoNombre={nombrePasoVisualizar} alCerrar={() => setModalVerEvidenciaOpen(false)} />}
            
            {modalCRUDOpen && <ModalGuardarPaso paso={pasoSeleccionado} alCerrar={() => setModalCRUDOpen(false)} alExito={() => { setModalCRUDOpen(false); cargarPasos(); }} />}
            {modalConfigOpen && <ModalConfigurarPlantilla paso={pasoSeleccionado} alCerrar={() => setModalConfigOpen(false)} />}
        </div>
    );
};

export default TabPasosPESV;