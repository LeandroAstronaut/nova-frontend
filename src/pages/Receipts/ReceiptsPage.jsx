import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Download,
    MoreHorizontal,
    Send,
    Printer,
    MessageCircle,
    X,
    FileText,
    Ban
} from 'lucide-react';
import { getReceipts, cancelReceipt, createReceipt, sendReceiptEmail } from '../../services/receiptService';
import { getClients } from '../../services/orderService';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import ReceiptDrawer from '../../components/receipts/ReceiptDrawer';
import SendEmailModal from '../../components/receipts/SendEmailModal';
import SendWhatsAppModal from '../../components/receipts/SendWhatsAppModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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

const ReceiptsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin';
    const isVendedor = user?.role?.name === 'vendedor';
    const isClient = user?.role?.name === 'cliente';

    const [receipts, setReceipts] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modales
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [cancelModal, setCancelModal] = useState({ isOpen: false, receipt: null, reason: '', loading: false });
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [receiptData, clientData] = await Promise.all([
                getReceipts(),
                getClients()
            ]);
            setReceipts(receiptData);
            
            // Filtrar clientes según el rol
            // Vendedor: solo sus clientes, Admin: todos
            if (isVendedor) {
                setClients(clientData.filter(c => c.salesRepId === user.id || c.salesRepId?._id === user.id));
            } else {
                setClients(clientData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReceipt = async (receiptData) => {
        try {
            await createReceipt(receiptData);
            addToast('Recibo creado exitosamente', 'success');
            setIsDrawerOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating receipt:', error);
            addToast('Error al crear recibo: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const handleCancelClick = (receipt) => {
        // Solo el creador puede anular (tanto admin como vendedor)
        if (receipt.createdBy._id !== user.id) {
            addToast('Solo el creador del recibo puede anularlo', 'error');
            return;
        }
        setCancelModal({ isOpen: true, receipt, reason: '', loading: false });
    };

    const handleCancelConfirm = async () => {
        try {
            setCancelModal(prev => ({ ...prev, loading: true }));
            await cancelReceipt(cancelModal.receipt._id, cancelModal.reason);
            addToast('Recibo anulado exitosamente', 'success');
            setCancelModal({ isOpen: false, receipt: null, reason: '', loading: false });
            fetchData();
        } catch (error) {
            console.error('Error cancelling receipt:', error);
            addToast('Error al anular: ' + (error.response?.data?.message || error.message), 'error');
            setCancelModal({ isOpen: false, receipt: null, reason: '', loading: false });
        }
    };

    const handleViewReceipt = (receipt) => {
        navigate(`/recibos/${receipt._id}`);
    };

    const handlePrintPDF = (receipt) => {
        try {
            generateReceiptPDF(receipt);
        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast('Error al generar PDF: ' + error.message, 'error');
        }
    };

    const handleSendEmail = (receipt) => {
        setSelectedReceipt(receipt);
        setIsEmailModalOpen(true);
    };

    const handleSendWhatsApp = (receipt) => {
        setSelectedReceipt(receipt);
        setIsWhatsAppModalOpen(true);
    };

    const handleConfirmSendEmail = async ({ receiptId, notifications }) => {
        try {
            setEmailLoading(true);
            const result = await sendReceiptEmail(receiptId, notifications);
            addToast(`Email enviado exitosamente a ${result.sent} destinatario(s)`, 'success');
            setIsEmailModalOpen(false);
        } catch (error) {
            console.error('Error sending email:', error);
            addToast('Error al enviar email: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setEmailLoading(false);
        }
    };

    // Filtrar recibos por búsqueda en todas las columnas
    const filteredReceipts = receipts.filter(receipt => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            receipt.receiptNumber?.toString().includes(term) ||
            receipt.clientId?.businessName?.toLowerCase().includes(term) ||
            receipt.type?.toLowerCase().includes(term) ||
            receipt.status?.toLowerCase().includes(term) ||
            receipt.amount?.toString().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                        Recibos
                        {isSuperadmin && <span className="ml-2 text-sm font-normal text-primary-600">(Todas las compañías)</span>}
                    </h1>
                    <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                        Gestione los recibos de ingreso y egreso de su empresa.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!isSuperadmin && !isClient && (
                        <Button
                            variant="primary"
                            onClick={() => setIsDrawerOpen(true)}
                            className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            Nuevo Recibo
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Filters */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="flex justify-end">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={14} strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full pl-9 pr-4 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-medium text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Vista Desktop - Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--bg-hover) text-[10px] font-bold text-(--text-muted) uppercase tracking-widest border-y border-(--border-color)">
                                <th className="px-6 py-3">Número</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={7} className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-(--text-muted)">
                                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                                Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredReceipts.length > 0 ? (
                                filteredReceipts.map((receipt) => (
                                    <tr 
                                        key={receipt._id} 
                                        className="hover:bg-(--bg-hover) transition-colors group cursor-pointer"
                                        onClick={() => handleViewReceipt(receipt)}
                                    >
                                        <td className="px-6 py-4 font-bold text-(--text-primary) text-[13px]">
                                            #{String(receipt.receiptNumber).padStart(5, '0')}
                                        </td>
                                        <td className="px-6 py-4 text-[12px] text-(--text-secondary)">
                                            {new Date(receipt.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[13px] font-semibold text-(--text-primary)">{receipt.clientId?.businessName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <TypeBadge type={receipt.type} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-(--text-primary) text-[13px]">
                                            ${receipt.amount.toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={receipt.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePrintPDF(receipt); }}
                                                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                    title="Imprimir PDF"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                {receipt.status === 'activo' && !isClient && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSendEmail(receipt); }}
                                                            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                            title="Enviar Email"
                                                        >
                                                            <Send size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(receipt); }}
                                                            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                            title="Enviar WhatsApp"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </button>
                                                        {/* Solo el creador puede anular */}
                                                        {receipt.createdBy._id === user.id && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCancelClick(receipt); }}
                                                                className="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all"
                                                                title="Anular"
                                                            >
                                                                <Ban size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="text-(--text-muted) text-[11px] font-bold uppercase tracking-widest bg-(--bg-hover) w-fit mx-auto px-4 py-2 rounded-lg border border-(--border-color)">
                                            No se encontraron recibos
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Vista Mobile - Cards */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="p-6 text-center">
                            <div className="flex items-center justify-center gap-2 text-(--text-muted)">
                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                Cargando...
                            </div>
                        </div>
                    ) : filteredReceipts.length > 0 ? (
                        <div className="divide-y divide-(--border-color)">
                            {filteredReceipts.map((receipt) => (
                                <div 
                                    key={receipt._id} 
                                    className="p-4 hover:bg-(--bg-hover) transition-colors cursor-pointer"
                                    onClick={() => handleViewReceipt(receipt)}
                                >
                                    {/* Header: Numero, Tipo y Estado */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-(--text-primary) text-[15px]">
                                                #{String(receipt.receiptNumber).padStart(5, '0')}
                                            </span>
                                            <TypeBadge type={receipt.type} />
                                        </div>
                                        <StatusBadge status={receipt.status} />
                                    </div>
                                    
                                    {/* Cliente */}
                                    <div className="mb-2">
                                        <div className="text-[14px] font-bold text-(--text-primary)">{receipt.clientId?.businessName}</div>
                                    </div>
                                    
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                                        <div>
                                            <span className="text-(--text-muted)">Fecha:</span>
                                            <span className="ml-1 font-semibold text-(--text-secondary)">{new Date(receipt.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-(--text-muted)">Monto:</span>
                                            <span className="ml-1 font-bold text-(--text-primary) text-[14px]">${receipt.amount.toLocaleString('es-AR')}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Acciones */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border-color)">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePrintPDF(receipt); }}
                                            className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                            title="Imprimir PDF"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        {receipt.status === 'activo' && !isClient && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSendEmail(receipt); }}
                                                    className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                    title="Enviar Email"
                                                >
                                                    <Send size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(receipt); }}
                                                    className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageCircle size={18} />
                                                </button>
                                                {receipt.createdBy._id === user.id && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancelClick(receipt); }}
                                                        className="p-2 rounded-lg text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all"
                                                        title="Anular"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <div className="text-(--text-muted) text-[11px] font-bold uppercase tracking-widest bg-(--bg-hover) w-fit mx-auto px-4 py-2 rounded-lg border border-(--border-color)">
                                No se encontraron recibos
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover)">
                    <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        Total {filteredReceipts.length} registros
                    </span>
                </div>
            </div>

            {/* Receipt Drawer */}
            <ReceiptDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleCreateReceipt}
                clients={clients}
            />

            {/* Cancel Modal */}
            <ConfirmModal
                isOpen={cancelModal.isOpen}
                onClose={() => setCancelModal({ isOpen: false, receipt: null, reason: '', loading: false })}
                onConfirm={handleCancelConfirm}
                title="¿Anular Recibo?"
                description={
                    <div className="space-y-3">
                        <p>Está a punto de anular el recibo #{String(cancelModal.receipt?.receiptNumber || '').padStart(5, '0')}. Esta acción no se puede deshacer.</p>
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

            {/* Email Modal */}
            <SendEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onConfirm={handleConfirmSendEmail}
                receipt={selectedReceipt}
                loading={emailLoading}
            />

            {/* WhatsApp Modal */}
            <SendWhatsAppModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                receipt={selectedReceipt}
            />
        </div>
    );
};

export default ReceiptsPage;
