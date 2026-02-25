import React from 'react';
import { FileText, ShoppingCart, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentActivity = ({ orders = [], isLoading = false, onViewAll, userRole }) => {
    const navigate = useNavigate();

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffInHours = (now - d) / (1000 * 60 * 60);
        
        if (diffInHours < 1) return 'Ahora';
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
        if (diffInHours < 48) return 'Ayer';
        return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    };

    const handleOrderClick = (order) => {
        if (!order?._id) return;
        // Redirigir según tipo: presupuesto o pedido
        const baseRoute = order.type === 'budget' ? '/presupuestos' : '/pedidos';
        navigate(`${baseRoute}/${order._id}`);
    };

    // Calcular distribución por estado
    const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {});

    const totalOrders = orders.length;

    const getStatusLabel = (status) => {
        const labels = {
            'espera': 'Espera',
            'confirmado': 'Confirmado',
            'preparado': 'Preparado',
            'completo': 'Completado',
        };
        return labels[status] || status;
    };

    if (isLoading) {
        return (
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)] h-[400px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100"></div>
                    <div className="text-[var(--text-muted)] text-xs">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={14} />
                        {userRole === 'cliente' ? 'Mis Pedidos' : 'Actividad Reciente'}
                    </h3>
                    {onViewAll && orders.length > 0 && (
                        <button
                            onClick={onViewAll}
                            className="flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            Ver todos
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                
                <p className="text-[13px] text-[var(--text-secondary)] mb-4">
                    {userRole === 'admin' ? 'Toda la empresa' : userRole === 'vendedor' ? 'Tus pedidos y presupuestos' : 'Tus compras recientes'}
                </p>

                {/* Barra de distribución por estado */}
                {totalOrders > 0 && (
                    <div className="mb-5">
                        <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-hover)]">
                            {statusCounts['espera'] > 0 && (
                                <div className="bg-gray-300 dark:bg-gray-600" style={{ width: `${(statusCounts['espera'] / totalOrders) * 100}%` }} />
                            )}
                            {statusCounts['confirmado'] > 0 && (
                                <div className="bg-primary-400" style={{ width: `${(statusCounts['confirmado'] / totalOrders) * 100}%` }} />
                            )}
                            {statusCounts['preparado'] > 0 && (
                                <div className="bg-primary-500" style={{ width: `${(statusCounts['preparado'] / totalOrders) * 100}%` }} />
                            )}
                            {statusCounts['completo'] > 0 && (
                                <div className="bg-success-500" style={{ width: `${(statusCounts['completo'] / totalOrders) * 100}%` }} />
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-1 text-[10px]">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        status === 'espera' ? 'bg-gray-300 dark:bg-gray-600' : 
                                        status === 'confirmado' ? 'bg-primary-400' : 
                                        status === 'preparado' ? 'bg-primary-500' : 'bg-success-500'
                                    }`} />
                                    <span className="text-[var(--text-muted)]">{getStatusLabel(status)}:</span>
                                    <span className="text-[var(--text-secondary)] font-medium">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de pedidos */}
                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                    {orders.length > 0 ? orders.slice(0, 8).map((order) => {
                        return (
                            <div
                                key={order._id}
                                onClick={() => handleOrderClick(order)}
                                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 flex items-center justify-center flex-shrink-0 transition-colors">
                                    {order.type === 'budget' ? 
                                        <FileText size={16} className="text-primary-600 dark:text-primary-400" /> : 
                                        <ShoppingCart size={16} className="text-primary-600 dark:text-primary-400" />
                                    }
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-bold text-[var(--text-primary)]">
                                            #{order.orderNumber}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)]">
                                            {order.type === 'budget' ? 'Presup.' : 'Pedido'}
                                        </span>
                                    </div>
                                    <div className="text-[12px] text-[var(--text-muted)] truncate">
                                        {order.client?.name || 'Cliente'}
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <div className="text-[13px] font-bold text-[var(--text-primary)]">
                                        ${order.total?.toLocaleString('es-AR')}
                                    </div>
                                    <div className="text-[11px] text-[var(--text-muted)]">
                                        {formatDate(order.createdAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" strokeWidth={1.5} />
                            <p className="text-[13px]">Sin actividad reciente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecentActivity;
