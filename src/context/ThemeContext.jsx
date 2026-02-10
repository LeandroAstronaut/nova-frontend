import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Inicializar desde localStorage o preferencia del sistema
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('nova-theme');
            if (savedTheme) {
                return savedTheme === 'dark';
            }
            // Si no hay tema guardado, usar preferencia del sistema
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // Aplicar clase dark al documento cuando cambie el tema
    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        // Guardar en localStorage
        localStorage.setItem('nova-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // Escuchar cambios en la preferencia del sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            // Solo cambiar si no hay preferencia guardada manualmente
            const savedTheme = localStorage.getItem('nova-theme');
            if (!savedTheme) {
                setIsDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const setLightMode = () => {
        setIsDarkMode(false);
    };

    const setDarkMode = () => {
        setIsDarkMode(true);
    };

    const value = {
        isDarkMode,
        toggleTheme,
        setLightMode,
        setDarkMode,
        theme: isDarkMode ? 'dark' : 'light'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
