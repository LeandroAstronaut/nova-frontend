import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NavigationGuardContext = createContext();

export const NavigationGuardProvider = ({ children }) => {
    const [isBlocked, setIsBlocked] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [modalConfig, setModalConfig] = useState({
        title: '¿Descartar cambios?',
        description: 'Tienes cambios sin guardar. Si sales ahora, perderás todo el progreso.',
        confirmText: 'Sí, descartar',
        cancelText: 'Continuar editando',
        type: 'warning'
    });
    
    // Usamos un ref para guardar la función de cleanup
    const blockedCallbackRef = useRef(null);

    const setNavigationBlocked = useCallback((blocked, config = {}) => {
        setIsBlocked(blocked);
        if (config.title) {
            setModalConfig(prev => ({ ...prev, ...config }));
        }
    }, []);

    const requestNavigation = useCallback((destination, onConfirm, onCancel) => {
        if (!isBlocked) {
            // Si no está bloqueado, permitir navegación directamente
            if (onConfirm) onConfirm();
            return true;
        }

        // Si está bloqueado, mostrar modal
        setPendingNavigation({ destination, onConfirm, onCancel });
        setShowConfirmModal(true);
        return false;
    }, [isBlocked]);

    const handleConfirmNavigation = useCallback(() => {
        setShowConfirmModal(false);
        setIsBlocked(false);
        
        if (pendingNavigation?.onConfirm) {
            pendingNavigation.onConfirm();
        }
        
        setPendingNavigation(null);
    }, [pendingNavigation]);

    const handleCancelNavigation = useCallback(() => {
        setShowConfirmModal(false);
        
        if (pendingNavigation?.onCancel) {
            pendingNavigation.onCancel();
        }
        
        setPendingNavigation(null);
    }, [pendingNavigation]);

    return (
        <NavigationGuardContext.Provider
            value={{
                isBlocked,
                setNavigationBlocked,
                requestNavigation,
                showConfirmModal,
                handleConfirmNavigation,
                handleCancelNavigation,
                modalConfig
            }}
        >
            {children}
        </NavigationGuardContext.Provider>
    );
};

export const useNavigationGuard = () => {
    const context = useContext(NavigationGuardContext);
    if (!context) {
        throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
    }
    return context;
};

export default NavigationGuardContext;
