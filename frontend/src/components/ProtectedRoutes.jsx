// frontend/src/components/ProtectedRoutes.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * @component ProtectedRoutes
 * @desc Componente para proteger rutas.
 * Si el usuario está autenticado, muestra las rutas hijas (Outlet).
 * Si no, lo redirige a la página de login.
 */
const ProtectedRoutes = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // 1. Mostrar "Cargando..." mientras el AuthContext verifica el token
    if (isLoading) {
        return <div>Cargando sesión...</div>;
    }

    // 2. Si no está autenticado, redirigir a /login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si está autenticado, mostrar el contenido de la ruta (ej. el Dashboard)
    // 'Outlet' es el marcador de posición de react-router-dom para las rutas anidadas
    return <Outlet />;
};

export default ProtectedRoutes;