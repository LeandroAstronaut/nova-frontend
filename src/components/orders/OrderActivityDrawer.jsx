import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, FileText, ShoppingCart, Mail, MessageCircle, Receipt, User, Trash2, Edit, RotateCcw, Package, ArrowRight, FileMinus } from 'lucide-react';
import { getEntityActivity } from '../../services/activityLogService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ChangeDetails from '../common/ChangeDetails';

const typeIcons = {
    budget_created: FileText,
    budget_edited: Edit,
    budget_deleted: Trash2,
    order_converted: ArrowRight,
    order_edited: Edit,
    order_deleted: Trash2,
    order_reverted: RotateCcw,
    order_status_updated: Package,
    email_sent: Mail,
    whatsapp_sent: MessageCircle,
    receipt_created: Receipt,
    receipt_edited: Edit,
    receipt_deleted: Trash2,
    receipt_cancelled: FileMinus,
    client_created: User,
    client_edited: Edit,
    product_created: ShoppingCart,
    product_edited: Edit,
    product_deleted: Trash2,
    user_created: User,
    user_edited: Edit,
    user_deleted: Trash2,
    company_updated: Edit,
    login: User,
    logout: User
};

const typeLabels = {
    budget_created: 'Presupuesto creado',
    budget_edited: 'Presupuesto editado',
    budget_deleted: 'Presupuesto eliminado',
    order_converted: 'Convertido a pedido',
    order_edited: 'Pedido editado',
    order_deleted: 'Pedido eliminado',
    order_reverted: 'Revertido a presupuesto',
    order_status_updated: 'Estado actualizado',
    email_sent: 'Email enviado',
    whatsapp_sent: 'WhatsApp enviado',
    receipt_created: 'Recibo creado',
    receipt_cancelled: 'Recibo anulado',
    receipt_edited: 'Recibo editado',
    receipt_deleted: 'Recibo eliminado',
    client_created: 'Cliente creado',
    client_edited: 'Cliente editado',
    product_created: 'Producto creado',
    product_edited: 'Producto editado',
    product_deleted: 'Producto eliminado',
    user_created: 'Usuario creado',
    user_edited: 'Usuario editado',
    user_deleted: 'Usuario eliminado',
    company_updated: 'Empresa actualizada',
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión'
};

const typeColors = {
    budget_created: 'bg-blue-100 text-blue-600',
    budget_edited: 'bg-gray-100 text-gray-600',
    budget_deleted: 'bg-red-100 text-red-600',
    order_converted: 'bg-green-100 text-green-600',
    order_edited: 'bg-gray-100 text-gray-600',
    order_deleted: 'bg-red-100 text-red-600',
    order_reverted: 'bg-orange-100 text-orange-600',
    order_status_updated: 'bg-purple-100 text-purple-600',
    email_sent: 'bg-indigo-100 text-indigo-600',
    whatsapp_sent: 'bg-green-100 text-green-600',
    receipt_created: 'bg-yellow-100 text-yellow-600',
    receipt_cancelled: 'bg-red-100 text-red-600',
    receipt_edited: 'bg-gray-100 text-gray-600',
    receipt_deleted: 'bg-red-100 text-red-600',
    client_created: 'bg-blue-100 text-blue-600',
    client_edited: 'bg-gray-100 text-gray-600',
    product_created: 'bg-blue-100 text-blue-600',
    product_edited: 'bg-gray-100 text-gray-600',
    product_deleted: 'bg-red-100 text-red-600',
    user_created: 'bg-blue-100 text-blue-600',
    user_edited: 'bg-gray-100 text-gray-600',
    user_deleted: 'bg-red-100 text-red-600',
    company_updated: 'bg-gray-100 text-gray-600',
    login: 'bg-green-100 text-green-600',
    logout: 'bg-gray-100 text-gray-600'
};

// Mapeo de estados a labels legibles
const statusLabels = {
    'espera': 'En Espera',
    'confirmado': 'Confirmado',
    'preparado': 'Preparando',
    'preparando': 'Preparando',
    'completo': 'Completado',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
    'budget': 'Presupuesto',
    'order': 'Pedido'
};

