import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import Button from './Button';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning' // 'danger', 'warning', 'info'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertCircle size={20} className="text-danger-600" />;
            case 'warning': return <AlertTriangle size={20} className="text-warning-600" />;
            case 'info': default: return <Info size={20} className="text-primary-600" />;
        }
    };

    const getIconBgClass = () => {
        switch (type) {
            case 'danger': return 'bg-danger-100 text-danger-600';
            case 'warning': return 'bg-warning-100 text-warning-600';
            case 'info': default: return 'bg-primary-100 text-primary-600';
        }
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

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-[10000]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-(--bg-card) rounded-2xl shadow-2xl dark:shadow-soft-lg-dark w-full overflow-hidden border border-(--border-color) flex flex-col"
                            style={{ maxWidth: '380px' }}
                        >
                            {/* Header - Consistente con drawers */}
                            <div className="px-5 py-4 border-b border-(--border-color) flex items-center justify-between shrink-0 bg-(--bg-card)">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getIconBgClass()}`}>
                                        {getIcon()}
                                    </div>
                                    <h3 className="text-sm font-bold text-(--text-primary)">
                                        {title}
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <p className="text-sm text-(--text-secondary) leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            {/* Footer - Acciones */}
                            <div className="px-5 py-4 border-t border-(--border-color) bg-(--bg-hover) flex items-center justify-end gap-3 shrink-0">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    className="!px-4 !py-2.5 !h-10 !text-xs font-bold"
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    variant={type === 'danger' ? 'danger' : 'primary'}
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="!px-4 !py-2.5 !h-10 !text-xs font-bold"
                                >
                                    {confirmText}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConfirmModal;
