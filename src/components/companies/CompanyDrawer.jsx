import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Building2,
    Mail,
    Users,
    Check,
    Power,
    DollarSign,
    Tag,
    Upload,
    Trash2,
    ShoppingCart,
    Package,
    Receipt,
    Landmark,
    FileText,
    Percent,
    Grid3X3,
    CreditCard,
    Hash,
    FileUp,
    Settings,
    FileSpreadsheet
} from 'lucide-react';
import Button from '../common/Button';
import { uploadCompanyLogo, deleteCompanyLogo, updateDisplayPreferences, updateOrderSettings, updateImportConfig } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';

// ============================================================================
// COMPONENTE: ToggleSwitch
// ============================================================================
const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            checked ? 'bg-primary-500' : 'bg-[var(--border-color)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <motion.div
            initial={false}
            animate={{ x: checked ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
    </button>
);

// ============================================================================
// COMPONENTE: FeatureCheckbox
// ============================================================================
const FeatureCheckbox = ({ label, icon: Icon, checked, onChange }) => (
    <label
        className={`
            flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
            ${checked 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]'}
        `}
    >
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="hidden"
        />
        <Icon size={18} className={checked ? 'text-primary-600' : 'text-[var(--text-muted)]'} />
        <span className={`text-[13px] ${checked ? 'font-semibold text-primary-700' : 'text-[var(--text-secondary)]'}`}>
            {label}
        </span>
        {checked && <Check size={14} className="text-primary-600 ml-auto" />}
    </label>
);

// ============================================================================
// COMPONENTE PRINCIPAL: CompanyDrawer
// ============================================================================
const CompanyDrawer = ({ 
    isOpen, 
    onClose, 
    onSave, 
    onToggleStatus,
    company = null
}) => {
    const { addToast: showToast } = useToast();
    const isEditing = !!company;
    
    const fileInputRef = useRef(null);
    const [localLogo, setLocalLogo] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        slug: '',
        plan: 'basico',
        active: true,
        features: {
            catalog: false,
            importer: false,
            stock: false,
            priceLists: false,
            receipts: false,
            currentAccount: false,
            orders: true,
            clientUsers: false,
            commissionCalculation: false,
            productVariants: false,
            maxUsers: 3
        },
        showPricesWithTax: false,
        inputPricesWithTax: false,
        excludeOfferProductsFromGlobalDiscount: false,
        importConfig: {
            format: 'standard',
            winmak: {
                delimiter: ';',
                defaultTaxRate: 21,
                encoding: 'utf8'
            },
            columnMapping: {},
            options: {
                autoCreateCategories: true
            }
        }
    });

    // Inicializar formulario
    useEffect(() => {
        if (!isOpen) return;
        
        const defaultImportConfig = {
            format: 'standard',
            winmak: {
                delimiter: ';',
                defaultTaxRate: 21,
                encoding: 'utf8'
            },
            columnMapping: {},
            options: {
                autoCreateCategories: true
            }
        };
        
        if (company) {
            setFormData({
                name: company.name || '',
                email: company.email || '',
                slug: company.slug || '',
                plan: company.plan || 'basico',
                active: company.active !== false,
                features: { 
                    catalog: false,
                    importer: false,
                    stock: false,
                    priceLists: false,
                    receipts: false,
                    currentAccount: false,
                    orders: true,
                    clientUsers: false,
                    commissionCalculation: false,
                    productVariants: false,
                    maxUsers: 3,
                    ...company.features 
                },
                showPricesWithTax: company.showPricesWithTax || false,
                inputPricesWithTax: company.inputPricesWithTax || false,
                excludeOfferProductsFromGlobalDiscount: company.excludeOfferProductsFromGlobalDiscount || false,
                importConfig: {
                    ...defaultImportConfig,
                    ...company.importConfig,
                    winmak: {
                        ...defaultImportConfig.winmak,
                        ...(company.importConfig?.winmak || {})
                    },
                    options: {
                        ...defaultImportConfig.options,
                        ...(company.importConfig?.options || {})
                    }
                }
            });
            setLocalLogo(company.logo || null);
        } else {
            setFormData({
                name: '',
                email: '',
                slug: '',
                plan: 'basico',
                active: true,
                features: {
                    catalog: false,
                    importer: false,
                    stock: false,
                    priceLists: false,
                    receipts: false,
                    currentAccount: false,
                    orders: true,
                    clientUsers: false,
                    commissionCalculation: false,
                    productVariants: false,
                    maxUsers: 3
                },
                showPricesWithTax: false,
                inputPricesWithTax: false,
                excludeOfferProductsFromGlobalDiscount: false,
                importConfig: defaultImportConfig
            });
            setLocalLogo(null);
        }
    }, [isOpen, company]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('features.')) {
            const featureName = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                features: { ...prev.features, [featureName]: type === 'checkbox' ? checked : value }
            }));
        } else if (name === 'showPricesWithTax' || name === 'inputPricesWithTax' || name === 'excludeOfferProductsFromGlobalDiscount') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleFeatureChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            features: { ...prev.features, [key]: value }
        }));
    };

    const handleImportConfigChange = (path, value) => {
        setFormData(prev => {
            const keys = path.split('.');
            const newConfig = { ...prev.importConfig };
            let current = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return { ...prev, importConfig: newConfig };
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            if (isEditing) {
                await onSave(company._id, formData);
                // También actualizar preferencias de visualización
                await updateDisplayPreferences(company._id, {
                    showPricesWithTax: formData.showPricesWithTax,
                    inputPricesWithTax: formData.inputPricesWithTax
                });
                // Actualizar configuración de pedidos
                await updateOrderSettings(company._id, {
                    excludeOfferProductsFromGlobalDiscount: formData.excludeOfferProductsFromGlobalDiscount
                });
                // Actualizar configuración de importación si tiene el feature habilitado
                if (formData.features.importer) {
                    await updateImportConfig(company._id, formData.importConfig);
                }
            } else {
                await onSave(formData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving company:', error);
        }
    };

    const handleLogoUpload = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!isEditing || !company) return;
        
        const file = e.target.files[0];
        if (!file) return;
        
        setTimeout(() => {
            if (e.target) e.target.value = '';
        }, 100);

        if (!file.type.startsWith('image/')) {
            showToast('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }

        if (file.size > 1 * 1024 * 1024) {
            showToast('La imagen no debe superar los 1MB', 'error');
            return;
        }

        setUploadingLogo(true);
        try {
            const result = await uploadCompanyLogo(company._id, file);
            if (result.logo) {
                setLocalLogo(result.logo);
                showToast('Logo actualizado exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            showToast('Error al subir el logo', 'error');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleDeleteLogo = async () => {
        if (!isEditing || !company) return;
        if (!window.confirm('¿Estás seguro de que deseas eliminar el logo?')) return;

        setUploadingLogo(true);
        try {
            await deleteCompanyLogo(company._id);
            setLocalLogo(null);
            showToast('Logo eliminado exitosamente', 'success');
        } catch (error) {
            console.error('Error deleting logo:', error);
            showToast('Error al eliminar el logo', 'error');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!isEditing || !company || !onToggleStatus) return;
        try {
            await onToggleStatus(company._id);
            setFormData(prev => ({ ...prev, active: !prev.active }));
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const planOptions = [
        { key: 'basico', label: 'Básico', color: 'secondary' },
        { key: 'estandar', label: 'Estándar', color: 'primary' },
        { key: 'premium', label: 'Premium', color: 'warning' }
    ];

    const featureOptions = [
        { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
        { key: 'catalog', label: 'Catálogo', icon: Package },
        { key: 'receipts', label: 'Recibos', icon: Receipt },
        { key: 'currentAccount', label: 'Ctas. Corrientes', icon: Landmark },
        { key: 'stock', label: 'Stock', icon: Building2 },
        { key: 'priceLists', label: 'Listas de Precio', icon: FileText },
        { key: 'clientUsers', label: 'Usuarios Cliente', icon: Users },
        { key: 'importer', label: 'Importador', icon: Upload },
        { key: 'commissionCalculation', label: 'Cálculo de Comisiones', icon: Percent },
        { key: 'productVariants', label: 'Productos Variables', icon: Grid3X3 }
    ];

    return createPortal(
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
                        onClick={onClose}
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
                                        {isEditing ? 'Editar Compañía' : 'Nueva Compañía'}
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        {isEditing ? 'Modifique los datos de la compañía' : 'Complete los datos de la nueva compañía'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* ============================================
                                    FILA 1: DOS COLUMNAS
                                    ============================================ */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    
                                    {/* COLUMNA IZQUIERDA: Información Básica */}
                                    <div className="space-y-6">
                                        
                                        {/* INFORMACIÓN BÁSICA */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Building2 size={14} />
                                                Información Básica
                                            </h3>
                                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                            
                                            <div className="space-y-4">
                                                {/* Nombre */}
                                                <div>
                                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                        Nombre <span className="text-danger-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleInputChange}
                                                            placeholder="Nombre de la compañía"
                                                            required
                                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                        Email <span className="text-danger-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            placeholder="empresa@ejemplo.com"
                                                            required
                                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Slug */}
                                                <div>
                                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                        Slug <span className="text-danger-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                        <input
                                                            type="text"
                                                            name="slug"
                                                            value={formData.slug}
                                                            onChange={handleInputChange}
                                                            placeholder="nombre-compania"
                                                            required
                                                            disabled={isEditing}
                                                            className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                isEditing ? 'opacity-60 cursor-not-allowed' : 'border-[var(--border-color)]'
                                                            }`}
                                                        />
                                                    </div>
                                                    {isEditing && (
                                                        <p className="text-[10px] text-[var(--text-muted)] mt-1">El slug no se puede modificar</p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* PLAN */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 }}
                                            className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                        >
                                            <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <CreditCard size={14} /> Plan
                                            </h3>
                                            
                                            <div className="grid grid-cols-3 gap-2">
                                                {planOptions.map(({ key, label, color }) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, plan: key }))}
                                                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all ${
                                                            formData.plan === key
                                                                ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                                                                : 'border-[var(--border-color)] hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                                        }`}
                                                    >
                                                        <span className={`text-[11px] font-bold text-center leading-tight ${formData.plan === key ? `text-${color}-600` : 'text-[var(--text-secondary)]'}`}>
                                                            {label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* MÁXIMO DE USUARIOS */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Users size={14} />
                                                Límite de Usuarios
                                            </h3>
                                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                            
                                            <div className="relative">
                                                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                <input
                                                    type="number"
                                                    name="features.maxUsers"
                                                    value={formData.features.maxUsers}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    max="100"
                                                    className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* LOGO - Solo en edición */}
                                        {isEditing && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                                className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                            >
                                                <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Building2 size={14} /> Logo de la Empresa
                                                </h3>
                                                
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-xl bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center mb-3 overflow-hidden">
                                                        {localLogo ? (
                                                            <img 
                                                                src={localLogo} 
                                                                alt="Logo" 
                                                                className="w-full h-full object-contain p-2"
                                                            />
                                                        ) : (
                                                            <Building2 size={32} className="text-[var(--text-muted)]" />
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoUpload}
                                                            className="hidden"
                                                            disabled={uploadingLogo}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            className="!px-3 !py-1.5 !text-xs"
                                                            isLoading={uploadingLogo}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                fileInputRef.current?.click();
                                                            }}
                                                        >
                                                            <Upload size={14} className="mr-1.5" />
                                                            {localLogo ? 'Cambiar' : 'Subir'}
                                                        </Button>

                                                        {localLogo && (
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                onClick={handleDeleteLogo}
                                                                className="!px-3 !py-1.5 !text-xs text-danger-600 hover:text-danger-700"
                                                                isLoading={uploadingLogo}
                                                            >
                                                                <Trash2 size={14} className="mr-1.5" />
                                                                Eliminar
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
                                                        Formatos: JPG, PNG, WEBP • Máximo 1MB
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* COLUMNA DERECHA: Módulos y Configuración */}
                                    <div className="space-y-6">
                                        
                                        {/* MÓDULOS HABILITADOS */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Grid3X3 size={14} />
                                                Módulos Habilitados
                                            </h3>
                                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                {featureOptions.map(({ key, label, icon }) => (
                                                    <FeatureCheckbox
                                                        key={key}
                                                        label={label}
                                                        icon={icon}
                                                        checked={formData.features[key]}
                                                        onChange={(checked) => handleFeatureChange(key, checked)}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* PREFERENCIAS DE VISUALIZACIÓN - Solo en edición */}
                                        {isEditing && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                                className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                            >
                                                <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <DollarSign size={14} /> Preferencias de Visualización
                                                </h3>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600">
                                                                <DollarSign size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Mostrar precios con IVA</p>
                                                                <p className="text-[10px] text-[var(--text-muted)]">En productos y pedidos</p>
                                                            </div>
                                                        </div>
                                                        <ToggleSwitch 
                                                            checked={formData.showPricesWithTax}
                                                            onChange={(checked) => setFormData(prev => ({ ...prev, showPricesWithTax: checked }))}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                                                <DollarSign size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Cargar precios con IVA</p>
                                                                <p className="text-[10px] text-[var(--text-muted)]">En alta/edición de productos</p>
                                                            </div>
                                                        </div>
                                                        <ToggleSwitch 
                                                            checked={formData.inputPricesWithTax}
                                                            onChange={(checked) => setFormData(prev => ({ ...prev, inputPricesWithTax: checked }))}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* CONFIGURACIÓN DE PEDIDOS - Solo en edición */}
                                        {isEditing && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                            >
                                                <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Tag size={14} /> Configuración de Pedidos
                                                </h3>
                                                
                                                <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600">
                                                            <Tag size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-semibold text-[var(--text-primary)]">Proteger precios de oferta</p>
                                                            <p className="text-[10px] text-[var(--text-muted)]">No aplican descuento global</p>
                                                        </div>
                                                    </div>
                                                    <ToggleSwitch 
                                                        checked={formData.excludeOfferProductsFromGlobalDiscount}
                                                        onChange={(checked) => setFormData(prev => ({ ...prev, excludeOfferProductsFromGlobalDiscount: checked }))}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* CONFIGURACIÓN DE IMPORTACIÓN - Solo si tiene importer habilitado */}
                                        {formData.features.importer && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                                className="bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800 p-5"
                                            >
                                                <h3 className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <FileUp size={14} /> Configuración de Importación
                                                </h3>
                                                
                                                {/* Selector de formato */}
                                                <div className="mb-4">
                                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                                                        Formato de archivo
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImportConfigChange('format', 'standard')}
                                                            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition-all ${
                                                                formData.importConfig?.format === 'standard'
                                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                                    : 'border-[var(--border-color)] hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                                            }`}
                                                        >
                                                            <FileSpreadsheet size={20} className={formData.importConfig?.format === 'standard' ? 'text-amber-600' : 'text-[var(--text-muted)]'} />
                                                            <span className={`text-[11px] font-bold text-center ${formData.importConfig?.format === 'standard' ? 'text-amber-700' : 'text-[var(--text-secondary)]'}`}>
                                                                Estándar
                                                            </span>
                                                            <span className="text-[9px] text-[var(--text-muted)] text-center">Mapeo manual de columnas</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImportConfigChange('format', 'winmak')}
                                                            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition-all ${
                                                                formData.importConfig?.format === 'winmak'
                                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                                    : 'border-[var(--border-color)] hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                                            }`}
                                                        >
                                                            <Settings size={20} className={formData.importConfig?.format === 'winmak' ? 'text-amber-600' : 'text-[var(--text-muted)]'} />
                                                            <span className={`text-[11px] font-bold text-center ${formData.importConfig?.format === 'winmak' ? 'text-amber-700' : 'text-[var(--text-secondary)]'}`}>
                                                                Winmak
                                                            </span>
                                                            <span className="text-[9px] text-[var(--text-muted)] text-center">Formato específico con rubros</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Configuración específica Winmak */}
                                                {formData.importConfig?.format === 'winmak' && (
                                                    <div className="space-y-3 border-t border-amber-200 dark:border-amber-800 pt-4">
                                                        <p className="text-[11px] text-[var(--text-muted)] mb-3">
                                                            Configuración para archivos Winmak (ej: Lajara)
                                                        </p>
                                                        
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                    Delimitador
                                                                </label>
                                                                <select
                                                                    value={formData.importConfig?.winmak?.delimiter || ';'}
                                                                    onChange={(e) => handleImportConfigChange('winmak.delimiter', e.target.value)}
                                                                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors"
                                                                >
                                                                    <option value=";">Punto y coma (;)</option>
                                                                    <option value=",">Coma (,)</option>
                                                                    <option value="\t">Tabulación</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                    IVA por defecto (%)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={formData.importConfig?.winmak?.defaultTaxRate || 21}
                                                                    onChange={(e) => handleImportConfigChange('winmak.defaultTaxRate', parseFloat(e.target.value) || 0)}
                                                                    min="0"
                                                                    max="100"
                                                                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                            <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-2">Columnas detectadas automáticamente:</p>
                                                            <div className="text-[10px] text-[var(--text-muted)] space-y-1">
                                                                <div className="flex justify-between"><span>Código:</span> <span className="font-mono text-amber-600">Codigo de Articulo</span></div>
                                                                <div className="flex justify-between"><span>Nombre:</span> <span className="font-mono text-amber-600">Descripcion</span></div>
                                                                <div className="flex justify-between"><span>Rubro:</span> <span className="font-mono text-amber-600">Codigo Rubro → Descripcion Rubro</span></div>
                                                                <div className="flex justify-between"><span>Subrubro:</span> <span className="font-mono text-amber-600">Codigo SubRubro → Descripcion Subrubro</span></div>
                                                                <div className="flex justify-between"><span>Stock:</span> <span className="font-mono text-amber-600">Stock 1</span></div>
                                                                <div className="flex justify-between"><span>Precio L1:</span> <span className="font-mono text-amber-600">Precio 1</span></div>
                                                                <div className="flex justify-between"><span>Precio L2:</span> <span className="font-mono text-amber-600">Precio 2</span></div>
                                                                <div className="flex justify-between"><span>Barra:</span> <span className="font-mono text-amber-600">Barra</span></div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                                                <strong>Nota:</strong> El tratamiento de IVA (precios con o sin IVA) se toma de la configuración general de la compañía "Cargar precios con IVA".
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Configuración formato Standard */}
                                                {formData.importConfig?.format === 'standard' && (
                                                    <div className="space-y-3 border-t border-amber-200 dark:border-amber-800 pt-4">
                                                        <p className="text-[11px] text-[var(--text-muted)]">
                                                            En el modo Estándar, el mapeo de columnas se configurará durante la primera importación.
                                                        </p>
                                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                                                <strong>Nota:</strong> El mapeo se hará automáticamente al importar el primer archivo. Se detectarán las columnas y se asignarán a los campos de NOVA.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* ESTADO - Solo en edición */}
                                        {isEditing && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                            >
                                                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Power size={14} />
                                                    Estado de la Compañía
                                                </h3>
                                                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                                
                                                <div className="flex items-center justify-between p-4 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.active ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'}`}>
                                                            <Power size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                                {formData.active ? 'Compañía Activa' : 'Compañía Inactiva'}
                                                            </p>
                                                            <p className="text-[11px] text-[var(--text-muted)]">
                                                                {formData.active 
                                                                    ? 'Los usuarios pueden iniciar sesión' 
                                                                    : 'Los usuarios no pueden iniciar sesión'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleToggleStatus}
                                                        className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                                            formData.active 
                                                                ? 'bg-danger-100 text-danger-600 hover:bg-danger-200' 
                                                                : 'bg-success-100 text-success-600 hover:bg-success-200'
                                                        }`}
                                                    >
                                                        {formData.active ? 'Desactivar' : 'Activar'}
                                                    </button>
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
                                onClick={onClose}
                                className="!px-6 !py-2 !text-sm"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                className="!px-6 !py-2 !text-sm"
                            >
                                {isEditing ? 'Guardar Cambios' : 'Crear Compañía'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default CompanyDrawer;
