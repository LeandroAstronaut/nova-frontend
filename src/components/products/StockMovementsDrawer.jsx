import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Package,
    ArrowRight,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Calendar,
    User,
    FileText,
    History,
    ShoppingCart,
    RotateCcw,
    AlertCircle,
    Hash,
    ChevronDown
} from 'lucide-react';
import { getProductStockMovements } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const typeIcons = {
    manual_adjustment: RotateCcw,
    order_reserve: ShoppingCart,
    order_release: ArrowLeft,
    delivery_consume: TrendingDown,
    quote_create: FileText,
    quote_update: FileText,
    quote_cancel: RotateCcw,
    quote_convert: ArrowRight
};

const typeLabels = {
    manual_adjustment: 'Ajuste Manual',
    order_reserve: 'Reserva Pedido',
    order_release: 'Liberación Pedido',
    delivery_consume: 'Entrega',
    quote_create: 'Nuevo Presupuesto',
    quote_update: 'Presupuesto Modificado',
    quote_cancel: 'Presupuesto Cancelado',
    quote_convert: 'Presupuesto → Pedido'
};

const typeColors = {
    manual_adjustment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    order_reserve: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    order_release: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    delivery_consume: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    quote_create: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    quote_update: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    quote_cancel: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    quote_convert: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
};

const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
    
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
};

