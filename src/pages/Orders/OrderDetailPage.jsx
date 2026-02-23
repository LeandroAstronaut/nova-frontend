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
    Download,
    Percent,
    X,
    Tag,
    RefreshCw
} from 'lucide-react';
import { getOrder, convertBudgetToOrder, deleteOrder, revertOrderToBudget, updateOrderStatus, sendOrderEmail, checkPriceChanges, updateOrderPrices } from '../../services/orderService';
import { generateOrderPDF } from '../../utils/pdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import BudgetDrawer from '../../components/orders/BudgetDrawer';
import ConvertToOrderModal from '../../components/orders/ConvertToOrderModal';
import UpdateOrderStatusModal from '../../components/orders/UpdateOrderStatusModal';
import RevertOrderModal from '../../components/orders/RevertOrderModal';
import SendEmailModal from '../../components/orders/SendEmailModal';
import SendWhatsAppModal from '../../components/orders/SendWhatsAppModal';
import OrderActivityDrawer from '../../components/orders/OrderActivityDrawer';
import OrderDetailContent from '../../components/orders/OrderDetailContent';



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
    const [isUpdatePricesModalOpen, setIsUpdatePricesModalOpen] = useState(false);
    const [hasPriceChanges, setHasPriceChanges] = useState(false);
    const [priceChangesCount, setPriceChangesCount] = useState(0);
    const [checkingPriceChanges, setCheckingPriceChanges] = useState(false);
    const [updatingPrices, setUpdatingPrices] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, loading: false });
    const [revertModal, setRevertModal] = useState({ isOpen: false, loading: false, targetStatus: null, title: '', description: '' });
    
    // Para preparar/completar
    const [targetStatus, setTargetStatus] = useState('preparado');

    const isSuperadmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin';
    const isVendedor = user?.role?.name === 'vendedor';
    const isClient = user?.role?.name === 'cliente';

    // Check if commission display is enabled
    const hasCommissionFeature = user?.company?.features?.commissionCalculation === true;
    const canViewCommission = (isAdmin || isSuperadmin || user?.canViewCommission === true) && hasCommissionFeature;
    const canEditCommission = (isAdmin || isSuperadmin) && hasCommissionFeature;
    
    // Price display setting
    const showPricesWithTax = user?.company?.showPricesWithTax === true;
    const taxRate = user?.company?.defaultTaxRate || 21;

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const orderData = await getOrder(id);
            setOrder(orderData);
        } catch (error) {
            console.error('Error fetching order:', error);
            addToast('Error al cargar el pedido', 'error');
            navigate(-1);
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

    const handleRevertConfirm = async ({ orderId, targetStatus, notifications, additionalEmails }) => {
        try {
            setRevertModal(prev => ({ ...prev, loading: true }));
            const result = await revertOrderToBudget(orderId, targetStatus, notifications, additionalEmails);
            addToast('Pedido revertido exitosamente', 'success');
            
            // Mostrar info de emails enviados
            if (result.data?.emailNotifications?.sent > 0) {
                addToast(`${result.data.emailNotifications.sent} correo(s) de notificación enviado(s)`, 'success');
            }
            
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

    // Verificar si hay cambios de precios
    const checkForPriceChanges = async () => {
        if (!order?._id) return;
        
        try {
            setCheckingPriceChanges(true);
            const result = await checkPriceChanges(order._id);
            setHasPriceChanges(result.hasChanges);
            setPriceChangesCount(result.count);
        } catch (error) {
            console.error('Error checking price changes:', error);
        } finally {
            setCheckingPriceChanges(false);
        }
    };

    // Actualizar precios del pedido/presupuesto
    const handleUpdatePrices = async () => {
        if (!order?._id) return;
        
        try {
            setUpdatingPrices(true);
            await updateOrderPrices(order._id);
            addToast('Precios actualizados exitosamente', 'success');
            fetchOrder();
            setHasPriceChanges(false);
            setPriceChangesCount(0);
        } catch (error) {
            console.error('Error updating prices:', error);
            addToast('Error al actualizar precios: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setUpdatingPrices(false);
            setIsUpdatePricesModalOpen(false);
        }
    };

    // Verificar cambios de precios cuando cambia el pedido
    useEffect(() => {
        if (order?._id) {
            checkForPriceChanges();
        }
    }, [order?._id, order?.items?.length]);

    // Determinar si se puede mostrar el botón de actualizar precios
    const canShowUpdatePricesButton = () => {
        if (!order) return false;
        if (isClient) return false;
        if (isVendedor && order.type !== 'budget') return false;
        if (isAdmin && order.status === 'completo') return false;
        return hasPriceChanges;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) return null;

    // Usar total calculado del backend o calcular para pedidos antiguos
    const subtotal = order.subtotal !== undefined ? parseFloat(order.subtotal) : (order.items?.reduce((acc, item) => 
        acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0
    ) || 0);
    
    const finalTotal = order.total !== undefined ? parseFloat(order.total) : (subtotal * (1 - (order.discount || 0) / 100));
    const discountAmount = subtotal - finalTotal;

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

                    {/* Botón Actualizar Precios - solo si hay cambios */}
                    {canShowUpdatePricesButton() && (
                        <Button
                            variant="secondary"
                            onClick={() => setIsUpdatePricesModalOpen(true)}
                            className="px-3! text-[11px] font-bold uppercase tracking-wider bg-warning-50! text-warning-600! border-warning-200! hover:bg-warning-100!"
                            title={`${priceChangesCount} producto${priceChangesCount > 1 ? 's' : ''} con precios actualizados`}
                        >
                            <RefreshCw size={14} strokeWidth={2.5} className={checkingPriceChanges ? 'animate-spin' : ''} />
                            Actualizar Precios
                            <span className="ml-1 px-1.5 py-0.5 bg-warning-600 text-white text-[9px] rounded-full">
                                {priceChangesCount}
                            </span>
                        </Button>
                    )}

                    {/* Botón PDF -->
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

            {/* Main Content - Usando componente reutilizable */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                <OrderDetailContent 
                    order={order}
                    showPricesWithTax={showPricesWithTax}
                    canViewCommission={canViewCommission}
                    taxRate={taxRate}
                />
                
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
                onConfirm={async ({ budgetId, notifications, additionalEmails }) => {
                    try {
                        await convertBudgetToOrder(budgetId, notifications, additionalEmails);
                        setIsConvertModalOpen(false); // Cerrar modal inmediatamente
                        addToast('Presupuesto convertido a pedido exitosamente', 'success');
                        fetchOrder();
                    } catch (error) {
                        addToast('Error al convertir: ' + error.message, 'error');
                    }
                }}
                budget={order}
                isClient={isClient}
                features={user?.company?.features}
            />

            <UpdateOrderStatusModal
                isOpen={isUpdateStatusModalOpen}
                onClose={() => setIsUpdateStatusModalOpen(false)}
                onConfirm={async ({ orderId, status, notifications, additionalEmails }) => {
                    try {
                        await updateOrderStatus(orderId, status, notifications, additionalEmails);
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
                onConfirm={async ({ orderId, notifications, additionalEmails }) => {
                    try {
                        const result = await sendOrderEmail(orderId, notifications, additionalEmails);
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
                showPricesWithTax={showPricesWithTax}
                taxRate={taxRate}
            />

            <OrderActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => setIsActivityDrawerOpen(false)}
                entityType={order.type}
                entityId={order._id}
                entityNumber={order.orderNumber}
                clientName={order.clientId?.businessName}
            />

            {/* Modal para actualizar precios */}
            <ConfirmModal
                isOpen={isUpdatePricesModalOpen}
                onClose={() => setIsUpdatePricesModalOpen(false)}
                onConfirm={handleUpdatePrices}
                title="Actualizar Precios"
                description={
                    <div className="space-y-3">
                        <p>¿Estás seguro que deseas actualizar los precios de los productos a los valores actuales?</p>
                        <div className="bg-(--bg-hover) rounded-lg p-3 text-xs space-y-1">
                            <p className="font-medium text-(--text-primary)">Esta acción hará lo siguiente:</p>
                            <ul className="list-disc list-inside text-(--text-secondary) space-y-0.5">
                                <li>Actualizará los precios de lista/oferta según la configuración actual</li>
                                <li>Recalculará el estado de oferta de cada producto</li>
                                <li>Recalculará los totales con la configuración actual de la empresa</li>
                                <li>No modificará los descuentos individuales de cada producto</li>
                            </ul>
                        </div>
                        <p className="text-xs text-(--text-muted)">Esta acción no se puede deshacer.</p>
                    </div>
                }
                confirmText={updatingPrices ? 'Actualizando...' : 'Actualizar Precios'}
                cancelText="Cancelar"
                type="warning"
                isLoading={updatingPrices}
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

            <RevertOrderModal
                isOpen={revertModal.isOpen}
                onClose={() => setRevertModal({ isOpen: false, loading: false, targetStatus: null, title: '', description: '' })}
                onConfirm={handleRevertConfirm}
                order={order}
                loading={revertModal.loading}
                targetStatus={revertModal.targetStatus}
                title={revertModal.title}
                description={revertModal.description}
            />

        </div>
    );
};

export default OrderDetailPage;
