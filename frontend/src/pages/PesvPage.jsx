// frontend/src/pages/PesvPage.jsx

import React, { useState, useEffect } from 'react';
import { getConductoresPESV, getMantenimientos } from '../services/pesvService';
import { getActivosTodos } from '../services/assetService';
import '../index.css';
import { 
    BsConeStriped, BsPersonBadge, BsTools, BsTruck, 
    BsCheckCircle, BsPencilSquare, BsPersonPlusFill, BsEyeFill, BsPlusLg, BsInfoCircle 
} from 'react-icons/bs';
import Swal from 'sweetalert2';

// Importamos los componentes hijos
import ModalGestionConductor from '../components/ModalGestionConductor';
import ModalCrearMantenimiento from '../components/ModalCrearMantenimiento';
import TabPasosPESV from '../components/TabPasosPESV'; 
import ModalCrearUsuario from '../components/ModalCrearUsuario'; 
import ModalVerMantenimiento from '../components/ModalVerMantenimiento'; // <--- IMPORTANTE

const PesvPage = () => {
    // URL Base para abrir los documentos adjuntos
    const API_BASE_URL = 'http://localhost:5000';

    // Estado de Pestañas
    const [activeTab, setActiveTab] = useState('implementacion'); 
    
    // Estados de Datos
    const [conductores, setConductores] = useState([]);
    const [mantenimientos, setMantenimientos] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Estados de Modales
    const [modalConductorOpen, setModalConductorOpen] = useState(false);
    const [conductorSelected, setConductorSelected] = useState(null);
    
    // Modales de Mantenimiento
    const [modalMtoOpen, setModalMtoOpen] = useState(false);
    const [modalVerMtoOpen, setModalVerMtoOpen] = useState(false); // Estado para ver detalle
    const [mtoSeleccionado, setMtoSeleccionado] = useState(null); // Mto seleccionado para ver

    // Estados para crear usuario (Flujo continuo)
    const [modalCrearUsuarioOpen, setModalCrearUsuarioOpen] = useState(false);
    const [usuarioPrellenado, setUsuarioPrellenado] = useState(null);

    // Cargar datos al cambiar de pestaña
    useEffect(() => {
        cargarDatos();
    }, [activeTab]);

    const cargarDatos = async () => {
        if (activeTab === 'implementacion') return;

        setIsLoading(true);
        try {
            if (activeTab === 'conductores') {
                const data = await getConductoresPESV();
                setConductores(data);
                setIsLoading(false); 
                return data; 
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

    // --- MANEJADORES DE CONDUCTORES ---

    const abrirEditarConductor = (c) => {
        setConductorSelected(c);
        setModalConductorOpen(true);
    };

    const handleConductorGuardado = () => {
        setModalConductorOpen(false);
        setConductorSelected(null);
        cargarDatos(); 
    };
    
    const abrirCrearUsuario = (c) => {
        setUsuarioPrellenado({
            NombreCompleto: c.NombreCompleto,
            CedulaUsuario: c.CedulaUsuario,
            Cargo: c.Cargo
        });
        setModalCrearUsuarioOpen(true);
    };

    const handleUsuarioCreado = async (cedulaCreada) => {
        setModalCrearUsuarioOpen(false);
        setUsuarioPrellenado(null);

        Swal.fire({
            title: '¡Usuario Activado!',
            text: 'Preparando formulario de licencia...',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
        });

        const listaActualizada = await cargarDatos();

        if (listaActualizada && cedulaCreada) {
            const nuevoConductor = listaActualizada.find(c => c.CedulaUsuario === cedulaCreada);
            if (nuevoConductor && nuevoConductor.ID_Usuario) {
                setTimeout(() => {
                    abrirEditarConductor(nuevoConductor);
                }, 800);
            }
        }
    };

    // --- MANEJADORES DE MANTENIMIENTOS ---

    const handleMtoCreado = () => {
        setModalMtoOpen(false);
        cargarDatos(); 
    };

    const abrirVerMto = (m) => {
        setMtoSeleccionado(m);
        setModalVerMtoOpen(true);
    };

    // --- HELPERS ---

    const isVencido = (fechaISO) => {
        if (!fechaISO) return false;
        const fecha = new Date(fechaISO).setHours(0,0,0,0);
        const hoy = new Date().setHours(0,0,0,0);
        return fecha < hoy;
    };

    const abrirDocumento = (ruta) => {
        if (!ruta) return;
        const rutaLimpia = ruta.replace(/\\/g, '/'); 
        const urlCompleta = `${API_BASE_URL}/${rutaLimpia}`;
        window.open(urlCompleta, '_blank');
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
                
                {/* TAB 1: IMPLEMENTACIÓN */}
                {activeTab === 'implementacion' && <TabPasosPESV />}

                {/* TAB 2: CONDUCTORES */}
                {activeTab === 'conductores' && (
                    <>
                        {isLoading ? <p>Sincronizando con Nómina (Gosen)...</p> : (
                            <div className="table-wrapper">
                                <div style={{marginBottom:'10px', fontSize:'0.85rem', color:'#666', backgroundColor:'#e7f3ff', padding:'10px', borderRadius:'6px', border:'1px solid #b6d4fe'}}>
                                    <strong>ℹ️ Sincronización:</strong> Se visualizan colaboradores con cargos de <strong>Conductor, Chofer, Transportador y Maquinaria</strong>.
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Estado</th>
                                            <th>Nombre</th>
                                            <th>Cédula</th>
                                            <th>Cargo (Nómina)</th>
                                            <th>Licencia</th>
                                            <th>Categoría</th>
                                            <th>Vencimiento</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conductores.map((c, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    {c.EstadoRegistro === 'Registrado' ? (
                                                        <span className="status-pill status-activo">En Sistema</span>
                                                    ) : (
                                                        <span className="status-pill status-pendiente">Pendiente</span>
                                                    )}
                                                </td>
                                                <td><strong>{c.NombreCompleto}</strong></td>
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
                                                <td style={{display: 'flex', gap: '5px'}}>
                                                    {c.ID_Usuario ? (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-secondary" 
                                                                onClick={() => abrirEditarConductor(c)}
                                                                title="Editar datos de licencia"
                                                            >
                                                                <BsPencilSquare /> Gestionar
                                                            </button>

                                                            {c.RutaLicencia && (
                                                                <button 
                                                                    className="btn btn-sm"
                                                                    onClick={() => abrirDocumento(c.RutaLicencia)}
                                                                    title="Ver Licencia Adjunta"
                                                                    style={{backgroundColor: '#17a2b8', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                                                >
                                                                    <BsEyeFill />
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <button 
                                                            className="btn btn-sm btn-primary" 
                                                            onClick={() => abrirCrearUsuario(c)}
                                                            title="Habilitar usuario en el sistema"
                                                        >
                                                            <BsPersonPlusFill /> Crear Usuario
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* TAB 3: VEHÍCULOS */}
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
                                            <th style={{textAlign: 'center'}}>Ver</th> {/* COLUMNA NUEVA */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mantenimientos.length === 0 ? (
                                            <tr><td colSpan="7" style={{textAlign:'center'}}>No hay mantenimientos registrados.</td></tr>
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
                                                    <td>{m.Descripcion.substring(0, 30)}...</td>
                                                    <td>{m.Taller_Realizo || 'Interno'}</td>
                                                    <td>${(m.Costo || 0).toLocaleString()}</td>
                                                    <td style={{textAlign: 'center'}}>
                                                        <button 
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => abrirVerMto(m)}
                                                            title="Ver Detalle y Evidencia"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px'
                                                            }}
                                                        >
                                                            <BsInfoCircle /> Detalle
                                                        </button>
                                                    </td>
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

            {modalCrearUsuarioOpen && (
                <ModalCrearUsuario 
                    alCerrar={() => setModalCrearUsuarioOpen(false)} 
                    alExito={handleUsuarioCreado} 
                    initialData={usuarioPrellenado} 
                />
            )}

            {/* MODAL DE VER DETALLE (NUEVO) */}
            {modalVerMtoOpen && (
                <ModalVerMantenimiento 
                    mantenimiento={mtoSeleccionado} 
                    alCerrar={() => setModalVerMtoOpen(false)} 
                />
            )}
        </div>
    );
};

export default PesvPage;