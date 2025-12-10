// frontend/src/pages/PresupuestoPage.jsx

import React, { useState, useEffect } from 'react';
import { 
    getPresupuestos, 
    crearPresupuesto, 
    registrarGasto, 
    getDetalleGastos,
    editarPresupuesto,
    eliminarPresupuesto 
} from '../services/budgetService';
import { useAuth } from '../context/AuthContext';
import '../index.css';
import Swal from 'sweetalert2';
import { 
    BsCashCoin, BsPlusLg, BsFileEarmarkArrowUp, BsEye, 
    BsCurrencyDollar, BsPencilSquare, BsTrash, BsArchiveFill // <--- Agregué icono de archivo
} from 'react-icons/bs';

const API_URL = 'http://localhost:5000';

const PresupuestoPage = () => {
    const { usuario } = useAuth();
    const [presupuestos, setPresupuestos] = useState([]);
    const [anio, setAnio] = useState(new Date().getFullYear());
    
    // Modales
    const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
    const [modalGastoOpen, setModalGastoOpen] = useState(false);
    const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
    
    // Estados auxiliares
    const [selectedPresupuesto, setSelectedPresupuesto] = useState(null);
    const [listaGastos, setListaGastos] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    // Forms
    const [formAsignar, setFormAsignar] = useState({ 
        idPresupuesto: null,
        nombreRubro: '', 
        descripcion: '', 
        montoAsignado: '', 
        anio: new Date().getFullYear(),
        estado: 'Activo'
    });
    
    const [formGasto, setFormGasto] = useState({ 
        descripcionGasto: '', 
        montoGastado: '', 
        fechaGasto: new Date().toISOString().split('T')[0] 
    });
    const [archivoGasto, setArchivoGasto] = useState(null);

    const esSuperAdmin = usuario.rol === 'Super Admin';

    useEffect(() => {
        cargarDatos();
    }, [anio]);

    const cargarDatos = async () => {
        try {
            const data = await getPresupuestos(anio);
            setPresupuestos(data);
        } catch (error) { console.error(error); }
    };

    // --- LOGICA MODAL ASIGNAR/EDITAR ---
    const abrirModalCrear = () => {
        setIsEditing(false);
        setFormAsignar({ 
            idPresupuesto: null,
            nombreRubro: '', descripcion: '', montoAsignado: '', 
            anio: anio, estado: 'Activo' 
        });
        setModalAsignarOpen(true);
    };

    const abrirModalEditar = (p) => {
        setIsEditing(true);
        setFormAsignar({
            idPresupuesto: p.ID_Presupuesto,
            nombreRubro: p.NombreRubro,
            descripcion: p.Descripcion || '',
            montoAsignado: p.MontoAsignado,
            anio: p.Anio,
            estado: p.Estado
        });
        setModalAsignarOpen(true);
    };

    const handleGuardarPresupuesto = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await editarPresupuesto(formAsignar.idPresupuesto, formAsignar);
                Swal.fire('Actualizado', 'Rubro actualizado correctamente.', 'success');
            } else {
                await crearPresupuesto(formAsignar);
                Swal.fire('Creado', 'Presupuesto asignado.', 'success');
            }
            setModalAsignarOpen(false);
            cargarDatos();
        } catch (error) { 
            Swal.fire('Error', error.message, 'error'); 
        }
    };

    // --- LOGICA INACTIVAR (Antes Eliminar) ---
    const handleEliminar = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Inactivar Rubro?',
            text: `Se ocultará el rubro "${nombre}" de la lista principal.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, inactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await eliminarPresupuesto(id); // Llama al backend que ahora hace UPDATE
                Swal.fire('Inactivado', 'El rubro ha sido archivado.', 'success');
                cargarDatos();
            } catch (error) {
                // Mensaje si tiene gastos (viene del SP)
                Swal.fire('No se puede inactivar', error.message, 'error');
            }
        }
    };

    // --- LOGICA GASTAR (Admin SST) ---
    const abrirModalGasto = (p) => {
        setSelectedPresupuesto(p);
        setModalGastoOpen(true);
    };

    const handleGasto = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('idPresupuesto', selectedPresupuesto.ID_Presupuesto);
        formData.append('descripcionGasto', formGasto.descripcionGasto);
        formData.append('montoGastado', formGasto.montoGastado);
        formData.append('fechaGasto', formGasto.fechaGasto);
        if (archivoGasto) formData.append('evidencia', archivoGasto);

        try {
            await registrarGasto(formData);
            Swal.fire('Registrado', 'Gasto guardado correctamente.', 'success');
            setModalGastoOpen(false);
            setFormGasto({ descripcionGasto: '', montoGastado: '', fechaGasto: new Date().toISOString().split('T')[0] });
            setArchivoGasto(null);
            cargarDatos();
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    // --- LOGICA VER DETALLE ---
    const abrirModalDetalle = async (p) => {
        setSelectedPresupuesto(p);
        const gastos = await getDetalleGastos(p.ID_Presupuesto);
        setListaGastos(gastos);
        setModalDetalleOpen(true);
    };

    // --- UTILS ---
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const getProgressColor = (porcentaje) => {
        if (porcentaje > 90) return '#dc3545'; // Rojo
        if (porcentaje > 70) return '#ffc107'; // Amarillo
        return '#28a745'; // Verde
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gestión de Presupuesto {anio}</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <input type="number" className="form-control" style={{width:'80px'}} value={anio} onChange={e => setAnio(e.target.value)} />
                    {esSuperAdmin && (
                        <button className="btn btn-primary" onClick={abrirModalCrear}>
                            <BsPlusLg /> Asignar Nuevo Rubro
                        </button>
                    )}
                </div>
            </div>

            <div className="page-content-card">
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', gap:'1.5rem'}}>
                    {presupuestos.map(p => {
                        const porcentaje = (p.TotalGastado / p.MontoAsignado) * 100;
                        const colorBarra = getProgressColor(porcentaje);

                        return (
                            <div key={p.ID_Presupuesto} style={{border:'1px solid #eee', borderRadius:'10px', padding:'1.5rem', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', position:'relative', backgroundColor: '#fff'}}>
                                
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                    <h3 style={{margin:'0 0 5px 0', color:'#005A5B', maxWidth: '70%'}}>{p.NombreRubro}</h3>
                                    
                                    {/* BOTONES DE EDICIÓN (SOLO SUPER ADMIN) */}
                                    {esSuperAdmin && (
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <button className="btn btn-sm btn-icon" onClick={() => abrirModalEditar(p)} title="Editar Rubro">
                                                <BsPencilSquare style={{color:'#f0ad4e'}}/>
                                            </button>
                                            <button className="btn btn-sm btn-icon" onClick={() => handleEliminar(p.ID_Presupuesto, p.NombreRubro)} title="Inactivar (Solo si sin gastos)">
                                                <BsArchiveFill style={{color:'#dc3545'}}/> {/* Icono cambiado a Archive */}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <p style={{color:'#666', fontSize:'0.9rem', minHeight:'40px'}}>{p.Descripcion}</p>
                                
                                <div style={{marginBottom:'1rem'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:'5px'}}>
                                        <span>Gastado: <strong>{formatMoney(p.TotalGastado)}</strong></span>
                                        <span>Total: <strong>{formatMoney(p.MontoAsignado)}</strong></span>
                                    </div>
                                    <div style={{width:'100%', height:'10px', backgroundColor:'#e9ecef', borderRadius:'5px', overflow:'hidden'}}>
                                        <div style={{width:`${Math.min(porcentaje, 100)}%`, height:'100%', backgroundColor: colorBarra, transition:'width 0.5s'}}></div>
                                    </div>
                                    <div style={{textAlign:'right', marginTop:'5px', fontWeight:'bold', color: p.SaldoDisponible < 0 ? 'red' : '#28a745'}}>
                                        Disponible: {formatMoney(p.SaldoDisponible)}
                                    </div>
                                </div>

                                <div style={{display:'flex', gap:'10px', marginTop:'1rem'}}>
                                    <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={() => abrirModalDetalle(p)}>
                                        <BsEye /> Ver Gastos
                                    </button>
                                    <button className="btn btn-warning btn-sm" style={{flex:1}} onClick={() => abrirModalGasto(p)}>
                                        <BsCashCoin /> Registrar Gasto
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {presupuestos.length === 0 && <p style={{color:'#666'}}>No hay rubros activos asignados para este año.</p>}
                </div>
            </div>

            {/* MODAL ASIGNAR / EDITAR (SUPER ADMIN) */}
            {modalAsignarOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{isEditing ? 'Editar Presupuesto' : 'Asignar Presupuesto'}</h3>
                            <button className="modal-close-button" onClick={()=>setModalAsignarOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleGuardarPresupuesto}>
                            <div className="modal-body">
                                <div className="form-group"><label>Nombre Actividad/Rubro</label><input required className="form-control" value={formAsignar.nombreRubro} onChange={e=>setFormAsignar({...formAsignar, nombreRubro:e.target.value})} placeholder="Ej: Compra EPP"/></div>
                                <div className="form-group"><label>Descripción</label><input className="form-control" value={formAsignar.descripcion} onChange={e=>setFormAsignar({...formAsignar, descripcion:e.target.value})}/></div>
                                <div className="form-group"><label>Monto a Asignar ($)</label><input type="number" required className="form-control" value={formAsignar.montoAsignado} onChange={e=>setFormAsignar({...formAsignar, montoAsignado:e.target.value})}/></div>
                                
                                {isEditing && (
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select className="form-control" value={formAsignar.estado} onChange={e=>setFormAsignar({...formAsignar, estado:e.target.value})}>
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo (Ocultar)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer"><button className="btn btn-primary">{isEditing ? 'Actualizar' : 'Guardar'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR GASTO */}
            {modalGastoOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>Registrar Gasto: {selectedPresupuesto?.NombreRubro}</h3><button className="modal-close-button" onClick={()=>setModalGastoOpen(false)}>&times;</button></div>
                        <form onSubmit={handleGasto}>
                            <div className="modal-body">
                                <div className="form-group"><label>Descripción del Gasto</label><input required className="form-control" value={formGasto.descripcionGasto} onChange={e=>setFormGasto({...formGasto, descripcionGasto:e.target.value})} placeholder="Ej: Factura #123 Panamericana"/></div>
                                <div className="form-group"><label>Monto ($)</label><input type="number" required className="form-control" value={formGasto.montoGastado} onChange={e=>setFormGasto({...formGasto, montoGastado:e.target.value})}/></div>
                                <div className="form-group"><label>Fecha</label><input type="date" required className="form-control" value={formGasto.fechaGasto} onChange={e=>setFormGasto({...formGasto, fechaGasto:e.target.value})}/></div>
                                <div className="form-group"><label>Evidencia (Factura/Foto)</label><input type="file" className="form-control" onChange={e=>setArchivoGasto(e.target.files[0])}/></div>
                            </div>
                            <div className="modal-footer"><button className="btn btn-primary">Registrar</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL VER DETALLE */}
            {modalDetalleOpen && (
                <div className="modal-overlay">
                    <div className="modal-content modal-lg">
                        <div className="modal-header"><h3>Detalle de Gastos: {selectedPresupuesto?.NombreRubro}</h3><button className="modal-close-button" onClick={()=>setModalDetalleOpen(false)}>&times;</button></div>
                        <div className="modal-body" style={{maxHeight:'60vh', overflowY:'auto'}}>
                            <table className="data-table">
                                <thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Evidencia</th></tr></thead>
                                <tbody>
                                    {listaGastos.map(g => (
                                        <tr key={g.ID_Gasto}>
                                            <td>{new Date(g.FechaGasto).toLocaleDateString()}</td>
                                            <td>{g.DescripcionGasto}<br/><small style={{color:'#999'}}>Reg: {g.UsuarioRegistra}</small></td>
                                            <td style={{fontWeight:'bold'}}>{formatMoney(g.MontoGastado)}</td>
                                            <td>
                                                {g.RutaEvidencia ? (
                                                    <a href={`${API_URL}/${g.RutaEvidencia}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary"><BsFileEarmarkArrowUp/> Ver</a>
                                                ) : 'No adjunto'}
                                            </td>
                                        </tr>
                                    ))}
                                    {listaGastos.length === 0 && <tr><td colSpan="4">No hay gastos registrados.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresupuestoPage;