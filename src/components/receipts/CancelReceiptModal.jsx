import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Send, Building2, User, Mail, Loader2 } from 'lucide-react';
import Button from '../common/Button';

const Toggle = ({ checked, onChange, label, email, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`w-full flex items-center justify-between py-1 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className="flex flex-col items-start">
            <span className="text-[13px] font-bold text-[var(--text-primary)]">{label}</span>
            <span className="text-[11px] text-[var(--text-muted)]">{email || 'No configurado'}</span>
        </div>
        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-500' : 'bg-[var(--border-color)]'}`}>
            <motion.div
                initial={false}
                animate={{ x: checked ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </div>
    </button>
);

const CancelReceiptModal = ({ isOpen, onClose, onConfirm, receipt, loading, userRole }) => {
    const [reason, setReason] = useState('');
    const [notifications, setNotifications] = useState({
        company: false,
        seller: false,
        client: false
    });
    const [additionalEmails, setAdditionalEmails] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReason('');
            // Por defecto todos tildados
            setNotifications({ company: true, seller: true, client: true });
            setAdditionalEmails('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm({ 
            receiptId: receipt?._id, 
            reason: reason.trim(),
            notifications, 
            additionalEmails: additionalEmails.trim() 
        });
    };

    const handleClose = () => { if (!loading) onClose(); };

    const hasAdditionalEmails = additionalEmails.trim().length > 0;
    const hasSelectedRecipient = notifications.company || notifications.seller || notifications.client || hasAdditionalEmails;
    const receiptNumber = String(receipt?.receiptNumber || '').padStart(5, '0');

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={handleClose} 
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]" 
                    />
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
                                <div className="w-10 h-10 bg-danger-100 dark:bg-danger-900/30 rounded-xl flex items-center justify-center text-danger-600 dark:text-danger-400">
                                    <AlertCircle size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">¿Anular Recibo?</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">Recibo #{receiptNumber}</p>
                                </div>
                            </div>
                            <button onClick={handleClose} disabled={loading} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors disabled:opacity-50">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Mensaje de advertencia */}
                            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                                Está a punto de anular el recibo <strong>#{receiptNumber}</strong>. Esta acción no se puede deshacer.
                            </p>

                            {/* Motivo */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                    Motivo (opcional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ingrese el motivo de anulación..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                                />
                            </div>

                            {/* Email Destinatarios - Diseño Compacto */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                    Notificar por email
                                </label>
                                <div>
                                    <Toggle 
                                        checked={notifications.company} 
                                        onChange={(c) => setNotifications(p => ({ ...p, company: c }))} 
                                        label="Empresa" 
                                        email={receipt?.companyId?.email} 
                                        disabled={!receipt?.companyId?.email || userRole === 'vendedor'} 
                                    />
                                    <Toggle 
                                        checked={notifications.seller} 
                                        onChange={(c) => setNotifications(p => ({ ...p, seller: c }))} 
                                        label="Vendedor" 
                                        email={receipt?.salesRepId?.email} 
                                        disabled={!receipt?.salesRepId?.email || userRole === 'admin'} 
                                    />
                                    <Toggle 
                                        checked={notifications.client} 
                                        onChange={(c) => setNotifications(p => ({ ...p, client: c }))} 
                                        label="Cliente" 
                                        email={receipt?.clientId?.email} 
                                        disabled={!receipt?.clientId?.email} 
                                    />
                                </div>
                            </div>

                            {/* Additional Emails */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                    Otras direcciones
                                </label>
                                <input
                                    type="text"
                                    value={additionalEmails}
                                    onChange={(e) => setAdditionalEmails(e.target.value)}
                                    placeholder="ej: correo1@ejemplo.com, correo2@ejemplo.com"
                                    className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                />
                                <p className="text-[10px] text-[var(--text-muted)]">
                                    Separa múltiples emails con comas
                                </p>
                            </div>

                            {!receipt?.companyId?.email && !receipt?.salesRepId?.email && !receipt?.clientId?.email && !hasAdditionalEmails && (
                                <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-100 dark:border-warning-800">
                                    <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium">
                                        No hay emails configurados. Puedes ingresar emails manualmente arriba.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex gap-3">
                            <Button variant="secondary" onClick={handleClose} disabled={loading} className="flex-1">
                                Cancelar
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={handleConfirm} 
                                disabled={loading} 
                                className="flex-1"
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" />Anulando...</>
                                ) : (
                                    <>Sí, anular</>
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

export default CancelReceiptModal;
