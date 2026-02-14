import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as performLogout, loginWithCompany, switchCompany } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingSelection, setPendingSelection] = useState(false);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [tempToken, setTempToken] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await getMe();
                    // Normalizar el formato del role
                    const user = { ...userData.user };
                    if (typeof user.role === 'string') {
                        user.role = { name: user.role };
                    }
                    setUser(user);
                } catch (error) {
                    console.error('Auth initialization failed:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const loginUser = (userData) => {
        // Si requiere selección de compañía
        if (userData.requiresSelection) {
            setPendingSelection(true);
            setCompanyOptions(userData.options || []);
            setTempToken(userData.tempToken);
            return;
        }

        // Login normal
        const user = { ...userData.user };
        if (typeof user.role === 'string') {
            user.role = { name: user.role };
        }
        setUser(user);
        setPendingSelection(false);
        setCompanyOptions([]);
        setTempToken(null);
    };

    const selectCompany = async (userId) => {

        if (!tempToken) {
            throw new Error('No hay sesión pendiente');
        }
        
        try {
            const data = await loginWithCompany(tempToken, userId);

            
            if (!data.success) {
                throw new Error(data.message || 'Error al seleccionar compañía');
            }
            
            const user = { ...data.user };
            if (typeof user.role === 'string') {
                user.role = { name: user.role };
            }
            setUser(user);
            setPendingSelection(false);
            setCompanyOptions([]);
            setTempToken(null);
            
            return data;
        } catch (error) {
            console.error('AuthContext.selectCompany - error:', error);
            throw error;
        }
    };

    const cancelSelection = () => {
        setPendingSelection(false);
        setCompanyOptions([]);
        setTempToken(null);
    };

    const switchUserCompany = async (userId) => {
        const data = await switchCompany(userId);
        
        const user = { ...data.user };
        if (typeof user.role === 'string') {
            user.role = { name: user.role };
        }
        setUser(user);
        
        return data;
    };

    const logout = () => {
        performLogout();
        setUser(null);
        setPendingSelection(false);
        setCompanyOptions([]);
        setTempToken(null);
    };

    // Función para actualizar el contexto del usuario (útil después de cambios)
    const updateUserContext = async () => {
        try {

            const userData = await getMe();

            // Normalizar el formato del role
            const user = { ...userData.user };
            if (typeof user.role === 'string') {
                user.role = { name: user.role };
            }

            setUser(user);
            return user;
        } catch (error) {
            console.error('Error updating user context:', error);
            throw error;
        }
    };

    // Refrescar datos del usuario cuando la ventana vuelve a tener foco
    // y cada 5 minutos para mantener permisos actualizados
    useEffect(() => {
        if (!user) return;

        const refreshUser = () => {
            // Solo refrescar si hay un token válido
            const token = localStorage.getItem('token');
            if (token) {
                updateUserContext().catch(() => {
                    // Silenciar errores - si falla, mantener datos actuales
                });
            }
        };

        // Refrescar al volver a la pestaña
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshUser();
            }
        };

        // Refrescar cada 5 minutos
        const intervalId = setInterval(refreshUser, 5 * 60 * 1000);

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(intervalId);
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            pendingSelection,
            companyOptions,
            loginUser, 
            selectCompany,
            cancelSelection,
            switchUserCompany,
            logout, 
            updateUserContext 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
