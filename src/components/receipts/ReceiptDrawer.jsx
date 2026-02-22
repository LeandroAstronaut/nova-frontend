import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Search, Building2, Check, ChevronLeft } from 'lucide-react';
import Button from '../common/Button';

const ReceiptDrawer = ({ isOpen, onClose, onSave, clients }) => {
    const [step, setStep] = useState(1);
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
    const [clientSearch, setClientSearch] = useState('');
    
    // Filtrar y ordenar clientes (seleccionado primero)
    const filteredClients = useMemo(() => {
        let result = clients || [];
        
        // Filtrar por búsqueda
        if (clientSearch.trim()) {
            const search = clientSearch.toLowerCase();
            result = result.filter(c => 
                c.businessName?.toLowerCase().includes(search) || 
                c.cuit?.toLowerCase().includes(search)
            );
        }
        
        // Ordenar: seleccionado primero
        return [...result].sort((a, b) => {
            if (formData.clientId && a._id === formData.clientId) return -1;
            if (formData.clientId && b._id === formData.clientId) return 1;
            return 0;
        });
    }, [clients, clientSearch, formData.clientId]);
    
    // Cliente seleccionado
    const selectedClient = useMemo(() => {
        return (clients || []).find(c => c._id === formData.clientId);
    }, [clients, formData.clientId]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
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
            setClientSearch('');
        }
    }, [isOpen]);

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.clientId) newErrors.clientId = 'Seleccione un cliente';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const validateStep2 = () => {
        const newErrors = {};
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Ingrese un monto válido';
        if (!formData.concept.trim()) newErrors.concept = 'Ingrese el concepto';
        if (!formData.date) newErrors.date = 'Seleccione una fecha';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };
    
    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;
        
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

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[520px] bg-[var(--bg-card)] shadow-2xl z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-2 md:gap-3">
                                {step === 2 && (
                                    <button
                                        onClick={handleBack}
                                        className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                        title="Volver"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                <div className="w-9 h-9 md:w-10 md:h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <FileText size={18} className="md:w-5 md:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-base font-semibold text-[var(--text-primary)]">Nuevo Recibo</h2>
                                    <p className="text-[10px] md:text-[11px] text-[var(--text-muted)] font-medium">Paso {step} de 2</p>
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
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    /* PASO 1: Selección de Cliente */
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 block">
                                                Seleccionar Cliente
                                            </label>
                                            
                                            {/* Búsqueda */}
                                            <div className="relative mb-3">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nombre o CUIT..."
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs"
                                                    autoFocus
                                                />
                                            </div>
                                            
                                            {/* Grid de clientes */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                                                {filteredClients.length > 0 ? filteredClients.slice(0, 20).map((client, index) => {
                                                    const isSelected = formData.clientId === client._id;
                                                    return (
                                                        <motion.button
                                                            key={client._id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.03, duration: 0.2 }}
                                                            onClick={() => {
                                                                setFormData({ ...formData, clientId: client._id });
                                                                setStep(2);
                                                            }}
                                                            className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                                                isSelected 
                                                                    ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10' 
                                                                    : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-primary-300'
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md">
                                                                    <Check size={12} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                                isSelected ? 'bg-primary-100 text-primary-600' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                                                            }`}>
                                                                <Building2 size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-900' : 'text-[var(--text-primary)]'}`}>
                                                                    {client.businessName}
                                                                </p>
                                                                <p className="text-[10px] text-[var(--text-muted)]">{client.cuit || 'Sin CUIT'}</p>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                }) : (
                                                    <div className="col-span-full text-center py-8 text-[var(--text-muted)] text-sm">
                                                        <div className="w-12 h-12 bg-[var(--bg-hover)] rounded-xl flex items-center justify-center mx-auto mb-3">
                                                            <Building2 size={24} className="opacity-50" />
                                                        </div>
                                                        <p>No se encontraron clientes</p>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.clientId && <p className="text-danger-500 text-xs mt-2">{errors.clientId}</p>}
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* PASO 2: Formulario del Recibo */
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-5"
                                    >
                                        {/* Cliente seleccionado - Clickeable para volver */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setStep(1)}
                                            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                                    Cliente
                                                </label>
                                                <span className="text-[10px] text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Cambiar
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                                        {selectedClient?.businessName}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)]">
                                                        {selectedClient?.cuit || 'Sin CUIT'}
                                                    </p>
                                                </div>
                                                <ChevronLeft size={16} className="text-[var(--text-muted)] rotate-180" />
                                            </div>
                                        </motion.div>

                                        {/* Tipo y Fecha */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 }}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <div>
                                                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                    Tipo
                                                </label>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, type: 'ingreso' })}
                                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                                                            formData.type === 'ingreso'
                                                                ? 'bg-success-100 dark:bg-success-900/30 text-success-700 border border-success-300'
                                                                : 'bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                                                        }`}
                                                    >
                                                        Ingreso
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, type: 'egreso' })}
                                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                                                            formData.type === 'egreso'
                                                                ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 border border-danger-300'
                                                                : 'bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                                                        }`}
                                                    >
                                                        Egreso
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                    Fecha
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Monto y Método */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <div>
                                                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                    Monto
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">$</span>
                                                    <input
                                                        type="number"
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className={`w-full pl-8 pr-3 py-2 bg-[var(--bg-input)] border rounded-lg text-sm font-semibold ${
                                                            errors.amount ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                        }`}
                                                    />
                                                </div>
                                                {errors.amount && <p className="text-danger-500 text-xs mt-1">{errors.amount}</p>}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                    Método
                                                </label>
                                                <select
                                                    value={formData.paymentMethod}
                                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                                >
                                                    <option value="efectivo">Efectivo</option>
                                                    <option value="transferencia">Transferencia</option>
                                                    <option value="cheque">Cheque</option>
                                                    <option value="tarjeta">Tarjeta</option>
                                                    <option value="otro">Otro</option>
                                                </select>
                                            </div>
                                        </motion.div>

                                        {/* Concepto */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                Concepto
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.concept}
                                                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                                placeholder="Ej: Pago de factura #1234"
                                                className={`w-full px-3 py-2 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                                    errors.concept ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                            />
                                            {errors.concept && <p className="text-danger-500 text-xs mt-1">{errors.concept}</p>}
                                        </motion.div>

                                        {/* Notas */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                Notas
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="Notas adicionales..."
                                                rows={2}
                                                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm resize-none"
                                            />
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                {step === 2 && formData.amount && (
                                    <div className="hidden sm:block">
                                        <span className="text-[11px] text-[var(--text-muted)]">Total:</span>
                                        <span className={`text-base font-bold ml-1 ${formData.type === 'ingreso' ? 'text-success-600' : 'text-danger-600'}`}>
                                            ${Number(formData.amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {step === 1 ? (
                                    <Button
                                        variant="primary"
                                        onClick={handleNext}
                                        disabled={!formData.clientId}
                                        className="!px-6 !py-2 !text-sm disabled:opacity-50"
                                    >
                                        Siguiente
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleBack}
                                            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                            title="Volver"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <Button
                                            variant="primary"
                                            onClick={handleSubmit}
                                            loading={loading}
                                            disabled={!formData.amount || !formData.concept}
                                            className="!px-6 !py-2 !text-sm !bg-success-600 hover:!bg-success-700 disabled:opacity-50"
                                        >
                                            Crear Recibo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ReceiptDrawer;