// Estilos de badges de estado (igual que en la tabla)
const statusBadgeStyles = {
    espera: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border-warning-100 dark:border-warning-800',
    confirmado: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800',
    preparado: 'bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400 border-info-100 dark:border-info-800',
    preparando: 'bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400 border-info-100 dark:border-info-800',
    completo: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800',
    completado: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800',
    cancelado: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    budget: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
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

const ITEMS_PER_PAGE = 10;

const OrderActivityDrawer = ({ isOpen, onClose, entityType, entityId, entityNumber, clientName }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isOpen && entityType && entityId) {
            fetchActivities(true);
        }
    }, [isOpen, entityType, entityId]);

    const fetchActivities = async (reset = false, customPage = null) => {
        try {
            setLoading(true);
            setError(null);
            
            const currentPage = customPage || (reset ? 1 : page);
            const skip = (currentPage - 1) * ITEMS_PER_PAGE;
            
            const data = await getEntityActivity(entityType, entityId, ITEMS_PER_PAGE, skip);
            
            if (reset || currentPage === 1) {
                setActivities(data);
            } else {
                setActivities(prev => [...prev, ...data]);
            }
            
            setHasMore(data.length === ITEMS_PER_PAGE);
            
            if (reset) {
                setPage(1);
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Error al cargar la actividad');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchActivities(false, nextPage);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[480px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Historial de Actividad</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        {entityType === 'order' ? 'Pedido' : entityType === 'budget' ? 'Presupuesto' : 'Recibo'} #{String(entityNumber || '').padStart(5, '0')}
                                        {clientName && ` • ${clientName}`}
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

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[var(--text-muted)] text-sm mt-3">Cargando actividad...</p>
                                </div>
                            ) : error ? (
                                <div className="h-full flex flex-col items-center justify-center py-12 text-center px-6">
                                    <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-2xl flex items-center justify-center mb-4">
                                        <Trash2 size={28} className="text-danger-600" />
                                    </div>
                                    <p className="text-[var(--text-muted)] text-sm">{error}</p>
                                    <button
                                        onClick={() => fetchActivities(true)}
                                        className="mt-3 text-primary-600 text-sm font-medium hover:underline"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mb-4">
                                        <History size={40} className="text-[var(--text-muted)] opacity-50" />
                                    </div>
                                    <p className="text-[var(--text-muted)] text-sm font-medium">No hay actividad registrada</p>
                                    <p className="text-[var(--text-muted)] text-xs mt-1">
                                        Las acciones realizadas aparecerán aquí
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {activities.map((activity) => {
                                        const Icon = typeIcons[activity.type] || History;
                                        const colorClass = typeColors[activity.type] || 'bg-gray-100 text-gray-600';
                                        
                                        // Determinar si mostrar cambios (solo para ediciones)
                                        const showChanges = activity.changes && activity.changes.length > 0 && 
                                            (activity.type === 'budget_edited' || activity.type === 'order_edited');

                                        return (
                                            <motion.div
                                                key={activity._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="group p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] text-[var(--text-primary)] leading-snug">
                                                            {activity.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[11px] text-[var(--text-muted)]">
                                                                {formatTime(activity.createdAt)}
                                                            </span>
                                                            {activity.userId && (
                                                                <span className="text-[10px] text-[var(--text-muted)]">
                                                                    • {activity.userId.firstName} {activity.userId.lastName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Mostrar cambios si es una edición */}
                                                {showChanges && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                                                        <ChangeDetails changes={activity.changes} compact={true} />
                                                    </div>
                                                )}
                                                
                                                {/* Metadata adicional si existe */}
                                                {activity.metadata && !showChanges && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                                                        {/* Cambio de estado (status_updated y reverted) */}
                                                        {(activity.metadata.previousStatus && activity.metadata.newStatus) || (activity.metadata.previousStatus && activity.metadata.targetStatus) ? (
                                                            <div className="flex items-center gap-2 text-[11px]">
                                                                <span className="text-[var(--text-muted)]">
                                                                    {activity.type === 'order_reverted' ? 'Revertido:' : 'Cambio de estado:'}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${statusBadgeStyles[activity.metadata.previousStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                    {statusLabels[activity.metadata.previousStatus] || activity.metadata.previousStatus}
                                                                </span>
                                                                <ArrowRight size={12} className="text-[var(--text-muted)]" />
                                                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${statusBadgeStyles[activity.metadata.newStatus || activity.metadata.targetStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                    {statusLabels[activity.metadata.newStatus || activity.metadata.targetStatus] || activity.metadata.newStatus || activity.metadata.targetStatus}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                        {activity.metadata.recipients && (
                                                            <div className="text-[11px] text-[var(--text-muted)]">
                                                                Destinatarios: {activity.metadata.recipients.join(', ')}
                                                            </div>
                                                        )}
                                                        {activity.metadata.amount && (
                                                            <div className="text-[11px] text-[var(--text-muted)]">
                                                                Monto: ${activity.metadata.amount.toLocaleString('es-AR')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {(activities.length > 0 || loading) && (
                            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
                                {loading && page > 1 ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[12px] text-[var(--text-muted)]">Cargando...</span>
                                    </div>
                                ) : hasMore ? (
                                    <button
                                        onClick={loadMore}
                                        className="w-full text-center text-[12px] font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider"
                                    >
                                        Cargar más actividad
                                    </button>
                                ) : (
                                    <p className="text-center text-[12px] text-[var(--text-muted)]">
                                        No hay más actividad
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default OrderActivityDrawer;
