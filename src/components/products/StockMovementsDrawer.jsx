import React, { useState, useEffect } from 'react';
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
    Minus,
    Plus,
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
    quote_create: 'Presupuesto Creado',
    quote_update: 'Presupuesto Editado',
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

const getQuantityDisplay = (movement) => {
    const quantity = movement.quantity;
    
    if (quantity > 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                <Plus size={12} />
                +{quantity}
            </span>
        );
    } else if (quantity < 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                <Minus size={12} />
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
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    });

    // Reset selected variant when product changes
    useEffect(() => {
        setSelectedVariantId(null);
    }, [product?._id]);

    useEffect(() => {
        if (isOpen && product?._id) {
            fetchMovements();
        }
    }, [isOpen, product, selectedVariantId]);

    const fetchMovements = async (page = 1) => {
        if (!product?._id) return;
        
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit
            };
            if (selectedVariantId) {
                params.variantId = selectedVariantId;
            }
            const result = await getProductStockMovements(product._id, params);
            setMovements(result.movements || []);
            setPagination({
                page: result.page,
                limit: pagination.limit,
                total: result.total,
                totalPages: result.totalPages
            });
        } catch (error) {
            console.error('Error fetching stock movements:', error);
            addToast('Error al cargar movimientos de stock', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!product) return null;

    // Calcular stock total de todas las variantes
    const getTotalStock = () => {
        if (!product.hasVariants || !product.variants?.length) {
            return {
                stock: product.stock || 0,
                stockReserved: product.stockReserved || 0,
                stockQuoted: product.stockQuoted || 0
            };
        }
        return product.variants.reduce((totals, variant) => {
            totals.stock += variant.stock || 0;
            totals.stockReserved += variant.stockReserved || 0;
            totals.stockQuoted += variant.stockQuoted || 0;
            return totals;
        }, { stock: 0, stockReserved: 0, stockQuoted: 0 });
    };

    // Obtener stock de la variante seleccionada o totales
    const getDisplayStock = () => {
        if (!product.hasVariants || !selectedVariantId) {
            return getTotalStock();
        }
        const variant = product.variants?.find(v => v.id === selectedVariantId);
        if (!variant) return getTotalStock();
        return {
            stock: variant.stock || 0,
            stockReserved: variant.stockReserved || 0,
            stockQuoted: variant.stockQuoted || 0
        };
    };

    const displayStock = getDisplayStock();
    const hasVariants = product.hasVariants && product.variants?.length > 0;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220, duration: 0.3 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[600px] bg-[var(--bg-card)] shadow-2xl z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
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
                                        {product.code} • {product.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Variant Selector */}
                        {hasVariants && (
                            <div className="px-6 py-3 bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                                <label className="text-[11px] text-[var(--text-muted)] mb-1.5 block">Variante</label>
                                <div className="relative">
                                    <select
                                        value={selectedVariantId || ''}
                                        onChange={(e) => setSelectedVariantId(e.target.value || null)}
                                        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 appearance-none cursor-pointer"
                                    >
                                        <option value="">Todas las variantes</option>
                                        {product.variants.map(variant => (
                                            <option key={variant.id} value={variant.id}>
                                                {product.variantConfig?.label1}: {variant.value1}
                                                {variant.value2 && ` • ${product.variantConfig?.label2}: ${variant.value2}`}
                                                {variant.sku && ` (${variant.sku})`}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={16} />
                                </div>
                            </div>
                        )}

                        {/* Stock Summary */}
                        <div className="px-6 py-4 bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Físico</p>
                                    <p className="text-xl font-bold text-[var(--text-primary)]">{displayStock.stock}</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Disponible</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{Math.max(0, displayStock.stock - displayStock.stockReserved)}</p>
                                </div>
                                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                                    <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Reservado</p>
                                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{displayStock.stockReserved}</p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                                    <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Presup.</p>
                                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{displayStock.stockQuoted}</p>
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
                                <div className="p-4">
                                    {/* Timeline */}
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-5 top-2 bottom-2 w-px bg-[var(--border-color)]" />
                                        
                                        {movements.map((movement, index) => {
                                            const Icon = typeIcons[movement.type] || History;
                                            const colorClass = typeColors[movement.type] || 'bg-gray-100 text-gray-600';
                                            const label = typeLabels[movement.type] || movement.type;
                                            const isFirst = index === 0;
                                            const hasOrderInfo = movement.sourceInfo;
                                            
                                            return (
                                                <motion.div
                                                    key={movement._id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="relative flex gap-4 pb-5 last:pb-0"
                                                >
                                                    {/* Timeline dot */}
                                                    <div className="relative z-10">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass} ${isFirst ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-card)] ring-primary-500' : ''}`}>
                                                            <Icon size={18} />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        {/* Tipo y cantidad */}
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-hover)] text-[var(--text-muted)]">
                                                                {label}
                                                            </span>
                                                            {getQuantityDisplay(movement)}
                                                        </div>
                                                        
                                                        {/* Número de presupuesto/pedido si existe */}
                                                        {hasOrderInfo && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Hash size={12} className="text-[var(--text-muted)]" />
                                                                <span className="text-[12px] font-bold text-[var(--text-primary)]">
                                                                    {movement.sourceInfo.type === 'budget' ? 'Presupuesto' : 'Pedido'} 
                                                                    {' '}
                                                                    #{String(movement.sourceInfo.orderNumber).padStart(5, '0')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Descripción */}
                                                        <p className="text-[13px] text-[var(--text-primary)] leading-snug mb-2">
                                                            {movement.notes}
                                                        </p>
                                                        
                                                        {/* Stock resultante */}
                                                        <div className="flex items-center gap-3 mb-2 p-2 bg-[var(--bg-hover)] rounded-lg text-[11px]">
                                                            <span className="text-[var(--text-muted)] font-medium">Resultado:</span>
                                                            <span className="font-bold text-[var(--text-primary)]">
                                                                Físico: {movement.stockAfter?.physical}
                                                            </span>
                                                            <span className="text-[var(--border-color)]">|</span>
                                                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                                                Reservado: {movement.stockAfter?.reserved}
                                                            </span>
                                                            {movement.stockAfter?.quoted > 0 && (
                                                                <>
                                                                    <span className="text-[var(--border-color)]">|</span>
                                                                    <span className="font-bold text-purple-600 dark:text-purple-400">
                                                                        Presup.: {movement.stockAfter?.quoted}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Usuario y fecha */}
                                                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={11} />
                                                                {formatTime(movement.createdAt)}
                                                            </span>
                                                            {movement.createdBy && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <User size={11} />
                                                                        {movement.createdBy.firstName} {movement.createdBy.lastName}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                                    <button
                                        onClick={() => fetchMovements(pagination.page - 1)}
                                        disabled={pagination.page === 1 || loading}
                                        className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm font-medium hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-[var(--text-muted)]">
                                        Página {pagination.page} de {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchMovements(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages || loading}
                                        className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm font-medium hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
                            <p className="text-[11px] text-[var(--text-muted)] text-center">
                                {pagination.total} {pagination.total === 1 ? 'movimiento' : 'movimientos'} registrados
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default StockMovementsDrawer;
