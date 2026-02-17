import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Mail, Building2, User, Loader2, AlertTriangle, Package, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { validateBudgetStock } from '../../services/orderService';

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

const StockIssueItem = ({ issue }) => (
    <div className="flex items-start gap-3 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-100 dark:border-danger-800">
        <AlertTriangle size={18} className="text-danger-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-danger-700 dark:text-danger-300 truncate">
                {issue.name} <span className="text-danger-500">({issue.code})</span>
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-danger-600 dark:text-danger-400">
                <span>Solicitado: <strong>{issue.requested}</strong></span>
                <span>Disponible: <strong>{issue.available}</strong></span>
                <span className="text-danger-500">Faltante: <strong>{issue.shortage}</strong></span>
            </div>
        </div>
    </div>
);

const ConvertToOrderModal = ({ isOpen, onClose, onConfirm, budget, loading, isClient = false, features = {} }) => {
    const [notifications, setNotifications] = useState({
        company: true,
        seller: true,
        client: !isClient
    });
    const [stockValidation, setStockValidation] = useState({
        loading: false,
        canConvert: true,
        issues: []
    });
    
    const hasStockFeature = features?.stock === true;
    
    // Validar stock cuando se abre el modal
    useEffect(() => {
        // Solo validar si es un presupuesto real
        if (isOpen && budget?.type !== 'budget') {
            // Si ya no es presupuesto (ya fue convertido), cerrar modal
            if (budget?.type === 'order') {
                handleClose();
            }
            return;
        }
        
        if (isOpen && hasStockFeature && budget?._id) {
            checkStock();
        } else if (isOpen && !hasStockFeature) {
            setStockValidation({
                loading: false,
                canConvert: true,
                issues: []
            });
        }
    }, [isOpen, budget, hasStockFeature]);
    
    const checkStock = async () => {
        setStockValidation(prev => ({ ...prev, loading: true }));
        try {
            const result = await validateBudgetStock(budget._id);
            setStockValidation({
                loading: false,
                canConvert: result.canConvert,
                issues: result.stockIssues || []
            });
        } catch (error) {
            console.error('Error validating stock:', error);
            setStockValidation({
                loading: false,
                canConvert: false,
                issues: [{ name: 'Error de validación', code: 'N/A', requested: 0, available: 0, shortage: 0, reason: error.message }]
            });
        }
    };
    
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
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Validación de Stock */}
                            {hasStockFeature && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Package size={16} className="text-[var(--text-muted)]" />
                                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Validación de Stock</h3>
                                        {stockValidation.loading && (
                                            <Loader2 size={14} className="animate-spin text-primary-500" />
                                        )}
                                    </div>
                                    
                                    {stockValidation.loading ? (
                                        <div className="p-4 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] text-center">
                                            <Loader2 size={24} className="animate-spin text-primary-500 mx-auto mb-2" />
                                            <p className="text-sm text-[var(--text-muted)]">Verificando disponibilidad...</p>
                                        </div>
                                    ) : stockValidation.canConvert ? (
                                        <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-100 dark:border-success-800 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-success-100 dark:bg-success-900/40 rounded-full flex items-center justify-center">
                                                <ArrowRight size={14} className="text-success-600" />
                                            </div>
                                            <p className="text-sm text-success-700 dark:text-success-300">
                                                Stock disponible para todos los productos
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-100 dark:border-danger-800">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle size={16} className="text-danger-500" />
                                                    <p className="text-sm font-bold text-danger-700 dark:text-danger-300">
                                                        Stock insuficiente
                                                    </p>
                                                </div>
                                                <p className="text-xs text-danger-600 dark:text-danger-400 mb-3">
                                                    Los siguientes productos no tienen stock suficiente. 
                                                    Edite el presupuesto para ajustar las cantidades.
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {stockValidation.issues.map((issue, index) => (
                                                    <StockIssueItem key={index} issue={issue} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Divider */}
                            {hasStockFeature && <div className="border-t border-[var(--border-color)]" />}

                            {/* Notificaciones - solo si hay stock disponible */}
                            {stockValidation.canConvert && (
                                <div className="space-y-3">
                                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                                        {isClient 
                                            ? 'Al convertir este presupuesto en pedido, se notificará automáticamente a la empresa y al vendedor asignado.'
                                            : 'Al convertir este presupuesto en pedido, se enviarán notificaciones por email a las siguientes direcciones:'
                                        }
                                    </p>

                                    <div className="space-y-3">
                                        {/* Company - Siempre activo */}
                                        <Toggle
                                            checked={notifications.company}
                                            onChange={() => {}}
                                            disabled={true}
                                            icon={Building2}
                                            label="Email empresa"
                                            email={budget?.companyId?.email || 'configurado@empresa.com'}
                                        />

                                        {/* Seller */}
                                        <Toggle
                                            checked={notifications.seller}
                                            onChange={(checked) => setNotifications(prev => ({ ...prev, seller: checked }))}
                                            disabled={isClient}
                                            icon={User}
                                            label="Email vendedor"
                                            email={budget?.salesRepId?.email || 'vendedor@empresa.com'}
                                        />

                                        {/* Client */}
                                        <Toggle
                                            checked={notifications.client}
                                            onChange={(checked) => setNotifications(prev => ({ ...prev, client: checked }))}
                                            icon={Mail}
                                            label="Email cliente"
                                            email={budget?.clientId?.email || 'cliente@empresa.com'}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Nota - solo si hay stock disponible */}
                            {stockValidation.canConvert && (
                                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-100 dark:border-warning-800">
                                    <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium leading-relaxed">
                                        <strong>Nota:</strong> Una vez convertido, el presupuesto pasará a ser un pedido confirmado y ya no podrá ser editado.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1"
                            >
                                {stockValidation.canConvert ? 'Cancelar' : 'Cerrar'}
                            </Button>
                            {stockValidation.canConvert && (
                                <Button
                                    variant="primary"
                                    onClick={handleConfirm}
                                    disabled={loading || stockValidation.loading}
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
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConvertToOrderModal;
