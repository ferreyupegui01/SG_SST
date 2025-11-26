// frontend/src/layout/ColaboradorLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header'; // Importamos el Header (que ya tiene logout)
import '../style/ColaboradorLayout.css'; // CSS nuevo

const ColaboradorLayout = () => {
    return (
        <div className="colaborador-layout">
            {/* 1. Header en la parte superior */}
            <Header />

            {/* 2. Contenido de la página (se renderiza aquí) */}
            <main className="colaborador-page-content">
                <Outlet />
            </main>
        </div>
    );
};

export default ColaboradorLayout;