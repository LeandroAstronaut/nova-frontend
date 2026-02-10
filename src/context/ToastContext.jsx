import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

// Iconos según el tipo
const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info
};

// Colores según el tipo - usando las variables del tema
const styles = {
    success: {
        icon: 'text-success-500',
        bg: 'bg-success-50/95 dark:bg-success-900/20',
        border: 'border-success-200 dark:border-success-800',
        text: 'text-success-800 dark:text-success-200'
    },
    error: {
        icon: 'text-danger-500',
        bg: 'bg-danger-50/95 dark:bg-danger-900/20',
        border: 'border-danger-200 dark:border-danger-800',
        text: 'text-danger-800 dark:text-danger-200'
    },
    warning: {
        icon: 'text-warning-500',
        bg: 'bg-warning-50/95 dark:bg-warning-900/20',
        border: 'border-warning-200 dark:border-warning-800',
        text: 'text-warning-800 dark:text-warning-200'
    },
    info: {
        icon: 'text-primary-500',
        bg: 'bg-primary-50/95 dark:bg-primary-900/20',
        border: 'border-primary-200 dark:border-primary-800',
        text: 'text-primary-800 dark:text-primary-200'
    }
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* Container de toasts - Top Center */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => {
                        const Icon = icons[toast.type];
                        const style = styles[toast.type];
                        
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                layout
                                className={`
                                    pointer-events-auto 
                                    flex items-center gap-3 
                                    px-4 py-3.5 
                                    rounded-xl 
                                    border 
                                    shadow-lg shadow-secondary-900/5 dark:shadow-black/20
                                    backdrop-blur-sm
                                    ${style.bg} ${style.border}
                                `}
                            >
                                {/* Icon */}
                                <div className={`flex-shrink-0 ${style.icon}`}>
                                    <Icon size={18} strokeWidth={2} />
                                </div>
                                
                                {/* Message */}
                                <p className={`flex-1 text-[13px] font-medium leading-snug ${style.text}`}>
                                    {toast.message}
                                </p>
                                
                                {/* Close button */}
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className={`
                                        flex-shrink-0 p-1 rounded-lg
                                        opacity-60 hover:opacity-100
                                        transition-all duration-200
                                        ${style.text}
                                    `}
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export default ToastProvider;
