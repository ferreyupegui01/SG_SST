// frontend/src/pages/PesvPage.jsx

import React, { useState, useEffect } from 'react';
import { getConductoresPESV, getMantenimientos } from '../services/pesvService';
import { getActivosTodos } from '../services/assetService';
import '../index.css';
import { BsConeStriped, BsPersonBadge, BsTools, BsTruck, BsPlusLg, BsPencilSquare, BsCheckCircle, BsFileEarmarkText } from 'react-icons/bs';

// Importamos los componentes hijos
import ModalGestionConductor from '../components/ModalGestionConductor';
import ModalCrearMantenimiento from '../components/ModalCrearMantenimiento';
import TabPasosPESV from '../components/TabPasosPESV'; 

const PesvPage = () => {
    // Estado de Pestañas
    const [activeTab, setActiveTab] = useState('implementacion'); 
    
    // Estados de Datos
    const [conductores, setConductores] = useState([]);
    const [mantenimientos, setMantenimientos] = useState([]);
    const [vehiculos, setVehiculos] = useState([]); // Todos los activos tipo vehículo
    const [isLoading, setIsLoading] = useState(false);

    // Estados de Modales
    const [modalConductorOpen, setModalConductorOpen] = useState(false);
    const [conductorSelected, setConductorSelected] = useState(null);
    const [modalMtoOpen, setModalMtoOpen] = useState(false);

    // Cargar datos al cambiar de pestaña
    useEffect(() => {
        cargarDatos();
    }, [activeTab]);

    const cargarDatos = async () => {
        // La pestaña 'implementacion' gestiona su propia carga de datos
        if (activeTab === 'implementacion') return;

        setIsLoading(true);
        try {
            if (activeTab === 'conductores') {
                const data = await getConductoresPESV();
                setConductores(data);
            } 
            else if (activeTab === 'vehiculos') {
                const allActivos = await getActivosTodos();
                // Filtramos solo lo que rueda
                const vehs = allActivos.filter(v => ['Vehiculo', 'Moto', 'Montacarga'].includes(v.TipoActivo));
                setVehiculos(vehs);
            }
            else if (activeTab === 'mantenimientos') {
                const mtos = await getMantenimientos();
                const allActivos = await getActivosTodos();
                setMantenimientos(mtos);
                setVehiculos(allActivos.filter(v => ['Vehiculo', 'Moto', 'Montacarga'].includes(v.TipoActivo)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- HELPERS ---
    const abrirEditarConductor = (c) => {
        setConductorSelected(c);
        setModalConductorOpen(true);
    };

    const handleConductorGuardado = () => {
        setModalConductorOpen(false);
        setConductorSelected(null);
        cargarDatos(); // Recargar tabla
    };
    
    const handleMtoCreado = () => {
        setModalMtoOpen(false);
        cargarDatos(); // Recargar tabla
    };

    // Verificar si una fecha ya pasó (Vencido)
    const isVencido = (fechaISO) => {
        if (!fechaISO) return false;
        // Comparar solo fechas sin hora para evitar falsos positivos del mismo día
        const fecha = new Date(fechaISO).setHours(0,0,0,0);
        const hoy = new Date().setHours(0,0,0,0);
        return fecha < hoy;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>
                    <BsConeStriped style={{color:'#fd7e14', marginRight:'10px'}} /> 
                    Plan Estratégico de Seguridad Vial (PESV)
                </h1>
            </div>

            {/* --- NAVEGACIÓN (TABS) --- */}
            <div style={{display:'flex', gap:'0.5rem', marginBottom:'2rem', borderBottom:'2px solid #dee2e6', flexWrap: 'wrap'}}>
                <button 
                    className={`btn ${activeTab === 'implementacion' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setActiveTab('implementacion')}
                    style={{borderRadius:'8px 8px 0 0', borderBottom: 'none'}}
                >
                    <BsCheckCircle /> Implementación
                </button>
                <button 
                    className={`btn ${activeTab === 'conductores' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setActiveTab('conductores')}
                    style={{borderRadius:'8px 8px 0 0', borderBottom: 'none'}}
                >
                    <BsPersonBadge /> Conductores
                </button>
                <button 
                    className={`btn ${activeTab === 'vehiculos' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setActiveTab('vehiculos')}
                    style={{borderRadius:'8px 8px 0 0', borderBottom: 'none'}}
                >
                    <BsTruck /> Vehículos
                </button>
                <button 
                    className={`btn ${activeTab === 'mantenimientos' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setActiveTab('mantenimientos')}
                    style={{borderRadius:'8px 8px 0 0', borderBottom: 'none'}}
                >
                    <BsTools /> Mantenimientos
                </button>
            </div>

            {/* --- CONTENIDO --- */}
            <div className="page-content-card">
                
                {/* TAB 1: IMPLEMENTACIÓN (Gestor de Pasos) */}
                {activeTab === 'implementacion' && <TabPasosPESV />}

                {/* TAB 2: CONDUCTORES */}
                {activeTab === 'conductores' && (
                    <>
                        {isLoading ? <p>Cargando conductores...</p> : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Cédula</th>
                                            <th>Cargo</th>
                                            <th>Licencia</th>
                                            <th>Categoría</th>
                                            <th>Vencimiento</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conductores.map(c => (
                                            <tr key={c.ID_Usuario}>
                                                <td>{c.NombreCompleto}</td>
                                                <td>{c.CedulaUsuario}</td>
                                                <td>{c.Cargo}</td>
                                                <td>{c.NumeroLicencia || '--'}</td>
                                                <td>{c.Categoria || '--'}</td>
                                                <td>
                                                    {c.VencimientoLicencia ? (
                                                        <span className={`status-pill ${isVencido(c.VencimientoLicencia) ? 'status-inactivo' : 'status-activo'}`}>
                                                            {new Date(c.VencimientoLicencia).toLocaleDateString()}
                                                        </span>
                                                    ) : <span style={{color:'#999'}}>--</span>}
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => abrirEditarConductor(c)}>
                                                        <BsPencilSquare /> Gestionar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* TAB 3: VEHÍCULOS (Resumen) */}
                {activeTab === 'vehiculos' && (
                    <>
                        {isLoading ? <p>Cargando flota...</p> : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Placa / ID</th>
                                            <th>Descripción</th>
                                            <th>Kilometraje</th>
                                            <th>Venc. SOAT</th>
                                            <th>Venc. Tecno</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehiculos.map(v => (
                                            <tr key={v.ID_Activo}>
                                                <td>{v.TipoActivo}</td>
                                                <td><strong>{v.CodigoIdentificador}</strong></td>
                                                <td>{v.NombreDescriptivo}</td>
                                                <td style={{color:'#007BFF', fontWeight:'bold'}}>
                                                    {v.KilometrajeActual ? v.KilometrajeActual.toLocaleString() : 0} km
                                                </td>
                                                <td>
                                                    {v.SOAT_Vencimiento ? (
                                                        <span className={`status-pill ${isVencido(v.SOAT_Vencimiento) ? 'status-inactivo' : 'status-activo'}`}>
                                                            {new Date(v.SOAT_Vencimiento).toLocaleDateString()}
                                                        </span>
                                                    ) : '--'}
                                                </td>
                                                <td>
                                                    {v.Tecno_Vencimiento ? (
                                                        <span className={`status-pill ${isVencido(v.Tecno_Vencimiento) ? 'status-inactivo' : 'status-activo'}`}>
                                                            {new Date(v.Tecno_Vencimiento).toLocaleDateString()}
                                                        </span>
                                                    ) : '--'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* TAB 4: MANTENIMIENTOS */}
                {activeTab === 'mantenimientos' && (
                    <>
                        <div style={{marginBottom:'1rem'}}>
                            <button className="btn btn-primary" onClick={() => setModalMtoOpen(true)}>
                                <BsPlusLg /> Registrar Mantenimiento
                            </button>
                        </div>
                        
                        {isLoading ? <p>Cargando historial...</p> : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Vehículo</th>
                                            <th>Tipo</th>
                                            <th>Descripción</th>
                                            <th>Taller</th>
                                            <th>Costo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mantenimientos.length === 0 ? (
                                            <tr><td colSpan="6" style={{textAlign:'center'}}>No hay mantenimientos registrados.</td></tr>
                                        ) : (
                                            mantenimientos.map(m => (
                                                <tr key={m.ID_Mantenimiento}>
                                                    <td>{new Date(m.Fecha).toLocaleDateString()}</td>
                                                    <td>{m.Vehiculo} ({m.Placa})</td>
                                                    <td>
                                                        <span className={`status-pill ${m.TipoMantenimiento === 'Preventivo' ? 'status-activo' : 'status-inactivo'}`}>
                                                            {m.TipoMantenimiento}
                                                        </span>
                                                    </td>
                                                    <td>{m.Descripcion}</td>
                                                    <td>{m.Taller_Realizo || 'Interno'}</td>
                                                    <td>${(m.Costo || 0).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- MODALES --- */}
            {modalConductorOpen && (
                <ModalGestionConductor 
                    conductor={conductorSelected} 
                    alCerrar={() => setModalConductorOpen(false)} 
                    alExito={handleConductorGuardado} 
                />
            )}
            
            {modalMtoOpen && (
                <ModalCrearMantenimiento 
                    vehiculos={vehiculos} 
                    alCerrar={() => setModalMtoOpen(false)} 
                    alExito={handleMtoCreado} 
                />
            )}
        </div>
    );
};

export default PesvPage;