// Componente para mostrar cambios expandibles - Estilos de NotificationBell
const StockMovementChanges = ({ changes }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!changes || changes.length === 0) return null;
    
    return (
        <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
                <span>{changes.length} {changes.length === 1 ? 'cambio' : 'cambios'}</span>
                <ChevronDown 
                    size={12} 
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-1">
                            {changes.map((change, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-[var(--text-muted)]">{change.label}:</span>
                                    <span className="line-through text-[var(--text-muted)] opacity-60">{change.from}</span>
                                    <span className="text-[var(--text-muted)]">→</span>
                                    <span className="font-medium text-[var(--text-primary)]">{change.to}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const getQuantityDisplay = (movement) => {
    const quantity = movement.quantity;
    
    if (quantity > 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                +{quantity}
            </span>
        );
    } else if (quantity < 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                {quantity}
            </span>
        );
    }
    return <span className="text-[var(--text-muted)]">0</span>;
};

const StockMovementsDrawer = ({ isOpen, onClose, product }) => {
    const { addToast } = useToast();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false
    });

    // Preserve last valid product so the exit animation can complete
    // even when the parent sets product=null at the same time as isOpen=false
    const lastProductRef = useRef(product);
    if (product) lastProductRef.current = product;
    const displayProduct = lastProductRef.current;

    // Reset selected variant and movements when product changes
    useEffect(() => {
        setSelectedVariantId(null);
        setMovements([]);
        setPagination({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasMore: false
        });
    }, [product?._id]);

    useEffect(() => {
        if (isOpen && product?._id) {
            // Reset and fetch first page when drawer opens or variant changes
            setMovements([]);
            fetchMovements(1, true);
        }
    }, [isOpen, product, selectedVariantId]);

    const fetchMovements = async (page = 1, reset = false) => {
        if (!product?._id) return;
        
        if (page === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        
        try {
            const params = {
                page,
                limit: pagination.limit
            };
            if (selectedVariantId) {
                params.variantId = selectedVariantId;
            }
            const result = await getProductStockMovements(product._id, params);
            
            // Acumular movimientos si no es reset
            setMovements(prev => reset ? (result.movements || []) : [...prev, ...(result.movements || [])]);
            
            setPagination({
                page: result.page,
                limit: pagination.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasMore: result.page < result.totalPages
            });
        } catch (error) {
            console.error('Error fetching stock movements:', error);
            addToast('Error al cargar movimientos de stock', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };
    
    const loadMore = () => {
        if (!loadingMore && pagination.hasMore) {
            fetchMovements(pagination.page + 1, false);
        }
    };

    if (!displayProduct) return null;

    // Calcular stock total de todas las variantes
    const getTotalStock = () => {
        if (!displayProduct.hasVariants || !displayProduct.variants?.length) {
            return {
                stock: displayProduct.stock || 0,
                stockReserved: displayProduct.stockReserved || 0,
                stockQuoted: displayProduct.stockQuoted || 0
            };
        }
        return displayProduct.variants.reduce((totals, variant) => {
            totals.stock += variant.stock || 0;
            totals.stockReserved += variant.stockReserved || 0;
            totals.stockQuoted += variant.stockQuoted || 0;
            return totals;
        }, { stock: 0, stockReserved: 0, stockQuoted: 0 });
    };

    // Obtener stock de la variante seleccionada o totales
    const getDisplayStock = () => {
        if (!displayProduct.hasVariants || !selectedVariantId) {
            return getTotalStock();
        }
        const variant = displayProduct.variants?.find(v => v.id === selectedVariantId);
        if (!variant) return getTotalStock();
        return {
            stock: variant.stock || 0,
            stockReserved: variant.stockReserved || 0,
            stockQuoted: variant.stockQuoted || 0
        };
    };

    const displayStock = getDisplayStock();
    const hasVariants = displayProduct.hasVariants && displayProduct.variants?.length > 0;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer */}
                    <motion.div
                        key="drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220, duration: 0.3 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[600px] bg-[var(--bg-card)] shadow-2xl z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header - Estilo similar a Notificaciones */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        Historial de Stock
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium truncate max-w-[300px]">
                                        {displayProduct.code} • {displayProduct.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Variant Selector - Compacto */}
                        {hasVariants && (
                            <div className="px-6 py-2 bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                                <div className="relative group">
                                    <select
                                        value={selectedVariantId || ''}
                                        onChange={(e) => setSelectedVariantId(e.target.value || null)}
                                        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 appearance-none cursor-pointer transition-all hover:border-primary-300"
                                    >
                                        <option value="">Todas las variantes</option>
                                        {displayProduct.variants.map(variant => (
                                            <option key={variant.id} value={variant.id}>
                                                {displayProduct.variantConfig?.label1}: {variant.value1}
                                                {variant.value2 && ` • ${displayProduct.variantConfig?.label2}: ${variant.value2}`}
                                                {variant.sku && ` (${variant.sku})`}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-primary-500 transition-colors pointer-events-none" size={14} />
                                </div>
                            </div>
                        )}

                        {/* Stock Summary - Compacto */}
                        <div className="px-6 py-3 bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[var(--text-muted)]">Físico:</span>
                                    <span className="text-sm font-bold text-[var(--text-primary)]">{displayStock.stock}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400">Disponible:</span>
                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{Math.max(0, displayStock.stock - displayStock.stockReserved)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400">Reservado:</span>
                                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{displayStock.stockReserved}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-purple-600 dark:text-purple-400">Presup.:</span>
                                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">{displayStock.stockQuoted}</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[var(--text-muted)] text-sm mt-3">Cargando movimientos...</p>
                                </div>
                            ) : movements.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mb-4">
                                        <History size={40} className="text-[var(--text-muted)] opacity-50" />
                                    </div>
                                    <p className="text-[var(--text-muted)] font-medium">No hay movimientos registrados</p>
                                    <p className="text-[var(--text-muted)] text-xs mt-1 max-w-[250px]">
                                        Los movimientos aparecerán cuando haya cambios de stock por ventas, ajustes o entregas
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {/* Lista de movimientos - Estilos copiados de NotificationBell */}
                                    {movements.map((movement, index) => {
                                        const Icon = typeIcons[movement.type] || History;
                                        const colorClass = typeColors[movement.type] || 'bg-gray-100 text-gray-600';
                                        const hasChanges = movement.changes && movement.changes.length > 0;
                                        
                                        return (
                                            <motion.div
                                                key={movement._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] text-[var(--text-primary)] leading-snug">
                                                            {movement.sourceId ? (
                                                                <a 
                                                                    href={`/pedidos/${movement.sourceId}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="hover:text-primary-600 transition-colors"
                                                                >
                                                                    {movement.notes}
                                                                    {movement.sourceInfo?.orderNumber && (
                                                                        <span className="ml-1 text-primary-600 font-medium">
                                                                            #{movement.sourceInfo.orderNumber}
                                                                        </span>
                                                                    )}
                                                                </a>
                                                            ) : (
                                                                movement.notes
                                                            )}
                                                        </p>
                                                        {/* Stock resultante */}
                                                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--text-muted)]">
                                                            <span>Físico: <span className="font-medium text-[var(--text-primary)]">{movement.stockAfter?.physical}</span></span>
                                                            <span>Reservado: <span className="font-medium text-amber-600">{movement.stockAfter?.reserved}</span></span>
                                                            {movement.stockAfter?.quoted > 0 && (
                                                                <span>Presup.: <span className="font-medium text-purple-600">{movement.stockAfter?.quoted}</span></span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[11px] text-[var(--text-muted)]">
                                                                {formatTime(movement.createdAt)}
                                                            </span>
                                                            {movement.createdBy && (
                                                                <span className="text-[10px] text-[var(--text-muted)]">
                                                                    • {movement.createdBy.firstName} {movement.createdBy.lastName}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {hasChanges && <StockMovementChanges changes={movement.changes} />}
                                                    </div>
                                                    <div className="shrink-0">
                                                        {getQuantityDisplay(movement)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer - Igual a NotificationBell */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
                            {loadingMore ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[12px] text-[var(--text-muted)]">Cargando...</span>
                                </div>
                            ) : pagination.hasMore ? (
                                <button
                                    onClick={loadMore}
                                    className="w-full text-center text-[12px] font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider"
                                >
                                    Cargar más movimientos
                                </button>
                            ) : (
                                <p className="text-center text-[12px] text-[var(--text-muted)]">
                                    No hay más movimientos
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default StockMovementsDrawer;
