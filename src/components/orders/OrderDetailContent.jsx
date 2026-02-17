import React from 'react';
import {
    Package,
    Calendar,
    User,
    Building2,
    DollarSign,
    Check,
    Percent,
    Tag,
    History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ status }) => {
    const styles = {
        espera: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border-warning-100 dark:border-warning-800',
        confirmado: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800',
        preparado: 'bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400 border-info-100 dark:border-info-800',
        completo: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800'
    };

    const labels = {
        espera: 'En Espera',
        confirmado: 'Confirmado',
        preparado: 'Preparando',
        completo: 'Completado'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.espera}`}>
            {labels[status] || status}
        </span>
    );
};

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-(--border-color) last:border-0">
        {Icon && (
            <div className="w-7 h-7 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                <Icon size={14} className="text-(--text-muted)" />
            </div>
        )}
        <div className="flex-1">
            <p className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
            <p className="text-[12px] font-semibold text-(--text-primary) mt-0.5">{value || '-'}</p>
        </div>
    </div>
);

const OrderDetailContent = ({ order, showPricesWithTax = false, canViewCommission = false }) => {
    const { user } = useAuth();
    const isSuperadmin = user?.role?.name === 'superadmin';

    if (!order) return null;

    // Calcular totales
    const subtotal = order.subtotal !== undefined 
        ? parseFloat(order.subtotal) 
        : (order.items?.reduce((acc, item) => 
            acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0
        ) || 0);
    
    const finalTotal = order.total !== undefined 
        ? parseFloat(order.total) 
        : (subtotal * (1 - (order.discount || 0) / 100));
    
    const discountAmount = subtotal - finalTotal;

    return (
        <div className="space-y-4">
            {/* Header de la card */}
            <div className="bg-(--bg-card) p-3 border-b border-(--border-color)">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="text-[12px] font-semibold text-(--text-primary)">
                            {order.items?.length || 0} productos
                        </span>
                        {isSuperadmin && (
                            <span className="text-[10px] text-primary-600">
                                ({order.companyId?.name})
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-(--text-muted) font-bold uppercase tracking-wider">Total</p>
                        <p className="text-lg font-bold text-(--text-primary)">${finalTotal.toLocaleString('es-AR')}</p>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Columna izquierda - Productos (3/5) */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Productos */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Productos
                            </h3>
                            <div className="space-y-2">
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-(--bg-hover) rounded-xl">
                                        <div className="w-10 h-10 bg-(--bg-card) rounded-xl flex items-center justify-center">
                                            <Package size={20} className="text-(--text-muted)" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-(--text-primary) truncate">{item.name}</p>
                                            <p className="text-[10px] text-(--text-muted)">
                                                Código: {item.code || 'N/A'}
                                                {item.hasOffer && (
                                                    <span className="ml-2 px-1.5 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-600 text-[8px] font-bold rounded">
                                                        OFERTA
                                                    </span>
                                                )}
                                            </p>
                                            {item.hasOffer === true && order.excludeOfferProductsFromGlobalDiscount === true && (
                                                <p className="text-[9px] text-pink-600 mt-0.5 flex items-center gap-1">
                                                    <Tag size={9} />
                                                    No aplica descuento global
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[11px] font-semibold text-(--text-primary)">
                                                {item.quantity} x ${Number(item.listPrice || 0).toLocaleString('es-AR')}
                                            </p>
                                            {item.discount > 0 && (
                                                <p className="text-[9px] text-success-600">
                                                    -{item.discount}% desc.
                                                </p>
                                            )}
                                            <p className="text-[11px] font-bold text-primary-600 mt-0.5">
                                                ${(item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notas */}
                        {order.notes && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Notas
                                </h3>
                                <p className="text-[12px] text-(--text-secondary) whitespace-pre-wrap bg-(--bg-hover) p-3 rounded-xl">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Totales, Info y Historial (2/5) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Totales */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Totales
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[12px] text-(--text-muted)">
                                    <span>Subtotal</span>
                                    <span className="font-medium">${subtotal.toLocaleString('es-AR')}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-[12px] text-success-600 dark:text-success-400">
                                        <span>Descuento</span>
                                        <span className="font-medium">-${discountAmount.toLocaleString('es-AR')}</span>
                                    </div>
                                )}
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-[11px] text-(--text-muted)">
                                        <span>Descuento Global</span>
                                        <span>{order.discount}%</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[13px] font-bold text-(--text-primary) pt-2 border-t border-(--border-color)">
                                    <span>Total Final</span>
                                    <span>${finalTotal.toLocaleString('es-AR')}</span>
                                </div>
                                
                                {/* IVA Info */}
                                <div className="pt-2 mt-2 border-t border-(--border-color)/50">
                                    <div className="flex justify-between text-[11px] text-(--text-muted)">
                                        <span>IVA</span>
                                        <span>{showPricesWithTax ? 'Incluido' : 'No incluye'}</span>
                                    </div>
                                </div>
                                
                                {/* Nota sobre productos con oferta protegidos */}
                                {order.excludeOfferProductsFromGlobalDiscount === true && order.items?.some(item => item.hasOffer === true) && (
                                    <div className="mt-2 p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                                        <p className="text-[10px] text-pink-700 dark:text-pink-300 flex items-start gap-1">
                                            <Tag size={10} className="shrink-0 mt-0.5" />
                                            <span>
                                                {order.items.filter(item => item.hasOffer).length} producto{order.items.filter(item => item.hasOffer).length > 1 ? 's' : ''} con precio de oferta no aplican descuento global
                                            </span>
                                        </p>
                                    </div>
                                )}
                                
                                {/* Comisión */}
                                {canViewCommission && (
                                    <div className="pt-2 mt-2 border-t border-(--border-color)/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">Comisión</span>
                                            {order.commissionAmount ? (
                                                <p className="text-[12px] font-semibold text-success-600 dark:text-success-400">
                                                    ${order.commissionAmount.toLocaleString('es-AR')}
                                                    {order.commissionRate && (
                                                        <span className="text-[10px] text-(--text-muted) ml-1">
                                                            ({order.commissionRate}%)
                                                        </span>
                                                    )}
                                                </p>
                                            ) : (
                                                <p className="text-[12px] font-semibold text-(--text-muted)">-</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info general */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información General
                            </h3>
                            <InfoRow 
                                label="Cliente" 
                                value={order.clientId?.businessName}
                                icon={Building2}
                            />
                            <InfoRow 
                                label="Vendedor" 
                                value={`${order.salesRepId?.firstName} ${order.salesRepId?.lastName}`}
                                icon={User}
                            />
                            <InfoRow 
                                label="Fecha" 
                                value={new Date(order.date).toLocaleDateString('es-AR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                                icon={Calendar}
                            />
                            {order.deliveryDate && (
                                <InfoRow 
                                    label="Fecha de Entrega" 
                                    value={new Date(order.deliveryDate).toLocaleDateString('es-AR')}
                                    icon={Calendar}
                                />
                            )}
                            <InfoRow 
                                label="Lista de Precios" 
                                value={order.priceList === 2 ? 'Lista 2' : 'Lista 1'}
                                icon={DollarSign}
                            />
                            {order.paymentMethod && (
                                <InfoRow 
                                    label="Método de Pago" 
                                    value={order.paymentMethod}
                                    icon={Check}
                                />
                            )}
                        </div>

                        {/* Historial de estados */}
                        <div className="pt-4 border-t border-(--border-color)">
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3 flex items-center gap-2">
                                <History size={12} />
                                Historial
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[11px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success-500"></div>
                                    <span className="text-(--text-muted)">Creado</span>
                                    <span className="ml-auto text-(--text-secondary) text-[10px]">
                                        {new Date(order.createdAt).toLocaleDateString('es-AR')}
                                    </span>
                                </div>
                                {order.convertedAt && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                        <span className="text-(--text-muted)">Convertido a pedido</span>
                                        <span className="ml-auto text-(--text-secondary) text-[10px]">
                                            {new Date(order.convertedAt).toLocaleDateString('es-AR')}
                                        </span>
                                    </div>
                                )}
                                {order.statusDates?.confirmed && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                        <span className="text-(--text-muted)">Confirmado</span>
                                        <span className="ml-auto text-(--text-secondary) text-[10px]">
                                            {new Date(order.statusDates.confirmed).toLocaleDateString('es-AR')}
                                        </span>
                                    </div>
                                )}
                                {order.statusDates?.prepared && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-info-500"></div>
                                        <span className="text-(--text-muted)">En Preparación</span>
                                        <span className="ml-auto text-(--text-secondary) text-[10px]">
                                            {new Date(order.statusDates.prepared).toLocaleDateString('es-AR')}
                                        </span>
                                    </div>
                                )}
                                {order.statusDates?.completed && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success-500"></div>
                                        <span className="text-(--text-muted)">Completado</span>
                                        <span className="ml-auto text-(--text-secondary) text-[10px]">
                                            {new Date(order.statusDates.completed).toLocaleDateString('es-AR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailContent;
