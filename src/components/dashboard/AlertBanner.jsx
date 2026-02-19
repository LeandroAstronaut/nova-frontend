import React from 'react';
import { AlertTriangle, FileText, Package, ArrowRight } from 'lucide-react';

const AlertBanner = ({ type = 'budgets', count, amount, onClick, daysOld = null }) => {
    const configs = {
        budgets: {
            icon: FileText,
            title: count === 1 ? 'Presupuesto pendiente' : `${count} presupuestos pendientes`,
            message: amount ? `Total: $${amount.toLocaleString('es-AR')}` : 'Sin convertir a pedidos',
            action: 'Ver',
        },
        stock: {
            icon: Package,
            title: count === 1 ? 'Producto con stock bajo' : `${count} productos con stock bajo`,
            message: 'Revisar inventario',
            action: 'Ver',
        },
        oldBudgets: {
            icon: AlertTriangle,
            title: `${count} presupuestos antiguos`,
            message: `Más de ${daysOld || 7} días sin convertir`,
            action: 'Revisar',
        },
    };

    const config = configs[type] || configs.budgets;
    const Icon = config.icon;

    return (
        <div className="card rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary-600" strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[var(--text-primary)] text-sm">{config.title}</h4>
                <p className="text-xs text-[var(--text-muted)]">{config.message}</p>
            </div>

            <button
                onClick={onClick}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
            >
                {config.action}
                <ArrowRight size={14} />
            </button>
        </div>
    );
};

export default AlertBanner;
