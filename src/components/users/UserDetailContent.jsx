import React from 'react';
import { Mail, Phone, Shield, Briefcase, Building2, Percent, Calendar, CheckCircle, XCircle, FileText, Clock, MessageCircle } from 'lucide-react';

const RoleBadge = ({ roleName }) => {
    const configs = {
        'admin': {
            styles: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
            label: 'Administrador'
        },
        'vendedor': {
            styles: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
            label: 'Vendedor'
        },
        'cliente': {
            styles: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800',
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
        ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800'
        : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800';

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
            {active ? 'Activo' : 'Inactivo'}
        </span>
    );
};

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-(--border-color) last:border-0">
        {Icon && (
            <div className="w-7 h-7 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                <Icon size={14} className="text-(--text-muted)" />
            </div>
        )}
        <div className="flex-1">
            <p className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
            <p className="text-[12px] font-semibold text-(--text-primary) mt-0.5">{value || '-'}</p>
        </div>
    </div>
);

// Componente para filas de contacto con acciones
const ContactRow = ({ label, value, icon: Icon, type }) => {
    if (!value || value === 'No especificado') return <InfoRow label={label} value={value} icon={Icon} />;
    
    // Limpiar número para links (quitar espacios, guiones, paréntesis, etc)
    const cleanNumber = value.replace(/[\s\-\(\)\.]/g, '');
    
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-(--border-color) last:border-0">
            {Icon && (
                <div className="w-7 h-7 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-(--text-muted)" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
                <p className="text-[12px] font-semibold text-(--text-primary) mt-0.5 truncate">{value}</p>
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
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-(--bg-card) p-3 border-b border-(--border-color)">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RoleBadge roleName={user.roleId?.name} />
                        <StatusBadge active={user.active} />
                    </div>
                    <div className="text-[11px] text-(--text-muted)">
                        Miembro desde {new Date(user.createdAt).toLocaleDateString('es-AR')}
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-4">
                        {/* Información de Contacto */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información de Contacto
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
                                    label="Email" 
                                    value={user.email}
                                    icon={Mail}
                                />
                                <ContactRow 
                                    label="Teléfono" 
                                    value={user.phone}
                                    icon={Phone}
                                    type="phone"
                                />
                                <ContactRow 
                                    label="WhatsApp" 
                                    value={user.whatsapp}
                                    icon={Phone}
                                    type="whatsapp"
                                />
                            </div>
                        </div>

                        {/* Información de la Cuenta */}
                        <div className="pt-4 border-t border-(--border-color)">
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información de la Cuenta
                            </h3>
                            <div className="space-y-1">
                                {isSuperadmin && (
                                    <InfoRow 
                                        label="Compañía" 
                                        value={user.companyId?.name || 'No especificada'}
                                        icon={Building2}
                                    />
                                )}
                                <InfoRow 
                                    label="Rol" 
                                    value={user.roleId?.name === 'admin' ? 'Administrador' : 
                                          user.roleId?.name === 'cliente' ? 'Usuario de Cliente' : 'Vendedor'}
                                    icon={Shield}
                                />
                                <InfoRow 
                                    label="Estado" 
                                    value={user.active ? 'Activo' : 'Inactivo'}
                                    icon={user.active ? CheckCircle : XCircle}
                                />
                                <InfoRow 
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
                    <div className="space-y-4">
                        {/* Información Laboral */}
                        {(isVendedor || isUserAdmin) && (
                            <div>
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Información Laboral
                                </h3>
                                <div className="space-y-1">
                                    <InfoRow 
                                        label="Comisión" 
                                        value={`${user.commission || 0}%`}
                                        icon={Percent}
                                    />
                                    <InfoRow 
                                        label="Clientes Asignados" 
                                        value={user.assignedClients?.length || 0}
                                        icon={Building2}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Cliente Asociado */}
                        {isCliente && user.clientId && (
                            <div>
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Cliente Asociado
                                </h3>
                                <div className="space-y-1">
                                    <InfoRow 
                                        label="Razón Social" 
                                        value={user.clientId.businessName}
                                        icon={Building2}
                                    />
                                    <InfoRow 
                                        label="CUIT" 
                                        value={user.clientId.cuit}
                                        icon={FileText}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actividad Reciente */}
                        <div className={`${(isVendedor || isUserAdmin || (isCliente && user.clientId)) ? 'pt-4 border-t border-(--border-color)' : ''}`}>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Actividad Reciente
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
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
                                <InfoRow 
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
