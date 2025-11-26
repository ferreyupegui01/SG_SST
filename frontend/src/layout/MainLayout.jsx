// frontend/src/layout/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; // Importamos el Sidebar real
import Header from '../components/Header';   // Importamos el Header real
import '../style/MainLayout.css'; // Importamos el CSS del layout

/**
 * @component MainLayout
 * @desc El layout principal de la aplicación autenticada.
 */
const MainLayout = () => {
    return (
        <div className="app-layout">
            
            {/* --- 1. Barra Lateral Fija --- */}
            <Sidebar />

            {/* --- 2. Contenedor Principal (derecha) --- */}
            <div className="main-content-wrapper">
                
                {/* --- Barra Superior --- */}
                <Header />
                
                {/* 'Outlet' renderizará la página actual (ej. Dashboard) */}
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;