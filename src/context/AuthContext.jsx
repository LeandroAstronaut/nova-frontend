import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as performLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
        // Normalizar el formato del role para compatibilidad
        const user = { ...userData.user };
        if (typeof user.role === 'string') {
            user.role = { name: user.role };
        }
        setUser(user);
    };

    const logout = () => {
        performLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
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
