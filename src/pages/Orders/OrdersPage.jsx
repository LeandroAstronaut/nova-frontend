import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Download,
    MoreHorizontal,
    Edit2,
    ChevronUp,
    ChevronDown,
    ArrowRight,
    ArrowLeft,
    Eye,
    Trash2,
    Send,
    Printer,
    X,
    Package,
    CheckCircle,
    MessageCircle
} from 'lucide-react';

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
import { getOrders, convertBudgetToOrder, deleteOrder, revertOrderToBudget, updateOrderStatus, sendOrderEmail } from '../../services/orderService';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import BudgetDrawer from '../../components/orders/BudgetDrawer';
import ConvertToOrderModal from '../../components/orders/ConvertToOrderModal';
import UpdateOrderStatusModal from '../../components/orders/UpdateOrderStatusModal';
import SendEmailModal from '../../components/orders/SendEmailModal';
import SendWhatsAppModal from '../../components/orders/SendWhatsAppModal';
import OrderActivityDrawer from '../../components/orders/OrderActivityDrawer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Building2, History } from 'lucide-react';
import { generateOrderPDF } from '../../utils/pdfGenerator';

// Función para exportar a CSV
const exportToCSV = (data, mode) => {
    const headers = ['Número', 'Cliente', 'Fecha', 'Vendedor', 'Total', 'Estado'];
    const rows = data.map(order => {
        // Calcular subtotal con descuento por ítem
        const subtotal = order.items.reduce((acc, item) => 
            acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0
        );
        // Aplicar descuento general de la orden
        const total = subtotal * (1 - (order.discount || 0) / 100);
        return [
            `#${String(order.orderNumber).padStart(5, '0')}`,
            order.clientId?.businessName || 'N/A',
            new Date(order.date).toLocaleDateString(),
            `${order.salesRepId?.firstName || ''} ${order.salesRepId?.lastName || ''}`.trim(),
            `$${total.toLocaleString()}`,
            order.status
        ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${mode === 'order' ? 'pedidos' : 'presupuestos'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

// Dropdown Menu Component - Posicionado fijo para evitar overflow de la tabla
const ActionMenu = ({ items, onClose, position, openAbove = false }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        // Usar click en lugar de mousedown para que no interfiera con los clicks en los items
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
                left: position?.left || 0,
            }}
            className="w-48 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-[9999] overflow-hidden"
        >
            {items.map((item, idx) => (
                <button
                    key={idx}
                    onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                        onClose();
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

const OrdersPage = ({ mode = 'order' }) => {
    const navigate = useNavigate();
    const { user, updateUserContext } = useAuth();
    const { addToast } = useToast();
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin';
    const isVendedor = user?.role?.name === 'vendedor';
    const isClient = user?.role?.name === 'cliente';

    // Check if commission display is enabled for current user
    const hasCommissionFeature = user?.company?.features?.commissionCalculation === true;
    const canViewCommission = (isAdmin || isSuperadmin || user?.canViewCommission === true) && hasCommissionFeature;
    
    // Refrescar datos del usuario al montar y cuando vuelve al foco
    // Esto asegura que los permisos (como canViewCommission) estén actualizados
    useEffect(() => {
        // Refrescar inmediatamente al montar
        updateUserContext?.();
        
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateUserContext?.();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [updateUserContext]);
    
    // Refrescar usuario cada 30 segundos mientras está en esta página
    useEffect(() => {
        const intervalId = setInterval(() => {
            updateUserContext?.();
        }, 30000);
        
        return () => clearInterval(intervalId);
    }, [updateUserContext]);
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Sorting State
    const [sort, setSort] = useState({
        sortBy: 'orderNumber',
        order: 'desc'
    });

    // Data for filters
    const [clients, setClients] = useState([]);
    const [sellers, setSellers] = useState([]);

    // Drawer states
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('create');
    const [drawerType, setDrawerType] = useState('budget'); // 'budget' o 'order'
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Convert Modal states
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [converting, setConverting] = useState(false);

    // Update Status Modal states
    const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
    const [targetStatus, setTargetStatus] = useState('preparado');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Send Email Modal states
    const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
    const [selectedOrderForEmail, setSelectedOrderForEmail] = useState(null);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Send WhatsApp Modal states
    const [isSendWhatsAppModalOpen, setIsSendWhatsAppModalOpen] = useState(false);
    const [selectedOrderForWhatsApp, setSelectedOrderForWhatsApp] = useState(null);

    // Activity Drawer states
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [selectedOrderForActivity, setSelectedOrderForActivity] = useState(null);

    // Action Menu state
    const [openMenu, setOpenMenu] = useState({ id: null, position: null, openAbove: false });

    // Delete confirmation state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null, loading: false });

    // Revert to previous state confirmation
    const [revertModal, setRevertModal] = useState({ isOpen: false, order: null, loading: false, targetStatus: null, title: '', description: '' });

    const handleOpenMenu = (e, orderId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const menuHeight = 300; // Altura máxima estimada del menú
        const menuWidth = 192; // Ancho del menú
        
        // Detectar si está cerca del borde inferior (últimos 300px de la pantalla)
        const openAbove = (rect.bottom + menuHeight) > windowHeight;
        
        // Detectar si está cerca del borde izquierdo (móvil)
        // Si el botón está a menos de 150px del borde izquierdo, abrir hacia la derecha
        const openRight = rect.left < 150;
        
        let leftPosition;
        if (openRight) {
            // Abrir hacia la derecha desde el botón
            leftPosition = rect.left;
        } else {
            // Alinear a la derecha del botón
            leftPosition = rect.left - menuWidth + rect.width;
        }
        
        // Asegurar que no se salga por la derecha de la pantalla
        if (leftPosition + menuWidth > windowWidth) {
            leftPosition = windowWidth - menuWidth - 16;
        }
        
        // Asegurar que no sea negativo
        if (leftPosition < 8) {
            leftPosition = 8;
        }
        
        setOpenMenu({
            id: orderId,
            position: {
                top: openAbove ? rect.top : rect.bottom + 8,
                left: leftPosition
            },
            openAbove
        });
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [mode, sort, debouncedSearchTerm]);

    // Debounce para el término de búsqueda (esperar 500ms después de dejar de tipear)
    useEffect(() => {
        if (searchTerm) {
            setIsSearching(true);
        }
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchInitialData = async () => {
        try {
            const [clientData, sellerData] = await Promise.all([
                import('../../services/orderService').then(m => m.getClients()),
                import('../../services/orderService').then(m => m.getSellers())
            ]);
            setClients(clientData);
            setSellers(sellerData);
        } catch (error) {
            console.error('Error fetching filter data:', error);
        }
    };

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOrders(mode, {
                ...sort,
                search: debouncedSearchTerm
            });
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [mode, sort, debouncedSearchTerm]);

    const handleSort = (field) => {
        setSort(prev => ({
            sortBy: field,
            order: prev.sortBy === field && prev.order === 'desc' ? 'asc' : 'desc'
        }));
    };

    // PERMISOS: Determinar si puede editar
    const canEdit = (order) => {
        if (isSuperadmin) return false; // Superadmin no edita nada
        if (isAdmin) {
            // Admin no puede editar pedidos completados (sí puede editar los que están preparando)
            if (order.type === 'order' && order.status === 'completo') {
                return false;
            }
            return true;
        }
        if (isVendedor) {
            // Vendedor solo edita sus propios presupuestos
            if (order.type === 'order') return false; // No edita pedidos
            const isOwn = isSameId(order.salesRepId, user?.id);
            const isPending = order.status === 'espera';
            return isOwn && isPending;
        }
        if (isClient) {
            // Cliente solo edita sus propios presupuestos en espera
            if (order.type === 'order') return false;
            const isOwn = isSameId(order.clientId, user?.client?.id);
            return isOwn && order.status === 'espera';
        }
        return false;
    };

    // PERMISOS: Determinar si puede eliminar
    const canDelete = (order) => {
        if (isSuperadmin) return false; // Superadmin no elimina nada
        if (isAdmin) {
            // Admin no puede eliminar pedidos completados
            if (order.type === 'order' && order.status === 'completo') {
                return false;
            }
            return true;
        }
        if (isVendedor) {
            // Vendedor solo elimina sus propios presupuestos
            if (order.type === 'order') return false; // No elimina pedidos
            const isOwn = isSameId(order.salesRepId, user?.id);
            const isPending = order.status === 'espera';
            return isOwn && isPending;
        }
        if (isClient) {
            // Cliente solo elimina sus propios presupuestos en espera
            if (order.type === 'order') return false; // No elimina pedidos
            const isOwn = isSameId(order.clientId, user?.client?.id);
            const isPending = order.status === 'espera';
            return isOwn && isPending;
        }
        return false;
    };

    // PERMISOS: Determinar si puede ver
    const canView = (order) => {
        if (isSuperadmin) return true;
        if (isAdmin) return true;
        if (isVendedor) {
            return isSameId(order.salesRepId, user?.id);
        }
        if (isClient) return true;
        return false;
    };

    // Helper para comparar IDs (pueden ser string u objeto con _id o id)
    const isSameId = (id1, id2) => {
        const str1 = id1?._id || id1?.id || id1;
        const str2 = id2?._id || id2?.id || id2;
        return str1?.toString() === str2?.toString();
    };

    // PERMISOS: Determinar si puede convertir a pedido
    const canConvertToOrder = (order) => {
        if (mode !== 'budget') return false; // Solo en modo presupuestos
        if (isSuperadmin) return false;
        if (order.status !== 'espera') return false;
        if (isAdmin) return true;
        if (isVendedor) {
            return isSameId(order.salesRepId, user?.id);
        }
        if (isClient) {
            return isSameId(order.clientId, user?.client?.id);
        }
        return false;
    };

    const handleOpenCreate = () => {
        setDrawerMode('create');
        setDrawerType(mode); // Usa el modo actual (budget u order)
        setSelectedOrder(null);
        setIsDrawerOpen(true);
    };

    const handleOpenCreateBudget = () => {
        // En modo pedidos, el botón crea un presupuesto
        setDrawerMode('create');
        setDrawerType('budget'); // Siempre crea presupuesto
        setSelectedOrder(null);
        setIsDrawerOpen(true);
    };

    const handleEditOrder = (order) => {
        if (!canEdit(order)) return;
        setDrawerMode('edit');
        setDrawerType(order.type || mode); // Usa el tipo del pedido/presupuesto
        setSelectedOrder(order);
        setIsDrawerOpen(true);
    };

    const handleViewOrder = (order) => {
        // Navegar a la página de detalle
        const path = order.type === 'order' ? '/pedidos' : '/presupuestos';
        navigate(`${path}/${order._id}`);
    };

    const handleDeleteClick = (order) => {
        setDeleteModal({ isOpen: true, order, loading: false });
        setOpenMenu({ id: null, position: null, openAbove: false }); // Cerrar menú
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.order) return;
        
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            await deleteOrder(deleteModal.order._id);
            setDeleteModal({ isOpen: false, order: null, loading: false });
            addToast(deleteModal.order.type === 'order' ? 'Pedido eliminado exitosamente' : 'Presupuesto eliminado exitosamente', 'success');
            fetchOrders(); // Refrescar lista
        } catch (error) {
            console.error('Error deleting order:', error);
            addToast('Error al eliminar: ' + (error.response?.data?.message || error.message), 'error');
            setDeleteModal({ isOpen: false, order: null, loading: false });
        }
    };

    // Determinar si se puede revertir a estado anterior y a cuál
    const getRevertInfo = (order) => {
        if (!isAdmin || order?.type !== 'order') return null;
        
        // Definir la cadena de estados y sus reversiones
        const revertChain = {
            'completo': { to: 'preparado', label: 'Volver a Preparando', description: 'El pedido volverá a estado "Preparando" y podrá ser editado nuevamente.' },
            'preparado': { to: 'confirmado', label: 'Volver a Confirmado', description: 'El pedido volverá a estado "Confirmado" y podrá ser editado nuevamente.' },
            'confirmado': { to: 'budget', label: 'Volver a Presupuesto', description: 'El pedido se revertirá a presupuesto. Volverá a estado "En Espera" y podrá ser editado nuevamente.' }
        };
        
        return revertChain[order?.status] || null;
    };

    // Cambiar estado del pedido (preparar/completar)
    const canPrepareOrder = (order) => {
        return isAdmin && order?.type === 'order' && order?.status === 'confirmado';
    };

    const canCompleteOrder = (order) => {
        return isAdmin && order?.type === 'order' && order?.status === 'preparado';
    };

    const handlePrepareClick = (order) => {
        setSelectedOrderForStatus(order);
        setTargetStatus('preparado');
        setIsUpdateStatusModalOpen(true);
    };

    const handleCompleteClick = (order) => {
        setSelectedOrderForStatus(order);
        setTargetStatus('completo');
        setIsUpdateStatusModalOpen(true);
    };

    const handleUpdateStatusConfirm = async ({ orderId, status, notifications }) => {
        try {
            setUpdatingStatus(true);
            const result = await updateOrderStatus(orderId, status, notifications);
            setIsUpdateStatusModalOpen(false);
            setSelectedOrderForStatus(null);
            
            // Mostrar toast de éxito
            const statusText = status === 'preparado' ? 'Preparando' : 'Completado';
            addToast(`Pedido actualizado a "${statusText}" exitosamente`, 'success');
            
            // Mostrar info de emails enviados si los hubo
            if (result.data?.emailNotifications?.sent > 0) {
                addToast(`${result.data.emailNotifications.sent} correo(s) de notificación enviado(s)`, 'success');
            }
            
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error('Error updating order status:', error);
            addToast('Error al actualizar estado: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Enviar email con detalle
    const handleSendEmailClick = (order) => {
        setSelectedOrderForEmail(order);
        setIsSendEmailModalOpen(true);
    };

    // Enviar WhatsApp con detalle
    const handleSendWhatsAppClick = (order) => {
        setSelectedOrderForWhatsApp(order);
        setIsSendWhatsAppModalOpen(true);
    };

    const handleViewActivityClick = (order) => {
        setSelectedOrderForActivity(order);
        setIsActivityDrawerOpen(true);
    };

    const handleSendEmailConfirm = async ({ orderId, notifications }) => {
        try {
            setSendingEmail(true);
            
            const result = await sendOrderEmail(orderId, notifications);
            
            setIsSendEmailModalOpen(false);
            setSelectedOrderForEmail(null);
            
            if (result.sent > 0) {
                addToast(`${result.sent} email(s) enviado(s) exitosamente`, 'success');
            }
            if (result.failed > 0) {
                addToast(`${result.failed} email(s) no pudieron enviarse`, 'error');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            addToast('Error al enviar email: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleRevertClick = (order) => {
        const revertInfo = getRevertInfo(order);
        if (!revertInfo) return;
        
        setRevertModal({ 
            isOpen: true, 
            order, 
            loading: false,
            targetStatus: revertInfo.to,
            title: `¿${revertInfo.label}?`,
            description: revertInfo.description
        });
        setOpenMenu({ id: null, position: null, openAbove: false }); // Cerrar menú
    };

    const handleRevertConfirm = async () => {
        if (!revertModal.order) return;
        
        try {
            setRevertModal(prev => ({ ...prev, loading: true }));
            await revertOrderToBudget(revertModal.order._id, revertModal.targetStatus);
            setRevertModal({ isOpen: false, order: null, loading: false, targetStatus: null, title: '', description: '' });
            
            const statusLabels = {
                'budget': 'presupuesto',
                'confirmado': 'Confirmado',
                'preparado': 'Preparando'
            };
            addToast(`Pedido revertido a ${statusLabels[revertModal.targetStatus] || revertModal.targetStatus} exitosamente`, 'success');
            fetchOrders(); // Refrescar lista
        } catch (error) {
            console.error('Error reverting order:', error);
            addToast('Error al revertir: ' + (error.response?.data?.message || error.message), 'error');
            setRevertModal({ isOpen: false, order: null, loading: false, targetStatus: null, title: '', description: '' });
        }
    };

    const handleDrawerSave = () => {
        fetchOrders();
    };

    const handleConvertClick = (order) => {
        setSelectedBudget(order);
        setIsConvertModalOpen(true);
    };

    const handleConvertConfirm = async ({ budgetId, notifications }) => {
        try {
            setConverting(true);
            const result = await convertBudgetToOrder(budgetId, notifications);
            setIsConvertModalOpen(false);
            setSelectedBudget(null);
            
            // Mostrar toast de éxito
            addToast('Presupuesto convertido a pedido exitosamente', 'success');
            
            // Mostrar info de emails enviados
            if (result.data?.emailNotifications) {
                const { sent, failed } = result.data.emailNotifications;
                if (sent > 0) {
                    addToast(`${sent} correo(s) de notificación enviado(s)`, 'success');
                }
                if (failed > 0) {
                    addToast(`${failed} correo(s) no pudieron enviarse`, 'error');
                }
            }
            
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error('Error converting budget:', error);
            addToast('Error al convertir: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setConverting(false);
        }
    };

    const SortIcon = ({ field }) => {
        if (sort.sortBy !== field) return <MoreHorizontal size={10} className="ml-1 opacity-20" />;
        return sort.order === 'asc' 
            ? <ChevronUp size={12} className="ml-1 text-primary-600 dark:text-primary-400" /> 
            : <ChevronDown size={12} className="ml-1 text-primary-600 dark:text-primary-400" />;
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                        {mode === 'order' ? 'Listado de Pedidos' : 'Listado de Presupuestos'}
                        {isSuperadmin && <span className="ml-2 text-sm font-normal text-primary-600">(Todas las compañías)</span>}
                    </h1>
                    <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                        {isSuperadmin 
                            ? 'Visualice todos los pedidos de todas las compañías del sistema.'
                            : (mode === 'order'
                                ? 'Visualice y gestione los pedidos confirmados de su empresa.'
                                : 'Cargue nuevos presupuestos que podrá convertir en pedidos luego.')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!isClient && (
                        <Button
                            variant="secondary"
                            className="px-3! text-[11px] font-bold uppercase tracking-wider"
                            onClick={() => exportToCSV(orders, mode)}
                        >
                            <Download size={14} strokeWidth={2.5} />
                            Exportar
                        </Button>
                    )}
                    {!isSuperadmin && (
                        <Button 
                            variant="primary" 
                            onClick={mode === 'order' ? handleOpenCreateBudget : handleOpenCreate} 
                            className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            Nuevo Presupuesto
                        </Button>
                    )}
                </div>
            </div>

            {/* main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Filters Header */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="flex justify-end">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={14} strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full pl-9 pr-4 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-medium text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-(--bg-card) transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                            />
                        </div>
                    </div>
                </div>

                {/* Vista Desktop - Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--bg-hover) text-[10px] font-bold text-(--text-muted) uppercase tracking-widest border-y border-(--border-color)">
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('orderNumber')}>
                                    <div className="flex items-center"># Número <SortIcon field="orderNumber" /></div>
                                </th>
                                {isSuperadmin && (
                                    <th className="px-6 py-3">
                                        <div className="flex items-center gap-1"><Building2 size={12} /> Compañía</div>
                                    </th>
                                )}
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('clientId')}>
                                    <div className="flex items-center">Cliente <SortIcon field="clientId" /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('date')}>
                                    <div className="flex items-center">Fecha <SortIcon field="date" /></div>
                                </th>
                                <th className="px-6 py-3">Vendedor</th>
                                <th className="px-6 py-3 text-right cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Total</th>
                                {canViewCommission && (
                                    <th className="px-6 py-3 text-right">Comisión</th>
                                )}
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={isSuperadmin ? (canViewCommission ? 9 : 8) : (canViewCommission ? 8 : 7)} className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                                Sincronizando...
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr 
                                        key={order._id} 
                                        className="hover:bg-(--bg-hover) transition-colors group cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}
                                    >
                                        <td className="px-6 py-4 font-bold text-(--text-primary) text-[13px]">
                                            #{String(order.orderNumber).padStart(5, '0')}
                                        </td>
                                        {isSuperadmin && (
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                                                    <Building2 size={10} />
                                                    {order.companyId?.name || 'N/A'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="text-[13px] font-bold text-(--text-primary)">{order.clientId?.businessName}</div>
                                            <div className="text-[10px] text-(--text-muted) font-bold tracking-tight uppercase">ID: {order.clientId?._id.substring(18).toUpperCase()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-[12px] font-semibold text-(--text-secondary)">
                                            {new Date(order.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-[12px] font-semibold text-(--text-secondary)">
                                            {order.salesRepId?.firstName} {order.salesRepId?.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-(--text-primary) text-[13px]">
                                            ${(() => {
                                                const subtotal = order.items.reduce((acc, item) => acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0);
                                                const total = subtotal * (1 - (order.discount || 0) / 100);
                                                return total.toLocaleString();
                                            })()}
                                        </td>
                                        {canViewCommission && (
                                            <td className="px-6 py-4 text-right text-[13px]">
                                                {order.commissionAmount ? (
                                                    <span className="font-semibold text-success-600 dark:text-success-400">
                                                        ${order.commissionAmount.toLocaleString()}
                                                        {order.commissionRate && (
                                                            <span className="text-[10px] text-(--text-muted) ml-1">
                                                                ({order.commissionRate}%)
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-(--text-muted)">-</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Botón Convertir a Pedido - Solo para presupuestos */}
                                                {canConvertToOrder(order) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleConvertClick(order); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500 hover:bg-success-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <ArrowRight size={14} strokeWidth={2.5} />
                                                        Convertir
                                                    </button>
                                                )}

                                                {/* Botón Preparar - Solo admin y pedidos confirmados */}
                                                {canPrepareOrder(order) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlePrepareClick(order); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <Package size={14} strokeWidth={2.5} />
                                                        Preparar
                                                    </button>
                                                )}

                                                {/* Botón Completar - Solo admin y pedidos preparados */}
                                                {canCompleteOrder(order) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCompleteClick(order); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500 hover:bg-success-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <CheckCircle size={14} strokeWidth={2.5} />
                                                        Completar
                                                    </button>
                                                )}

                                                {/* Botón Ver - Siempre visible si tiene permiso */}
                                                {canView(order) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}
                                                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={16} strokeWidth={2.5} />
                                                    </button>
                                                )}

                                                {/* Menú de 3 puntos - Acciones adicionales (todos los roles) */}
                                                <div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, order._id); }}
                                                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    {openMenu.id === order._id && (
                                                        <ActionMenu
                                                            openAbove={openMenu.openAbove}
                                                            items={[
                                                                {
                                                                    icon: <Eye size={16} />,
                                                                    label: 'Ver detalle',
                                                                    onClick: () => handleViewOrder(order)
                                                                },
                                                                ...(canEdit(order) ? [{
                                                                    icon: <Edit2 size={16} />,
                                                                    label: 'Editar',
                                                                    onClick: () => handleEditOrder(order)
                                                                }] : []),
                                                                ...(isClient ? [] : [{  // Clientes no pueden enviar emails/WhatsApp
                                                                    icon: <Send size={16} />,
                                                                    label: 'Enviar por email',
                                                                    onClick: () => handleSendEmailClick(order)
                                                                }]),
                                                                ...(isClient ? [] : [{  // Clientes no pueden enviar emails/WhatsApp
                                                                    icon: <MessageCircle size={16} />,
                                                                    label: 'Enviar WhatsApp',
                                                                    onClick: () => handleSendWhatsAppClick(order)
                                                                }]),
                                                                {
                                                                    icon: <Printer size={16} />,
                                                                    label: 'Imprimir / PDF',
                                                                    onClick: () => {
                                                                        try {
                                                                            generateOrderPDF(order, order.companyId);
                                                                        } catch (error) {
                                                                            console.error('Error generating PDF:', error);
                                                                            addToast('Error al generar PDF: ' + error.message, 'error');
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    icon: <History size={16} />,
                                                                    label: 'Ver Actividad',
                                                                    onClick: () => handleViewActivityClick(order)
                                                                },
                                                                ...(getRevertInfo(order) ? [{
                                                                    icon: <ArrowLeft size={16} />,
                                                                    label: getRevertInfo(order).label,
                                                                    variant: 'warning',
                                                                    onClick: () => handleRevertClick(order)
                                                                }] : []),
                                                                ...(canDelete(order) ? [{
                                                                    icon: <Trash2 size={16} />,
                                                                    label: 'Eliminar',
                                                                    variant: 'danger',
                                                                    onClick: () => handleDeleteClick(order)
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
                                    <td colSpan={isSuperadmin ? (canViewCommission ? 9 : 8) : (canViewCommission ? 8 : 7)} className="px-6 py-12 text-center">
                                        <div className="text-(--text-muted) text-[11px] font-bold uppercase tracking-widest bg-(--bg-hover) w-fit mx-auto px-4 py-2 rounded-lg border border-(--border-color)">
                                            No se encontraron {mode === 'order' ? 'pedidos' : 'presupuestos'}
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
                            <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                Sincronizando...
                            </div>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="divide-y divide-(--border-color)">
                            {orders.map((order) => (
                                <div 
                                    key={order._id} 
                                    className="p-4 hover:bg-(--bg-hover) transition-colors cursor-pointer"
                                    onClick={() => handleViewOrder(order)}
                                >
                                    {/* Header: Numero y Estado */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-(--text-primary) text-[15px]">
                                                #{String(order.orderNumber).padStart(5, '0')}
                                            </span>
                                            {isSuperadmin && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                                                    <Building2 size={8} />
                                                    {order.companyId?.name || 'N/A'}
                                                </span>
                                            )}
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    
                                    {/* Cliente */}
                                    <div className="mb-2">
                                        <div className="text-[14px] font-bold text-(--text-primary)">{order.clientId?.businessName}</div>
                                        <div className="text-[10px] text-(--text-muted) font-bold tracking-tight uppercase">ID: {order.clientId?._id.substring(18).toUpperCase()}</div>
                                    </div>
                                    
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                                        <div>
                                            <span className="text-(--text-muted)">Fecha:</span>
                                            <span className="ml-1 font-semibold text-(--text-secondary)">{new Date(order.date).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-(--text-muted)">Asignado a:</span>
                                            <span className="ml-1 font-semibold text-(--text-secondary)">{order.salesRepId?.firstName} {order.salesRepId?.lastName}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-(--text-muted)">Total:</span>
                                            <span className="ml-1 font-bold text-(--text-primary) text-[14px]">${(() => {
                                                const subtotal = order.items.reduce((acc, item) => acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0);
                                                const total = subtotal * (1 - (order.discount || 0) / 100);
                                                return total.toLocaleString();
                                            })()}</span>
                                        </div>
                                        {canViewCommission && order.commissionAmount && (
                                            <div className="col-span-2">
                                                <span className="text-(--text-muted)">Comisión:</span>
                                                <span className="ml-1 font-bold text-success-600 text-[14px]">
                                                    ${order.commissionAmount.toLocaleString()}
                                                    {order.commissionRate && (
                                                        <span className="text-[10px] text-(--text-muted) ml-1">
                                                            ({order.commissionRate}%)
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Acciones */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-(--border-color)">
                                        {canConvertToOrder(order) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleConvertClick(order); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                                            >
                                                <ArrowRight size={14} strokeWidth={2.5} />
                                                Convertir
                                            </button>
                                        )}
                                        {canPrepareOrder(order) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrepareClick(order); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                                            >
                                                <Package size={14} strokeWidth={2.5} />
                                                Preparar
                                            </button>
                                        )}
                                        {canCompleteOrder(order) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCompleteClick(order); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                                            >
                                                <CheckCircle size={14} strokeWidth={2.5} />
                                                Completar
                                            </button>
                                        )}
                                        {canView(order) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}
                                                className="flex items-center justify-center p-2 rounded-lg text-(--text-muted) hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                                                title="Ver detalle"
                                            >
                                                <Eye size={18} strokeWidth={2.5} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, order._id); }}
                                            className="flex items-center justify-center p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>

                                    {/* Menu - todos los roles */}
                                    {openMenu.id === order._id && (
                                        <ActionMenu
                                            openAbove={openMenu.openAbove}
                                            items={[
                                                { icon: <Eye size={16} />, label: 'Ver detalle', onClick: () => handleViewOrder(order) },
                                                ...(canEdit(order) ? [{ icon: <Edit2 size={16} />, label: 'Editar', onClick: () => handleEditOrder(order) }] : []),
                                                ...(isClient ? [] : [{ icon: <Send size={16} />, label: 'Enviar por email', onClick: () => handleSendEmailClick(order) }]),
                                                ...(isClient ? [] : [{ icon: <MessageCircle size={16} />, label: 'Enviar WhatsApp', onClick: () => handleSendWhatsAppClick(order) }]),
                                                { icon: <Printer size={16} />, label: 'Imprimir / PDF', onClick: () => { try { generateOrderPDF(order, order.companyId); } catch (error) { addToast('Error al generar PDF: ' + error.message, 'error'); } } },
                                                { icon: <History size={16} />, label: 'Ver Actividad', onClick: () => handleViewActivityClick(order) },
                                                ...(getRevertInfo(order) ? [{ icon: <ArrowLeft size={16} />, label: getRevertInfo(order).label, variant: 'warning', onClick: () => handleRevertClick(order) }] : []),
                                                ...(canDelete(order) ? [{ icon: <Trash2 size={16} />, label: 'Eliminar', variant: 'danger', onClick: () => handleDeleteClick(order) }] : [])
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
                                No se encontraron {mode === 'order' ? 'pedidos' : 'presupuestos'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover) flex items-center justify-between">
                    <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        Total {orders.length} registros
                    </span>
                    <div className="flex gap-1">
                        <Button variant="secondary" className="px-3! py-1! text-[10px]! font-bold uppercase tracking-wider">Anterior</Button>
                        <Button variant="secondary" className="px-3! py-1! text-[10px]! font-bold uppercase tracking-wider">Siguiente</Button>
                    </div>
                </div>
            </div>

            {/* Order/Budget Drawer (Create / Edit) */}
            <BudgetDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleDrawerSave}
                order={selectedOrder}
                mode={drawerMode}
                type={drawerType}
                readOnly={isSuperadmin} // Superadmin siempre en modo lectura
            />

            {/* Convert to Order Modal */}
            <ConvertToOrderModal
                isOpen={isConvertModalOpen}
                onClose={() => {
                    setIsConvertModalOpen(false);
                    setSelectedBudget(null);
                }}
                onConfirm={handleConvertConfirm}
                budget={selectedBudget}
                loading={converting}
                isClient={isClient}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, order: null, loading: false })}
                onConfirm={handleDeleteConfirm}
                title={`¿Eliminar ${deleteModal.order?.type === 'order' ? 'Pedido' : 'Presupuesto'}?`}
                description={`Está a punto de eliminar ${deleteModal.order?.type === 'order' ? 'el pedido' : 'el presupuesto'} #${String(deleteModal.order?.orderNumber || '').padStart(5, '0')}. Esta acción no se puede deshacer.`}
                confirmText={deleteModal.loading ? 'Eliminando...' : 'Sí, eliminar'}
                cancelText="Cancelar"
                type="danger"
            />

            {/* Revert to Previous State Confirmation Modal */}
            <ConfirmModal
                isOpen={revertModal.isOpen}
                onClose={() => setRevertModal({ isOpen: false, order: null, loading: false, targetStatus: null, title: '', description: '' })}
                onConfirm={handleRevertConfirm}
                title={revertModal.title || '¿Volver al estado anterior?'}
                description={`Está a punto de revertir el pedido #${String(revertModal.order?.orderNumber || '').padStart(5, '0')}. ${revertModal.description || ''}`}
                confirmText={revertModal.loading ? 'Revirtiendo...' : 'Sí, revertir'}
                cancelText="Cancelar"
                type="warning"
            />

            {/* Update Order Status Modal (Preparar/Completar) */}
            <UpdateOrderStatusModal
                isOpen={isUpdateStatusModalOpen}
                onClose={() => {
                    setIsUpdateStatusModalOpen(false);
                    setSelectedOrderForStatus(null);
                }}
                onConfirm={handleUpdateStatusConfirm}
                order={selectedOrderForStatus}
                targetStatus={targetStatus}
                loading={updatingStatus}
            />

            {/* Send Email Modal */}
            <SendEmailModal
                isOpen={isSendEmailModalOpen}
                onClose={() => {
                    setIsSendEmailModalOpen(false);
                    setSelectedOrderForEmail(null);
                }}
                onConfirm={handleSendEmailConfirm}
                order={selectedOrderForEmail}
                loading={sendingEmail}
            />

            {/* Send WhatsApp Modal */}
            <SendWhatsAppModal
                isOpen={isSendWhatsAppModalOpen}
                onClose={() => {
                    setIsSendWhatsAppModalOpen(false);
                    setSelectedOrderForWhatsApp(null);
                }}
                order={selectedOrderForWhatsApp}
            />

            {/* Order Activity Drawer */}
            <OrderActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => {
                    setIsActivityDrawerOpen(false);
                    setSelectedOrderForActivity(null);
                }}
                entityType={selectedOrderForActivity?.type}
                entityId={selectedOrderForActivity?._id}
                entityNumber={selectedOrderForActivity?.orderNumber}
                clientName={selectedOrderForActivity?.clientId?.businessName}
            />
        </div>
    );
};

export default OrdersPage;
