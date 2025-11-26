// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Importamos el decodificador
import * as authService from '../services/authService';

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Crear el Proveedor (Provider)
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [usuario, setUsuario] = useState(null); // { id, nombre, rol }
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Para la carga inicial

    useEffect(() => {
        // Comprobar si ya existe un token en localStorage al cargar la app
        setIsLoading(true);
        const storedToken = authService.getCurrentToken();
        
        if (storedToken) {
            try {
                // Decodificamos el token para obtener la info del usuario
                const decoded = jwtDecode(storedToken); 
                
                // Comprobamos si el token ha expirado
                if (decoded.exp * 1000 < Date.now()) {
                    authService.logout(); // Token expirado, lo borramos
                } else {
                    // Token válido
                    setToken(storedToken);
                    setUsuario(decoded.usuario); // { id, nombre, rol }
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Error decodificando el token:", error);
                authService.logout(); // Token corrupto, lo borramos
            }
        }
        setIsLoading(false);
    }, []);

    // Función de Login que se llamará desde la página de Login
    const login = async (cedula, password) => {
        // Llama al servicio de API
        const data = await authService.login(cedula, password);

        // Si tuvo éxito, el servicio ya guardó el token en localStorage
        const decoded = jwtDecode(data.token);
        
        // Actualizamos el estado global
        setToken(data.token);
        setUsuario(decoded.usuario);
        setIsAuthenticated(true);
    };

    // Función de Logout
    const logout = () => {
        authService.logout(); // Borra de localStorage
        // Resetea el estado global
        setToken(null);
        setUsuario(null);
        setIsAuthenticated(false);
    };

    // El valor que compartiremos a toda la app
    const value = {
        token,
        usuario, // El objeto { id, nombre, rol }
        isAuthenticated,
        isLoading,
        login, // La función de login
        logout, // La función de logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Crear un Hook personalizado para usar el contexto fácilmente
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};