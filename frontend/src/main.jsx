// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <--- Importa tu AuthProvider
// Asumo que tienes un index.css global
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* 1. Envuelve todo con el AuthProvider */}
        <AuthProvider>
            {/* 2. Envuelve todo con el BrowserRouter */}
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>,
);