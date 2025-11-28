// frontend/src/pages/DirectorioExternoPage.jsx

import React, { useState, useEffect } from 'react';
import { buscarUsuarioExterno } from '../services/userService';
import '../index.css';
// Importamos iconos
import { BsSearch, BsBuilding, BsPersonBadge, BsEnvelope, BsBriefcaseFill, BsFolderPlus } from 'react-icons/bs';
// IMPORTAMOS EL MODAL DE DOCUMENTOS
import ModalGestionarDocs from '../components/ModalGestionarDocs';

const DirectorioExternoPage = () => {
    const [empleados, setEmpleados] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Estado para controlar qué colaborador se está gestionando
    const [colaboradorDocs, setColaboradorDocs] = useState(null);

    useEffect(() => {
        const cargarDatos = async () => {
            setIsLoading(true);
            try {
                const data = await buscarUsuarioExterno(busqueda);
                setEmpleados(data);
            } catch (error) {
                console.error("Error cargando directorio:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const delayDebounce = setTimeout(() => {
            cargarDatos();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [busqueda]);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Directorio de Colaboradores</h1>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="filters-bar" style={{marginBottom: '1.5rem'}}>
                <div className="search-input-container" style={{maxWidth: '400px', position: 'relative'}}>
                    <BsSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Buscar por nombre o cédula..." 
                        style={{ paddingLeft: '40px', height: '45px', borderRadius: '50px' }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading ? (
                        <p style={{padding:'3rem', textAlign:'center', color:'#666'}}>Cargando directorio de Gosen...</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Identificación</th>
                                    <th>Cargo (Oficio)</th>
                                    <th>Área / Centro Costo</th>
                                    <th>Contacto</th>
                                    <th>Gestión</th> {/* NUEVA COLUMNA */}
                                </tr>
                            </thead>
                            <tbody>
                                {empleados.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'#999'}}>No se encontraron colaboradores.</td></tr>
                                ) : (
                                    empleados.map((emp, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{fontWeight:'bold', color:'#005A5B', fontSize:'0.95rem'}}>
                                                    {emp.Nombre}
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#333'}}>
                                                    <BsPersonBadge style={{color:'#6c757d'}}/> 
                                                    {emp.Cedula}
                                                </div>
                                            </td>
                                            
                                            <td>
                                                <div style={{
                                                    display:'flex', alignItems:'center', gap:'6px', 
                                                    fontWeight:'600', color:'#495057', backgroundColor:'#f1f3f5', 
                                                    padding:'5px 10px', borderRadius:'6px', width:'fit-content', fontSize:'0.85rem'
                                                }}>
                                                    <BsBriefcaseFill style={{color:'#007BFF'}}/> 
                                                    {emp.Cargo}
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#666', fontSize:'0.9rem'}}>
                                                    <BsBuilding /> {emp.Area}
                                                </div>
                                            </td>

                                            <td>
                                                {emp.Email && emp.Email !== 'No registrado' ? (
                                                    <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#007BFF', fontSize:'0.85rem'}}>
                                                        <BsEnvelope /> {emp.Email}
                                                    </span>
                                                ) : <span style={{color:'#adb5bd', fontSize:'0.8rem'}}>--</span>}
                                            </td>

                                            {/* BOTÓN DE DOCUMENTOS */}
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-secondary" 
                                                    onClick={() => setColaboradorDocs(emp)} // Abrimos el modal con este empleado
                                                    title="Gestionar Documentos Adjuntos"
                                                    style={{display:'flex', alignItems:'center', gap:'5px'}}
                                                >
                                                    <BsFolderPlus /> Docs
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <div style={{marginTop:'1.5rem', fontSize:'0.75rem', color:'#888', textAlign:'center', borderTop:'1px solid #eee', paddingTop:'10px'}}>
                    Información sincronizada en tiempo real con la Base de Datos de Gosen.
                </div>
            </div>

            {/* RENDERIZADO DEL MODAL */}
            {colaboradorDocs && (
                <ModalGestionarDocs 
                    colaborador={colaboradorDocs} 
                    alCerrar={() => setColaboradorDocs(null)} 
                />
            )}
        </div>
    );
};

export default DirectorioExternoPage;