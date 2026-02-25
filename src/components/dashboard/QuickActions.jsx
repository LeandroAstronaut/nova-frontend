import React from 'react';
import { 
    Plus, 
    FileText, 
    Users, 
    Package,
    Receipt,
} from 'lucide-react';

const QuickActions = ({ features = {}, userRole = 'vendedor', onAction, compact = false }) => {
    const isClient = userRole === 'cliente';
    const isAdmin = userRole === 'admin';
    const isSeller = userRole === 'vendedor';
    
    // Acciones según rol
    const actions = [
        {
            id: 'new-budget',
            label: 'Nuevo Presupuesto',
            icon: FileText,
            show: true, // Todos ven esto
        },
        {
            id: 'view-catalog',
            label: 'Ver Catálogo',
            icon: Package,
            show: features.catalog === true, // Solo si tiene feature catalog
        },
        {
            id: 'new-client',
            label: 'Nuevo Cliente',
            icon: Users,
            show: !isClient, // No va para usuarios cliente
        },
        {
            id: 'new-receipt',
            label: 'Nuevo Recibo',
            icon: Receipt,
            show: features.receipts === true && !isClient, // Solo si tiene feature y no es cliente
        },
    ].filter(action => action.show);

    if (compact) {
        // Versión compacta - horizontal debajo de alertas
        return (
            <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            onClick={() => onAction?.(action.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-[var(--border-color)] hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
                        >
                            <Icon size={16} className="text-primary-500 dark:text-primary-400 group-hover:text-primary-600" strokeWidth={1.5} />
                            <span className="text-[12px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                                {action.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // Versión card completa (por si se necesita en otro lugar)
    return (
        <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
            <div className="p-6">
                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Plus size={14} />
                    Accesos Rápidos
                </h3>
                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />

                <div className="grid grid-cols-2 gap-3">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        
                        return (
                            <button
                                key={action.id}
                                onClick={() => onAction?.(action.id)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-hover)] hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-[var(--border-color)] hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                                    <Icon size={18} className="text-primary-500 dark:text-primary-400 group-hover:text-primary-600" strokeWidth={1.5} />
                                </div>
                                <span className="text-[11px] font-medium text-[var(--text-secondary)] group-hover:text-primary-700 dark:group-hover:text-primary-400 text-center">
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default QuickActions;
