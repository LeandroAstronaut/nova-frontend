import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    Percent,
    Truck,
    Tag,
    Briefcase,
    AlertCircle,
    Hash,
    CreditCard,
    DollarSign,
    MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSellers } from '../../services/orderService';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';

// ============================================================================
// COMPONENTE: ConfirmCloseModal
// ============================================================================
const ConfirmCloseModal = ({ isOpen, onClose, onConfirm, hasChanges }) => {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={hasChanges ? '¿Descartar cambios?' : '¿Cerrar formulario?'}
            description={
                hasChanges
                    ? 'Ha realizado cambios en el cliente. Si cierra ahora, perderá toda la información ingresada.'
                    : '¿Está seguro que desea cerrar el formulario?'
            }
            confirmText={hasChanges ? 'Descartar cambios' : 'Cerrar'}
            cancelText={hasChanges ? 'Continuar editando' : 'Cancelar'}
            type={hasChanges ? 'warning' : 'info'}
        />
    );
};

// ============================================================================
// COMPONENTE PRINCIPAL: ClientDrawer
// ============================================================================
const ClientDrawer = ({ isOpen, onClose, onSave, client = null }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const isEditing = !!client;
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isVendedor = user?.role?.name === 'vendedor';

    const [loading, setLoading] = useState(false);
    const [vendedores, setVendedores] = useState([]);
    const [errors, setErrors] = useState({});
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    const initialDataRef = useRef(null);
    const initializedRef = useRef(false);

    const [formData, setFormData] = useState({
        businessName: '',
        cuit: '',
        code: '',
        discount: '',
        email: '',
        phone: '',
        whatsapp: '',
        contactFirstName: '',
        contactLastName: '',
        address: {
            street: '',
            city: '',
            postalCode: '',
            province: ''
        },
        shipping: {
            company: '',
            address: '',
            phone: ''
        },
        salesRepId: '',
        priceList: '1'
    });

    // ============================================================================
    // EFECTOS
    // ============================================================================

    // Cargar vendedores para el selector (solo admin/superadmin)
    useEffect(() => {
        if ((isAdmin || isSuperadmin) && isOpen) {
            const loadSellers = async () => {
                try {
                    const sellers = await getSellers();
                    setVendedores(sellers || []);
                } catch (error) {
                    console.error('Error loading sellers:', error);
                    setVendedores([]);
                }
            };
            loadSellers();
        }
    }, [isAdmin, isSuperadmin, isOpen]);

    // Efecto principal de inicialización del formulario
    useEffect(() => {
        if (!isOpen) {
            initializedRef.current = false;
            return;
        }

        // Evitar re-inicializar si ya se inicializó
        if (initializedRef.current) return;

        let newFormData;

        if (client) {
            newFormData = {
                businessName: client.businessName || '',
                cuit: client.cuit || '',
                code: client.code || '',
                discount: client.discount || '',
                email: client.email || '',
                phone: client.phone || '',
                whatsapp: client.whatsapp || '',
                contactFirstName: client.contactFirstName || '',
                contactLastName: client.contactLastName || '',
                address: {
                    street: client.address?.street || '',
                    city: client.address?.city || '',
                    postalCode: client.address?.postalCode || '',
                    province: client.address?.province || ''
                },
                shipping: {
                    company: client.shipping?.company || '',
                    address: client.shipping?.address || '',
                    phone: client.shipping?.phone || ''
                },
                salesRepId: client.salesRepId?._id || client.salesRepId || '',
                priceList: String(client.priceList || '1')
            };
        } else {
            // Default values para nuevo cliente
            newFormData = {
                businessName: '',
                cuit: '',
                code: '',
                discount: '',
                email: '',
                phone: '',
                whatsapp: '',
                contactFirstName: '',
                contactLastName: '',
                address: {
                    street: '',
                    city: '',
                    postalCode: '',
                    province: ''
                },
                shipping: {
                    company: '',
                    address: '',
                    phone: ''
                },
                salesRepId: isVendedor ? user.id : '',
                priceList: '1'
            };
        }

        setFormData(newFormData);
        initialDataRef.current = JSON.stringify(newFormData);
        setErrors({});
        setShowConfirmClose(false);
        initializedRef.current = true;

    }, [isOpen, client, isVendedor, user.id]);

    // ============================================================================
    // VALIDACIÓN
    // ============================================================================
    const hasChanges = useCallback(() => {
        if (!initialDataRef.current) return false;
        return JSON.stringify(formData) !== initialDataRef.current;
    }, [formData]);

    const validate = () => {
        const newErrors = {};

        // Validar Razón Social (requerido)
        if (!formData.businessName.trim()) {
            newErrors.businessName = 'La razón social es requerida';
        }

        // Validar descuento (0-100)
        if (formData.discount !== '' && formData.discount !== null) {
            const discount = parseFloat(formData.discount);
            if (isNaN(discount) || discount < 0 || discount > 100) {
                newErrors.discount = 'El descuento debe estar entre 0 y 100';
            }
        }

        // Validar email
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        // Validar CUIT (formato argentino básico)
        if (formData.cuit && !/^\d{2}-?\d{8}-?\d$/.test(formData.cuit.replace(/\s/g, ''))) {
            newErrors.cuit = 'Formato de CUIT inválido (XX-XXXXXXXX-X)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleAddressChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));
        if (errors[`address.${field}`]) {
            setErrors(prev => ({ ...prev, [`address.${field}`]: null }));
        }
    };

    const handleShippingChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            shipping: { ...prev.shipping, [field]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            const dataToSend = {
                ...formData,
                discount: formData.discount ? parseFloat(formData.discount) : 0,
                priceList: parseInt(formData.priceList)
            };

            await onSave(dataToSend);
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
            // Manejar errores específicos del backend
            if (error.response?.data?.message?.includes('código')) {
                setErrors(prev => ({ ...prev, code: 'Este código ya está en uso' }));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (hasChanges()) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setShowConfirmClose(false);
        onClose();
    };

    // ============================================================================
    // RENDER
    // ============================================================================
    return createPortal(
        <>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                            onClick={handleClose}
                        />

                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[900px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                                            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                                        </h2>
                                        <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                            {isEditing ? 'Modifique los datos del cliente' : 'Complete los datos del nuevo cliente'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* ============================================
                                        FILA 1: DOS COLUMNAS PRINCIPALES
                                        ============================================ */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* COLUMNA IZQUIERDA: Información Principal + Contacto */}
                                        <div className="space-y-6">
                                            {/* INFORMACIÓN PRINCIPAL */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Building2 size={14} />
                                                    Información Principal
                                                </h3>
                                                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />

                                                <div className="space-y-4">
                                                    {/* Razón Social */}
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Razón Social / Nombre <span className="text-danger-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.businessName}
                                                            onChange={(e) => handleChange('businessName', e.target.value)}
                                                            className={`w-full px-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                errors.businessName ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                            }`}
                                                            placeholder="Ej: Distribuidora del Sur S.A."
                                                        />
                                                        {errors.businessName && (
                                                            <p className="text-danger-500 text-[10px] mt-1 flex items-center gap-1">
                                                                <AlertCircle size={10} /> {errors.businessName}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* CUIT y Código en una fila */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                CUIT
                                                            </label>
                                                            <div className="relative">
                                                                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                                <input
                                                                    type="text"
                                                                    value={formData.cuit}
                                                                    onChange={(e) => handleChange('cuit', e.target.value)}
                                                                    className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                        errors.cuit ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                    }`}
                                                                    placeholder="30-12345678-9"
                                                                />
                                                            </div>
                                                            {errors.cuit && (
                                                                <p className="text-danger-500 text-[10px] mt-1">{errors.cuit}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Código
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.code}
                                                                onChange={(e) => handleChange('code', e.target.value)}
                                                                className={`w-full px-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                    errors.code ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                                placeholder="Código interno"
                                                            />
                                                            {errors.code && (
                                                                <p className="text-danger-500 text-[10px] mt-1">{errors.code}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Descuento y Lista de Precios */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Descuento (%)
                                                            </label>
                                                            <div className="relative">
                                                                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                    value={formData.discount}
                                                                    onChange={(e) => handleChange('discount', e.target.value)}
                                                                    className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                        errors.discount ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                    }`}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            {errors.discount && (
                                                                <p className="text-danger-500 text-[10px] mt-1">{errors.discount}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Lista de Precios
                                                            </label>
                                                            <div className="relative">
                                                                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                                <select
                                                                    value={formData.priceList}
                                                                    onChange={(e) => handleChange('priceList', e.target.value)}
                                                                    className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                                                                >
                                                                    <option value="1">Lista 1</option>
                                                                    <option value="2">Lista 2</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* DATOS DE CONTACTO */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 }}
                                            >
                                                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <User size={14} />
                                                    Persona de Contacto
                                                </h3>
                                                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />

                                                <div className="space-y-4">
                                                    {/* Nombre y Apellido */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Nombre
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.contactFirstName}
                                                                onChange={(e) => handleChange('contactFirstName', e.target.value)}
                                                                className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                placeholder="Nombre del contacto"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Apellido
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.contactLastName}
                                                                onChange={(e) => handleChange('contactLastName', e.target.value)}
                                                                className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                placeholder="Apellido del contacto"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Email */}
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Email
                                                        </label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                            <input
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={(e) => handleChange('email', e.target.value)}
                                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                    errors.email ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                                placeholder="contacto@empresa.com"
                                                            />
                                                        </div>
                                                        {errors.email && (
                                                            <p className="text-danger-500 text-[10px] mt-1">{errors.email}</p>
                                                        )}
                                                    </div>

                                                    {/* Teléfono y WhatsApp */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Teléfono
                                                            </label>
                                                            <div className="relative">
                                                                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                                <input
                                                                    type="text"
                                                                    value={formData.phone}
                                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                                    className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                    placeholder="Teléfono fijo"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                WhatsApp
                                                            </label>
                                                            <div className="relative">
                                                                <MessageCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                                <input
                                                                    type="text"
                                                                    value={formData.whatsapp}
                                                                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                                                                    className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                    placeholder="WhatsApp"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* COLUMNA DERECHA: Dirección + Transporte + Vendedor */}
                                        <div className="space-y-6">
                                            {/* DIRECCIÓN FISCAL */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                            >
                                                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <MapPin size={14} />
                                                    Dirección Fiscal
                                                </h3>
                                                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />

                                                <div className="space-y-4">
                                                    {/* Calle */}
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Domicilio
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.address.street}
                                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                                            className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                            placeholder="Calle y número"
                                                        />
                                                    </div>

                                                    {/* Ciudad y Provincia */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Localidad
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.address.city}
                                                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                                                className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                placeholder="Ciudad"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Provincia
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.address.province}
                                                                onChange={(e) => handleAddressChange('province', e.target.value)}
                                                                className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                placeholder="Provincia"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Código Postal */}
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Código Postal
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.address.postalCode}
                                                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                                            className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                            placeholder="CP"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* TRANSPORTE */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                                className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                            >
                                                <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Truck size={14} />
                                                    Transporte
                                                </h3>

                                                <div className="space-y-4">
                                                    {/* Empresa y Teléfono */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">
                                                                Empresa
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.shipping.company}
                                                                onChange={(e) => handleShippingChange('company', e.target.value)}
                                                                className="w-full px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                placeholder="Nombre del transporte"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">
                                                                Teléfono
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.shipping.phone}
                                                                onChange={(e) => handleShippingChange('phone', e.target.value)}
                                                                className="w-full px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                                placeholder="Teléfono"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Dirección de Entrega */}
                                                    <div>
                                                        <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">
                                                            Dirección de Entrega
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.shipping.address}
                                                            onChange={(e) => handleShippingChange('address', e.target.value)}
                                                            className="w-full px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                            placeholder="Dirección donde se entregan los pedidos"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* VENDEDOR ASIGNADO */}
                                            {(isAdmin || isSuperadmin) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                                >
                                                    <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <Briefcase size={14} />
                                                        Vendedor Asignado
                                                    </h3>

                                                    <div className="relative">
                                                        <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                        <select
                                                            value={formData.salesRepId}
                                                            onChange={(e) => handleChange('salesRepId', e.target.value)}
                                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                                                        >
                                                            <option value="">Seleccionar vendedor...</option>
                                                            {vendedores.map(seller => (
                                                                <option key={seller._id} value={seller._id}>
                                                                    {seller.firstName} {seller.lastName}
                                                                    {seller._id === user.id ? ' (Yo)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex items-center justify-end gap-3 shrink-0">
                                <Button
                                    variant="secondary"
                                    onClick={handleClose}
                                    className="!px-6 !py-2 !text-sm"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    loading={loading}
                                    className="!px-6 !py-2 !text-sm"
                                >
                                    {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Confirm Close Modal */}
            <ConfirmCloseModal
                isOpen={showConfirmClose}
                onClose={() => setShowConfirmClose(false)}
                onConfirm={handleConfirmClose}
                hasChanges={hasChanges()}
            />
        </>,
        document.body
    );
};

export default ClientDrawer;
