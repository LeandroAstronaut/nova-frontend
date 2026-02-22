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
    History,
    FileText,
    ShoppingCart,
    Receipt,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Helper para obtener iniciales del nombre del cliente
const getClientInitials = (businessName) => {
    if (!businessName) return 'CL';
    const words = businessName.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const StatusBadge = ({ status }) => {
    const styles = {
        espera: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800',
        confirmado: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
        preparado: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300 border-info-200 dark:border-info-800',
        completo: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800',
        entregado: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800',
        cancelado: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    };

    const labels = {
        espera: 'En Espera',
        confirmado: 'Confirmado',
        preparado: 'Preparando',
        completo: 'Completado',
        entregado: 'Entregado',
        cancelado: 'Cancelado'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.espera}`}>
            {labels[status] || status}
        </span>
    );
};

const InfoRow = ({ label, value, icon: Icon, highlighted = false }) => (
    <div className="flex items-center gap-3 py-2">
        {Icon && (
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[var(--text-muted)]" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
            <p className={`text-[13px] font-semibold mt-0.5 truncate ${highlighted ? 'text-primary-600 dark:text-primary-400' : 'text-[var(--text-primary)]'}`}>
                {value || '-'}
            </p>
        </div>
    </div>
);

const OrderDetailContent = ({ order, showPricesWithTax = false, canViewCommission = false, taxRate = 21 }) => {
    const { user } = useAuth();
    const isSuperadmin = user?.role?.name === 'superadmin';

    if (!order) return null;
    
    // Helper para aplicar IVA si corresponde
    const applyTax = (price) => {
        if (!showPricesWithTax) return price;
        return price * (1 + (taxRate || 21) / 100);
    };

    // Calcular totales (sin IVA - base)
    const subtotalBase = order.subtotal !== undefined 
        ? parseFloat(order.subtotal) 
        : (order.items?.reduce((acc, item) => 
            acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0
        ) || 0);
    
    const finalTotalBase = order.total !== undefined 
        ? parseFloat(order.total) 
        : (subtotalBase * (1 - (order.discount || 0) / 100));
    
    const discountAmountBase = subtotalBase - finalTotalBase;
    
    // Helper para formatear precio con 2 decimales
    const formatPrice = (price) => {
        return Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const orderNumber = order.orderNumber || order.budgetNumber;

    return (
        <div className="space-y-0">
            {/* Header Principal - Estilo Cliente */}
            <div className="px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-start gap-4">
                    {/* Iniciales del Cliente */}
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {getClientInitials(order.clientId?.businessName)}
                        </span>
                    </div>
                    
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                {/* Nombre del Cliente */}
                                <h1 className="text-[15px] font-bold text-[var(--text-primary)] truncate">
                                    {order.clientId?.businessName}
                                </h1>
                                {/* Vendedor */}
                                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                                    Vendedor: <span className="font-medium text-[var(--text-primary)]">{order.salesRepId?.firstName} {order.salesRepId?.lastName}</span>
                                </p>
                                {/* Status y Fecha */}
                                <div className="flex items-center gap-2 mt-2">
                                    <StatusBadge status={order.status} />
                                    <span className="text-[11px] text-[var(--text-muted)]">
                                        {new Date(order.date).toLocaleDateString('es-AR')}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-[var(--text-primary)]">
                                    ${formatPrice(applyTax(finalTotalBase))}
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                    Total {showPricesWithTax ? 'c/IVA' : 's/IVA'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info extra (solo superadmin) */}
                {isSuperadmin && order.companyId && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                        <Building2 size={14} className="text-[var(--text-muted)]" />
                        <span className="text-[12px] text-[var(--text-secondary)]">
                            <span className="text-[var(--text-muted)]">Compañía:</span>{' '}
                            <span className="font-medium text-primary-600 dark:text-primary-400">
                                {order.companyId.name}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Columna izquierda - Productos (3/5) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Productos */}
                        <div>
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Productos ({order.items?.length || 0})
                            </h3>
                            
                            {/* Aviso de IVA y Lista de Precios */}
                            <div className="mb-4 flex items-center gap-2 flex-wrap">
                                {showPricesWithTax && (
                                    <div className="px-2 py-1 bg-success-50 dark:bg-success-900/20 rounded-md border border-success-200 dark:border-success-800 flex items-center gap-1.5">
                                        <Receipt size={12} className="text-success-600 dark:text-success-400" />
                                        <span className="text-[11px] text-success-700 dark:text-success-300 font-medium">
                                            Precios con IVA incluido
                                        </span>
                                    </div>
                                )}
                                {order.priceList && (
                                    <div className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-md border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
                                        <DollarSign size={12} className="text-primary-600 dark:text-primary-400" />
                                        <span className="text-[11px] text-primary-700 dark:text-primary-300 font-medium">
                                            Lista {order.priceList}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                        {/* Imagen del producto */}
                                        <div className="w-14 h-14 bg-[var(--bg-card)] rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-[var(--border-color)]">
                                            {(() => {
                                                // Obtener imagen del producto referenciado
                                                const product = item.productId;
                                                
                                                // Si productId es un objeto poblado (tiene images)
                                                if (product && typeof product === 'object' && product.images) {
                                                    const images = product.images || [];
                                                    const coverIndex = product.coverImageIndex ?? 0;
                                                    const coverImage = images.length > 0 ? (images[coverIndex]?.url || images[0]?.url) : null;
                                                    
                                                    if (coverImage) {
                                                        return (
                                                            <img 
                                                                src={coverImage} 
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        );
                                                    }
                                                }
                                                
                                                // Si productId es solo un ID (string) o no tiene imágenes
                                                return <Package size={24} className="text-[var(--text-muted)]" />;
                                            })()}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                Código: {item.code || 'N/A'}
                                                <span className="ml-2 text-[11px] font-medium text-[var(--text-secondary)]">
                                                    • IVA: {item.taxRate || item.productId?.taxRate || taxRate || 21}%
                                                </span>
                                            </p>
                                            {item.hasOffer && (
                                                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 text-[10px] font-bold rounded-md border border-warning-200 dark:border-warning-800">
                                                    OFERTA
                                                </span>
                                            )}
                                            {item.hasOffer === true && order.excludeOfferProductsFromGlobalDiscount === true && (
                                                <p className="text-[10px] text-pink-600 mt-1 flex items-center gap-1">
                                                    <Tag size={10} />
                                                    No aplica descuento global
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* Cantidad y precio */}
                                        <div className="text-right shrink-0">
                                            {/* Cantidad y precio unitario */}
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-sm font-bold">
                                                    {item.quantity}
                                                </span>
                                                <span className="text-[var(--text-muted)] text-sm">×</span>
                                                <span className="text-[13px] font-semibold text-[var(--text-muted)]">
                                                    ${formatPrice(applyTax(Number(item.listPrice || 0)))}
                                                </span>
                                            </div>
                                            
                                            {item.discount > 0 && (
                                                <p className="text-[10px] text-success-600 font-medium leading-tight">
                                                    -{item.discount}% desc.
                                                </p>
                                            )}
                                            
                                            <p className="text-[15px] font-bold text-[var(--text-primary)] leading-tight">
                                                ${formatPrice(applyTax(item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Columna derecha - Totales e Info (2/5) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Titulo Resumen fuera de la card */}
                        <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                            Resumen
                        </h3>
                        
                        {/* Totales */}
                        <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border-color)]">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[13px]">
                                    <span className="font-semibold text-[var(--text-primary)]">Subtotal</span>
                                    <span className="font-semibold text-[var(--text-primary)]">${formatPrice(applyTax(subtotalBase))}</span>
                                </div>
                                
                                {discountAmountBase > 0 && (
                                    <div className="flex justify-between text-[13px]">
                                        <span className="text-success-600 dark:text-success-400">Descuento aplicado</span>
                                        <span className="font-semibold text-success-600 dark:text-success-400">-${formatPrice(applyTax(discountAmountBase))}</span>
                                    </div>
                                )}
                                
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-[12px]">
                                        <span className="text-[var(--text-muted)]">Descuento Global</span>
                                        <span className="font-medium text-[var(--text-primary)]">{order.discount}%</span>
                                    </div>
                                )}
                                
                                {/* Nota sobre productos con oferta */}
                                {order.excludeOfferProductsFromGlobalDiscount === true && order.items?.some(item => item.hasOffer === true) && (
                                    <div className="p-2.5 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                                        <p className="text-[11px] text-pink-700 dark:text-pink-300 flex items-start gap-1.5">
                                            <Tag size={12} className="shrink-0 mt-0.5" />
                                            <span>
                                                {order.items.filter(item => item.hasOffer).length} producto{order.items.filter(item => item.hasOffer).length > 1 ? 's' : ''} con precio de oferta no aplican descuento global
                                            </span>
                                        </p>
                                    </div>
                                )}
                                
                                <div className="pt-3 border-t border-[var(--border-color)]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[14px] font-bold text-[var(--text-primary)]">Total Final</span>
                                        <span className="text-lg font-bold text-[var(--text-primary)]">${formatPrice(applyTax(finalTotalBase))}</span>
                                    </div>
                                </div>
                                
                                {/* IVA Info */}
                                {!showPricesWithTax && (
                                    <div className="pt-2 border-t border-[var(--border-color)]/50">
                                        <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                                            <span>IVA ({taxRate || 21}%) no incluido</span>
                                            <span>${formatPrice(finalTotalBase * ((taxRate || 21) / 100))}</span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Comisión - Siempre mostrar si existe */}
                                {(canViewCommission || order.commissionAmount > 0) && (
                                    <div className="pt-3 border-t border-[var(--border-color)]">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Comisión</span>
                                                {showPricesWithTax && order.commissionAmount > 0 && (
                                                    <p className="text-[10px] text-success-600">sobre c/IVA</p>
                                                )}
                                            </div>
                                            {order.commissionAmount > 0 ? (
                                                <div className="text-right">
                                                    <p className="text-[14px] font-bold text-success-600 dark:text-success-400">
                                                        ${formatPrice(applyTax(order.commissionAmount))}
                                                    </p>
                                                    {order.commissionRate > 0 && (
                                                        <p className="text-[11px] text-[var(--text-muted)]">
                                                            {order.commissionRate}%
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[13px] font-semibold text-[var(--text-muted)]">-</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notas - Siempre visible */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Notas
                            </h3>
                            {order.notes ? (
                                <p className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border-color)]">
                                    {order.notes}
                                </p>
                            ) : (
                                <p className="text-[13px] text-[var(--text-muted)] italic bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border-color)]">
                                    No se han cargado notas.
                                </p>
                            )}
                        </div>

                        {/* Info general - Estilo con icono y label/valor */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Información General
                            </h3>
                            <div className="space-y-1">
                                {order.deliveryDate && (
                                    <InfoRow 
                                        label="Fecha de Entrega"
                                        value={new Date(order.deliveryDate).toLocaleDateString('es-AR', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                        icon={Calendar}
                                    />
                                )}
                                {order.paymentMethod && (
                                    <InfoRow 
                                        label="Método de Pago"
                                        value={order.paymentMethod}
                                        icon={Check}
                                    />
                                )}
                                {order.updatedAt && (
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                            <History size={16} className="text-[var(--text-muted)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-normal text-[var(--text-muted)] uppercase tracking-wider">Última Actualización</p>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                                {new Date(order.updatedAt).toLocaleString('es-AR', { 
                                                    day: '2-digit', 
                                                    month: '2-digit', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Historial de estados - Estilo con icono y label/valor */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Historial
                            </h3>
                            <div className="space-y-1">
                                {/* Creado */}
                                <div className="flex items-center gap-3 py-2">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                        <FileText size={16} className="text-[var(--text-muted)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-normal text-[var(--text-muted)] uppercase tracking-wider">Creado</p>
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                            {order.createdBy?.firstName ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : 'Sistema'}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)]">
                                            {new Date(order.createdAt).toLocaleString('es-AR', { 
                                                day: '2-digit', 
                                                month: '2-digit', 
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-success-500 shrink-0"></div>
                                </div>
                                
                                {/* Convertido */}
                                {order.convertedAt && (
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                            <ShoppingCart size={16} className="text-[var(--text-muted)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Convertido a Pedido</p>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                                {order.convertedBy?.firstName ? `${order.convertedBy.firstName} ${order.convertedBy.lastName}` : 'Sistema'}
                                            </p>
                                            <p className="text-[11px] text-[var(--text-secondary)]">
                                                {new Date(order.convertedAt).toLocaleString('es-AR', { 
                                                    day: '2-digit', 
                                                    month: '2-digit', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></div>
                                    </div>
                                )}
                                
                                {/* Confirmado */}
                                {order.statusDates?.confirmed && (
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                            <Check size={16} className="text-[var(--text-muted)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Confirmado</p>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                                {new Date(order.statusDates.confirmed).toLocaleString('es-AR', { 
                                                    day: '2-digit', 
                                                    month: '2-digit', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></div>
                                    </div>
                                )}
                                
                                {/* Preparando */}
                                {order.statusDates?.prepared && (
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                            <Package size={16} className="text-[var(--text-muted)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">En Preparación</p>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                                {new Date(order.statusDates.prepared).toLocaleString('es-AR', { 
                                                    day: '2-digit', 
                                                    month: '2-digit', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-info-500 shrink-0"></div>
                                    </div>
                                )}
                                
                                {/* Completado */}
                                {order.statusDates?.completed && (
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                            <Check size={16} className="text-[var(--text-muted)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Completado</p>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                                {new Date(order.statusDates.completed).toLocaleString('es-AR', { 
                                                    day: '2-digit', 
                                                    month: '2-digit', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-success-500 shrink-0"></div>
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
