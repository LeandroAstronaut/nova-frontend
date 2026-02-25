import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { motion } from 'framer-motion';
import { 
    Building2, 
    Phone, 
    Mail, 
    MapPin, 
    Save,
    Shield,
    Database,
    Package,
    Globe,
    Tag,
    Info,
    MessageCircle,
    Hash,
    CreditCard,
    Headphones,
    Eye,
    EyeOff
} from 'lucide-react';
import Button from '../../components/common/Button';
import SupportDrawer from '../../components/common/SupportDrawer';
import { updateContactInfo, updateOrderSettings, updateCatalogSettings } from '../../services/companyService';

const SettingsPage = () => {
    const { user, updateUserContext } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        businessName: '',
        cuit: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: ''
    });

    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';

    useEffect(() => {
        if (user?.company) {
            setFormData({
                companyName: user.company.name || '',
                businessName: user.company.businessName || '',
                cuit: user.company.cuit || '',
                phone: user.company.phone || '',
                whatsapp: user.company.whatsapp || '',
                email: user.company.email || '',
                address: user.company.address || ''
            });
        }
    }, [user]);

    const handleSaveContactInfo = async () => {
        setLoading(true);
        try {
            await updateContactInfo(user.company._id, {
                phone: formData.phone,
                whatsapp: formData.whatsapp,
                email: formData.email,
                address: formData.address
            });
            
            await updateUserContext();
            
            addToast('Información de contacto guardada exitosamente', 'success');
        } catch (error) {
            console.error('Error saving contact info:', error);
            addToast('Error al guardar: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Configuración unificada de Pedidos/Catálogo
    const [configSettings, setConfigSettings] = useState({
        // Pedidos
        sellOnlyFullPackages: user?.company?.sellOnlyFullPackages === true,
        // Catálogo interno (solo si tiene stock)
        showStockToClients: user?.company?.catalogSettings?.showStockToClients === true,
        hideOutOfStockInCatalog: user?.company?.catalogSettings?.hideOutOfStockInCatalog === true,
        // Catálogo público
        publicCatalog: user?.company?.publicCatalog === true,
        publicCatalogShowPrices: user?.company?.publicCatalogSettings?.showPrices === true || user?.company?.showPriceInPublicCatalog === true,
        publicCatalogPriceListId: user?.company?.publicCatalogSettings?.priceListId || null,
        publicCatalogShowStock: user?.company?.publicCatalogSettings?.showStock === true
    });
    const [savingConfig, setSavingConfig] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Cargar configuración inicial
    useEffect(() => {
        if (user?.company) {
            setConfigSettings({
                sellOnlyFullPackages: user.company.sellOnlyFullPackages === true,
                showStockToClients: user.company.catalogSettings?.showStockToClients === true,
                hideOutOfStockInCatalog: user.company.catalogSettings?.hideOutOfStockInCatalog === true,
                publicCatalog: user.company.publicCatalog === true,
                publicCatalogShowPrices: user.company.publicCatalogSettings?.showPrices === true || user.company.showPriceInPublicCatalog === true,
                publicCatalogPriceListId: user.company.publicCatalogSettings?.priceListId || null,
                publicCatalogShowStock: user.company.publicCatalogSettings?.showStock === true
            });
            setHasChanges(false);
        }
    }, [user]);

    // Marcar cambios pendientes
    const updateConfig = (key, value) => {
        setConfigSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    // Guardar configuración unificada
    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            // Guardar configuración de pedidos
            await updateOrderSettings(user.company._id, {
                sellOnlyFullPackages: configSettings.sellOnlyFullPackages
            });

            // Guardar configuración de catálogo (si tiene el módulo)
            if (features.catalog === true) {
                await updateCatalogSettings(user.company._id, {
                    showStockToClients: configSettings.showStockToClients,
                    hideOutOfStockInCatalog: configSettings.hideOutOfStockInCatalog,
                    publicCatalog: configSettings.publicCatalog,
                    publicCatalogSettings: {
                        showPrices: configSettings.publicCatalogShowPrices,
                        priceListId: configSettings.publicCatalogPriceListId,
                        showStock: configSettings.publicCatalogShowStock
                    }
                });
            }
            
            await updateUserContext();
            setHasChanges(false);
            addToast('Configuración guardada exitosamente', 'success');
        } catch (error) {
            console.error('Error saving config:', error);
            addToast('Error al guardar configuración: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setSavingConfig(false);
        }
    };

    const [showSupportDrawer, setShowSupportDrawer] = useState(false);

    if (!isAdmin && !isSuperadmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-[var(--text-muted)] text-center">
                    <Shield size={48} className="mx-auto mb-4 opacity-50" />
                    <h2 className="text-lg font-semibold mb-2">Acceso Restringido</h2>
                    <p className="text-sm">Solo los administradores pueden acceder a la configuración.</p>
                </div>
            </div>
        );
    }

    const features = user?.company?.features || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    Configuración
                </h1>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 font-medium">
                    Gestiona la configuración de tu empresa y preferencias del sistema.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-6">
                    
                    {/* Información Fiscal (Solo lectura) */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-6">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Building2 size={14} />
                                Información Fiscal
                            </h3>
                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Nombre de la Empresa
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="text"
                                                value={formData.companyName}
                                                disabled
                                                className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Razón Social
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="text"
                                                value={formData.businessName}
                                                disabled
                                                className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        CUIT
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={formData.cuit}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowSupportDrawer(true)}
                                    className="w-full bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left"
                                >
                                    <div className="flex items-start gap-2">
                                        <Headphones size={14} className="text-amber-600 mt-0.5" />
                                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                            Para modificar el nombre, razón social o CUIT, <span className="font-semibold underline">contacta al soporte técnico</span>.
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Plan y Usuarios */}
                    <div className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5">
                        <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCard size={14} /> Plan y Usuarios
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--bg-card)] rounded-xl p-4 text-center border border-[var(--border-color)]">
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Plan</p>
                                <p className="text-lg font-black text-[var(--text-primary)]">{user?.company?.plan || 'Básico'}</p>
                            </div>
                            <div className="bg-[var(--bg-card)] rounded-xl p-4 text-center border border-[var(--border-color)]">
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Usuarios</p>
                                <p className="text-lg font-black text-[var(--text-primary)]">
                                    {user?.company?.userCount || 1} / {features.maxUsers || 3}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Módulos Activos */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-6">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Database size={14} />
                                Módulos Activos
                            </h3>
                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                            
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'orders', label: 'Pedidos/Presupuestos', active: features.orders !== false },
                                    { key: 'receipts', label: 'Recibos', active: features.receipts === true },
                                    { key: 'catalog', label: 'Catálogo', active: features.catalog === true },
                                    { key: 'stock', label: 'Stock', active: features.stock === true },
                                    { key: 'currentAccount', label: 'Ctas. Corrientes', active: features.currentAccount === true },
                                    { key: 'priceLists', label: 'Listas de Precios', active: features.priceLists === true },
                                    { key: 'importer', label: 'Importador', active: features.importer === true },
                                    { key: 'clientUsers', label: 'Usuarios Cliente', active: features.clientUsers === true },
                                    { key: 'commissionCalculation', label: 'Cálculo de Comisiones', active: features.commissionCalculation === true },
                                    { key: 'productVariants', label: 'Productos Variables', active: features.productVariants === true },
                                ].map((module) => (
                                    <div 
                                        key={module.key}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium ${
                                            module.active 
                                                ? 'bg-success-50 dark:bg-success-900/20 text-success-600 border border-success-100 dark:border-success-800' 
                                                : 'bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${module.active ? 'bg-success-500' : 'bg-[var(--text-muted)]'}`} />
                                        {module.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-6">
                    
                    {/* Información de Contacto (Editable) */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-6">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Phone size={14} />
                                Información de Contacto
                            </h3>
                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Teléfono
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                placeholder="+54 341 1234567"
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
                                                type="tel"
                                                value={formData.whatsapp}
                                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                                className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                                placeholder="+54 9 341 1234567"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                            placeholder="info@empresa.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Dirección
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50"
                                            placeholder="Calle 123, Ciudad, Provincia"
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={handleSaveContactInfo}
                                    loading={loading}
                                    className="w-full"
                                >
                                    <Save size={16} className="mr-2" />
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Configuración de Pedidos/Catálogo */}
                    <div className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider flex items-center gap-2">
                                <Package size={14} /> Configuración de Pedidos/Catálogo
                            </h3>
                            {hasChanges && (
                                <span className="text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                                    Cambios pendientes
                                </span>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {/* Toggle: Solo bultos cerrados */}
                            <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Solo bultos cerrados</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">Solo cantidades en múltiplos del bulto</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateConfig('sellOnlyFullPackages', !configSettings.sellOnlyFullPackages)}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                        configSettings.sellOnlyFullPackages ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                    }`}
                                >
                                    <motion.div
                                        initial={false}
                                        animate={{ x: configSettings.sellOnlyFullPackages ? 20 : 2 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                    />
                                </button>
                            </div>

                            {/* Opciones de Catálogo - Solo si tiene módulo catalog habilitado */}
                            {features.catalog === true && (
                                <>
                                    <div className="h-px bg-[var(--border-color)] my-4" />
                                    
                                    {/* Opciones de catálogo interno - Solo si tiene stock habilitado */}
                                    {features.stock === true && (
                                        <>
                                            {/* Toggle: Mostrar stock a los clientes */}
                                            <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                                        <Eye size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Mostrar stock a los clientes</p>
                                                        <p className="text-[10px] text-[var(--text-muted)]">En el catálogo interno</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateConfig('showStockToClients', !configSettings.showStockToClients)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                        configSettings.showStockToClients ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                                    }`}
                                                >
                                                    <motion.div
                                                        initial={false}
                                                        animate={{ x: configSettings.showStockToClients ? 20 : 2 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                    />
                                                </button>
                                            </div>

                                            {/* Toggle: Ocultar productos sin stock */}
                                            <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                                        <EyeOff size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Ocultar productos sin stock</p>
                                                        <p className="text-[10px] text-[var(--text-muted)]">En el catálogo interno</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateConfig('hideOutOfStockInCatalog', !configSettings.hideOutOfStockInCatalog)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                        configSettings.hideOutOfStockInCatalog ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                                    }`}
                                                >
                                                    <motion.div
                                                        initial={false}
                                                        animate={{ x: configSettings.hideOutOfStockInCatalog ? 20 : 2 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                    />
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* Toggle: Catálogo público */}
                                    <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                <Globe size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Catálogo público</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">Acceso sin iniciar sesión</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateConfig('publicCatalog', !configSettings.publicCatalog)}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                configSettings.publicCatalog ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                            }`}
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ x: configSettings.publicCatalog ? 20 : 2 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                            />
                                        </button>
                                    </div>

                                    {/* Sub-toggles del catálogo público */}
                                    {configSettings.publicCatalog && (
                                        <div className="space-y-3 ml-4">
                                            {/* Toggle: Mostrar precios */}
                                            <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                                        <Tag size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Mostrar precios</p>
                                                        <p className="text-[10px] text-[var(--text-muted)]">En catálogo público</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateConfig('publicCatalogShowPrices', !configSettings.publicCatalogShowPrices)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                        configSettings.publicCatalogShowPrices ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                                    }`}
                                                >
                                                    <motion.div
                                                        initial={false}
                                                        animate={{ x: configSettings.publicCatalogShowPrices ? 20 : 2 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                    />
                                                </button>
                                            </div>

                                            {/* Selector de lista de precios - Solo si tiene habilitadas las listas y mostrar precios */}
                                            {features.priceLists === true && configSettings.publicCatalogShowPrices && (
                                                <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                                            <Tag size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-semibold text-[var(--text-primary)]">Lista de precios a mostrar</p>
                                                            <p className="text-[10px] text-[var(--text-muted)]">En catálogo público</p>
                                                        </div>
                                                    </div>
                                                    <select
                                                        value={configSettings.publicCatalogPriceListId ?? ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            updateConfig('publicCatalogPriceListId', value ? parseInt(value, 10) : null);
                                                        }}
                                                        className="w-full mt-2 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                                                    >
                                                        <option value="">Lista base</option>
                                                        <option value="1">Lista 1</option>
                                                        <option value="2">Lista 2</option>
                                                    </select>
                                                </div>
                                            )}

                                            {/* Toggle: Mostrar stock */}
                                            <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600">
                                                        <Package size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Mostrar stock</p>
                                                        <p className="text-[10px] text-[var(--text-muted)]">En catálogo público</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateConfig('publicCatalogShowStock', !configSettings.publicCatalogShowStock)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                        configSettings.publicCatalogShowStock ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                                    }`}
                                                >
                                                    <motion.div
                                                        initial={false}
                                                        animate={{ x: configSettings.publicCatalogShowStock ? 20 : 2 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            <Button
                                variant="primary"
                                onClick={handleSaveConfig}
                                loading={savingConfig}
                                disabled={!hasChanges}
                                className="w-full"
                            >
                                <Save size={16} className="mr-2" />
                                {hasChanges ? 'Guardar Configuración' : 'Sin cambios'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Drawer */}
            <SupportDrawer 
                isOpen={showSupportDrawer} 
                onClose={() => setShowSupportDrawer(false)} 
                user={user} 
            />
        </div>
    );
};

export default SettingsPage;
