import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Package,
    User,
    FileText,
    ShoppingCart,
    RotateCcw,
    Plus,
    Edit2,
    Trash2,
    Power,
    ChevronDown,
    Activity
} from 'lucide-react';
import { getProductActivity } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const typeIcons = {
    product_created: Plus,
    product_edited: Edit2,
    product_deleted: Trash2,
    product_deactivated: Power,
    product_reactivated: Power,
    budget_created: FileText,
    budget_edited: FileText,
    order_converted: ShoppingCart,
    order_edited: ShoppingCart,
    order_status_updated: RotateCcw,
    email_sent: FileText,
    whatsapp_sent: FileText,
    default: Activity
};

const typeLabels = {
    product_created: 'Producto Creado',
    product_edited: 'Producto Editado',
    product_deleted: 'Producto Eliminado',
    product_deactivated: 'Producto Desactivado',
    product_reactivated: 'Producto Reactivado',
    budget_created: 'Presupuesto Creado',
    budget_edited: 'Presupuesto Editado',
    order_converted: 'Presupuesto → Pedido',
    order_edited: 'Pedido Editado',
    order_status_updated: 'Estado Actualizado',
    email_sent: 'Email Enviado',
    whatsapp_sent: 'WhatsApp Enviado'
};

const typeColors = {
    product_created: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    product_edited: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    product_deleted: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    product_deactivated: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
    product_reactivated: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    budget_created: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    budget_edited: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    order_converted: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    order_edited: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    order_status_updated: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400',
    email_sent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    whatsapp_sent: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
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

// Componente para mostrar cambios expandibles
const ActivityChanges = ({ changes }) => {
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
                        <div className="mt-2 space-y-1.5">
                            {changes.map((change, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-[var(--text-muted)]">{change.label}:</span>
                                    <span className="line-through text-[var(--text-muted)] opacity-60 truncate max-w-[80px]">
                                        {change.from === null || change.from === '' ? '-' : String(change.from)}
                                    </span>
                                    <span className="text-[var(--text-muted)]">→</span>
                                    <span className="font-medium text-[var(--text-primary)] truncate max-w-[80px]">
                                        {change.to === null || change.to === '' ? '-' : String(change.to)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ProductActivityDrawer = ({ isOpen, onClose, product }) => {
    const { addToast } = useToast();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
    });

    useEffect(() => {
        if (isOpen && product?._id) {
            setActivities([]);
            fetchActivities(1, true);
        }
    }, [isOpen, product]);

    const fetchActivities = async (page = 1, reset = false) => {
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
            const result = await getProductActivity(product._id, params);
            
            setActivities(prev => reset ? (result.data || []) : [...prev, ...(result.data || [])]);
            
            setPagination({
                page: result.page || page,
                limit: pagination.limit,
                total: result.total || 0,
                hasMore: (result.data?.length || 0) === pagination.limit
            });
        } catch (error) {
            console.error('Error fetching product activities:', error);
            addToast('Error al cargar actividades', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };
    
    const loadMore = () => {
        if (!loadingMore && pagination.hasMore) {
            fetchActivities(pagination.page + 1, false);
        }
    };

    if (!product) return null;

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
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        Historial de Actividad
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium truncate max-w-[300px]">
                                        {product.code} • {product.name}
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

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[var(--text-muted)] text-sm mt-3">Cargando actividades...</p>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mb-4">
                                        <Activity size={40} className="text-[var(--text-muted)] opacity-50" />
                                    </div>
                                    <p className="text-[var(--text-muted)] font-medium">No hay actividades registradas</p>
                                    <p className="text-[var(--text-muted)] text-xs mt-1 max-w-[250px]">
                                        Las actividades aparecerán cuando se realicen cambios en el producto
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {activities.map((activity, index) => {
                                        const Icon = typeIcons[activity.type] || typeIcons.default;
                                        const colorClass = typeColors[activity.type] || typeColors.default;
                                        const label = typeLabels[activity.type] || activity.type;
                                        const hasChanges = activity.changes && activity.changes.length > 0;
                                        
                                        return (
                                            <motion.div
                                                key={activity._id}
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
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">
                                                                    {label}
                                                                </p>
                                                                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                                                                    {activity.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[11px] text-[var(--text-muted)]">
                                                                {formatTime(activity.createdAt)}
                                                            </span>
                                                            {activity.userId && (
                                                                <span className="text-[10px] text-[var(--text-muted)]">
                                                                    • {activity.userId.firstName} {activity.userId.lastName}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {hasChanges && <ActivityChanges changes={activity.changes} />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
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
                                    Cargar más actividades
                                </button>
                            ) : (
                                <p className="text-center text-[12px] text-[var(--text-muted)]">
                                    No hay más actividades
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

export default ProductActivityDrawer;
