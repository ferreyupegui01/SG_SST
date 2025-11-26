// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/LoginPage.css';
import logo from "../assets/logo-empaquetados.png";
// Iconos
import { BsShieldCheck, BsJournalCheck, BsPeople, BsArrowLeft, BsPersonFill, BsLockFill } from 'react-icons/bs';

const LoginPage = () => {
    const [view, setView] = useState('SELECCION');
    const [selectedRoleTitle, setSelectedRoleTitle] = useState(''); // Solo para visualización
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoadingLogin, setIsLoadingLogin] = useState(false);
    const { login } = useAuth();

    // --- 1. SELECCIÓN DE PERFIL ---
    const handleSelectRole = (roleName) => {
        setSelectedRoleTitle(roleName);
        setView('FORMULARIO');
        setError('');
        setCedula('');
        setPassword('');
    };

    // --- 2. VOLVER ---
    const handleBack = () => {
        setView('SELECCION');
        setSelectedRoleTitle('');
        setError('');
    };

    // --- 3. LOGIN ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!cedula || !password) {
            setError('Por favor, complete todos los campos.');
            return;
        }

        setIsLoadingLogin(true);
        try {
            // El backend valida la credencial y devuelve el rol real del usuario
            await login(cedula, password);
            // La redirección la maneja el AuthContext o el App.jsx basado en el rol devuelto
        } catch (err) {
            setError(err.message || 'Credenciales incorrectas.');
            setIsLoadingLogin(false);
        }
    };

    // --- VISTA 1: SELECCIÓN DE ROL ---
    if (view === 'SELECCION') {
        return (
            <div className="login-container-selection">
                <div className="login-header-center">
                    <img src={logo} alt="Logo Empaquetados El Trece" className="login-logo-selection" />
                    <h1>Bienvenido al Sistema</h1>
                    <p>Empaquetados El Trece S.A.S</p>
                    <h3>Seleccione su perfil para ingresar:</h3>
                </div>

                <div className="role-cards-container">
                    {/* TARJETA 1: SG-SST (También entrada para Super Admin) */}
                    <div className="role-card" onClick={() => handleSelectRole('Seguridad y Salud en el Trabajo')}>
                        <div className="role-icon sst-color"><BsShieldCheck /></div>
                        <h3>Gestión SG-SST</h3>
                        <p>Administradores y Líderes SST</p>
                    </div>

                    {/* TARJETA 2: CALIDAD (NUEVO) */}
                    <div className="role-card" onClick={() => handleSelectRole('Gestión de Calidad')}>
                        <div className="role-icon calidad-color"><BsJournalCheck /></div>
                        <h3>Gestión de Calidad</h3>
                        <p>Auditores y Control de Calidad</p>
                    </div>

                    {/* TARJETA 3: COLABORADOR */}
                    <div className="role-card" onClick={() => handleSelectRole('Colaborador')}>
                        <div className="role-icon collab-color"><BsPeople /></div>
                        <h3>Colaborador</h3>
                        <p>Reportes y Consultas Operativas</p>
                    </div>
                </div>
                
                <div style={{marginTop: '2rem', fontSize: '0.8rem', color: '#aaa'}}>
                    v2.0 - Sistema Integrado de Gestión
                </div>
            </div>
        );
    }

    // --- VISTA 2: FORMULARIO ---
    return (
        <div className="login-container">
            {/* Columna Izquierda Visual */}
            <div className="login-visual-column">
                <div className="visual-content">
                    <h1>{selectedRoleTitle}</h1>
                    <p>Ingrese sus credenciales para acceder al módulo seleccionado.</p>
                </div>
            </div>

            {/* Columna Derecha Formulario */}
            <div className="login-form-column">
                <button className="btn-back" onClick={handleBack}>
                    <BsArrowLeft /> Volver
                </button>

                <div className="login-form-wrapper">
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <img src={logo} alt="Logo" className="login-form-logo" />
                    </div>
                    <div className="login-logo-placeholder">Empaquetados El Trece</div>
                    <h2>Iniciar Sesión</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="cedula">Usuario / Cédula</label>
                            <div className="input-with-icon">
                                <BsPersonFill className="input-icon" />
                                <input
                                    type="text"
                                    id="cedula"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    placeholder="Ingrese su usuario"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Contraseña</label>
                            <div className="input-with-icon">
                                <BsLockFill className="input-icon" />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingrese su contraseña"
                                />
                            </div>
                        </div>

                        {error && <p className="login-error-message">{error}</p>}

                        <button type="submit" className="btn btn-primary login-button" disabled={isLoadingLogin}>
                            {isLoadingLogin ? 'Validando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;