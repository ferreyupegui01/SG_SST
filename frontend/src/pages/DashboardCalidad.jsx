// frontend/src/pages/DashboardCalidad.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../style/DashboardAdmin.css'; 
import { BsFillFolderFill, BsGraphUpArrow, BsClipboardCheck } from 'react-icons/bs';

const DashboardCalidad = () => {
    const { usuario } = useAuth();

    return (
        <div className="page-container">
            <div className="dashboard-admin-header" style={{ borderBottom: '4px solid #20c997' }}>
                <h1>Gestión de Calidad</h1>
                <p>Bienvenido/a, <strong>{usuario.nombre}</strong>. Panel de aseguramiento de calidad.</p>
            </div>

            <div className="page-content-card">
                <h2 style={{ marginBottom: '1.5rem' }}>Módulos Asignados</h2>
                
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    
                    <Link to="/documentos" className="kpi-card-link">
                        <div className="kpi-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BsFillFolderFill /> Gestión Documental
                            </h3>
                            <p>Control de documentos, versiones y registros del sistema.</p>
                        </div>
                    </Link>

                    <Link to="/acpm" className="kpi-card-link">
                        <div className="kpi-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BsGraphUpArrow /> Acciones (ACPM)
                            </h3>
                            <p>Gestión de acciones correctivas, preventivas y de mejora.</p>
                        </div>
                    </Link>

                    <div className="kpi-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BsClipboardCheck /> Auditorías
                        </h3>
                        <p>Módulo en construcción.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DashboardCalidad;