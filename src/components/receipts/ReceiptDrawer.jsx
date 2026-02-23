import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Search, Building2, Check, ChevronLeft, User } from 'lucide-react';
import Button from '../common/Button';

const ReceiptDrawer = ({ isOpen, onClose, onSave, clients, company = null, user = null, currentUser = null }) => {
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
    
    // Email options
    const [emailOptions, setEmailOptions] = useState({
        sendToCompany: false,
        sendToClient: false,
        sendToSalesRep: false,
        customEmail: ''
    });
    
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
            setEmailOptions({
                sendToCompany: false,
                sendToClient: false,
                sendToSalesRep: false,
                customEmail: ''
            });
        }
    }, [isOpen]);
    
    // Set default email options when entering step 2 based on user role
    useEffect(() => {
        if (step === 2 && formData.clientId) {
            const isAdmin = currentUser?.role?.name === 'admin' || currentUser?.role?.name === 'superadmin';
            
            setEmailOptions(prev => ({
                ...prev,
                sendToCompany: true,
                sendToClient: true,
                sendToSalesRep: true
            }));
        }
    }, [step, formData.clientId, currentUser]);

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
            
            // Build email recipients list
            const emailRecipients = [];
            if (emailOptions.sendToCompany && company?.email) {
                emailRecipients.push(company.email);
            }
            if (emailOptions.sendToClient && selectedClient?.email) {
                emailRecipients.push(selectedClient.email);
            }
            if (emailOptions.sendToSalesRep && selectedClient?.salesRepId?.email) {
                emailRecipients.push(selectedClient.salesRepId.email);
            }
            if (emailOptions.customEmail.trim()) {
                emailOptions.customEmail.split(',').forEach(email => {
                    const trimmed = email.trim();
                    if (trimmed) emailRecipients.push(trimmed);
                });
            }
            
            await onSave({
                ...formData,
                amount: Number(formData.amount),
                sendEmail: emailRecipients.length > 0,
                emailRecipients: emailRecipients
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
                        className={`fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full bg-[var(--bg-card)] shadow-2xl z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden transition-[max-width] duration-300 ease-in-out ${step === 2 ? 'md:max-w-4xl' : 'md:max-w-[520px]'}`}
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
                                    /* PASO 1: Selección de Cliente - Igual que BudgetDrawer */
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-4 md:space-y-6"
                                    >
                                        {/* Búsqueda */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} strokeWidth={2.5} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o CUIT..."
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-[var(--bg-card)] transition-all"
                                                autoFocus
                                            />
                                        </div>
                                        
                                        {/* Grid de Clientes */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                            {filteredClients.length > 0 ? filteredClients.slice(0, 50).map((client, index) => {
                                                const isSelected = formData.clientId === client._id;
                                                return (
                                                    <motion.button
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        transition={{ delay: index * 0.03 }}
                                                        key={client._id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, clientId: client._id });
                                                            setStep(2);
                                                        }}
                                                        className={`group relative bg-[var(--bg-card)] rounded-2xl border p-4 hover:shadow-lg transition-all text-left ${
                                                            isSelected
                                                                ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md'
                                                                : 'border-[var(--border-color)] hover:border-primary-300 dark:hover:border-primary-700'
                                                        }`}
                                                    >
                                                        {/* Badge Seleccionado - Círculo azul con check */}
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md">
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex items-start gap-3">
                                                            {/* Icon */}
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                                isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] group-hover:text-primary-600'
                                                            }`}>
                                                                <Building2 size={22} />
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1">
                                                                <p className={`font-bold text-[15px] leading-tight mb-1 ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-[var(--text-primary)]'}`}>
                                                                    {client.businessName}
                                                                </p>
                                                                <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wide">
                                                                    CUIT: {client.cuit || 'No registrado'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Vendedor */}
                                                        <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                                                            <User size={14} className="text-[var(--text-muted)]" />
                                                            <span className="text-[11px] text-primary-600 dark:text-primary-400 font-medium">
                                                                Vendedor: {client.salesRepId?.firstName && client.salesRepId?.lastName 
                                                                    ? `${client.salesRepId.firstName} ${client.salesRepId.lastName}`
                                                                    : client.salesRepId?.name 
                                                                        ? client.salesRepId.name
                                                                        : (client.salesRepId?._id || client.salesRepId ? 'Asignado' : 'Sin asignar')}
                                                            </span>
                                                        </div>
                                                    </motion.button>
                                                );
                                            }) : (
                                                <div className="col-span-full py-12 text-center">
                                                    <div className="w-16 h-16 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <Building2 size={32} className="text-[var(--text-muted)] opacity-50" />
                                                    </div>
                                                    <p className="text-[var(--text-muted)] text-sm font-medium">
                                                        {clientSearch ? `No se encontraron clientes para "${clientSearch}"` : 'Escribe para buscar clientes por nombre o CUIT'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {errors.clientId && <p className="text-danger-500 text-xs mt-2">{errors.clientId}</p>}
                                    </motion.div>
                                ) : (
                                    /* PASO 2: Formulario del Recibo - 2 columnas */
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                                    >
                                        {/* COLUMNA IZQUIERDA: Datos del recibo */}
                                        <div className="space-y-5">
                                            {/* CLIENTE - Título */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                    Cliente
                                                </label>
                                                <div 
                                                    onClick={() => setStep(1)}
                                                    className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                                                >
                                                    <div className="flex items-center justify-between">
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
                                                        </div>
                                                        <ChevronLeft size={16} className="text-[var(--text-muted)] rotate-180" />
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Fecha */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 }}
                                            >
                                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                    Fecha
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                                />
                                            </motion.div>

                                            {/* Monto y Método */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="grid grid-cols-2 gap-4"
                                            >
                                                <div>
                                                    <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
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
                                                    <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
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
                                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
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
                                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
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
                                        </div>

                                        {/* COLUMNA DERECHA: Opciones de Email */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.25 }}
                                            className="space-y-3"
                                        >
                                            <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                                                Enviar detalle por email
                                            </label>
                                            
                                            <div>
                                                {/* Email de la empresa */}
                                                {company?.email && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const isVendedor = currentUser?.role?.name === 'vendedor';
                                                            if (isVendedor) return;
                                                            setEmailOptions({ ...emailOptions, sendToCompany: !emailOptions.sendToCompany });
                                                        }}
                                                        disabled={currentUser?.role?.name === 'vendedor'}
                                                        className={`w-full flex items-center justify-between py-1 transition-colors ${currentUser?.role?.name === 'vendedor' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-[13px] font-bold text-[var(--text-primary)]">Empresa</span>
                                                            <span className="text-[11px] text-[var(--text-muted)]">{company.email}</span>
                                                        </div>
                                                        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${emailOptions.sendToCompany ? 'bg-primary-500' : 'bg-[var(--border-color)]'}`}>
                                                            <motion.div
                                                                initial={false}
                                                                animate={{ x: emailOptions.sendToCompany ? 20 : 2 }}
                                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                            />
                                                        </div>
                                                    </button>
                                                )}
                                                
                                                {/* Email del cliente */}
                                                {selectedClient?.email && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEmailOptions({ ...emailOptions, sendToClient: !emailOptions.sendToClient })}
                                                        className="w-full flex items-center justify-between py-1 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-[13px] font-bold text-[var(--text-primary)]">Cliente</span>
                                                            <span className="text-[11px] text-[var(--text-muted)]">{selectedClient.email}</span>
                                                        </div>
                                                        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${emailOptions.sendToClient ? 'bg-primary-500' : 'bg-[var(--border-color)]'}`}>
                                                            <motion.div
                                                                initial={false}
                                                                animate={{ x: emailOptions.sendToClient ? 20 : 2 }}
                                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                            />
                                                        </div>
                                                    </button>
                                                )}
                                                
                                                {/* Email del vendedor */}
                                                {selectedClient?.salesRepId?.email && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const isAdmin = currentUser?.role?.name === 'admin';
                                                            if (isAdmin) return;
                                                            setEmailOptions({ ...emailOptions, sendToSalesRep: !emailOptions.sendToSalesRep });
                                                        }}
                                                        disabled={currentUser?.role?.name === 'admin'}
                                                        className={`w-full flex items-center justify-between py-1 transition-colors ${currentUser?.role?.name === 'admin' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-[13px] font-bold text-[var(--text-primary)]">Vendedor</span>
                                                            <span className="text-[11px] text-[var(--text-muted)]">{selectedClient.salesRepId.email}</span>
                                                        </div>
                                                        <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${emailOptions.sendToSalesRep ? 'bg-primary-500' : 'bg-[var(--border-color)]'}`}>
                                                            <motion.div
                                                                initial={false}
                                                                animate={{ x: emailOptions.sendToSalesRep ? 20 : 2 }}
                                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                            />
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* Email personalizado */}
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                                                    Otras direcciones de email
                                                </label>
                                                <input
                                                    type="text"
                                                    value={emailOptions.customEmail}
                                                    onChange={(e) => setEmailOptions({ ...emailOptions, customEmail: e.target.value })}
                                                    placeholder="ej: correo1@ejemplo.com, correo2@ejemplo.com"
                                                    className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                                />
                                                <p className="text-[10px] text-[var(--text-muted)]">
                                                    Separa múltiples emails con comas
                                                </p>
                                            </div>
                                            
                                            {/* Mensaje si no hay opciones disponibles */}
                                            {!company?.email && !selectedClient?.email && !selectedClient?.salesRepId?.email && (
                                                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-100 dark:border-warning-800">
                                                    <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium">
                                                        <strong>Atención:</strong> No hay emails configurados. Puedes ingresar emails manualmente arriba.
                                                    </p>
                                                </div>
                                            )}
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
