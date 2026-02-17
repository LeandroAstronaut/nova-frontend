import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Ban,
    Eye,
    History
} from 'lucide-react';
import { getReceipts, cancelReceipt, createReceipt, sendReceiptEmail } from '../../services/receiptService';
import { getClients } from '../../services/orderService';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import ReceiptDrawer from '../../components/receipts/ReceiptDrawer';
import SendEmailModal from '../../components/receipts/SendEmailModal';
import SendWhatsAppModal from '../../components/receipts/SendWhatsAppModal';
import OrderActivityDrawer from '../../components/orders/OrderActivityDrawer';
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
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    // Pagination State
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    // Modales
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [cancelModal, setCancelModal] = useState({ isOpen: false, receipt: null, reason: '', loading: false });
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [exportMenu, setExportMenu] = useState({ open: false, position: null });
    
    // Action Menu state
    const [openMenu, setOpenMenu] = useState({ id: null, position: null, openAbove: false });
    
    // Activity Drawer state
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [selectedReceiptForActivity, setSelectedReceiptForActivity] = useState(null);

    useEffect(() => {
        fetchData();
    }, [pagination.page, debouncedSearchTerm]);

    // Debounce para el término de búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [receiptData, clientData] = await Promise.all([
                getReceipts({ 
                    page: pagination.page, 
                    limit: pagination.limit,
                    search: debouncedSearchTerm || undefined
                }),
                getClients()
            ]);
            
            setReceipts(receiptData.receipts || []);
            setPagination(prev => ({
                ...prev,
                total: receiptData.pagination?.total || 0,
                totalPages: receiptData.pagination?.totalPages || 0
            }));
            
            // Asegurar que clientData sea un array
            const clientsArray = Array.isArray(clientData) ? clientData : (clientData?.clients || []);
            
            // Filtrar clientes según el rol
            // Vendedor: solo sus clientes, Admin: todos
            if (isVendedor) {
                setClients(clientsArray.filter(c => c.salesRepId === user.id || c.salesRepId?._id === user.id));
            } else {
                setClients(clientsArray);
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

    const handleOpenExportMenu = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const menuWidth = 192;
        
        let leftPosition = rect.left - menuWidth + rect.width;
        
        if (leftPosition + menuWidth > windowWidth) {
            leftPosition = windowWidth - menuWidth - 16;
        }
        
        if (leftPosition < 8) {
            leftPosition = 8;
        }
        
        setExportMenu({
            open: true,
            position: {
                top: rect.bottom + 8,
                left: leftPosition
            }
        });
    };

    const handleOpenMenu = (e, receiptId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const menuHeight = 200;
        
        const openAbove = (rect.bottom + menuHeight) > windowHeight;
        
        setOpenMenu({
            id: receiptId,
            position: {
                top: rect.bottom + 8,
                left: rect.left - 160 + rect.width
            },
            openAbove
        });
    };

    const handleViewActivity = (receipt) => {
        setSelectedReceiptForActivity(receipt);
        setIsActivityDrawerOpen(true);
    };

    const handleExport = () => {
        const headers = ['Número', 'Fecha', 'Cliente', 'Tipo', 'Monto', 'Estado'];
        const rows = receipts.map(receipt => [
            `#${String(receipt.receiptNumber).padStart(5, '0')}`,
            new Date(receipt.date).toLocaleDateString(),
            receipt.clientId?.businessName || 'N/A',
            receipt.type === 'ingreso' ? 'Ingreso' : 'Egreso',
            receipt.amount,
            receipt.status === 'activo' ? 'Activo' : 'Anulado'
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `recibos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        setExportMenu({ open: false, position: null });
    };

    // Nota: El filtrado ahora se hace en el backend

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
                    {/* Menú de 3 puntitos - Exportar */}
                    {!isSuperadmin && !isClient && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenExportMenu(e);
                                }}
                                className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all border border-(--border-color)"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {exportMenu.open && (
                                <ActionMenu
                                    items={[{
                                        icon: <Download size={16} />,
                                        label: 'Exportar a CSV',
                                        onClick: handleExport
                                    }]}
                                    position={exportMenu.position}
                                    onClose={() => setExportMenu({ open: false, position: null })}
                                />
                            )}
                        </div>
                    )}
                    {/* Botón Nuevo */}
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
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                            <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                            Cargando datos
                                        </div>
                                    </td>
                                </tr>
                            ) : receipts.length > 0 ? (
                                receipts.map((receipt) => (
                                    <tr 
                                        key={receipt._id} 
                                        className="hover:bg-(--bg-hover) transition-colors even:bg-(--bg-hover)/50 group cursor-pointer"
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
                                                {/* Botón Imprimir - Siempre visible */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePrintPDF(receipt); }}
                                                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                    title="Imprimir PDF"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                
                                                {/* Menú de 3 puntitos - Otras acciones */}
                                                <div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, receipt._id); }}
                                                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                    
                                                    {openMenu.id === receipt._id && (
                                                        <ActionMenu
                                                            openAbove={openMenu.openAbove}
                                                            items={[
                                                                {
                                                                    icon: <Eye size={16} />,
                                                                    label: 'Ver detalle',
                                                                    onClick: () => handleViewReceipt(receipt)
                                                                },
                                                                {
                                                                    icon: <History size={16} />,
                                                                    label: 'Ver actividad',
                                                                    onClick: () => handleViewActivity(receipt)
                                                                },
                                                                ...(receipt.status === 'activo' && !isClient ? [{
                                                                    icon: <Send size={16} />,
                                                                    label: 'Enviar por email',
                                                                    onClick: () => handleSendEmail(receipt)
                                                                }] : []),
                                                                ...(receipt.status === 'activo' && !isClient ? [{
                                                                    icon: <MessageCircle size={16} />,
                                                                    label: 'Enviar WhatsApp',
                                                                    onClick: () => handleSendWhatsApp(receipt)
                                                                }] : []),
                                                                ...(receipt.status === 'activo' && !isClient && receipt.createdBy._id === user.id ? [{
                                                                    icon: <Ban size={16} />,
                                                                    label: 'Anular',
                                                                    variant: 'danger',
                                                                    onClick: () => handleCancelClick(receipt)
                                                                }] : [])
                                                            ]}
                                                            position={openMenu.position}
                                                            onClose={() => setOpenMenu({ id: null, position: null, openAbove: false })}
                                                        />
                                                    )}
                                                </div>
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
                        <div className="p-12 text-center">
                            <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                Cargando datos
                            </div>
                        </div>
                    ) : receipts.length > 0 ? (
                        <div className="divide-y divide-(--border-color)">
                            {receipts.map((receipt) => (
                                <div 
                                    key={receipt._id} 
                                    className="p-4 hover:bg-(--bg-hover) transition-colors cursor-pointer even:bg-(--bg-hover)/50"
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
                                        {/* Botón Imprimir - Siempre visible */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePrintPDF(receipt); }}
                                            className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                            title="Imprimir PDF"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        
                                        {/* Menú de 3 puntitos - Otras acciones */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, receipt._id); }}
                                            className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                    
                                    {/* Menu - Mobile */}
                                    {openMenu.id === receipt._id && (
                                        <ActionMenu
                                            openAbove={openMenu.openAbove}
                                            items={[
                                                {
                                                    icon: <Eye size={16} />,
                                                    label: 'Ver detalle',
                                                    onClick: () => handleViewReceipt(receipt)
                                                },
                                                {
                                                    icon: <History size={16} />,
                                                    label: 'Ver actividad',
                                                    onClick: () => handleViewActivity(receipt)
                                                },
                                                ...(receipt.status === 'activo' && !isClient ? [{
                                                    icon: <Send size={16} />,
                                                    label: 'Enviar por email',
                                                    onClick: () => handleSendEmail(receipt)
                                                }] : []),
                                                ...(receipt.status === 'activo' && !isClient ? [{
                                                    icon: <MessageCircle size={16} />,
                                                    label: 'Enviar WhatsApp',
                                                    onClick: () => handleSendWhatsApp(receipt)
                                                }] : []),
                                                ...(receipt.status === 'activo' && !isClient && receipt.createdBy._id === user.id ? [{
                                                    icon: <Ban size={16} />,
                                                    label: 'Anular',
                                                    variant: 'danger',
                                                    onClick: () => handleCancelClick(receipt)
                                                }] : [])
                                            ]}
                                            position={openMenu.position}
                                            onClose={() => setOpenMenu({ id: null, position: null, openAbove: false })}
                                        />
                                    )}
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

                {/* Footer / Pagination */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover) flex items-center justify-between">
                    <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        Mostrando {receipts.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registros
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-(--border-color) bg-(--bg-card) text-(--text-secondary) hover:bg-(--bg-hover) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="text-xs text-(--text-muted) px-2">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-(--border-color) bg-(--bg-card) text-(--text-secondary) hover:bg-(--bg-hover) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
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

            {/* Activity Drawer */}
            <OrderActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => {
                    setIsActivityDrawerOpen(false);
                    setSelectedReceiptForActivity(null);
                }}
                entityType="receipt"
                entityId={selectedReceiptForActivity?._id}
                entityNumber={selectedReceiptForActivity?.receiptNumber}
                clientName={selectedReceiptForActivity?.clientId?.businessName}
            />
        </div>
    );
};

const ActionMenu = ({ items, onClose, position, openAbove = false }) => {
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        // Usar click en lugar de mousedown para evitar conflictos
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);
    
    // Calcular altura estimada del menú (aprox 40px por item)
    const estimatedHeight = items.length * 42;
    
    return (
        <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{ 
                position: 'fixed', 
                top: openAbove ? (position?.top - estimatedHeight) : position?.top, 
                left: position?.left 
            }}
            className="w-48 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-[9999] overflow-hidden"
        >
            {items.map((item, idx) => (
                <button
                    key={idx}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onClose();
                        // Ejecutar el onClick después de cerrar el menú
                        setTimeout(() => {
                            item.onClick();
                        }, 0);
                    }}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                        item.variant === 'danger' 
                            ? 'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20' 
                            : 'text-(--text-primary) hover:bg-(--bg-hover)'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default ReceiptsPage;
