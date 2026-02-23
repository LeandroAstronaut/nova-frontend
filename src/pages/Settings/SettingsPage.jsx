import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
    Building2, 
    Users, 
    CreditCard, 
    Mail, 
    Phone, 
    MapPin, 
    Save,
    Shield,
    Bell,
    Database,
    Package,
    Globe,
    ShoppingCart,
    Grid3X3
} from 'lucide-react';
import Button from '../../components/common/Button';
import { updateContactInfo, updateOrderSettings } from '../../services/companyService';

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
        address: '',
        notificationsEnabled: true,
        autoBackup: true
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
                address: user.company.address || '',
                notificationsEnabled: user.company.notificationsEnabled !== false,
                autoBackup: user.company.autoBackup !== false
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
            
            // Actualizar el contexto del usuario
            await updateUserContext();
            
            addToast('Información de contacto guardada exitosamente', 'success');
        } catch (error) {
            console.error('Error saving contact info:', error);
            addToast('Error al guardar: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Estado para preferencias de visualización

    
    // Estado para configuración de pedidos
    const [orderSettings, setOrderSettings] = useState({
        sellOnlyFullPackages: user?.company?.sellOnlyFullPackages === true,
        publicCatalog: user?.company?.publicCatalog === true,
        showPriceInPublicCatalog: user?.company?.showPriceInPublicCatalog === true,
        allowAnonymousPurchases: user?.company?.allowAnonymousPurchases === true
    });
    const [savingOrderSettings, setSavingOrderSettings] = useState(false);
    
    // Actualizar orderSettings cuando cambie user
    useEffect(() => {
        if (user?.company) {
            setOrderSettings({
                sellOnlyFullPackages: user.company.sellOnlyFullPackages === true,
                publicCatalog: user.company.publicCatalog === true,
                showPriceInPublicCatalog: user.company.showPriceInPublicCatalog === true,
                allowAnonymousPurchases: user.company.allowAnonymousPurchases === true
            });
        }
    }, [user]);
    
    const handleSaveOrderSettings = async () => {
        setSavingOrderSettings(true);
        try {
            await updateOrderSettings(user.company._id, orderSettings);
            
            // Actualizar el contexto del usuario
            await updateUserContext();
            
            addToast('Configuración de pedidos guardada exitosamente', 'success');
        } catch (error) {
            console.error('Error saving order settings:', error);
            addToast('Error al guardar configuración: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setSavingOrderSettings(false);
        }
    };

    // Solo admin puede ver esta página
    if (!isAdmin && !isSuperadmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-(--text-muted) text-center">
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
                <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                    Configuración
                </h1>
                <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                    Gestiona la configuración de tu empresa y preferencias del sistema.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-6">
                    {/* Información de la Empresa (Solo lectura) */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-(--text-primary)">Información Fiscal</h2>
                                    <p className="text-[11px] text-(--text-muted)">Datos de la empresa (solo lectura)</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                        Nombre de la Empresa
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        disabled
                                        className="w-full px-3 py-2.5 bg-(--bg-hover) border border-(--border-color) rounded-lg text-sm text-(--text-muted) cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                        Razón Social
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        disabled
                                        className="w-full px-3 py-2.5 bg-(--bg-hover) border border-(--border-color) rounded-lg text-sm text-(--text-muted) cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                    CUIT
                                </label>
                                <input
                                    type="text"
                                    value={formData.cuit}
                                    disabled
                                    className="w-full px-3 py-2.5 bg-(--bg-hover) border border-(--border-color) rounded-lg text-sm text-(--text-muted) cursor-not-allowed"
                                />
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Para modificar el nombre, razón social o CUIT, contacta al soporte técnico.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-6">
                    {/* Información de Contacto (Editable) */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-(--text-primary)">Información de Contacto</h2>
                                    <p className="text-[11px] text-(--text-muted)">Datos de contacto editables</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                            placeholder="+54 341 1234567"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                        WhatsApp
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                                        <input
                                            type="tel"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                            placeholder="+54 9 341 1234567"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                        placeholder="info@empresa.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                    Dirección
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                        placeholder="Calle 123, Ciudad, Provincia"
                                    />
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSaveContactInfo}
                                isLoading={loading}
                                className="w-full mt-2"
                            >
                                <Save size={18} className="mr-2" />
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>

                    {/* Módulos Activos */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-(--text-primary)">Módulos Activos</h2>
                                    <p className="text-[11px] text-(--text-muted)">Funcionalidades habilitadas</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'orders', label: 'Pedidos/Presupuestos', active: features.orders !== false },
                                    { key: 'receipts', label: 'Recibos', active: features.receipts === true },
                                    { key: 'catalog', label: 'Catálogo', active: features.catalog === true },
                                    { key: 'stock', label: 'Stock', active: features.stock === true },
                                    { key: 'currentAccount', label: 'Ctas. Corrientes', active: features.currentAccount === true },
                                    { key: 'priceLists', label: 'Listas de Precios', active: features.priceLists === true },
                                    { key: 'importador', label: 'Importador', active: features.importador === true },
                                    { key: 'clientUsers', label: 'Usuarios Cliente', active: features.clientUsers === true },
                                    { key: 'productVariants', label: 'Productos Variables', active: features.productVariants === true },
                                ].map((module) => (
                                    <div 
                                        key={module.key}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                                            module.active 
                                                ? 'bg-success-50 dark:bg-success-900/20 text-success-600 border border-success-100 dark:border-success-800' 
                                                : 'bg-(--bg-hover) text-(--text-muted) border border-(--border-color)'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${module.active ? 'bg-success-500' : 'bg-(--text-muted)'}`} />
                                        {module.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Configuración de Pedidos */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-(--text-primary)">Configuración de Pedidos y Catálogo</h2>
                                    <p className="text-[11px] text-(--text-muted)">Reglas para la compra de productos y catálogo público</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Toggle: Solo bultos cerrados */}
                            <div className="p-4 bg-(--bg-hover) rounded-xl border border-(--border-color)">
                                <div class="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-(--text-primary)">Solo bultos cerrados</p>
                                            <p className="text-[11px] text-(--text-muted)">Los clientes solo podrán pedir cantidades en múltiplos del bulto</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOrderSettings(prev => ({ ...prev, sellOnlyFullPackages: !prev.sellOnlyFullPackages }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                                            orderSettings.sellOnlyFullPackages ? 'bg-primary-500' : 'bg-(--border-color)'
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                orderSettings.sellOnlyFullPackages ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-(--border-color) my-4" />

                            {/* Toggle: Catálogo público */}
                            <div className="p-4 bg-(--bg-hover) rounded-xl border border-(--border-color)">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <Globe size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-(--text-primary)">Catálogo público</p>
                                            <p className="text-[11px] text-(--text-muted)">Permite acceder al catálogo sin iniciar sesión</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOrderSettings(prev => ({ ...prev, publicCatalog: !prev.publicCatalog }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                                            orderSettings.publicCatalog ? 'bg-primary-500' : 'bg-(--border-color)'
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                orderSettings.publicCatalog ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Toggle: Mostrar precio en catálogo público (solo si está activado) */}
                            {orderSettings.publicCatalog && (
                                <div className="p-4 bg-(--bg-hover) rounded-xl border border-(--border-color) ml-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                                <Tag size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-(--text-primary)">Mostrar precios en catálogo público</p>
                                                <p className="text-[11px] text-(--text-muted)">Los visitantes verán los precios de los productos</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setOrderSettings(prev => ({ ...prev, showPriceInPublicCatalog: !prev.showPriceInPublicCatalog }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                                                orderSettings.showPriceInPublicCatalog ? 'bg-primary-500' : 'bg-(--border-color)'
                                            }`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                    orderSettings.showPriceInPublicCatalog ? 'translate-x-7' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Toggle: Permitir compras anónimas (solo si está activado) */}
                            {orderSettings.publicCatalog && (
                                <div className="p-4 bg-(--bg-hover) rounded-xl border border-(--border-color) ml-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                                <ShoppingCart size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-(--text-primary)">Permitir compras anónimas</p>
                                                <p className="text-[11px] text-(--text-muted)">Los visitantes pueden hacer pedidos sin registrarse</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setOrderSettings(prev => ({ ...prev, allowAnonymousPurchases: !prev.allowAnonymousPurchases }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                                                orderSettings.allowAnonymousPurchases ? 'bg-primary-500' : 'bg-(--border-color)'
                                            }`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                    orderSettings.allowAnonymousPurchases ? 'translate-x-7' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <Button
                                variant="primary"
                                onClick={handleSaveOrderSettings}
                                isLoading={savingOrderSettings}
                                className="w-full"
                            >
                                <Save size={18} className="mr-2" />
                                Guardar Configuración
                            </Button>
                        </div>
                    </div>

                    {/* Plan y Usuarios */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-(--text-primary)">Plan y Usuarios</h2>
                                    <p className="text-[11px] text-(--text-muted)">Información de suscripción</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-(--bg-hover) rounded-xl p-4 text-center">
                                    <p className="text-[11px] text-(--text-muted) uppercase tracking-wider mb-1">Plan</p>
                                    <p className="text-lg font-black text-(--text-primary)">{user?.company?.plan || 'Básico'}</p>
                                </div>
                                <div className="bg-(--bg-hover) rounded-xl p-4 text-center">
                                    <p className="text-[11px] text-(--text-muted) uppercase tracking-wider mb-1">Usuarios</p>
                                    <p className="text-lg font-black text-(--text-primary)">
                                        {user?.company?.userCount || 1} / {features.maxUsers || 3}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
