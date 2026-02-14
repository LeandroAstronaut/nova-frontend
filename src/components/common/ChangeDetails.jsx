import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Package, Percent, FileText, DollarSign, User, Calendar, Building2, Tag, MapPin, Truck, Phone, Mail, CheckCircle } from 'lucide-react';

const fieldIcons = {
    'items': Package,
    'discount': Percent,
    'notes': FileText,
    'paymentMethod': DollarSign,
    'salesRepId': User,
    'deliveryDate': Calendar,
    // Campos de cliente
    'businessName': Building2,
    'cuit': Tag,
    'code': Tag,
    'email': Mail,
    'phone': Phone,
    'whatsapp': Phone,
    'priceList': DollarSign,
    'contactFirstName': User,
    'contactLastName': User,
    'address': MapPin,
    'shipping': Truck,
    'active': CheckCircle,
    'default': FileText
};

const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (value === '') return '(vacío)';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const ChangeDetails = ({ changes, compact = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!changes || changes.length === 0) {
        return (
            <p className="text-[11px] text-[var(--text-muted)] italic">
                No hay detalles de cambios disponibles
            </p>
        );
    }

    // Si es modo compacto, mostrar solo cantidad de cambios con botón expandir
    if (compact) {
        return (
            <div className="mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                    <span>{changes.length} {changes.length === 1 ? 'cambio' : 'cambios'}</span>
                    <ChevronDown 
                        size={14} 
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 pt-2 border-t border-[var(--border-color)] space-y-2">
                                {changes.map((change, index) => {
                                    const Icon = fieldIcons[change.field] || fieldIcons[change.field?.split('.')[0]] || fieldIcons.default;
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className="flex items-start gap-2 text-[11px]"
                                        >
                                            <div className="w-6 h-6 rounded-md bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                                <Icon size={12} className="text-[var(--text-muted)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--text-primary)]">
                                                    {change.label}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-[var(--text-secondary)]">
                                                    <span className="line-through opacity-60">
                                                        {formatValue(change.from)}
                                                    </span>
                                                    <ArrowRight size={10} className="text-primary-500" />
                                                    <span className="text-primary-600 font-medium">
                                                        {formatValue(change.to)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Modo expandido (para el drawer de actividad)
    return (
        <div className="mt-3 p-3 bg-[var(--bg-hover)] rounded-lg border border-[var(--border-color)]">
            <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-2 uppercase tracking-wider">
                Cambios realizados
            </p>
            <div className="space-y-2">
                {changes.map((change, index) => {
                    const Icon = fieldIcons[change.field] || fieldIcons[change.field?.split('.')[0]] || fieldIcons.default;
                    
                    return (
                        <div 
                            key={index} 
                            className="flex items-start gap-3 p-2 bg-[var(--bg-card)] rounded-lg"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                <Icon size={14} className="text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-[var(--text-primary)]">
                                    {change.label}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 rounded text-[11px] line-through">
                                        {formatValue(change.from)}
                                    </span>
                                    <ArrowRight size={12} className="text-[var(--text-muted)]" />
                                    <span className="px-2 py-0.5 bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded text-[11px] font-medium">
                                        {formatValue(change.to)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChangeDetails;
