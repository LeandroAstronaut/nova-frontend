import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Send, MessageCircle, Ban, FileText, User, Building2, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { getReceipt, cancelReceipt, sendReceiptEmail } from '../../services/receiptService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import OrderActivityDrawer from '../../components/orders/OrderActivityDrawer';
import SendEmailModal from '../../components/receipts/SendEmailModal';
import SendWhatsAppModal from '../../components/receipts/SendWhatsAppModal';
import { generateReceiptPDF } from '../../utils/receiptPdfGenerator';

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
    <div className="flex items-start gap-3 py-3 border-b border-(--border-color) last:border-0">
        {Icon && (
            <div className="w-8 h-8 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                <Icon size={16} className="text-(--text-muted)" />
            </div>
        )}
        <div className="flex-1">
            <p className="text-[11px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
            <p className="text-[13px] font-semibold text-(--text-primary) mt-0.5">{value || '-'}</p>
        </div>
    </div>
);

const ReceiptDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelModal, setCancelModal] = useState({ isOpen: false, reason: '', loading: false });
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    const isCreator = receipt?.createdBy?._id === user?.id;
    // Solo el creador puede anular el recibo (tanto admin como vendedor)
    const canCancel = receipt?.status === 'activo' && isCreator;

    const handleSendEmail = () => setIsEmailModalOpen(true);
    const handleSendWhatsApp = () => setIsWhatsAppModalOpen(true);

    const handleConfirmSendEmail = async ({ notifications }) => {
        try {
            setEmailLoading(true);
            const result = await sendReceiptEmail(receipt._id, notifications);
            addToast(`Email enviado exitosamente a ${result.sent} destinatario(s)`, 'success');
            setIsEmailModalOpen(false);
        } catch (error) {
            console.error('Error sending email:', error);
            addToast('Error al enviar email: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setEmailLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipt();
    }, [id]);

    const fetchReceipt = async () => {
        try {
            setLoading(true);
            const data = await getReceipt(id);
            setReceipt(data);
        } catch (error) {
            console.error('Error fetching receipt:', error);
            addToast('Error al cargar el recibo', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintPDF = () => {
        try {
            generateReceiptPDF(receipt);
        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast('Error al generar PDF: ' + error.message, 'error');
        }
    };

    const handleCancel = () => {
        if (!canCancel) {
            addToast('No tiene permisos para anular este recibo', 'error');
            return;
        }
        setCancelModal({ isOpen: true, reason: '', loading: false });
    };

    const handleCancelConfirm = async () => {
        try {
            setCancelModal(prev => ({ ...prev, loading: true }));
            await cancelReceipt(receipt._id, cancelModal.reason);
            addToast('Recibo anulado exitosamente', 'success');
            setCancelModal({ isOpen: false, reason: '', loading: false });
            fetchReceipt();
        } catch (error) {
            console.error('Error cancelling receipt:', error);
            addToast('Error al anular: ' + (error.response?.data?.message || error.message), 'error');
            setCancelModal({ isOpen: false, reason: '', loading: false });
        }
    };

    const handleViewActivity = () => {
        setIsActivityDrawerOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!receipt) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                                Recibo #{String(receipt.receiptNumber).padStart(5, '0')}
                            </h1>
                            <StatusBadge status={receipt.status} />
                            <TypeBadge type={receipt.type} />
                        </div>
                        <p className="text-[13px] text-(--text-secondary) mt-0.5">
                            {receipt.clientId?.businessName} • {new Date(receipt.date).toLocaleDateString('es-AR')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        onClick={handlePrintPDF}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <Printer size={14} strokeWidth={2.5} />
                        PDF
                    </Button>

                    {receipt.status === 'activo' && (
                        <>
                            <Button 
                                variant="secondary" 
                                onClick={handleSendEmail}
                                className="px-3! text-[11px] font-bold uppercase tracking-wider"
                            >
                                <Send size={14} strokeWidth={2.5} />
                                Email
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={handleSendWhatsApp}
                                className="px-3! text-[11px] font-bold uppercase tracking-wider"
                            >
                                <MessageCircle size={14} strokeWidth={2.5} />
                                WhatsApp
                            </Button>
                        </>
                    )}

                    {canCancel && (
                        <Button 
                            variant="secondary" 
                            onClick={handleCancel}
                            className="px-3! text-[11px] font-bold uppercase tracking-wider text-danger-600 hover:text-danger-700"
                        >
                            <Ban size={14} strokeWidth={2.5} />
                            Anular
                        </Button>
                    )}

                    <Button 
                        variant="secondary" 
                        onClick={handleViewActivity}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <FileText size={14} strokeWidth={2.5} />
                        Actividad
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Header de la card */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <StatusBadge status={receipt.status} />
                            <TypeBadge type={receipt.type} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider">Monto</p>
                            <p className={`text-xl font-black ${receipt.type === 'ingreso' ? 'text-success-600' : 'text-warning-600'}`}>
                                {receipt.type === 'egreso' ? '-' : ''}${receipt.amount.toLocaleString('es-AR')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna izquierda */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Información del Recibo
                                </h3>
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

                            {receipt.notes && (
                                <div className="pt-6 border-t border-(--border-color)">
                                    <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                        Notas
                                    </h3>
                                    <p className="text-(--text-secondary) whitespace-pre-wrap bg-(--bg-hover) p-4 rounded-xl">
                                        {receipt.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Columna derecha */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Información de Terceros
                                </h3>
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

                            <div className="pt-6 border-t border-(--border-color)">
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Historial
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-success-500"></div>
                                        <span className="text-(--text-muted)">Creado</span>
                                        <span className="ml-auto text-(--text-secondary) text-[11px]">
                                            {new Date(receipt.createdAt).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    {receipt.status === 'anulado' && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-danger-500"></div>
                                            <span className="text-(--text-muted)">Anulado</span>
                                            <span className="ml-auto text-(--text-secondary) text-[11px]">
                                                {new Date(receipt.cancelledAt).toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {receipt.status === 'anulado' && (
                                <div className="pt-6 border-t border-(--border-color)">
                                    <h3 className="text-sm font-bold text-danger-600 uppercase tracking-wider mb-4">
                                        Información de Anulación
                                    </h3>
                                    <InfoRow 
                                        label="Anulado por" 
                                        value={`${receipt.cancelledBy?.firstName} ${receipt.cancelledBy?.lastName}`}
                                        icon={User}
                                    />
                                    {receipt.cancellationReason && (
                                        <div className="mt-3 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-100 dark:border-danger-800">
                                            <p className="text-[11px] font-bold text-danger-600 uppercase tracking-wider mb-1">Motivo</p>
                                            <p className="text-sm text-danger-700 dark:text-danger-400">{receipt.cancellationReason}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover)">
                    <p className="text-[11px] text-(--text-muted) text-center font-medium">
                        Última actualización: {new Date(receipt.updatedAt).toLocaleString('es-AR')}
                    </p>
                </div>
            </div>

            {/* Cancel Modal */}
            <ConfirmModal
                isOpen={cancelModal.isOpen}
                onClose={() => setCancelModal({ isOpen: false, reason: '', loading: false })}
                onConfirm={handleCancelConfirm}
                title="¿Anular Recibo?"
                description={
                    <div className="space-y-3">
                        <p>Está a punto de anular el recibo #{String(receipt.receiptNumber).padStart(5, '0')}. Esta acción no se puede deshacer.</p>
                        <div>
                            <label className="block text-xs font-medium text-(--text-muted) mb-1">Motivo (opcional)</label>
                            <textarea
                                value={cancelModal.reason}
                                onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full p-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm"
                                rows={2}
                                placeholder="Ingrese el motivo de anulación..."
                            />
                        </div>
                    </div>
                }
                confirmText={cancelModal.loading ? 'Anulando...' : 'Sí, anular'}
                type="danger"
            />

            {/* Activity Drawer */}
            <OrderActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => setIsActivityDrawerOpen(false)}
                entityType="receipt"
                entityId={receipt._id}
                entityNumber={receipt.receiptNumber}
                clientName={receipt.clientId?.businessName}
            />

            {/* Email Modal */}
            <SendEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onConfirm={handleConfirmSendEmail}
                receipt={receipt}
                loading={emailLoading}
            />

            {/* WhatsApp Modal */}
            <SendWhatsAppModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                receipt={receipt}
            />
        </div>
    );
};

export default ReceiptDetailPage;
