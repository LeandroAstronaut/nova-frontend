import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { changePassword } from '../../services/userService';
import { 
    User, 
    Mail, 
    Phone, 
    Shield, 
    Briefcase, 
    Building2,
    Lock,
    Save,
    Calendar,
    Clock,
    Edit2,
    CheckCircle2,
    AlertCircle,
    MessageCircle,
    Percent,
    Tag,
    Info
} from 'lucide-react';
import Button from '../../components/common/Button';

const RoleBadge = ({ roleName }) => {
    const configs = {
        'admin': {
            icon: Shield,
            label: 'Administrador',
            styles: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
        },
        'vendedor': {
            icon: Briefcase,
            label: 'Vendedor',
            styles: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
        },
        'cliente': {
            icon: Building2,
            label: 'Usuario de Cliente',
            styles: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800'
        }
    };

    const config = configs[roleName] || configs['vendedor'];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${config.styles}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

const ProfilePage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    // Datos del usuario
    const userData = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        whatsapp: user?.whatsapp || '',
        role: user?.role?.name || '',
        company: user?.company?.name || '',
        client: user?.client?.businessName || '',
        birthDate: user?.birthDate ? new Date(user.birthDate).toLocaleDateString('es-AR') : 'No especificada',
        createdAt: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR') : '',
        lastLogin: user?.lastLogin ? new Date(user.lastLogin).toLocaleString('es-AR') : 'Nunca',
        commission: user?.commission || 0,
        canViewCommission: user?.canViewCommission ?? true,
        canEditProductDiscount: user?.canEditProductDiscount ?? true,
        canEditBudgetDiscount: user?.canEditBudgetDiscount ?? true
    };

    const isVendedor = userData.role === 'vendedor';
    const isCliente = userData.role === 'cliente';
    const isAdmin = userData.role === 'admin';

    const handlePasswordChange = async () => {
        const newErrors = {};
        
        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'La contraseña actual es requerida';
        }
        if (!passwordData.newPassword) {
            newErrors.newPassword = 'La nueva contraseña es requerida';
        } else if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            
            addToast('Contraseña actualizada exitosamente', 'success');
            setShowPasswordForm(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setErrors({});
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMsg = error.response?.data?.message || 'Error al cambiar la contraseña';
            addToast(errorMsg, 'error');
            
            if (error.response?.status === 401) {
                setErrors({ currentPassword: 'La contraseña actual es incorrecta' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    Mi Perfil
                </h1>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 font-medium">
                    Gestiona tu información personal y seguridad de la cuenta.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMNA IZQUIERDA - Información Personal */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Card Principal con Avatar */}
                    <div className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm ${
                                userData.role === 'admin' 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                                    : userData.role === 'cliente'
                                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                            }`}>
                                {userData.firstName[0]}{userData.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">
                                    {userData.firstName} {userData.lastName}
                                </h2>
                                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 truncate">{userData.email}</p>
                                <div className="mt-2">
                                    <RoleBadge roleName={userData.role} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información Personal */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-6">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <User size={14} />
                                Información Personal
                            </h3>
                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Nombre
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={userData.firstName}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Apellido
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={userData.lastName}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                    <input
                                        type="email"
                                        value={userData.email}
                                        disabled
                                        className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                    Fecha de Nacimiento
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                    <input
                                        type="text"
                                        value={userData.birthDate}
                                        disabled
                                        className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-6">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Phone size={14} />
                                Contacto
                            </h3>
                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={userData.phone || 'No especificado'}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
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
                                            value={userData.whatsapp || 'No especificado'}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información de la Cuenta */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-6">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Shield size={14} />
                                Información de la Cuenta
                            </h3>
                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Rol
                                    </label>
                                    <div className="relative">
                                        <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={isAdmin ? 'Administrador' : isVendedor ? 'Vendedor' : 'Usuario de Cliente'}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                
                                {userData.company && (
                                    <div>
                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Empresa
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="text"
                                                value={userData.company}
                                                disabled
                                                className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isCliente && userData.client && (
                                <div className="mt-4">
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Cliente Asignado
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={userData.client}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            )}

                            {isVendedor && (
                                <div className="mt-4">
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Comisión (%)
                                    </label>
                                    <div className="relative">
                                        <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={`${userData.commission}%`}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Miembro desde
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={userData.createdAt}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                        Último acceso
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                        <input
                                            type="text"
                                            value={userData.lastLogin}
                                            disabled
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA - Seguridad */}
                <div className="space-y-6">
                    
                    {/* Cambiar Contraseña */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-6">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Lock size={14} />
                                Seguridad
                            </h3>
                            <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                            
                            {!showPasswordForm ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center">
                                        <Lock size={28} className="text-[var(--text-muted)]" />
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] mb-5">
                                        Es recomendable cambiar tu contraseña periódicamente para mantener tu cuenta segura.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowPasswordForm(true)}
                                        className="w-full"
                                    >
                                        <Edit2 size={16} className="mr-2" />
                                        Cambiar Contraseña
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                            setErrors({});
                                        }}
                                        className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                                    >
                                        ← Volver
                                    </button>

                                    <div>
                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Contraseña Actual
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                    errors.currentPassword ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        {errors.currentPassword && (
                                            <p className="text-danger-500 text-[10px] mt-1 flex items-center gap-1">
                                                <AlertCircle size={10} /> {errors.currentPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Nueva Contraseña
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                    errors.newPassword ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                        </div>
                                        {errors.newPassword && (
                                            <p className="text-danger-500 text-[10px] mt-1">{errors.newPassword}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Confirmar Nueva Contraseña
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                    errors.confirmPassword ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="Repite la nueva contraseña"
                                            />
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-danger-500 text-[10px] mt-1">{errors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <Button
                                        variant="primary"
                                        onClick={handlePasswordChange}
                                        loading={loading}
                                        className="w-full mt-2"
                                    >
                                        <Save size={16} className="mr-2" />
                                        Guardar Contraseña
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Permisos (solo si aplica) */}
                    {isVendedor && (
                        <div className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5">
                            <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Shield size={14} /> Mis Permisos
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Percent size={14} className="text-[var(--text-muted)]" />
                                        <span className="text-[13px] text-[var(--text-primary)]">Ver comisiones</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${userData.canViewCommission ? 'bg-success-500' : 'bg-danger-500'}`} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Tag size={14} className="text-[var(--text-muted)]" />
                                        <span className="text-[13px] text-[var(--text-primary)]">Editar descuentos</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${userData.canEditProductDiscount ? 'bg-success-500' : 'bg-danger-500'}`} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Percent size={14} className="text-[var(--text-muted)]" />
                                        <span className="text-[13px] text-[var(--text-primary)]">Descuento global</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${userData.canEditBudgetDiscount ? 'bg-success-500' : 'bg-danger-500'}`} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tips de seguridad */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                        <h4 className="text-[11px] font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                            <Info size={14} />
                            Consejos de Seguridad
                        </h4>
                        <ul className="text-[11px] text-amber-700 dark:text-amber-300 space-y-1.5">
                            <li>• Usa al menos 8 caracteres</li>
                            <li>• Combina letras, números y símbolos</li>
                            <li>• No uses información personal</li>
                            <li>• Cambia tu contraseña cada 3 meses</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
