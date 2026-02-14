import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Mail, Building2, User, Loader2 } from 'lucide-react';
import Button from '../common/Button';

const Toggle = ({ checked, onChange, disabled, icon: Icon, label, email }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${disabled ? 'bg-[var(--bg-hover)] border-[var(--border-color)] opacity-60' : 'bg-[var(--bg-card)] border-[var(--border-color)]'} transition-all`}>
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${checked ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <div>
                <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">{email}</p>
            </div>
        </div>
        <button
            onClick={() => !disabled && onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-500' : 'bg-[var(--border-color)]'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={disabled}
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

const ConvertToOrderModal = ({ isOpen, onClose, onConfirm, budget, loading, isClient = false }) => {
    const [notifications, setNotifications] = useState({
        company: true,      // Siempre activo, no se puede desactivar
        seller: true,       // Opcional (obligatorio si es cliente)
        client: !isClient   // Solo opcional si NO es cliente
    });
    
    // Resetear estado cuando se abre el modal
    React.useEffect(() => {
        if (isOpen) {
            setNotifications({
                company: true,
                seller: true,
                client: !isClient
            });
        }
    }, [isOpen, isClient]);

    const handleConfirm = () => {
        onConfirm({
            budgetId: budget?._id,
            notifications
        });
    };

    const handleClose = () => {
        if (!loading) onClose();
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
                        onClick={handleClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl z-[10000] overflow-hidden border border-[var(--border-color)]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center text-success-600 dark:text-success-400">
                                    <ArrowRight size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Convertir a Pedido</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        Presupuesto #{String(budget?.orderNumber).padStart(5, '0')}
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
                                {isClient 
                                    ? 'Al convertir este presupuesto en pedido, se notificará automáticamente a la empresa y al vendedor asignado.'
                                    : 'Al convertir este presupuesto en pedido, se enviarán notificaciones por email a las siguientes direcciones:'
                                }
                            </p>

                            <div className="space-y-3">
                                {/* Company - Siempre activo (obligatorio para cliente) */}
                                <Toggle
                                    checked={notifications.company}
                                    onChange={() => {}}
                                    disabled={true}
                                    icon={Building2}
                                    label="Email empresa"
                                    email={budget?.companyId?.email || 'configurado@empresa.com'}
                                />

                                {/* Seller - Obligatorio si es cliente (siempre activado y disabled) */}
                                <Toggle
                                    checked={notifications.seller}
                                    onChange={(checked) => setNotifications(prev => ({ ...prev, seller: checked }))}
                                    disabled={isClient}
                                    icon={User}
                                    label="Email vendedor"
                                    email={budget?.salesRepId?.email || 'vendedor@empresa.com'}
                                />

                                {/* Client - Opcional siempre (el cliente decide si quiere recibir copia) */}
                                <Toggle
                                    checked={notifications.client}
                                    onChange={(checked) => setNotifications(prev => ({ ...prev, client: checked }))}
                                    icon={Mail}
                                    label="Email cliente"
                                    email={budget?.clientId?.email || 'cliente@empresa.com'}
                                />
                            </div>

                            <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-100 dark:border-warning-800">
                                <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium leading-relaxed">
                                    <strong>Nota:</strong> Una vez convertido, el presupuesto pasará a ser un pedido confirmado y ya no podrá ser editado.
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
                                disabled={loading}
                                className="flex-1 !bg-success-600 hover:!bg-success-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Convirtiendo...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight size={16} />
                                        Convertir
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConvertToOrderModal;
