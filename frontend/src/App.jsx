// frontend/src/App.jsx

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; 
import UsuariosPage from './pages/UsuariosPage';
import ActivosPage from './pages/ActivosPage.jsx';
import PlanificacionPage from './pages/PlanificacionPage.jsx';
import InspeccionesPage from './pages/InspeccionesPage.jsx';
import ReportesPage from './pages/ReportesPage.jsx'; 
import AcpmPage from './pages/AcpmPage.jsx'; 
import DocumentosPage from './pages/DocumentosPage.jsx';
import MedicinaLaboralPage from './pages/MedicinaLaboralPage.jsx'; 
import LogsPage from './pages/LogsPage.jsx'; 
import IndicadoresPage from './pages/IndicadoresPage.jsx'; 
import PesvPage from './pages/PesvPage.jsx'; 
import SolicitudesPage from './pages/SolicitudesPage.jsx';
import ReportarMaquinaPage from './pages/ReportarMaquinaPage.jsx'; 
import ReportarSeguridadPage from './pages/ReportarSeguridadPage.jsx';
import DashboardSuperAdmin from './pages/DashboardSuperAdmin';
import GestionFormulariosPage from './pages/GestionFormulariosPage'; 
import DirectorioExternoPage from './pages/DirectorioExternoPage';
import ActasPage from './pages/ActasPage.jsx'; 
import PresupuestoPage from './pages/PresupuestoPage.jsx';
import HistorialPage from './pages/HistorialPage.jsx';

// Layouts
import MainLayout from './layout/MainLayout'; 
import ColaboradorLayout from './layout/ColaboradorLayout.jsx'; 
import ProtectedRoutes from './components/ProtectedRoutes';

const AdminRoutes = () => {
    const { usuario } = useAuth();
    // CAMBIO: Se eliminó Gestión de Calidad
    const tieneAcceso = usuario.rol === 'Super Admin' || usuario.rol === 'Administrador SST';
    return tieneAcceso ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const SuperAdminRoutes = () => {
    const { usuario } = useAuth();
    return usuario.rol === 'Super Admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

function App() {
    const { isAuthenticated, isLoading, usuario } = useAuth();

    useEffect(() => {
        const root = document.getElementById('root');
        if (isAuthenticated) {
            root.classList.add('layout-activo');
        } else {
            root.classList.remove('layout-activo');
        }
    }, [isAuthenticated]);

    const getDefaultRoute = () => {
        if (!usuario) return "/login";
        if (usuario.rol === 'Super Admin') return "/super-admin/dashboard";
        // CAMBIO: Se eliminó la ruta de Calidad
        if (usuario.rol === 'Administrador SST') return "/dashboard";
        if (usuario.rol === 'Colaborador') return "/dashboard"; 
        return "/login";
    };

    if (isLoading) {
        return <div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center'}}>Cargando Sistema...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />} />
            
            <Route path="/" element={<ProtectedRoutes />}>
                <Route element={usuario?.rol === 'Colaborador' ? <ColaboradorLayout /> : <MainLayout />}>
                    
                    <Route path="dashboard" element={
                        usuario?.rol === 'Super Admin' ? <Navigate to="/super-admin/dashboard" replace /> :
                        // CAMBIO: Se eliminó la redirección a Calidad
                        <DashboardPage /> 
                    } />
                    
                    {/* SUPER ADMIN */}
                    <Route path="super-admin" element={<SuperAdminRoutes />}>
                        <Route path="dashboard" element={<DashboardSuperAdmin />} />
                        <Route path="formularios" element={<GestionFormulariosPage />} />
                    </Route>

                    {/* GESTIÓN Y ADMINISTRACIÓN (RUTAS COMPARTIDAS SUPER ADMIN Y ADMIN SST) */}
                    <Route element={<AdminRoutes />}>
                        <Route path="usuarios" element={<UsuariosPage />} />
                        <Route path="directorio" element={<DirectorioExternoPage />} />

                        <Route path="activos" element={<ActivosPage />} /> 
                        <Route path="planificacion" element={<PlanificacionPage />} />
                        <Route path="inspecciones" element={<InspeccionesPage />} />
                        <Route path="reportes" element={<ReportesPage />} /> 
                        <Route path="acpm" element={<AcpmPage />} /> 
                        <Route path="documentos" element={<DocumentosPage />} />
                        <Route path="medicina" element={<MedicinaLaboralPage />} /> 
                        <Route path="indicadores" element={<IndicadoresPage />} />
                        <Route path="pesv" element={<PesvPage />} /> 
                        <Route path="solicitudes" element={<SolicitudesPage />} />
                        <Route path="logs" element={<LogsPage />} />
                        <Route path="actas" element={<ActasPage />} />
                        <Route path="presupuesto" element={<PresupuestoPage />} />
                        <Route path="historial" element={<HistorialPage />} />
                    </Route>

                    {/* COLABORADOR */}
                    <Route path="reportar-maquina" element={<ReportarMaquinaPage />} />
                    <Route path="reportar-seguridad" element={<ReportarSeguridadPage />} />

                    <Route index element={<Navigate to={getDefaultRoute()} replace />} />
                </Route>
            </Route>
            
            <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
    );
}

export default App;