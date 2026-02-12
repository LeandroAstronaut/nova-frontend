import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Calendar, Percent, FileText, Phone, Shield, Briefcase, Building2 } from 'lucide-react';
import Button from '../common/Button';

const SellerDrawer = ({ isOpen, onClose, onSave, user = null, clients = [] }) => {
    const isEditing = !!user;
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'vendedor', // 'vendedor' | 'admin' | 'cliente'
        clientId: '', // Solo para rol 'cliente'
        phone: '',
        whatsapp: '',
        birthDate: '',
        commission: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    password: '', // No mostrar contraseña existente
                    role: user.roleId?.name || 'vendedor',
                    clientId: user.clientId?._id || '',
                    phone: user.phone || '',
                    whatsapp: user.whatsapp || '',
                    birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
                    commission: user.commission || '',
                    notes: user.notes || ''
                });
            } else {
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    role: 'vendedor',
                    clientId: '',
                    phone: '',
                    whatsapp: '',
                    birthDate: '',
                    commission: '',
                    notes: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, user]);

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
        if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        if (!isEditing && !formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        // Validar que se seleccionó un cliente si el rol es 'cliente'
        if (formData.role === 'cliente' && !formData.clientId) {
            newErrors.clientId = 'Debe seleccionar un cliente';
        }
        if (formData.commission && (formData.commission < 0 || formData.commission > 100)) {
            newErrors.commission = 'La comisión debe estar entre 0 y 100';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        
        try {
            setLoading(true);
            const dataToSend = { ...formData };
            // Si está editando y no cambió la contraseña, no enviarla
            if (isEditing && !dataToSend.password) {
                delete dataToSend.password;
            }
            // Si no es rol cliente, eliminar clientId
            if (dataToSend.role !== 'cliente') {
                delete dataToSend.clientId;
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[480px] bg-[var(--bg-card)] shadow-2xl z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleConfig.bgColor} ${roleConfig.textColor}`}>
                                    <RoleIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {isEditing ? 'Modifique los datos del usuario' : 'Complete los datos del nuevo usuario'}
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
                            {/* Selector de Rol (solo en creación) */}
                            {!isEditing && (
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Tipo de Usuario *
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['vendedor', 'admin', 'cliente'].map((role) => {
                                            const config = getRoleConfig(role);
                                            const Icon = config.icon;
                                            const isSelected = formData.role === role;
                                            
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role, clientId: '' })}
                                                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border-2 transition-all ${
                                                        isSelected
                                                            ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20`
                                                            : `border-[var(--border-color)] ${config.hoverBorder}`
                                                    }`}
                                                >
                                                    <Icon size={18} className={isSelected ? config.textColor : 'text-[var(--text-muted)]'} />
                                                    <div className="text-[11px] font-bold text-center leading-tight" style={{ color: isSelected ? undefined : 'var(--text-secondary)' }}>
                                                        {config.label}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Selector de Cliente (solo para rol 'cliente') */}
                            {formData.role === 'cliente' && (
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Cliente Asignado *
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                        <select
                                            value={formData.clientId}
                                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                            className={`w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm appearance-none ${
                                                errors.clientId ? 'border-danger-500' : 'border-[var(--border-color)]'
                                            }`}
                                        >
                                            <option value="">Seleccione un cliente...</option>
                                            {clients.map((client) => (
                                                <option key={client._id} value={client._id}>
                                                    {client.businessName} {client.code ? `(${client.code})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.clientId && <p className="text-danger-500 text-xs mt-1">{errors.clientId}</p>}
                                    {clients.length === 0 && (
                                        <p className="text-amber-600 text-xs mt-1">
                                            No hay clientes disponibles. Cree clientes primero.
                                        </p>
                                    )}
                                </div>
                            )}

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

                            {/* Email */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Email * (será su usuario)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={isEditing}
                                        className={`w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                            errors.email ? 'border-danger-500' : 'border-[var(--border-color)]'
                                        } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder="juan.perez@empresa.com"
                                    />
                                </div>
                                {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email}</p>}
                                {isEditing && <p className="text-[10px] text-[var(--text-muted)] mt-1">El email no se puede modificar</p>}
                            </div>

                            {/* Contraseña */}
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Contraseña {isEditing ? '(dejar vacío para no cambiar)' : '*'}
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
                                        placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
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
                                            placeholder="(11) 1234-5678"
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
                                            placeholder="(11) 1234-5678"
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
                                            value={formData.commission}
                                            onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                                            disabled={formData.role === 'cliente'}
                                            className={`w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                                errors.commission ? 'border-danger-500' : 'border-[var(--border-color)]'
                                            } ${formData.role === 'cliente' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            placeholder="0"
                                        />
                                    </div>
                                    {errors.commission && <p className="text-danger-500 text-xs mt-1">{errors.commission}</p>}
                                    {formData.role === 'cliente' && (
                                        <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                            Los usuarios de cliente no tienen comisión
                                        </p>
                                    )}
                                </div>
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
                                        placeholder="Notas adicionales sobre el usuario..."
                                        rows={3}
                                        className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm resize-none"
                                    />
                                </div>
                            </div>

                            {/* Info Email */}
                            {!isEditing && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <Mail size={16} className="text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-[12px] text-blue-700 dark:text-blue-300 font-medium">
                                                Se enviará un email de bienvenida
                                            </p>
                                            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                                                El usuario recibirá sus credenciales por correo electrónico.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] space-y-3">
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                className="w-full !py-3"
                            >
                                {isEditing ? 'Guardar Cambios' : `Crear ${roleConfig.label}`}
                            </Button>
                            <button
                                onClick={onClose}
                                className="w-full text-center text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SellerDrawer;
