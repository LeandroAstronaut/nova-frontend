import React, { useState, useEffect } from 'react';
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
    Edit2
} from 'lucide-react';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-(--border-color) last:border-0">
        {Icon && (
            <div className="w-8 h-8 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                <Icon size={16} className="text-(--text-muted)" />
            </div>
        )}
        <div className="flex-1">
            <p className="text-[11px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
            <p className="text-[13px] font-semibold text-(--text-primary) mt-0.5">{value || '-'}</p>
        </div>
    </div>
);

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
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${config.styles}`}>
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

    // Datos del usuario (solo informativos)
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
        commission: user?.commission || 0
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
            
            // Si es error de contraseña actual incorrecta
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
                <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                    Mi Perfil
                </h1>
                <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                    Gestiona tu información personal y seguridad de la cuenta.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda - Info del usuario */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Card de información principal */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-6 border-b border-(--border-color) bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10">
                            <div className="flex items-center gap-4">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-3xl ${
                                    userData.role === 'admin' 
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                                        : userData.role === 'cliente'
                                            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                                }`}>
                                    {userData.firstName[0]}{userData.lastName[0]}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-(--text-primary)">
                                        {userData.firstName} {userData.lastName}
                                    </h2>
                                    <p className="text-sm text-(--text-secondary) mt-1">{userData.email}</p>
                                    <div className="mt-3">
                                        <RoleBadge roleName={userData.role} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                Información de Contacto
                            </h3>
                            <InfoRow 
                                label="Email" 
                                value={userData.email}
                                icon={Mail}
                            />
                            <InfoRow 
                                label="Teléfono" 
                                value={userData.phone || 'No especificado'}
                                icon={Phone}
                            />
                            <InfoRow 
                                label="WhatsApp" 
                                value={userData.whatsapp || 'No especificado'}
                                icon={Phone}
                            />
                            <InfoRow 
                                label="Fecha de Nacimiento" 
                                value={userData.birthDate}
                                icon={Calendar}
                            />
                        </div>
                    </div>

                    {/* Información de la cuenta */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider">
                                Información de la Cuenta
                            </h3>
                        </div>
                        
                        <div className="p-6">
                            <InfoRow 
                                label="Rol" 
                                value={isAdmin ? 'Administrador' : isVendedor ? 'Vendedor' : 'Usuario de Cliente'}
                                icon={Shield}
                            />
                            {userData.company && (
                                <InfoRow 
                                    label="Empresa" 
                                    value={userData.company}
                                    icon={Building2}
                                />
                            )}
                            {isCliente && userData.client && (
                                <InfoRow 
                                    label="Cliente Asignado" 
                                    value={userData.client}
                                    icon={Briefcase}
                                />
                            )}
                            {isVendedor && (
                                <InfoRow 
                                    label="Comisión" 
                                    value={`${userData.commission}%`}
                                    icon={User}
                                />
                            )}
                            <InfoRow 
                                label="Miembro desde" 
                                value={userData.createdAt}
                                icon={Calendar}
                            />
                            <InfoRow 
                                label="Último acceso" 
                                value={userData.lastLogin}
                                icon={Clock}
                            />
                        </div>
                    </div>
                </div>

                {/* Columna derecha - Seguridad */}
                <div className="space-y-6">
                    {/* Cambiar contraseña */}
                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover)">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-(--text-primary)">Seguridad</h2>
                                    <p className="text-[11px] text-(--text-muted)">Gestiona tu contraseña</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {!showPasswordForm ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--bg-hover) flex items-center justify-center">
                                        <Lock size={28} className="text-(--text-muted)" />
                                    </div>
                                    <p className="text-sm text-(--text-secondary) mb-4">
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
                                        className="text-xs text-(--text-muted) hover:text-(--text-primary) transition-colors"
                                    >
                                        ← Volver
                                    </button>

                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Contraseña Actual
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className={`w-full px-3 py-2.5 bg-(--bg-input) border rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 ${
                                                errors.currentPassword ? 'border-danger-500' : 'border-(--border-color)'
                                            }`}
                                            placeholder="••••••••"
                                        />
                                        {errors.currentPassword && (
                                            <p className="text-danger-500 text-xs mt-1">{errors.currentPassword}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Nueva Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className={`w-full px-3 py-2.5 bg-(--bg-input) border rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 ${
                                                errors.newPassword ? 'border-danger-500' : 'border-(--border-color)'
                                            }`}
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                        {errors.newPassword && (
                                            <p className="text-danger-500 text-xs mt-1">{errors.newPassword}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Confirmar Nueva Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className={`w-full px-3 py-2.5 bg-(--bg-input) border rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 ${
                                                errors.confirmPassword ? 'border-danger-500' : 'border-(--border-color)'
                                            }`}
                                            placeholder="Repite la nueva contraseña"
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-danger-500 text-xs mt-1">{errors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <Button
                                        variant="primary"
                                        onClick={handlePasswordChange}
                                        isLoading={loading}
                                        className="w-full mt-2"
                                    >
                                        <Save size={16} className="mr-2" />
                                        Guardar Contraseña
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips de seguridad */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                            <Shield size={16} />
                            Consejos de Seguridad
                        </h4>
                        <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
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
