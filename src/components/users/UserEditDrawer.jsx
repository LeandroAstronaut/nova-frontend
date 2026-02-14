import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Calendar, Percent, FileText, Phone, Shield, Briefcase, Building2, Save } from 'lucide-react';
import Button from '../common/Button';

const UserEditDrawer = ({ isOpen, onClose, onSave, user, isSuperadmin = false }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        whatsapp: '',
        birthDate: '',
        commission: '',
        password: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                whatsapp: user.whatsapp || '',
                birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
                commission: user.commission || '',
                password: '',
                notes: user.notes || ''
            });
            setErrors({});
        }
    }, [isOpen, user]);

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
        if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
        
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        
        const roleName = user?.roleId?.name;
        if ((roleName === 'vendedor' || roleName === 'admin') && formData.commission !== '') {
            const commissionNum = parseFloat(formData.commission);
            if (isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
                newErrors.commission = 'La comisión debe estar entre 0 y 100';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        
        try {
            setLoading(true);
            const dataToSend = { ...formData };
            // Si no se ingresó contraseña, no enviarla
            if (!dataToSend.password) {
                delete dataToSend.password;
            }
            await onSave(dataToSend);
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleConfig = (role) => {
        const configs = {
            'vendedor': {
                icon: Briefcase,
                color: 'amber',
                label: 'Vendedor',
                bgColor: 'bg-amber-100 dark:bg-amber-900/30',
                textColor: 'text-amber-600'
            },
            'admin': {
                icon: Shield,
                color: 'blue',
                label: 'Administrador',
                bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                textColor: 'text-blue-600'
            },
            'cliente': {
                icon: Building2,
                color: 'violet',
                label: 'Usuario de Cliente',
                bgColor: 'bg-violet-100 dark:bg-violet-900/30',
                textColor: 'text-violet-600'
            }
        };
        return configs[role] || configs['vendedor'];
    };

    const roleName = user?.roleId?.name || 'vendedor';
    const roleConfig = getRoleConfig(roleName);
    const RoleIcon = roleConfig.icon;
    const isVendedor = roleName === 'vendedor';
    const isAdmin = roleName === 'admin';
    const isCliente = roleName === 'cliente';

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
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[480px] bg-[var(--bg-card)] shadow-2xl z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleConfig.bgColor} ${roleConfig.textColor}`}>
                                    <RoleIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        Editar Usuario
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {user?.firstName} {user?.lastName}
                                    </p>
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
                            {/* User Info Card */}
                            <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${roleConfig.bgColor} ${roleConfig.textColor}`}>
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                                            {user?.email}
                                        </p>
                                        {isSuperadmin && user?.companyId?.name && (
                                            <p className="text-[10px] text-primary-600 mt-0.5 flex items-center gap-1">
                                                <Building2 size={10} />
                                                {user.companyId.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${roleConfig.bgColor} ${roleConfig.textColor} border-current opacity-60 shrink-0`}>
                                        {roleConfig.label}
                                    </div>
                                </div>
                            </div>

                            {/* Nombre y Apellido */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                            errors.firstName ? 'border-danger-500' : 'border-[var(--border-color)]'
                                        }`}
                                        placeholder="Ej: Juan"
                                    />
                                    {errors.firstName && <p className="text-danger-500 text-xs mt-1">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Apellido *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                            errors.lastName ? 'border-danger-500' : 'border-[var(--border-color)]'
                                        }`}
                                        placeholder="Ej: Pérez"
                                    />
                                    {errors.lastName && <p className="text-danger-500 text-xs mt-1">{errors.lastName}</p>}
                                </div>
                            </div>

                            {/* Email (solo lectura) */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Email (no editable)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg text-sm opacity-60 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Nueva Contraseña (dejar vacío para no cambiar)
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                            errors.password ? 'border-danger-500' : 'border-[var(--border-color)]'
                                        }`}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                {errors.password && <p className="text-danger-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Teléfonos */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="549341123456"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        WhatsApp
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                        <input
                                            type="tel"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="549341123456"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fecha de nacimiento y Comisión */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Fecha de Nacimiento
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                        <input
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                {(isVendedor || isAdmin) && (
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Comisión (%)
                                        </label>
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={formData.commission}
                                                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                                                className={`w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                                    errors.commission ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.commission && <p className="text-danger-500 text-xs mt-1">{errors.commission}</p>}
                                    </div>
                                )}
                                {!isVendedor && (
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Rol
                                        </label>
                                        <div className="px-3 py-2.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-muted)]">
                                            {roleConfig.label}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Notas
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-[var(--text-muted)]" size={16} />
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm min-h-[100px] resize-none"
                                        placeholder="Notas adicionales sobre el usuario..."
                                    />
                                </div>
                            </div>

                            {/* Información adicional */}
                            {isCliente && user?.clientId && (
                                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800">
                                    <h4 className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                                        Cliente Asignado
                                    </h4>
                                    <p className="text-[13px] font-medium text-[var(--text-primary)]">
                                        {user.clientId.businessName}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        CUIT: {user.clientId.cuit || 'No especificado'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] shrink-0">
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    className="flex-1 text-[11px] font-bold uppercase tracking-wider"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 text-[11px] font-bold uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} className="mr-2" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default UserEditDrawer;
