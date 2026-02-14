import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Edit2,
    Send,
    MessageCircle,
    Printer,
    History,
    Trash2,
    MoreHorizontal,
    Package,
    CheckCircle,
    ArrowRight,
    Calendar,
    User,
    Building2,
    DollarSign,
    FileText,
    Check,
    Download
} from 'lucide-react';
import { getOrders, convertBudgetToOrder, deleteOrder, revertOrderToBudget, updateOrderStatus, sendOrderEmail } from '../../services/orderService';
import { generateOrderPDF } from '../../utils/pdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import BudgetDrawer from '../../components/orders/BudgetDrawer';
import ConvertToOrderModal from '../../components/orders/ConvertToOrderModal';
import UpdateOrderStatusModal from '../../components/orders/UpdateOrderStatusModal';
import SendEmailModal from '../../components/orders/SendEmailModal';
import SendWhatsAppModal from '../../components/orders/SendWhatsAppModal';
import OrderActivityDrawer from '../../components/orders/OrderActivityDrawer';

const StatusBadge = ({ status }) => {
    const styles = {
        espera: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border-warning-100 dark:border-warning-800',
        confirmado: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800',
        preparado: 'bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400 border-info-100 dark:border-info-800',
        completo: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800'
    };

    const labels = {
        espera: 'En Espera',
        confirmado: 'Confirmado',
        preparado: 'Preparando',
        completo: 'Completado'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.espera}`}>
            {labels[status] || status}
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

const OrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    
    // Estados de modales
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
    const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
    const [isSendWhatsAppModalOpen, setIsSendWhatsAppModalOpen] = useState(false);
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, loading: false });
    const [revertModal, setRevertModal] = useState({ isOpen: false, loading: false, targetStatus: null, title: '', description: '' });
    
    // Para preparar/completar
    const [targetStatus, setTargetStatus] = useState('preparado');

    const isSuperadmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin';
    const isVendedor = user?.role?.name === 'vendedor';
    const isClient = user?.role?.name === 'cliente';

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            // Obtener todos los pedidos y filtrar por ID
            const orders = await getOrders();
            const foundOrder = orders.find(o => o._id === id);
            if (foundOrder) {
                setOrder(foundOrder);
            } else {
                addToast('Pedido no encontrado', 'error');
                navigate(-1);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            addToast('Error al cargar el pedido', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper para comparar IDs
    const isSameId = (id1, id2) => {
        const str1 = id1?._id || id1?.id || id1;
        const str2 = id2?._id || id2?.id || id2;
        return str1?.toString() === str2?.toString();
    };

    // Permisos (misma lógica que OrdersPage)
    const canEdit = () => {
        if (isSuperadmin) return false;
        if (isAdmin) {
            if (order?.type === 'order' && order?.status === 'completo') return false;
            return true;
        }
        if (isVendedor) {
            if (order?.type === 'order') return false;
            const isOwn = isSameId(order?.salesRepId, user?.id);
            const isPending = order?.status === 'espera';
            return isOwn && isPending;
        }
        if (isClient) {
            // Cliente solo edita sus propios presupuestos en espera
            if (order?.type === 'order') return false;
            const isOwn = isSameId(order?.clientId, user?.client?.id);
            const isPending = order?.status === 'espera';
            return isOwn && isPending;
        }
        return false;
    };

    const canDelete = () => {
        if (isSuperadmin) return false;
        if (isAdmin) {
            if (order?.type === 'order' && order?.status === 'completo') return false;
            return true;
        }
        if (isVendedor) {
            if (order?.type === 'order') return false;
            const isOwn = isSameId(order?.salesRepId, user?.id);
            const isPending = order?.status === 'espera';
            return isOwn && isPending;
        }
        if (isClient) {
            // Cliente solo elimina sus propios presupuestos en espera
            if (order?.type === 'order') return false;
            const isOwn = isSameId(order?.clientId, user?.client?.id);
            const isPending = order?.status === 'espera';
            return isOwn && isPending;
        }
        return false;
    };

    const canConvertToOrder = () => {
        if (order?.type !== 'budget') return false;
        if (order?.status !== 'espera') return false;
        if (isSuperadmin) return false;
        if (isAdmin) return true;
        if (isVendedor) {
            return order?.salesRepId?._id === user?.id;
        }
        if (isClient) return true;
        return false;
    };

    const canPrepareOrder = () => {
        return isAdmin && order?.type === 'order' && order?.status === 'confirmado';
    };

    const canCompleteOrder = () => {
        return isAdmin && order?.type === 'order' && order?.status === 'preparado';
    };

    const getRevertInfo = () => {
        if (!isAdmin || order?.type !== 'order') return null;
        
        const revertChain = {
            'completo': { to: 'preparado', label: 'Volver a Preparando', description: 'El pedido volverá a estado "Preparando".' },
            'preparado': { to: 'confirmado', label: 'Volver a Confirmado', description: 'El pedido volverá a estado "Confirmado".' },
            'confirmado': { to: 'budget', label: 'Volver a Presupuesto', description: 'El pedido se revertirá a presupuesto.' }
        };
        
        return revertChain[order?.status] || null;
    };

    // Handlers de acciones
    const handleEdit = () => {
        if (!canEdit()) return;
        setIsEditDrawerOpen(true);
    };

    const handleConvert = () => {
        if (!canConvertToOrder()) return;
        setIsConvertModalOpen(true);
    };

    const handlePrepare = () => {
        if (!canPrepareOrder()) return;
        setTargetStatus('preparado');
        setIsUpdateStatusModalOpen(true);
    };

    const handleComplete = () => {
        if (!canCompleteOrder()) return;
        setTargetStatus('completo');
        setIsUpdateStatusModalOpen(true);
    };

    const handleSendEmail = () => {
        setIsSendEmailModalOpen(true);
    };

    const handleSendWhatsApp = () => {
        setIsSendWhatsAppModalOpen(true);
    };

    const handlePrintPDF = () => {
        try {
            generateOrderPDF(order, order.companyId);
        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast('Error al generar PDF: ' + error.message, 'error');
        }
    };

    const handleViewActivity = () => {
        setIsActivityDrawerOpen(true);
    };

    const handleDelete = () => {
        setDeleteModal({ isOpen: true, loading: false });
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleteModal({ isOpen: true, loading: true });
            await deleteOrder(order._id);
            addToast(order.type === 'order' ? 'Pedido eliminado exitosamente' : 'Presupuesto eliminado exitosamente', 'success');
            navigate(-1);
        } catch (error) {
            console.error('Error deleting:', error);
            addToast('Error al eliminar: ' + (error.response?.data?.message || error.message), 'error');
            setDeleteModal({ isOpen: false, loading: false });
        }
    };

    const handleRevertClick = () => {
        const revertInfo = getRevertInfo();
        if (!revertInfo) return;
        
        setRevertModal({ 
            isOpen: true, 
            loading: false,
            targetStatus: revertInfo.to,
            title: `¿${revertInfo.label}?`,
            description: revertInfo.description
        });
    };

    const handleRevertConfirm = async () => {
        try {
            setRevertModal(prev => ({ ...prev, loading: true }));
            await revertOrderToBudget(order._id, revertModal.targetStatus);
            addToast('Pedido revertido exitosamente', 'success');
            fetchOrder();
        } catch (error) {
            console.error('Error reverting:', error);
            addToast('Error al revertir: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setRevertModal({ isOpen: false, loading: false, targetStatus: null, title: '', description: '' });
        }
    };

    const handleSave = () => {
        fetchOrder();
        setIsEditDrawerOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) return null;

    const total = order.items?.reduce((acc, item) => 
        acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0
    ) || 0;

    const discountAmount = total * (order.discount || 0) / 100;
    const finalTotal = total - discountAmount;

    return (
        <div className="space-y-6">
            {/* Header Area - Estilo consistente con OrdersPage */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                            {order.type === 'order' ? 'Pedido' : 'Presupuesto'} #{String(order.orderNumber).padStart(5, '0')}
                            {isSuperadmin && <span className="ml-2 text-sm font-normal text-primary-600">({order.companyId?.name})</span>}
                        </h1>
                        <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                            {order.clientId?.businessName} • {new Date(order.date).toLocaleDateString('es-AR')}
                        </p>
                    </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                    {/* Botón de próximo paso */}
                    {canConvertToOrder() && (
                        <Button 
                            variant="primary" 
                            onClick={handleConvert}
                            className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                        >
                            <ArrowRight size={14} strokeWidth={2.5} />
                            Convertir a Pedido
                        </Button>
                    )}
                    {canPrepareOrder() && (
                        <Button 
                            variant="primary" 
                            onClick={handlePrepare}
                            className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                        >
                            <Package size={14} strokeWidth={2.5} />
                            Preparar
                        </Button>
                    )}
                    {canCompleteOrder() && (
                        <Button 
                            variant="primary" 
                            onClick={handleComplete}
                            className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                        >
                            <CheckCircle size={14} strokeWidth={2.5} />
                            Completar
                        </Button>
                    )}

                    {/* Botón Editar */}
                    {canEdit() && (
                        <Button
                            variant="secondary"
                            onClick={handleEdit}
                            className="px-3! text-[11px] font-bold uppercase tracking-wider"
                        >
                            <Edit2 size={14} strokeWidth={2.5} />
                            Editar
                        </Button>
                    )}

                    {/* Botón PDF */}
                    <Button 
                        variant="secondary" 
                        onClick={handlePrintPDF}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <Printer size={14} strokeWidth={2.5} />
                        PDF
                    </Button>

                    {/* Menú de más acciones - visible para todos los roles */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                            className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-colors"
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {showActionsMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-50 py-2">
                                {canEdit() && (
                                    <button
                                        onClick={() => { handleEdit(); setShowActionsMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Editar
                                    </button>
                                )}
                                {/* Email y WhatsApp solo para no-clientes */}
                                {!isClient && (
                                    <>
                                        <button
                                            onClick={() => { handleSendEmail(); setShowActionsMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                        >
                                            <Send size={16} />
                                            Enviar por Email
                                        </button>
                                        <button
                                            onClick={() => { handleSendWhatsApp(); setShowActionsMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                        >
                                            <MessageCircle size={16} />
                                            Enviar por WhatsApp
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => { handleViewActivity(); setShowActionsMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                >
                                    <History size={16} />
                                    Ver Actividad
                                </button>
                                {/* Revertir solo para admin */}
                                {getRevertInfo() && (
                                    <button
                                        onClick={() => { handleRevertClick(); setShowActionsMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                                    >
                                        <ArrowLeft size={16} />
                                        {getRevertInfo().label}
                                    </button>
                                )}
                                <div className="border-t border-(--border-color) my-1"></div>
                                {canDelete() && (
                                    <button
                                        onClick={() => { handleDelete(); setShowActionsMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Card - Estilo consistente con OrdersPage */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Header de la card */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <StatusBadge status={order.status} />
                            <span className="text-[13px] font-semibold text-(--text-primary)">
                                {order.items?.length || 0} productos
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider">Total</p>
                            <p className="text-xl font-black text-(--text-primary)">${finalTotal.toLocaleString('es-AR')}</p>
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Columna izquierda - Productos */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Productos */}
                            <div>
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Productos
                                </h3>
                                <div className="space-y-3">
                                    {order.items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 bg-(--bg-hover) rounded-xl">
                                            <div className="w-12 h-12 bg-(--bg-card) rounded-xl flex items-center justify-center">
                                                <Package size={24} className="text-(--text-muted)" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-(--text-primary)">{item.name}</p>
                                                <p className="text-[11px] text-(--text-muted)">Código: {item.code}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-(--text-primary)">
                                                    {item.quantity} x ${item.listPrice.toLocaleString('es-AR')}
                                                </p>
                                                {item.discount > 0 && (
                                                    <p className="text-[11px] text-success-600">
                                                        -{item.discount}% desc.
                                                    </p>
                                                )}
                                                <p className="text-sm font-bold text-primary-600 mt-1">
                                                    ${(item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)).toLocaleString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notas */}
                            {order.notes && (
                                <div className="pt-6 border-t border-(--border-color)">
                                    <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                        Notas
                                    </h3>
                                    <p className="text-(--text-secondary) whitespace-pre-wrap bg-(--bg-hover) p-4 rounded-xl">{order.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Columna derecha - Info general */}
                        <div className="space-y-6">
                            {/* Info general */}
                            <div>
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Información General
                                </h3>
                                <InfoRow 
                                    label="Cliente" 
                                    value={order.clientId?.businessName}
                                    icon={Building2}
                                />
                                <InfoRow 
                                    label="Vendedor" 
                                    value={`${order.salesRepId?.firstName} ${order.salesRepId?.lastName}`}
                                    icon={User}
                                />
                                <InfoRow 
                                    label="Fecha" 
                                    value={new Date(order.date).toLocaleDateString('es-AR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                    icon={Calendar}
                                />
                                {order.deliveryDate && (
                                    <InfoRow 
                                        label="Fecha de Entrega" 
                                        value={new Date(order.deliveryDate).toLocaleDateString('es-AR')}
                                        icon={Calendar}
                                    />
                                )}
                                <InfoRow 
                                    label="Lista de Precios" 
                                    value={order.priceList === 2 ? 'Lista 2' : 'Lista 1'}
                                    icon={DollarSign}
                                />
                                {order.paymentMethod && (
                                    <InfoRow 
                                        label="Método de Pago" 
                                        value={order.paymentMethod}
                                        icon={Check}
                                    />
                                )}
                            </div>

                            {/* Historial de estados */}
                            <div className="pt-6 border-t border-(--border-color)">
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Historial
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-success-500"></div>
                                        <span className="text-(--text-muted)">Creado</span>
                                        <span className="ml-auto text-(--text-secondary) text-[11px]">
                                            {new Date(order.createdAt).toLocaleDateString('es-AR')}
                                        </span>
                                    </div>
                                    {order.convertedAt && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                            <span className="text-(--text-muted)">Convertido a pedido</span>
                                            <span className="ml-auto text-(--text-secondary) text-[11px]">
                                                {new Date(order.convertedAt).toLocaleDateString('es-AR')}
                                            </span>
                                        </div>
                                    )}
                                    {order.statusDates?.confirmed && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                            <span className="text-(--text-muted)">Confirmado</span>
                                            <span className="ml-auto text-(--text-secondary) text-[11px]">
                                                {new Date(order.statusDates.confirmed).toLocaleDateString('es-AR')}
                                            </span>
                                        </div>
                                    )}
                                    {order.statusDates?.prepared && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-info-500"></div>
                                            <span className="text-(--text-muted)">En Preparación</span>
                                            <span className="ml-auto text-(--text-secondary) text-[11px]">
                                                {new Date(order.statusDates.prepared).toLocaleDateString('es-AR')}
                                            </span>
                                        </div>
                                    )}
                                    {order.statusDates?.completed && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-success-500"></div>
                                            <span className="text-(--text-muted)">Completado</span>
                                            <span className="ml-auto text-(--text-secondary) text-[11px]">
                                                {new Date(order.statusDates.completed).toLocaleDateString('es-AR')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer de la card */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover)">
                    <p className="text-[11px] text-(--text-muted) text-center font-medium">
                        Última actualización: {new Date(order.updatedAt).toLocaleString('es-AR')}
                    </p>
                </div>
            </div>

            {/* Modales y Drawers */}
            <BudgetDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => setIsEditDrawerOpen(false)}
                onSave={handleSave}
                order={order}
                mode="edit"
                type={order.type}
            />

            <ConvertToOrderModal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                onConfirm={async ({ budgetId, notifications }) => {
                    try {
                        await convertBudgetToOrder(budgetId, notifications);
                        addToast('Presupuesto convertido a pedido exitosamente', 'success');
                        fetchOrder();
                    } catch (error) {
                        addToast('Error al convertir: ' + error.message, 'error');
                    }
                }}
                budget={order}
                isClient={isClient}
            />

            <UpdateOrderStatusModal
                isOpen={isUpdateStatusModalOpen}
                onClose={() => setIsUpdateStatusModalOpen(false)}
                onConfirm={async ({ orderId, status, notifications }) => {
                    try {
                        await updateOrderStatus(orderId, status, notifications);
                        addToast('Estado actualizado exitosamente', 'success');
                        fetchOrder();
                    } catch (error) {
                        addToast('Error al actualizar estado: ' + error.message, 'error');
                    }
                }}
                order={order}
                targetStatus={targetStatus}
            />

            <SendEmailModal
                isOpen={isSendEmailModalOpen}
                onClose={() => setIsSendEmailModalOpen(false)}
                onConfirm={async ({ orderId, notifications }) => {
                    try {
                        const result = await sendOrderEmail(orderId, notifications);
                        addToast(`${result.sent} email(s) enviado(s)`, 'success');
                    } catch (error) {
                        addToast('Error al enviar email: ' + error.message, 'error');
                    }
                }}
                order={order}
            />

            <SendWhatsAppModal
                isOpen={isSendWhatsAppModalOpen}
                onClose={() => setIsSendWhatsAppModalOpen(false)}
                order={order}
            />

            <OrderActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => setIsActivityDrawerOpen(false)}
                entityType={order.type}
                entityId={order._id}
                entityNumber={order.orderNumber}
                clientName={order.clientId?.businessName}
            />

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, loading: false })}
                onConfirm={handleDeleteConfirm}
                title={`¿Eliminar ${order.type === 'order' ? 'Pedido' : 'Presupuesto'}?`}
                description={`Está a punto de eliminar #${String(order.orderNumber).padStart(5, '0')}. Esta acción no se puede deshacer.`}
                confirmText={deleteModal.loading ? 'Eliminando...' : 'Sí, eliminar'}
                type="danger"
            />

            <ConfirmModal
                isOpen={revertModal.isOpen}
                onClose={() => setRevertModal({ isOpen: false, loading: false, targetStatus: null, title: '', description: '' })}
                onConfirm={handleRevertConfirm}
                title={revertModal.title}
                description={revertModal.description}
                confirmText={revertModal.loading ? 'Revirtiendo...' : 'Sí, revertir'}
                type="warning"
            />
        </div>
    );
};

export default OrderDetailPage;
