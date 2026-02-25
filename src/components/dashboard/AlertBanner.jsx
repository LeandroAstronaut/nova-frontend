import React from 'react';
import { AlertTriangle, FileText, Package } from 'lucide-react';

const AlertBanner = ({ type = 'budgets', count, onClick, daysOld = null }) => {
    const configs = {
        budgets: {
            icon: FileText,
            title: count === 1 ? 'Presupuesto pendiente' : `${count} presupuestos pendientes`,
            message: 'En estado de espera',
            styles: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-600',
            iconStyles: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        },
        stock: {
            icon: Package,
            title: count === 1 ? 'Producto con stock bajo' : `${count} productos con stock bajo`,
            message: 'Revisar inventario',
            styles: 'bg-danger-50 dark:bg-danger-900/20 border-danger-100 dark:border-danger-800 hover:border-danger-300 dark:hover:border-danger-600',
            iconStyles: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
        },
        oldBudgets: {
            icon: AlertTriangle,
            title: `${count} presupuestos antiguos`,
            message: `Más de ${daysOld || 7} días en espera`,
            styles: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-600',
            iconStyles: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        },
    };

    const config = configs[type] || configs.budgets;
    const Icon = config.icon;

    return (
        <div 
            onClick={onClick}
            className={`rounded-xl p-4 flex items-center gap-4 border cursor-pointer transition-all ${config.styles}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconStyles}`}>
                <Icon size={18} strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[var(--text-primary)] text-[13px]">{config.title}</h4>
                <p className="text-[11px] text-[var(--text-muted)]">{config.message}</p>
            </div>
        </div>
    );
};

export default AlertBanner;
