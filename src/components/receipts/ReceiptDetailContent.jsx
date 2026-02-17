import React from 'react';
import { FileText, User, Building2, Calendar, DollarSign, History, Tag } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        activo: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800',
        anulado: 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800'
    };

    const labels = {
        activo: 'Activo',
        anulado: 'Anulado'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.activo}`}>
            {labels[status] || status}
        </span>
    );
};

const TypeBadge = ({ type }) => {
    const styles = {
        ingreso: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800',
        egreso: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border-warning-100 dark:border-warning-800'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[type] || styles.ingreso}`}>
            {type === 'ingreso' ? 'Ingreso' : 'Egreso'}
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

const ReceiptDetailContent = ({ receipt }) => {
    if (!receipt) return null;

    return (
        <div className="space-y-4">
            {/* Header de la card */}
            <div className="bg-(--bg-card) p-3 border-b border-(--border-color)">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <StatusBadge status={receipt.status} />
                        <TypeBadge type={receipt.type} />
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-(--text-muted) font-bold uppercase tracking-wider">Monto</p>
                        <p className={`text-lg font-bold ${receipt.type === 'ingreso' ? 'text-success-600' : 'text-warning-600'}`}>
                            {receipt.type === 'egreso' ? '-' : ''}${receipt.amount.toLocaleString('es-AR')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-4">
                        {/* Información del Recibo */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información del Recibo
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
                                    label="Concepto" 
                                    value={receipt.concept}
                                    icon={FileText}
                                />
                                <InfoRow 
                                    label="Método de Pago" 
                                    value={receipt.paymentMethod?.charAt(0).toUpperCase() + receipt.paymentMethod?.slice(1)}
                                    icon={DollarSign}
                                />
                                <InfoRow 
                                    label="Fecha" 
                                    value={new Date(receipt.date).toLocaleDateString('es-AR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                    icon={Calendar}
                                />
                            </div>
                        </div>

                        {/* Notas */}
                        {receipt.notes && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Notas
                                </h3>
                                <p className="text-[12px] text-(--text-secondary) whitespace-pre-wrap bg-(--bg-hover) p-3 rounded-xl">
                                    {receipt.notes}
                                </p>
                            </div>
                        )}

                        {/* Información de Anulación */}
                        {receipt.status === 'anulado' && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-danger-600 uppercase tracking-wider mb-3">
                                    Información de Anulación
                                </h3>
                                <div className="space-y-1">
                                    <InfoRow 
                                        label="Anulado por" 
                                        value={`${receipt.cancelledBy?.firstName} ${receipt.cancelledBy?.lastName}`}
                                        icon={User}
                                    />
                                    {receipt.cancellationReason && (
                                        <div className="mt-2 p-2 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-100 dark:border-danger-800">
                                            <p className="text-[10px] font-bold text-danger-600 uppercase tracking-wider mb-1">Motivo</p>
                                            <p className="text-[12px] text-danger-700 dark:text-danger-400">{receipt.cancellationReason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-4">
                        {/* Información de Terceros */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información de Terceros
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
                                    label="Cliente" 
                                    value={receipt.clientId?.businessName}
                                    icon={Building2}
                                />
                                <InfoRow 
                                    label="Vendedor" 
                                    value={`${receipt.salesRepId?.firstName} ${receipt.salesRepId?.lastName}`}
                                    icon={User}
                                />
                            </div>
                        </div>

                        {/* Historial */}
                        <div className="pt-4 border-t border-(--border-color)">
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3 flex items-center gap-2">
                                <History size={12} />
                                Historial
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[11px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success-500"></div>
                                    <span className="text-(--text-muted)">Creado</span>
                                    <span className="ml-auto text-(--text-secondary) text-[10px]">
                                        {new Date(receipt.createdAt).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                {receipt.status === 'anulado' && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-danger-500"></div>
                                        <span className="text-(--text-muted)">Anulado</span>
                                        <span className="ml-auto text-(--text-secondary) text-[10px]">
                                            {new Date(receipt.cancelledAt).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptDetailContent;
