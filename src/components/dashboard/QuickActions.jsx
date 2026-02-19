import React from 'react';
import { 
    Plus, 
    FileText, 
    ShoppingCart, 
    Users, 
    Package,
    DollarSign,
    Receipt,
    User,
} from 'lucide-react';

const QuickActions = ({ features = {}, userRole = 'vendedor', onAction }) => {
    const allActions = [
        {
            id: 'new-order',
            label: 'Nuevo Pedido',
            icon: ShoppingCart,
            roles: ['admin', 'vendedor'],
            alwaysShow: true,
        },
        {
            id: 'new-budget',
            label: 'Nuevo Presupuesto',
            icon: FileText,
            roles: ['admin', 'vendedor'],
            alwaysShow: true,
        },
        {
            id: 'new-client',
            label: 'Nuevo Cliente',
            icon: Users,
            roles: ['admin', 'vendedor'],
            alwaysShow: true,
        },
        {
            id: 'view-catalog',
            label: 'Ver Catálogo',
            icon: Package,
            roles: ['admin', 'vendedor', 'cliente'],
            feature: 'catalog',
        },
        {
            id: 'view-products',
            label: 'Productos',
            icon: Package,
            roles: ['admin', 'vendedor'],
            alwaysShow: true,
        },
        {
            id: 'new-receipt',
            label: 'Nuevo Recibo',
            icon: Receipt,
            roles: ['admin', 'vendedor'],
            feature: 'receipts',
        },
        {
            id: 'view-commissions',
            label: 'Mis Comisiones',
            icon: DollarSign,
            roles: ['vendedor'],
            feature: 'commissionCalculation',
        },
        {
            id: 'view-account',
            label: 'Mi Cuenta',
            icon: User,
            roles: ['cliente'],
            alwaysShow: true,
        },
    ];

    const availableActions = allActions.filter(action => {
        if (!action.roles.includes(userRole) && userRole !== 'admin') {
            return false;
        }
        if (action.feature && !features[action.feature]) {
            return false;
        }
        return true;
    });

    return (
        <div className="card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Plus size={16} className="text-primary-600" strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-base">Accesos Rápidos</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {availableActions.map((action) => {
                    const Icon = action.icon;
                    
                    return (
                        <button
                            key={action.id}
                            onClick={() => onAction?.(action.id)}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[var(--bg-hover)] hover:bg-primary-50 border border-[var(--border-color)] hover:border-primary-200 transition-all group"
                        >
                            <Icon size={18} className="text-primary-500 group-hover:text-primary-600" strokeWidth={1.5} />
                            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-primary-700 text-center">
                                {action.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
