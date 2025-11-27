// frontend/src/pages/DirectorioExternoPage.jsx

import React, { useState, useEffect } from 'react';
import { buscarUsuarioExterno } from '../services/userService';
import '../index.css';
import { BsSearch, BsBuilding, BsPersonBadge, BsEnvelope } from 'react-icons/bs';

const DirectorioExternoPage = () => {
    const [empleados, setEmpleados] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Carga inicial y búsqueda
    useEffect(() => {
        const cargarDatos = async () => {
            setIsLoading(true);
            try {
                // Si busqueda está vacía, el backend ahora nos trae los TOP 50 por defecto
                const data = await buscarUsuarioExterno(busqueda);
                setEmpleados(data);
            } catch (error) {
                console.error("Error cargando directorio:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce para no saturar la API mientras escribes
        const delayDebounce = setTimeout(() => {
            cargarDatos();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [busqueda]);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Directorio Corporativo (Nómina)</h1>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="filters-bar" style={{marginBottom: '1.5rem'}}>
                <div className="search-input-container" style={{maxWidth: '400px'}}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Buscar por nombre o cédula..." 
                        style={{ paddingLeft: '35px', height: '45px', borderRadius: '50px' }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="page-content-card">
                <div className="table-wrapper">
                    {isLoading ? (
                        <p style={{padding:'2rem', textAlign:'center'}}>Cargando directorio...</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Identificación</th>
                                    <th>Ubicación / Cargo</th>
                                    <th>Contacto</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empleados.length === 0 ? (
                                    <tr><td colSpan="5" style={{textAlign:'center'}}>No se encontraron coincidencias.</td></tr>
                                ) : (
                                    empleados.map((emp, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{fontWeight:'bold', color:'#005A5B'}}>{emp.Nombre}</div>
                                            </td>
                                            <td>
                                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                                    <BsPersonBadge style={{color:'#666'}}/> {emp.Cedula}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{fontSize:'0.9rem'}}>{emp.Cargo}</div>
                                                <div style={{fontSize:'0.8rem', color:'#666', display:'flex', alignItems:'center', gap:'5px'}}>
                                                    <BsBuilding /> {emp.Area}
                                                </div>
                                            </td>
                                            <td>
                                                {emp.Email && emp.Email !== 'No registrado' ? (
                                                    <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#007BFF'}}>
                                                        <BsEnvelope /> {emp.Email}
                                                    </span>
                                                ) : <span style={{color:'#ccc'}}>--</span>}
                                            </td>
                                            <td>
                                                <span className="status-pill status-activo">Activo</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                <div style={{marginTop:'1rem', fontSize:'0.8rem', color:'#666', textAlign:'center'}}>
                    Mostrando resultados de la base de datos externa GH.
                </div>
            </div>
        </div>
    );
};

export default DirectorioExternoPage;