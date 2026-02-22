import React from 'react';
import { Mail, Phone, Shield, Briefcase, Building2, Percent, Calendar, CheckCircle, XCircle, FileText, Clock, MessageCircle, User } from 'lucide-react';

// Helper para obtener iniciales del usuario
const getUserInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'US';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const RoleBadge = ({ roleName }) => {
    const configs = {
        'admin': {
            styles: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            label: 'Administrador'
        },
        'vendedor': {
            styles: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            label: 'Vendedor'
        },
        'cliente': {
            styles: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
            label: 'Usuario de Cliente'
        }
    };

    const config = configs[roleName] || configs['vendedor'];

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.styles}`}>
            {config.label}
        </span>
    );
};

const StatusBadge = ({ active }) => {
    const styles = active 
        ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
        : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800';

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
            {active ? 'Activo' : 'Inactivo'}
        </span>
    );
};

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-3 py-2">
        {Icon && (
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[var(--text-muted)]" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
            <p className="text-[13px] font-semibold mt-0.5 truncate text-[var(--text-primary)]">{value || '-'}</p>
        </div>
    </div>
);

const InfoRowNormal = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-3 py-2">
        {Icon && (
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[var(--text-muted)]" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-normal text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
            <p className="text-[13px] font-semibold mt-0.5 truncate text-[var(--text-primary)]">{value || '-'}</p>
        </div>
    </div>
);

// Componente para filas de contacto con acciones
const ContactRow = ({ label, value, icon: Icon, type }) => {
    if (!value || value === 'No especificado') return <InfoRow label={label} value={value} icon={Icon} />;
    
    // Limpiar número para links (quitar espacios, guiones, paréntesis, etc)
    const cleanNumber = value.replace(/[\s\-\(\)\.]/g, '');
    
    return (
        <div className="flex items-center gap-3 py-2">
            {Icon && (
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[var(--text-muted)]" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
                <p className="text-[13px] font-semibold mt-0.5 truncate text-[var(--text-primary)]">{value}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {type === 'phone' && (
                    <a
                        href={`tel:${cleanNumber}`}
                        className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                        title="Llamar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Phone size={14} strokeWidth={2.5} />
                    </a>
                )}
                {type === 'whatsapp' && (
                    <a
                        href={`https://api.whatsapp.com/send?phone=${cleanNumber}&text=`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                        title="Enviar WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MessageCircle size={14} strokeWidth={2.5} />
                    </a>
                )}
            </div>
        </div>
    );
};

