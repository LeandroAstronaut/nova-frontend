import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, DollarSign, User, Calendar, MessageSquare } from 'lucide-react';
import Button from '../common/Button';

const ReceiptDrawer = ({ isOpen, onClose, onSave, clients }) => {
    const [formData, setFormData] = useState({
        clientId: '',
        type: 'ingreso',
        amount: '',
        concept: '',
        paymentMethod: 'efectivo',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                clientId: '',
                type: 'ingreso',
                amount: '',
                concept: '',
                paymentMethod: 'efectivo',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setErrors({});
        }
    }, [isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.clientId) newErrors.clientId = 'Seleccione un cliente';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Ingrese un monto válido';
        if (!formData.concept.trim()) newErrors.concept = 'Ingrese el concepto';
        if (!formData.date) newErrors.date = 'Seleccione una fecha';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        
        try {
            setLoading(true);
            await onSave({
                ...formData,
                amount: Number(formData.amount)
            });
        } catch (error) {
            console.error('Error saving receipt:', error);
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
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[480px] bg-[var(--bg-card)] shadow-2xl z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Nuevo Recibo</h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">Complete los datos del recibo</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Cliente */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Cliente *
                                </label>
                                <select
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                        errors.clientId ? 'border-danger-500' : 'border-[var(--border-color)]'
                                    }`}
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>{client.businessName}</option>
                                    ))}
                                </select>
                                {errors.clientId && <p className="text-danger-500 text-xs mt-1">{errors.clientId}</p>}
                            </div>

                            {/* Tipo y Fecha */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Tipo *
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'ingreso' })}
                                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                formData.type === 'ingreso'
                                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300'
                                                    : 'bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            Ingreso
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'egreso' })}
                                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                formData.type === 'egreso'
                                                    ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-300'
                                                    : 'bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            Egreso
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                            errors.date ? 'border-danger-500' : 'border-[var(--border-color)]'
                                        }`}
                                    />
                                    {errors.date && <p className="text-danger-500 text-xs mt-1">{errors.date}</p>}
                                </div>
                            </div>

                            {/* Monto */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Monto *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        className={`w-full pl-8 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                            errors.amount ? 'border-danger-500' : 'border-[var(--border-color)]'
                                        }`}
                                    />
                                </div>
                                {errors.amount && <p className="text-danger-500 text-xs mt-1">{errors.amount}</p>}
                            </div>

                            {/* Concepto */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Concepto *
                                </label>
                                <input
                                    type="text"
                                    value={formData.concept}
                                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                    placeholder="Ej: Pago de factura #1234"
                                    className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                        errors.concept ? 'border-danger-500' : 'border-[var(--border-color)]'
                                    }`}
                                />
                                {errors.concept && <p className="text-danger-500 text-xs mt-1">{errors.concept}</p>}
                            </div>

                            {/* Método de pago */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Método de Pago
                                </label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Notas
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Notas adicionales..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] space-y-3">
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                className="w-full !py-3"
                            >
                                Crear Recibo
                            </Button>
                            <button
                                onClick={onClose}
                                className="w-full text-center text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReceiptDrawer;
