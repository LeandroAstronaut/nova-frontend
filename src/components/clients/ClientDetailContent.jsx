import React from 'react';
import { Mail, Phone, MapPin, Building2, Truck, User, Percent, Calendar, Tag, Briefcase, MessageCircle } from 'lucide-react';

// Helper para obtener iniciales del cliente
const getClientInitials = (businessName) => {
    if (!businessName) return 'CL';
    const words = businessName.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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

// Componente para filas de contacto con accion
const ContactRow = ({ label, value, icon: Icon, type }) => {
    if (!value) return <InfoRow label={label} value={value} icon={Icon} />;
    
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
    if (!value) return <InfoRowNormal label={label} value={value} icon={Icon} />;
    
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

const ClientDetailContent = ({ client, showCompany = false }) => {
    if (!client) return null;

    return (
        <div className="space-y-0">
            {/* Header Principal - Estilo OrderDetail */}
            <div className="px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-start gap-4">
                    {/* Iniciales del Cliente */}
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {getClientInitials(client.businessName)}
                        </span>
                    </div>
                    
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                {/* Nombre del Cliente */}
                                <h1 className="text-[15px] font-bold text-[var(--text-primary)] truncate">
                                    {client.businessName}
                                </h1>
                                {/* CUIT */}
                                {client.cuit && (
                                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                                        CUIT: <span className="font-medium text-[var(--text-primary)]">{client.cuit}</span>
                                    </p>
                                )}
                                {/* Status y Lista de Precios */}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <StatusBadge active={client.active} />
                                    <span className="text-[11px] text-[var(--text-muted)]">
                                        Lista {client.priceList || 1}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Descuento a la derecha */}
                            {client.discount > 0 && (
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-primary-600">
                                        {client.discount}%
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        Descuento
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-3 md:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda - Contacto primero */}
                    <div className="space-y-6">
                        {/* Contacto */}
                        <div>
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Contacto
                            </h3>
                            <div className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] p-4">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-color)]">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-sm">
                                        {client.contactFirstName?.[0] || client.businessName?.[0] || 'C'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                                            {client.contactFirstName} {client.contactLastName}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)]">Persona de contacto</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <InfoRowNormal label="Email" value={client.email} icon={Mail} />
                                    <ContactRowNormal label="Teléfono" value={client.phone} icon={Phone} type="phone" />
                                    <ContactRowNormal label="WhatsApp" value={client.whatsapp} icon={Phone} type="whatsapp" />
                                </div>
                            </div>
                        </div>

                        {/* Información General - Labels font-normal */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Información General
                            </h3>
                            <div className="space-y-1">
                                <InfoRowNormal 
                                    label="Razón Social" 
                                    value={client.businessName}
                                    icon={Building2}
                                />
                                <InfoRowNormal 
                                    label="CUIT" 
                                    value={client.cuit}
                                    icon={Tag}
                                />
                                <InfoRowNormal 
                                    label="Código" 
                                    value={client.code}
                                    icon={Tag}
                                />
                                <InfoRowNormal 
                                    label="Descuento" 
                                    value={client.discount > 0 ? `${client.discount}%` : 'Sin descuento'}
                                    icon={Percent}
                                />
                                <InfoRowNormal 
                                    label="Lista de Precios" 
                                    value={`Lista ${client.priceList || 1}`}
                                    icon={Tag}
                                />
                                <InfoRowNormal 
                                    label="Fecha de Creación" 
                                    value={new Date(client.createdAt).toLocaleDateString('es-AR')}
                                    icon={Calendar}
                                />
                                {showCompany && client.companyId && (
                                    <InfoRowNormal 
                                        label="Compañía" 
                                        value={client.companyId?.name}
                                        icon={Building2}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Dirección - Labels font-normal */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Dirección
                            </h3>
                            <div className="space-y-1">
                                <InfoRowNormal 
                                    label="Domicilio" 
                                    value={client.address?.street}
                                    icon={MapPin}
                                />
                                <InfoRowNormal 
                                    label="Localidad" 
                                    value={client.address?.city}
                                    icon={MapPin}
                                />
                                <InfoRowNormal 
                                    label="Provincia" 
                                    value={client.address?.province}
                                    icon={MapPin}
                                />
                                <InfoRowNormal 
                                    label="Código Postal" 
                                    value={client.address?.postalCode}
                                    icon={MapPin}
                                />
                            </div>
                        </div>

                        {/* Transporte */}
                        {client.shipping?.company && (
                            <div className="pt-4 border-t border-[var(--border-color)]">
                                <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Transporte
                                </h3>
                                <div className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                                    <InfoRow 
                                        label="Empresa" 
                                        value={client.shipping?.company}
                                        icon={Truck}
                                    />
                                    <div className="border-t border-[var(--border-color)]" />
                                    <InfoRow 
                                        label="Teléfono" 
                                        value={client.shipping?.phone}
                                        icon={Phone}
                                    />
                                    <div className="border-t border-[var(--border-color)]" />
                                    <InfoRow 
                                        label="Dirección de Entrega" 
                                        value={client.shipping?.address}
                                        icon={MapPin}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Vendedor Asignado primero */}
                    <div className="space-y-6">
                        {/* Vendedor Asignado */}
                        {client.salesRepId && (
                            <div>
                                <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Vendedor Asignado
                                </h3>
                                <div className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm">
                                            {client.salesRepId?.firstName?.[0]}{client.salesRepId?.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                                                {client.salesRepId?.firstName} {client.salesRepId?.lastName}
                                            </p>
                                            <p className="text-[11px] text-[var(--text-muted)] truncate">{client.salesRepId?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Información del Sistema */}
                        <div className={client.salesRepId ? 'pt-2' : ''}>
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Información del Sistema
                            </h3>
                            <div className="space-y-1">
                                <InfoRowNormal 
                                    label="Creado Por" 
                                    value={`${client.createdBy?.firstName || ''} ${client.createdBy?.lastName || ''}`.trim() || 'Sistema'}
                                    icon={User}
                                />
                                <InfoRowNormal 
                                    label="Fecha de Creación" 
                                    value={new Date(client.createdAt).toLocaleDateString('es-AR', { 
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
                </div>
            </div>
        </div>
    );
};

export default ClientDetailContent;
