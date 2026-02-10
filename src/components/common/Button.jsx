import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ children, isLoading, variant = 'primary', className = '', ...props }) => {
    const variants = {
        primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-soft hover:shadow-primary-200/50 dark:hover:shadow-primary-900/50',
        secondary: 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
        danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    };

    return (
        <button
            disabled={isLoading}
            className={`
                flex items-center justify-center gap-2 
                px-4 py-2 rounded-lg font-bold text-sm
                transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100
                ${variants[variant]}
                ${className}
            `}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {children}
        </button>
    );
};

export default Button;
