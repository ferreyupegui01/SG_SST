// frontend/src/layout/MainLayout.jsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 
import Header from '../components/Header';   
import '../style/MainLayout.css'; 

/**
 * @component MainLayout
 * @desc El layout principal que gestiona la apertura del menú en móvil.
 */
const MainLayout = () => {
    // Estado para controlar si el sidebar está abierto en móvil
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="app-layout">
            
            {/* --- 1. Barra Lateral (Recibe estado y función de cerrar) --- */}
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            {/* --- Overlay Oscuro (Solo visible en móvil cuando el menú está abierto) --- */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar}></div>
            )}

            {/* --- 2. Contenedor Principal (derecha) --- */}
            <div className="main-content-wrapper">
                
                {/* --- Barra Superior (Recibe la función para ABRIR el menú) --- */}
                <Header onToggleSidebar={toggleSidebar} />
                
                {/* 'Outlet' renderizará la página actual */}
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;