// Componente para filas de contacto con acciones (labels font-normal)
const ContactRowNormal = ({ label, value, icon: Icon, type }) => {
    if (!value || value === 'No especificado') return <InfoRowNormal label={label} value={value} icon={Icon} />;
    
    // Limpiar número para links (quitar espacios, guiones, paréntesis, etc)
    const cleanNumber = value.replace(/[\s\-\(\)\.]/g, '');
    
    return (
        <div className="flex items-center gap-3 py-2">
            {Icon && (
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[var(--text-muted)]" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-normal text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
                <p className="text-[13px] font-semibold mt-0.5 truncate text-[var(--text-primary)]">{value}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {type === 'phone' && (
                    <a
                        href={`tel:${cleanNumber}`}
                        className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                        title="Llamar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Phone size={14} strokeWidth={2.5} />
                    </a>
                )}
                {type === 'whatsapp' && (
                    <a
                        href={`https://api.whatsapp.com/send?phone=${cleanNumber}&text=`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                        title="Enviar WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MessageCircle size={14} strokeWidth={2.5} />
                    </a>
                )}
            </div>
        </div>
    );
};

const UserDetailContent = ({ user, isSuperadmin = false }) => {
    if (!user) return null;

    const isVendedor = user.roleId?.name === 'vendedor';
    const isUserAdmin = user.roleId?.name === 'admin';
    const isCliente = user.roleId?.name === 'cliente';

    return (
        <div className="space-y-0">
            {/* Header Principal - Estilo Cliente */}
            <div className="px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-start gap-4">
                    {/* Iniciales del Usuario */}
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {getUserInitials(user.firstName, user.lastName)}
                        </span>
                    </div>
                    
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                {/* Nombre completo */}
                                <h1 className="text-[15px] font-bold text-[var(--text-primary)] truncate">
                                    {user.firstName} {user.lastName}
                                </h1>
                                {/* Email */}
                                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                                    {user.email}
                                </p>
                                {/* Rol y Status */}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <RoleBadge roleName={user.roleId?.name} />
                                    <StatusBadge active={user.active} />
                                </div>
                            </div>
                            
                            {/* Fecha de membresía a la derecha */}
                            <div className="text-right shrink-0">
                                <p className="text-[11px] text-[var(--text-muted)]">
                                    Miembro desde
                                </p>
                                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                                    {new Date(user.createdAt).toLocaleDateString('es-AR')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-3 md:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-6">
                        {/* Información de Contacto - En card */}
                        <div>
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Información de Contacto
                            </h3>
                            <div className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] p-4">
                                <div className="space-y-1">
                                    <InfoRowNormal 
                                        label="Email" 
                                        value={user.email}
                                        icon={Mail}
                                    />
                                    <ContactRowNormal 
                                        label="Teléfono" 
                                        value={user.phone}
                                        icon={Phone}
                                        type="phone"
                                    />
                                    <ContactRowNormal 
                                        label="WhatsApp" 
                                        value={user.whatsapp}
                                        icon={Phone}
                                        type="whatsapp"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Información de la Cuenta - Sin card */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Información de la Cuenta
                            </h3>
                            <div className="space-y-1">
                                {isSuperadmin && (
                                    <InfoRowNormal 
                                        label="Compañía" 
                                        value={user.companyId?.name || 'No especificada'}
                                        icon={Building2}
                                    />
                                )}
                                <InfoRowNormal 
                                    label="Rol" 
                                    value={user.roleId?.name === 'admin' ? 'Administrador' : 
                                          user.roleId?.name === 'cliente' ? 'Usuario de Cliente' : 'Vendedor'}
                                    icon={Shield}
                                />
                                <InfoRowNormal 
                                    label="Estado" 
                                    value={user.active ? 'Activo' : 'Inactivo'}
                                    icon={user.active ? CheckCircle : XCircle}
                                />
                                <InfoRowNormal 
                                    label="Fecha de Creación" 
                                    value={new Date(user.createdAt).toLocaleDateString('es-AR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                    icon={Calendar}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-6">
                        {/* Información Laboral - En card */}
                        {(isVendedor || isUserAdmin) && (
                            <div>
                                <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Información Laboral
                                </h3>
                                <div className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] p-4">
                                    <div className="space-y-1">
                                        <InfoRowNormal 
                                            label="Comisión" 
                                            value={`${user.commission || 0}%`}
                                            icon={Percent}
                                        />
                                        <InfoRowNormal 
                                            label="Clientes Asignados" 
                                            value={user.assignedClients?.length || 0}
                                            icon={Building2}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cliente Asociado - En card */}
                        {isCliente && user.clientId && (
                            <div>
                                <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Cliente Asociado
                                </h3>
                                <div className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] p-4">
                                    <div className="space-y-1">
                                        <InfoRowNormal 
                                            label="Razón Social" 
                                            value={user.clientId.businessName}
                                            icon={Building2}
                                        />
                                        <InfoRowNormal 
                                            label="CUIT" 
                                            value={user.clientId.cuit}
                                            icon={FileText}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actividad Reciente - Sin card */}
                        <div className={`${(isVendedor || isUserAdmin || (isCliente && user.clientId)) ? 'pt-4 border-t border-[var(--border-color)]' : ''}`}>
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Actividad Reciente
                            </h3>
                            <div className="space-y-1">
                                <InfoRowNormal 
                                    label="Último Inicio de Sesión" 
                                    value={user.lastLogin 
                                        ? new Date(user.lastLogin).toLocaleString('es-AR', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'Nunca ha iniciado sesión'
                                    }
                                    icon={Clock}
                                />
                                <InfoRowNormal 
                                    label="Última Actualización" 
                                    value={new Date(user.updatedAt).toLocaleString('es-AR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    icon={Clock}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailContent;
