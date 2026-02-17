import React from 'react';
import { Mail, Phone, MapPin, Building2, Truck, User, Percent, Calendar, Tag, Briefcase, MessageCircle } from 'lucide-react';

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
    if (!value) return <InfoRow label={label} value={value} icon={Icon} />;
    
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

const ClientDetailContent = ({ client, showCompany = false }) => {
    if (!client) return null;

    return (
        <div className="space-y-4">
            {/* Header de la card */}
            <div className="bg-(--bg-card) p-3 border-b border-(--border-color)">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <StatusBadge active={client.active} />
                        {client.discount > 0 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-primary-50 dark:bg-primary-900/30 text-primary-600 border-primary-100 dark:border-primary-800">
                                {client.discount}% Descuento
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-(--text-muted)">
                        <span>Lista de Precios: <strong className="text-(--text-primary)">{client.priceList || 1}</strong></span>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda - Contacto primero */}
                    <div className="space-y-4">
                        {/* Contacto */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Contacto
                            </h3>
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-(--border-color)">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-lg">
                                    {client.contactFirstName?.[0] || client.businessName?.[0] || 'C'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-(--text-primary) truncate">
                                        {client.contactFirstName} {client.contactLastName}
                                    </p>
                                    <p className="text-[11px] text-(--text-muted)">Persona de contacto</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <InfoRow label="Email" value={client.email} icon={Mail} />
                                <ContactRow label="Teléfono" value={client.phone} icon={Phone} type="phone" />
                                <ContactRow label="WhatsApp" value={client.whatsapp} icon={Phone} type="whatsapp" />
                            </div>
                        </div>

                        {/* Información General */}
                        <div className="pt-4 border-t border-(--border-color)">
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información General
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
                                    label="Razón Social" 
                                    value={client.businessName}
                                    icon={Building2}
                                />
                                <InfoRow 
                                    label="CUIT" 
                                    value={client.cuit}
                                    icon={Tag}
                                />
                                <InfoRow 
                                    label="Código" 
                                    value={client.code}
                                    icon={Tag}
                                />
                                <InfoRow 
                                    label="Descuento" 
                                    value={client.discount > 0 ? `${client.discount}%` : 'Sin descuento'}
                                    icon={Percent}
                                />
                                <InfoRow 
                                    label="Lista de Precios" 
                                    value={`Lista ${client.priceList || 1}`}
                                    icon={Tag}
                                />
                                <InfoRow 
                                    label="Fecha de Creación" 
                                    value={new Date(client.createdAt).toLocaleDateString('es-AR')}
                                    icon={Calendar}
                                />
                                {showCompany && client.companyId && (
                                    <InfoRow 
                                        label="Compañía" 
                                        value={client.companyId?.name}
                                        icon={Building2}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Dirección */}
                        <div className="pt-4 border-t border-(--border-color)">
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Dirección
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
                                    label="Domicilio" 
                                    value={client.address?.street}
                                    icon={MapPin}
                                />
                                <InfoRow 
                                    label="Localidad" 
                                    value={client.address?.city}
                                    icon={MapPin}
                                />
                                <InfoRow 
                                    label="Provincia" 
                                    value={client.address?.province}
                                    icon={MapPin}
                                />
                                <InfoRow 
                                    label="Código Postal" 
                                    value={client.address?.postalCode}
                                    icon={MapPin}
                                />
                            </div>
                        </div>

                        {/* Transporte */}
                        {client.shipping?.company && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Transporte
                                </h3>
                                <div className="space-y-1">
                                    <InfoRow 
                                        label="Empresa" 
                                        value={client.shipping?.company}
                                        icon={Truck}
                                    />
                                    <InfoRow 
                                        label="Teléfono" 
                                        value={client.shipping?.phone}
                                        icon={Phone}
                                    />
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
                    <div className="space-y-4">
                        {/* Vendedor Asignado */}
                        {client.salesRepId && (
                            <div>
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Vendedor Asignado
                                </h3>
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-(--border-color)">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-lg">
                                        {client.salesRepId?.firstName?.[0]}{client.salesRepId?.lastName?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-(--text-primary) truncate">
                                            {client.salesRepId?.firstName} {client.salesRepId?.lastName}
                                        </p>
                                        <p className="text-[11px] text-(--text-muted) truncate">{client.salesRepId?.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Información del Sistema */}
                        <div className={client.salesRepId ? 'pt-2' : ''}>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información del Sistema
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                                        <User size={14} className="text-(--text-muted)" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">Creado por</p>
                                        <p className="text-[12px] font-semibold text-(--text-secondary) mt-0.5">{client.createdBy?.firstName} {client.createdBy?.lastName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                                        <Calendar size={14} className="text-(--text-muted)" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">Fecha de creación</p>
                                        <p className="text-[12px] font-semibold text-(--text-secondary) mt-0.5">
                                            {new Date(client.createdAt).toLocaleDateString('es-AR', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailContent;
