import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Mail,
    Lock,
    Calendar,
    Percent,
    FileText,
    Phone,
    Shield,
    Briefcase,
    Building2,
    Tag,
    AlertCircle,
    CheckCircle2,
    MessageCircle
} from 'lucide-react';
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
                    ? 'Ha realizado cambios en el usuario. Si cierra ahora, perderá toda la información ingresada.'
                    : '¿Está seguro que desea cerrar el formulario?'
            }
            confirmText={hasChanges ? 'Descartar cambios' : 'Cerrar'}
            cancelText={hasChanges ? 'Continuar editando' : 'Cancelar'}
            type={hasChanges ? 'warning' : 'info'}
        />
    );
};

// ============================================================================
// COMPONENTE PRINCIPAL: UserDrawer
// ============================================================================
const UserDrawer = ({ isOpen, onClose, onSave, user = null, clients = [], features = {}, companies = [], isSuperadmin = false }) => {
    const isEditing = !!user;
    
    // Normalizar clients para manejar tanto array como objeto con propiedad clients
    const clientsList = Array.isArray(clients) ? clients : (clients?.clients || []);

    // Obtener información de cupo de la compañía seleccionada
    const getSelectedCompanyQuota = () => {
        if (!formData.companyId) return null;
        const company = companies.find(c => c._id === formData.companyId);
        if (!company) return null;
        
        const maxUsers = company.features?.maxUsers || 0;
        const activeUsers = company.activeUsersCount || 0;
        const available = maxUsers - activeUsers;
        
        return {
            maxUsers,
            activeUsers,
            available,
            hasQuota: available > 0
        };
    };
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'vendedor',
        clientId: '',
        companyId: '',
        phone: '',
        whatsapp: '',
        birthDate: '',
        commission: '',
        canViewCommission: true,
        canEditProductDiscount: true,
        canEditBudgetDiscount: true,
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    
    const initialDataRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            initializedRef.current = false;
            return;
        }

        if (initializedRef.current) return;

        let newFormData;
        if (user) {
            newFormData = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                password: '',
                role: user.roleId?.name || 'vendedor',
                clientId: user.clientId?._id || '',
                companyId: user.companyId?._id || '',
                phone: user.phone || '',
                whatsapp: user.whatsapp || '',
                birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
                commission: user.commission || '',
                canViewCommission: user.canViewCommission ?? true,
                canEditProductDiscount: user.canEditProductDiscount ?? true,
                canEditBudgetDiscount: user.canEditBudgetDiscount ?? true,
                notes: user.notes || ''
            };
        } else {
            newFormData = {
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'vendedor',
                clientId: '',
                companyId: '',
                phone: '',
                whatsapp: '',
                birthDate: '',
                commission: '',
                canViewCommission: true,
                canEditProductDiscount: true,
                canEditBudgetDiscount: true,
                notes: ''
            };
        }
        setFormData(newFormData);
        initialDataRef.current = JSON.stringify(newFormData);
        setErrors({});
        setShowConfirmClose(false);
        initializedRef.current = true;
    }, [isOpen, user]);

    // ============================================================================
    // VALIDACIÓN
    // ============================================================================
    const hasChanges = useCallback(() => {
        if (!initialDataRef.current) return false;
        return JSON.stringify(formData) !== initialDataRef.current;
    }, [formData]);

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
        if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        if (!isEditing && !formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        if (formData.role === 'cliente' && !formData.clientId) {
            newErrors.clientId = 'Debe seleccionar un cliente';
        }
        if (isSuperadmin && !isEditing && !formData.companyId) {
            newErrors.companyId = 'Debe seleccionar una compañía';
        }
        if (formData.commission && (formData.commission < 0 || formData.commission > 100)) {
            newErrors.commission = 'La comisión debe estar entre 0 y 100';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!validate()) return;
        
        try {
            setLoading(true);
            const dataToSend = { ...formData };
            if (isEditing && !dataToSend.password) {
                delete dataToSend.password;
            }
            if (dataToSend.role !== 'cliente') {
                delete dataToSend.clientId;
            }
            await onSave(dataToSend);
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
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

    const getRoleConfig = (role) => {
        const configs = {
            'vendedor': {
                icon: Briefcase,
                color: 'amber',
                label: 'Vendedor',
                bgColor: 'bg-amber-100 dark:bg-amber-900/30',
                textColor: 'text-amber-600',
                borderColor: 'border-amber-500',
                hoverBorder: 'hover:border-amber-200'
            },
            'admin': {
                icon: Shield,
                color: 'blue',
                label: 'Administrador',
                bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                textColor: 'text-blue-600',
                borderColor: 'border-blue-500',
                hoverBorder: 'hover:border-blue-200'
            },
            'cliente': {
                icon: Building2,
                color: 'violet',
                label: 'Usuario de Cliente',
                bgColor: 'bg-violet-100 dark:bg-violet-900/30',
                textColor: 'text-violet-600',
                borderColor: 'border-violet-500',
                hoverBorder: 'hover:border-violet-200'
            }
        };
        return configs[role] || configs['vendedor'];
    };

    const currentRole = formData.role;
    const roleConfig = getRoleConfig(currentRole);
    const RoleIcon = roleConfig.icon;

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
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleConfig.bgColor} ${roleConfig.textColor}`}>
                                        <RoleIcon size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                                            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                                        </h2>
                                        <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                            {isEditing ? 'Modifique los datos del usuario' : 'Complete los datos del nuevo usuario'}
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
                                <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                                    
                                    {/* ============================================
                                        FILA 1: DOS COLUMNAS
                                        ============================================ */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        
                                        {/* COLUMNA IZQUIERDA: Información Personal */}
                                        <div className="space-y-6">
                                            
                                            {/* INFORMACIÓN PERSONAL */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <User size={14} />
                                                    Información Personal
                                                </h3>
                                                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                                
                                                <div className="space-y-4">
                                                    {/* Nombre y Apellido */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Nombre <span className="text-danger-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.firstName}
                                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                                className={`w-full px-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                    errors.firstName ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                                placeholder="Ej: Juan"
                                                            />
                                                            {errors.firstName && (
                                                                <p className="text-danger-500 text-[10px] mt-1 flex items-center gap-1">
                                                                    <AlertCircle size={10} /> {errors.firstName}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                                Apellido <span className="text-danger-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.lastName}
                                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                                className={`w-full px-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                    errors.lastName ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                                placeholder="Ej: Pérez"
                                                            />
                                                            {errors.lastName && (
                                                                <p className="text-danger-500 text-[10px] mt-1">{errors.lastName}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Email */}
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Email <span className="text-danger-500">*</span> <span className="text-[var(--text-muted)] lowercase">(será su usuario)</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                            <input
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                                disabled={isEditing}
                                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                    errors.email ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                placeholder="juan.perez@empresa.com"
                                                            />
                                                        </div>
                                                        {errors.email && (
                                                            <p className="text-danger-500 text-[10px] mt-1">{errors.email}</p>
                                                        )}
                                                        {isEditing && (
                                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">El email no se puede modificar</p>
                                                        )}
                                                    </div>

                                                    {/* Contraseña */}
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Contraseña {isEditing ? <span className="text-[var(--text-muted)] lowercase">(dejar vacío para no cambiar)</span> : <span className="text-danger-500">*</span>}
                                                        </label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                            <input
                                                                type="password"
                                                                value={formData.password}
                                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                    errors.password ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                                placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
                                                            />
                                                        </div>
                                                        {errors.password && (
                                                            <p className="text-danger-500 text-[10px] mt-1">{errors.password}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* CONTACTO */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 }}
                                            >
                                                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Phone size={14} />
                                                    Contacto
                                                </h3>
                                                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                                
                                                <div className="space-y-4">
                                                    {/* Teléfono y WhatsApp */}
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
                                                                    placeholder="549341123456"
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
                                                                    placeholder="549341123456"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Fecha de Nacimiento */}
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Fecha de Nacimiento
                                                        </label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                            <input
                                                                type="date"
                                                                value={formData.birthDate}
                                                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                                                className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* NOTAS */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                            >
                                                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FileText size={14} />
                                                    Notas
                                                </h3>
                                                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                                
                                                <div className="relative">
                                                    <FileText className="absolute left-2.5 top-2.5 text-[var(--text-muted)]" size={14} />
                                                    <textarea
                                                        value={formData.notes}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                        placeholder="Notas adicionales sobre el usuario..."
                                                        rows={3}
                                                        className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors resize-none placeholder:text-[var(--text-muted)]/50"
                                                    />
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* COLUMNA DERECHA: Configuración */}
                                        <div className="space-y-6">
                                            
                                            {/* COMPAÑÍA (solo superadmin en creación) */}
                                            {!isEditing && isSuperadmin && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Building2 size={14} />
                                                        Compañía
                                                    </h3>
                                                    <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                                    
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Seleccionar Compañía <span className="text-danger-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                            <select
                                                                value={formData.companyId}
                                                                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors appearance-none ${
                                                                    errors.companyId ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                            >
                                                                <option value="">Seleccione una compañía...</option>
                                                                {companies.map((company) => {
                                                                    const maxUsers = company.features?.maxUsers || 0;
                                                                    const activeUsers = company.activeUsersCount || 0;
                                                                    return (
                                                                        <option key={company._id} value={company._id}>
                                                                            {company.name} ({activeUsers}/{maxUsers})
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                        {errors.companyId && (
                                                            <p className="text-danger-500 text-[10px] mt-1">{errors.companyId}</p>
                                                        )}
                                                        
                                                        {/* Info de cupo */}
                                                        {formData.companyId && (() => {
                                                            const quota = getSelectedCompanyQuota();
                                                            if (!quota) return null;
                                                            return (
                                                                <div className={`mt-2 p-2 rounded-lg text-[11px] ${
                                                                    quota.hasQuota 
                                                                        ? 'bg-success-50 text-success-700 border border-success-200' 
                                                                        : 'bg-danger-50 text-danger-700 border border-danger-200'
                                                                }`}>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {quota.hasQuota ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                                        <span className="font-medium">
                                                                            {quota.hasQuota 
                                                                                ? `Cupo disponible: ${quota.available} de ${quota.maxUsers}` 
                                                                                : `Sin cupo: ${quota.activeUsers}/${quota.maxUsers} usuarios`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* TIPO DE USUARIO (solo en creación) */}
                                            {!isEditing && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15 }}
                                                >
                                                    <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Shield size={14} />
                                                        Tipo de Usuario
                                                    </h3>
                                                    <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                                    
                                                    <div className={`grid gap-2 ${features.clientUsers ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                                        {['vendedor', 'admin', ...(features.clientUsers ? ['cliente'] : [])].map((role) => {
                                                            const config = getRoleConfig(role);
                                                            const Icon = config.icon;
                                                            const isSelected = formData.role === role;
                                                            
                                                            return (
                                                                <button
                                                                    key={role}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, role, clientId: '' })}
                                                                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all ${
                                                                        isSelected
                                                                            ? `${config.borderColor} ${config.bgColor}`
                                                                            : `border-[var(--border-color)] ${config.hoverBorder}`
                                                                    }`}
                                                                >
                                                                    <Icon size={18} className={isSelected ? config.textColor : 'text-[var(--text-muted)]'} />
                                                                    <div className={`text-[11px] font-medium text-center leading-tight ${isSelected ? config.textColor : 'text-[var(--text-secondary)]'}`}>
                                                                        {config.label}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* CLIENTE ASIGNADO (solo para rol 'cliente') */}
                                            {formData.role === 'cliente' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Building2 size={14} />
                                                        Cliente Asignado
                                                    </h3>
                                                    <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                                                    
                                                    <div>
                                                        <label className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                            Seleccionar Cliente <span className="text-danger-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                            <select
                                                                value={formData.clientId}
                                                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-input)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors appearance-none ${
                                                                    errors.clientId ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                            >
                                                                <option value="">Seleccione un cliente...</option>
                                                                {clientsList.map((client) => (
                                                                    <option key={client._id} value={client._id}>
                                                                        {client.businessName} {client.code ? `(${client.code})` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {errors.clientId && (
                                                            <p className="text-danger-500 text-[10px] mt-1">{errors.clientId}</p>
                                                        )}
                                                        {clientsList.length === 0 && (
                                                            <p className="text-amber-600 text-[10px] mt-1">
                                                                No hay clientes disponibles. Cree clientes primero.
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* COMISIÓN */}
                                            {formData.role !== 'cliente' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.25 }}
                                                    className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                                >
                                                    <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <Percent size={14} /> Comisión
                                                    </h3>
                                                    
                                                    <div>
                                                        <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">
                                                            Porcentaje de Comisión (%)
                                                        </label>
                                                        <div className="relative">
                                                            <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={formData.commission}
                                                                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                                                                className={`w-full pl-8 pr-2.5 py-1.5 bg-[var(--bg-card)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors placeholder:text-[var(--text-muted)]/50 ${
                                                                    errors.commission ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                                }`}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        {errors.commission && (
                                                            <p className="text-danger-500 text-[10px] mt-1">{errors.commission}</p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* PERMISOS */}
                                            {formData.role !== 'cliente' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5"
                                                >
                                                    <h3 className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <Shield size={14} /> Permisos
                                                    </h3>
                                                    
                                                    <div className="space-y-4">
                                                        {/* Ver comisiones */}
                                                        {features.commissionCalculation && (
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                                                        <Percent size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Ver comisiones</p>
                                                                        <p className="text-[11px] text-[var(--text-muted)]">Puede ver sus comisiones en pedidos</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, canViewCommission: !formData.canViewCommission })}
                                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                                        formData.canViewCommission ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                                                    }`}
                                                                >
                                                                    <motion.div
                                                                        initial={false}
                                                                        animate={{ x: formData.canViewCommission ? 20 : 2 }}
                                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                                    />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Editar descuento productos */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                                                    <Tag size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">Editar descuentos</p>
                                                                    <p className="text-[11px] text-[var(--text-muted)]">En productos de presupuestos</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, canEditProductDiscount: !formData.canEditProductDiscount })}
                                                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                                    formData.canEditProductDiscount ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                                                }`}
                                                            >
                                                                <motion.div
                                                                    initial={false}
                                                                    animate={{ x: formData.canEditProductDiscount ? 20 : 2 }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                                />
                                                            </button>
                                                        </div>

                                                        {/* Editar descuento presupuestos */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                                                                    <Percent size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">Descuento global</p>
                                                                    <p className="text-[11px] text-[var(--text-muted)]">En presupuestos completos</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, canEditBudgetDiscount: !formData.canEditBudgetDiscount })}
                                                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                                    formData.canEditBudgetDiscount ? 'bg-primary-500' : 'bg-[var(--border-color)]'
                                                                }`}
                                                            >
                                                                <motion.div
                                                                    initial={false}
                                                                    animate={{ x: formData.canEditBudgetDiscount ? 20 : 2 }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* INFO EMAIL */}
                                    {!isEditing && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.35 }}
                                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Mail size={18} className="text-blue-600 mt-0.5" />
                                                <div>
                                                    <p className="text-[13px] text-blue-700 dark:text-blue-300 font-semibold">
                                                        Se enviará un email de bienvenida
                                                    </p>
                                                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                                                        El usuario recibirá sus credenciales por correo electrónico.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
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
                                    {isEditing ? 'Guardar Cambios' : `Crear ${roleConfig.label}`}
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

export default UserDrawer;
