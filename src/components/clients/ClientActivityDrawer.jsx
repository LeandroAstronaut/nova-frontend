import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, FileText, Edit, Trash2, ArrowRight, RotateCcw, Package, Mail, MessageCircle, Receipt, User, CheckCircle, LogIn, LogOut, Shield, Loader2 } from 'lucide-react';
import { getClientActivity } from '../../services/activityLogService';
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
    receipt_cancelled: Trash2,
    client_created: User,
    client_edited: Edit,
    client_deleted: Trash2,
    login: LogIn,
    logout: LogOut,
    password_changed: Shield,
    status_changed: CheckCircle
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
    receipt_edited: 'Recibo editado',
    receipt_deleted: 'Recibo eliminado',
    receipt_cancelled: 'Recibo anulado',
    client_created: 'Cliente creado',
    client_edited: 'Cliente editado',
    client_deleted: 'Cliente eliminado',
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    password_changed: 'Contraseña cambiada',
    status_changed: 'Estado actualizado'
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
    client_deleted: 'bg-red-100 text-red-600',
    login: 'bg-green-100 text-green-600',
    logout: 'bg-gray-100 text-gray-600',
    password_changed: 'bg-amber-100 text-amber-600',
    status_changed: 'bg-purple-100 text-purple-600'
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

const ITEMS_PER_PAGE = 10;

const ClientActivityDrawer = ({ isOpen, onClose, client }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isOpen && client?._id) {
            fetchActivities(true);
        }
    }, [isOpen, client?._id]);

    const fetchActivities = async (reset = false, customPage = null) => {
        try {
            setLoading(true);
            setError(null);
            
            const currentPage = customPage || (reset ? 1 : page);
            const skip = (currentPage - 1) * ITEMS_PER_PAGE;
            
            const data = await getClientActivity(client._id, ITEMS_PER_PAGE, skip);
            
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
            console.error('Error fetching client activities:', err);
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[480px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Historial de Actividad</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{client?.businessName}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {loading && activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                                    <Loader2 size={32} className="animate-spin mb-3" />
                                    <p className="text-sm">Cargando actividad...</p>
                                </div>
                            ) : error ? (
                                <div className="h-full flex flex-col items-center justify-center text-danger-500 px-6">
                                    <p className="text-sm">{error}</p>
                                    <button 
                                        onClick={() => fetchActivities(true)} 
                                        className="mt-3 px-4 py-2 bg-primary-100 text-primary-600 rounded-lg text-sm"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                                    <History size={48} className="mb-3 opacity-30" />
                                    <p className="text-sm font-medium">Sin actividad registrada</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {activities.map((activity) => {
                                        const Icon = typeIcons[activity.type] || History;
                                        const colorClass = typeColors[activity.type] || 'bg-gray-100 text-gray-600';
                                        
                                        // Determinar si mostrar cambios (solo para ediciones)
                                        const showChanges = activity.changes && activity.changes.length > 0 && 
                                            (activity.type === 'client_edited' || activity.type === 'budget_edited' || activity.type === 'order_edited');
                                        
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
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
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

export default ClientActivityDrawer;
