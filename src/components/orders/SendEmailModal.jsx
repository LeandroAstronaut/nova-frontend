import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Building2, User, Mail, Loader2, FileText } from 'lucide-react';
import Button from '../common/Button';

const Toggle = ({ checked, onChange, icon: Icon, label, email, disabled }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${disabled ? 'bg-[var(--bg-hover)] border-[var(--border-color)] opacity-50' : checked ? 'bg-[var(--bg-card)] border-primary-200 dark:border-primary-800' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'} transition-all`}>
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${checked ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <div>
                <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">{email || 'No configurado'}</p>
            </div>
        </div>
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-500' : 'bg-[var(--border-color)]'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <motion.div
                initial={false}
                animate={{ x: checked ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </button>
    </div>
);

const SendEmailModal = ({ isOpen, onClose, onConfirm, order, loading }) => {
    const [notifications, setNotifications] = useState({
        company: false,
        seller: false,
        client: false
    });

    // Resetear toggles cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setNotifications({
                company: false,
                seller: false,
                client: false
            });
        }
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm({
            orderId: order?._id,
            notifications
        });
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    // Verificar si hay al menos un destinatario seleccionado
    const hasSelectedRecipient = notifications.company || notifications.seller || notifications.client;

    const orderNumber = String(order?.orderNumber || '').padStart(5, '0');
    const orderTypeLabel = order?.type === 'order' ? 'Pedido' : 'Presupuesto';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl z-[210] overflow-hidden border border-[var(--border-color)]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <Send size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Enviar por Email</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        {orderTypeLabel} #{orderNumber}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                                Seleccione los destinatarios a los que desea enviar el detalle:
                            </p>

                            <div className="space-y-3">
                                {/* Company */}
                                <Toggle
                                    checked={notifications.company}
                                    onChange={(checked) => setNotifications(prev => ({ ...prev, company: checked }))}
                                    icon={Building2}
                                    label="Email empresa"
                                    email={order?.companyId?.email}
                                    disabled={!order?.companyId?.email}
                                />

                                {/* Seller */}
                                <Toggle
                                    checked={notifications.seller}
                                    onChange={(checked) => setNotifications(prev => ({ ...prev, seller: checked }))}
                                    icon={User}
                                    label="Email vendedor"
                                    email={order?.salesRepId?.email}
                                    disabled={!order?.salesRepId?.email}
                                />

                                {/* Client */}
                                <Toggle
                                    checked={notifications.client}
                                    onChange={(checked) => setNotifications(prev => ({ ...prev, client: checked }))}
                                    icon={Mail}
                                    label="Email cliente"
                                    email={order?.clientId?.email}
                                    disabled={!order?.clientId?.email}
                                />
                            </div>

                            {!order?.companyId?.email && !order?.salesRepId?.email && !order?.clientId?.email && (
                                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-100 dark:border-warning-800">
                                    <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium">
                                        <strong>Atención:</strong> No hay emails configurados para enviar.
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-info-50 dark:bg-info-900/20 rounded-xl border border-info-100 dark:border-info-800">
                                <p className="text-[11px] text-info-700 dark:text-info-400 font-medium leading-relaxed">
                                    <strong>Nota:</strong> Se enviará un correo con el detalle completo del {orderTypeLabel.toLowerCase()}.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConfirm}
                                disabled={loading || !hasSelectedRecipient}
                                className="flex-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Enviar Email
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SendEmailModal;
