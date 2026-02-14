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
    Upload,
    Trash2,
    Image as ImageIcon
} from 'lucide-react';
import Button from '../../components/common/Button';
import { updateContactInfo, uploadCompanyLogo, deleteCompanyLogo } from '../../services/companyService';

const SettingsPage = () => {
    const { user, updateUserContext } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [localLogo, setLocalLogo] = useState(user?.company?.logo || null);
    const [logoRev, setLogoRev] = useState(0);
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

    // Log inicial
    useEffect(() => {
        console.log('SettingsPage - MONTADO - user?.company?.logo:', user?.company?.logo);
    }, []);

    // Actualizar localLogo cuando cambie user.company.logo
    useEffect(() => {
        console.log('SettingsPage - user?.company?.logo cambió:', user?.company?.logo);
        setLocalLogo(user?.company?.logo || null);
        setLogoRev(prev => prev + 1);
    }, [user?.company?.logo]);

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

    const fileInputRef = React.useRef(null);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Resetear el input para permitir volver a seleccionar el mismo archivo
        e.target.value = '';

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            addToast('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }

        // Validar tamaño (1MB máximo)
        if (file.size > 1 * 1024 * 1024) {
            addToast('La imagen no debe superar los 1MB', 'error');
            return;
        }

        setUploadingLogo(true);
        try {
            const result = await uploadCompanyLogo(user.company._id, file);
            
            // Actualizar estado local inmediatamente para ver el cambio sin esperar
            if (result.logo) {
                setLocalLogo(result.logo);
                setLogoRev(prev => prev + 1);
            }
            
            // Actualizar el contexto del usuario
            await updateUserContext();
            
            addToast('Logo actualizado exitosamente', 'success');
        } catch (error) {
            console.error('Error uploading logo:', error);
            addToast('Error al subir el logo: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleDeleteLogo = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar el logo?')) return;

        setUploadingLogo(true);
        try {
            await deleteCompanyLogo(user.company._id);
            
            // Actualizar estado local inmediatamente
            setLocalLogo(null);
            
            // Actualizar el contexto del usuario
            await updateUserContext();
            
            addToast('Logo eliminado exitosamente', 'success');
        } catch (error) {
            console.error('Error deleting logo:', error);
            addToast('Error al eliminar el logo: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setUploadingLogo(false);
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
                    {/* Logo de la Empresa */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                    <ImageIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-(--text-primary)">Logo de la Empresa</h2>
                                    <p className="text-[11px] text-(--text-muted)">Imagen que se muestra en el sidebar</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="flex flex-col items-center">
                                {/* Vista previa del logo */}
                                <div className="w-32 h-32 rounded-2xl bg-(--bg-hover) border-2 border-dashed border-(--border-color) flex items-center justify-center mb-4 overflow-hidden">
                                    {localLogo ? (
                                        <img 
                                            key={`${localLogo}-${logoRev}`}
                                            src={localLogo} 
                                            alt="Logo de la empresa" 
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <Building2 size={48} className="text-(--text-muted)" />
                                    )}
                                </div>

                                {/* Botones de acción */}
                                <div className="flex gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        disabled={uploadingLogo}
                                    />
                                    <Button
                                        variant="secondary"
                                        className="text-sm"
                                        isLoading={uploadingLogo}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload size={16} className="mr-2" />
                                        {user?.company?.logo ? 'Cambiar Logo' : 'Subir Logo'}
                                    </Button>

                                    {user?.company?.logo && (
                                        <Button
                                            variant="secondary"
                                            onClick={handleDeleteLogo}
                                            className="text-sm text-danger-600 hover:text-danger-700"
                                            isLoading={uploadingLogo}
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Eliminar
                                        </Button>
                                    )}
                                </div>

                                <p className="text-[11px] text-(--text-muted) mt-3 text-center">
                                    Formatos permitidos: JPG, PNG, GIF, WEBP<br/>
                                    Tamaño máximo: 1MB
                                </p>
                            </div>
                        </div>
                    </div>

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
