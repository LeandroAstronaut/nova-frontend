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
    login: 'Inicio de sesion',
    logout: 'Cierre de sesion',
    password_changed: 'Contrasena cambiada',
    status_changed: 'Estado actualizado'
};

const ClientActivityDrawer = ({ isOpen, onClose, client }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && client?._id) {
            fetchActivities();
        }
    }, [isOpen, client?._id]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientActivity(client._id, 100);
            setActivities(data);
        } catch (err) {
            console.error('Error fetching client activities:', err);
            setError('Error al cargar la actividad');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diffInSeconds = Math.floor((now - d) / 1000);
        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        return d.toLocaleDateString('es-AR');
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
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[480px] bg-[var(--bg-card)] shadow-2xl z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Historial de Actividad</h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">{client?.businessName}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                                    <Loader2 size={32} className="animate-spin mb-3" />
                                    <p className="text-sm">Cargando actividad...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center h-full text-danger-500">
                                    <p className="text-sm">{error}</p>
                                    <button onClick={fetchActivities} className="mt-3 px-4 py-2 bg-primary-100 text-primary-600 rounded-lg text-sm">Reintentar</button>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                                    <History size={48} className="mb-3 opacity-30" />
                                    <p className="text-sm font-medium">Sin actividad registrada</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-3">
                                    {activities.map((activity) => {
                                        const Icon = typeIcons[activity.type] || History;
                                        const label = typeLabels[activity.type] || activity.type;
                                        return (
                                            <div key={activity._id} className="flex gap-3 p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary-100 text-primary-600">
                                                    <Icon size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-[var(--text-primary)]">{label}</span>
                                                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">{formatDate(activity.createdAt)}</span>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{activity.description}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Por: {activity.userId?.firstName} {activity.userId?.lastName}</p>
                                                    
                                                    {/* Cambios detallados para ediciones */}
                                                    {activity.changes && activity.changes.length > 0 && (
                                                        <ChangeDetails changes={activity.changes} compact />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
                            <p className="text-xs text-[var(--text-muted)] text-center">{activities.length} registros de actividad</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ClientActivityDrawer;
