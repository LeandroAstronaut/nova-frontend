import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, FileText, ShoppingCart, Mail, MessageCircle, Receipt, User, Trash2, Edit, RotateCcw, Package, ArrowRight, CheckCircle, FileMinus } from 'lucide-react';
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

const OrderActivityDrawer = ({ isOpen, onClose, entityType, entityId, entityNumber, clientName }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && entityType && entityId) {
            fetchActivities();
        }
    }, [isOpen, entityType, entityId]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getEntityActivity(entityType, entityId);
            setActivities(data);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Error al cargar la actividad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[480px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
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
                            {loading ? (
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
                                        onClick={fetchActivities}
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
                                <div className="p-4 space-y-4">
                                    {/* Timeline */}
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-5 top-2 bottom-2 w-px bg-[var(--border-color)]" />
                                        
                                        {activities.map((activity, index) => {
                                            const Icon = typeIcons[activity.type] || History;
                                            const colorClass = typeColors[activity.type] || 'bg-gray-100 text-gray-600';
                                            const label = typeLabels[activity.type] || activity.type;
                                            const isFirst = index === 0;
                                            
                                            return (
                                                <motion.div
                                                    key={activity._id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="relative flex gap-4 pb-4 last:pb-0"
                                                >
                                                    {/* Timeline dot */}
                                                    <div className="relative z-10">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass} ${isFirst ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-card)] ring-primary-500' : ''}`}>
                                                            <Icon size={18} />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] mb-1">
                                                                    {label}
                                                                </span>
                                                                <p className="text-[13px] text-[var(--text-primary)] leading-snug">
                                                                    {activity.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[11px] text-[var(--text-muted)]">
                                                                {formatTime(activity.createdAt)}
                                                            </span>
                                                            {activity.userId && (
                                                                <>
                                                                    <span className="text-[var(--text-muted)]">•</span>
                                                                    <span className="text-[11px] text-[var(--text-muted)]">
                                                                        {activity.userId.firstName} {activity.userId.lastName}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Metadata adicional si existe */}
                                                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                                            <div className="mt-2 p-2 bg-[var(--bg-hover)] rounded-lg">
                                                                {activity.metadata.previousStatus && activity.metadata.newStatus && (
                                                                    <div className="flex items-center gap-2 text-[11px]">
                                                                        <span className="text-[var(--text-muted)]">Cambio de estado:</span>
                                                                        <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[var(--text-secondary)]">
                                                                            {activity.metadata.previousStatus}
                                                                        </span>
                                                                        <ArrowRight size={12} className="text-[var(--text-muted)]" />
                                                                        <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded text-primary-700 dark:text-primary-300">
                                                                            {activity.metadata.newStatus}
                                                                        </span>
                                                                    </div>
                                                                )}
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

                                                        {/* Cambios detallados para ediciones */}
                                                        {activity.changes && activity.changes.length > 0 && (
                                                            <ChangeDetails changes={activity.changes} />
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
                            <p className="text-[11px] text-[var(--text-muted)] text-center">
                                {activities.length} {activities.length === 1 ? 'registro' : 'registros'} de actividad
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default OrderActivityDrawer;
