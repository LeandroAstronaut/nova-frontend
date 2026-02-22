import React from 'react';
import { FileText, User, Building2, Calendar, DollarSign, History, Tag, Receipt, FileMinus, AlertCircle } from 'lucide-react';

// Helper para obtener iniciales del nombre del cliente
const getClientInitials = (businessName) => {
    if (!businessName) return 'CL';
    const words = businessName.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const StatusBadge = ({ status }) => {
    const styles = {
        activo: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800',
        anulado: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800'
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
        ingreso: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
        egreso: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[type] || styles.ingreso}`}>
            {type === 'ingreso' ? 'Ingreso' : 'Egreso'}
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

const ReceiptDetailContent = ({ receipt }) => {
    if (!receipt) return null;

    const formatAmount = (amount) => {
        return Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const isIncome = receipt.type === 'ingreso';
    const amountColor = isIncome ? 'text-success-600' : 'text-warning-600';
    const amountPrefix = isIncome ? '' : '-';

    return (
        <div className="space-y-0">
            {/* Header Principal - Estilo Cliente */}
            <div className="px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-start gap-4">
                    {/* Iniciales del Cliente */}
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {getClientInitials(receipt.clientId?.businessName)}
                        </span>
                    </div>
                    
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                {/* Nombre del Cliente */}
                                <h1 className="text-[15px] font-bold text-[var(--text-primary)] truncate">
                                    {receipt.clientId?.businessName}
                                </h1>
                                {/* Vendedor */}
                                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                                    Vendedor: <span className="font-medium text-[var(--text-primary)]">{receipt.salesRepId?.firstName} {receipt.salesRepId?.lastName}</span>
                                </p>
                                {/* Status y Fecha */}
                                <div className="flex items-center gap-2 mt-2">
                                    <StatusBadge status={receipt.status} />
                                    <TypeBadge type={receipt.type} />
                                    <span className="text-[11px] text-[var(--text-muted)]">
                                        {new Date(receipt.date).toLocaleDateString('es-AR')}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-lg font-bold ${amountColor}`}>
                                    {amountPrefix}${formatAmount(receipt.amount)}
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                    Monto {receipt.type}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-6">
                        {/* Información del Recibo - Labels font-normal */}
                        <div>
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Información del Recibo
                            </h3>
                            <div className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] p-4 space-y-1">
                                <InfoRowNormal
                                    label="Concepto" 
                                    value={receipt.concept}
                                    icon={FileText}
                                />
                                <InfoRowNormal
                                    label="Método de Pago" 
                                    value={receipt.paymentMethod?.charAt(0).toUpperCase() + receipt.paymentMethod?.slice(1)}
                                    icon={DollarSign}
                                />
                                <InfoRowNormal
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
                            <div>
                                <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Notas
                                </h3>
                                <p className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border-color)]">
                                    {receipt.notes}
                                </p>
                            </div>
                        )}

                        {/* Información de Anulación */}
                        {receipt.status === 'anulado' && (
                            <div>
                                <h3 className="text-[12px] font-bold text-danger-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileMinus size={16} />
                                    Información de Anulación
                                </h3>
                                <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-200 dark:border-danger-800 overflow-hidden">
                                    <InfoRow 
                                        label="Anulado por" 
                                        value={`${receipt.cancelledBy?.firstName} ${receipt.cancelledBy?.lastName}`}
                                        icon={User}
                                    />
                                    {receipt.cancellationReason && (
                                        <>
                                            <div className="border-t border-danger-200 dark:border-danger-800" />
                                            <div className="p-3">
                                                <p className="text-[11px] font-bold text-danger-600 uppercase tracking-wider mb-1">Motivo</p>
                                                <p className="text-[13px] text-danger-700 dark:text-danger-400">{receipt.cancellationReason}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-6">
                        {/* Información General - Estilo con icono y label/valor */}
                        <div>
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Información General
                            </h3>
                            <div className="space-y-1">
                                {receipt.paymentMethod && (
                                    <InfoRowNormal
                                        label="Método de Pago"
                                        value={receipt.paymentMethod?.charAt(0).toUpperCase() + receipt.paymentMethod?.slice(1)}
                                        icon={DollarSign}
                                    />
                                )}
                                {receipt.updatedAt && receipt.updatedAt !== receipt.createdAt && (
                                    <InfoRowNormal
                                        label="Última Actualización"
                                        value={new Date(receipt.updatedAt).toLocaleString('es-AR', { 
                                            day: '2-digit', 
                                            month: '2-digit', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        icon={History}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Historial - Estilo con icono y label/valor */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Historial
                            </h3>
                            <div className="space-y-1">
                                {/* Creado */}
                                <div className="flex items-center gap-3 py-2">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                        <FileText size={16} className="text-[var(--text-muted)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-normal text-[var(--text-muted)] uppercase tracking-wider">Creado</p>
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                            {receipt.createdBy?.firstName ? `${receipt.createdBy.firstName} ${receipt.createdBy.lastName}` : 'Sistema'}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)]">
                                            {new Date(receipt.createdAt).toLocaleString('es-AR', { 
                                                day: '2-digit', 
                                                month: '2-digit', 
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-success-500 shrink-0"></div>
                                </div>
                                
                                {/* Anulado */}
                                {receipt.status === 'anulado' && (
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                            <FileMinus size={16} className="text-[var(--text-muted)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-normal text-[var(--text-muted)] uppercase tracking-wider">Anulado</p>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                                                {receipt.cancelledBy?.firstName ? `${receipt.cancelledBy.firstName} ${receipt.cancelledBy.lastName}` : 'Sistema'}
                                            </p>
                                            <p className="text-[11px] text-[var(--text-secondary)]">
                                                {new Date(receipt.cancelledAt).toLocaleString('es-AR', { 
                                                    day: '2-digit', 
                                                    month: '2-digit', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-danger-500 shrink-0"></div>
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
