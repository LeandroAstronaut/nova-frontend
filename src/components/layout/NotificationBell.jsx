import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, FileText, ShoppingCart, Mail, MessageCircle, Receipt, User, Trash2, Edit, RotateCcw, Package, ArrowRight, FileMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActivityLogs, getUnreadCount, markAsRead, markAllAsRead } from '../../services/activityLogService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
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
    receipt_cancelled: FileMinus,
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
    
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

const NotificationBell = ({ isOpen, onClose, onUnreadCountChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const data = await getActivityLogs({ limit: showAll ? 50 : 20 });
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        
        // Actualizar cada 30 segundos
        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadCount();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [showAll]);

    // Recargar cuando se abre el drawer
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            refreshUnreadCount();
        }
    }, [isOpen]);

    // Sincronizar unreadCount con el Header
    useEffect(() => {
        if (onUnreadCountChange) {
            onUnreadCountChange(unreadCount);
        }
    }, [unreadCount, onUnreadCountChange]);

    const handleMarkAsRead = async (logId) => {
        try {
            await markAsRead([logId]);
            setNotifications(prev => 
                prev.map(n => n._id === logId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            addToast('Todas las notificaciones marcadas como leídas', 'success');
        } catch (error) {
            console.error('Error marking all as read:', error);
            addToast('Error al marcar notificaciones', 'error');
        }
    };

    // Refrescar contador desde el servidor
    const refreshUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error refreshing unread count:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification._id);
        }
        
        // Navegar según el tipo de entidad
        if (notification.entityType === 'order' || notification.entityType === 'budget') {
            // Si tiene entityId, ir directo al detalle
            if (notification.entityId) {
                const path = notification.entityType === 'order' ? '/pedidos' : '/presupuestos';
                navigate(`${path}/${notification.entityId}`);
            } else {
                navigate('/pedidos');
            }
        } else if (notification.entityType === 'receipt') {
            if (notification.entityId) {
                navigate(`/recibos/${notification.entityId}`);
            } else {
                navigate('/recibos');
            }
        } else if (notification.entityType === 'client') {
            navigate('/clientes');
        }
        
        onClose();
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
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[999]"
                    />

                    {/* Drawer - Estilo consistente con CartDrawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[420px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[1000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header - Estilo consistente */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Notificaciones</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-primary-600 transition-colors"
                                        title="Marcar todas como leídas"
                                    >
                                        <CheckCheck size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content - Scrolleable */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mb-4">
                                        <Bell size={40} className="text-[var(--text-muted)] opacity-50" />
                                    </div>
                                    <p className="text-[var(--text-muted)] text-sm font-medium">No hay notificaciones</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {notifications.map((notification) => {
                                        const Icon = typeIcons[notification.type] || Bell;
                                        const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600';
                                        
                                        // Determinar si mostrar cambios (solo para ediciones)
                                        const showChanges = notification.changes && notification.changes.length > 0 && 
                                            (notification.type === 'budget_edited' || notification.type === 'order_edited');

                                        return (
                                            <motion.div
                                                key={notification._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`group p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer transition-all ${
                                                    !notification.read ? 'bg-primary-50/30 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : ''
                                                }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] text-[var(--text-primary)] leading-snug">
                                                            {notification.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[11px] text-[var(--text-muted)]">
                                                                {formatTime(notification.createdAt)}
                                                            </span>
                                                            {notification.userId && (
                                                                <span className="text-[10px] text-[var(--text-muted)]">
                                                                    • {notification.userId.firstName} {notification.userId.lastName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification._id);
                                                            }}
                                                            className="shrink-0 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-primary-600 transition-colors"
                                                            title="Marcar como leída"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Mostrar cambios si es una edición */}
                                                {showChanges && (
                                                    <div 
                                                        className="mt-2 pt-2 border-t border-[var(--border-color)]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ChangeDetails changes={notification.changes} compact={true} />
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="w-full text-center text-[12px] font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider"
                                >
                                    {showAll ? 'Ver menos' : 'Ver todas las notificaciones'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationBell;
