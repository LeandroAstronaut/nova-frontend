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
    CheckCircle
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        espera: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border-warning-100 dark:border-warning-800',
        confirmado: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800',
        preparado: 'bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400 border-info-100 dark:border-info-800',
        completo: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.espera}`}>
            {status}
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
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Building2 } from 'lucide-react';
import { generateOrderPDF } from '../../utils/pdfGenerator';

// Función para exportar a CSV
const exportToCSV = (data, mode) => {
    const headers = ['Número', 'Cliente', 'Fecha', 'Vendedor', 'Total', 'Estado'];
    const rows = data.map(order => [
        `#${String(order.orderNumber).padStart(5, '0')}`,
        order.clientId?.businessName || 'N/A',
        new Date(order.date).toLocaleDateString(),
        `${order.salesRepId?.firstName || ''} ${order.salesRepId?.lastName || ''}`.trim(),
        `$${order.items.reduce((acc, item) => acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0).toLocaleString()}`,
        order.status
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${mode === 'order' ? 'pedidos' : 'presupuestos'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

// Dropdown Menu Component - Posicionado fijo para evitar overflow de la tabla
const ActionMenu = ({ items, onClose, position }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: position?.top || 0,
                left: position?.left || 0,
            }}
            className="w-48 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-300 overflow-hidden"
        >
            {items.map((item, idx) => (
                <button
                    key={idx}
                    onClick={() => {
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
    const { user } = useAuth();
    const { addToast } = useToast();
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin';
    const isVendedor = user?.role?.name === 'vendedor';
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Filters & Sorting State
    const [filters, setFilters] = useState({
        clientId: '',
        salesRepId: '',
    });
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

    // Action Menu state
    const [openMenu, setOpenMenu] = useState({ id: null, position: null });

    // Delete confirmation state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null, loading: false });

    // Revert to budget confirmation state
    const [revertModal, setRevertModal] = useState({ isOpen: false, order: null, loading: false });

    const handleOpenMenu = (e, orderId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setOpenMenu({
            id: orderId,
            position: {
                top: rect.bottom + 8, // 8px de margen
                left: rect.left - 192 + rect.width // Alinear a la derecha (192px = width del menú)
            }
        });
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [mode, filters, sort, debouncedSearchTerm]);

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
                ...filters,
                ...sort,
                search: debouncedSearchTerm
            });
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [mode, filters, sort, debouncedSearchTerm]);

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
            // Admin no puede editar pedidos en preparación o completados
            if (order.type === 'order' && (order.status === 'preparado' || order.status === 'completo')) {
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
        return false;
    };

    // PERMISOS: Determinar si puede ver
    const canView = (order) => {
        if (isSuperadmin) return true;
        if (isAdmin) return true;
        if (isVendedor) {
            return isSameId(order.salesRepId, user?.id);
        }
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
        if (isAdmin) return true;
        if (isVendedor) {
            const isOwn = isSameId(order.salesRepId, user?.id);
            const isPending = order.status === 'espera';
            return isOwn && isPending;
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
        // Vista de solo lectura para TODOS los usuarios
        setDrawerMode('view'); // Modo view para solo lectura
        setDrawerType(order.type || mode);
        setSelectedOrder(order);
        setIsDrawerOpen(true);
    };

    const handleDeleteClick = (order) => {
        setDeleteModal({ isOpen: true, order, loading: false });
        setOpenMenu({ id: null, position: null }); // Cerrar menú
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

    // Revertir pedido a presupuesto
    const canRevertToBudget = (order) => {
        // Solo admin puede revertir pedidos confirmados (no preparados ni completados)
        return isAdmin && order?.type === 'order' && order?.status === 'confirmado';
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
            const statusText = status === 'preparado' ? 'En Preparación' : 'Completado';
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
        setRevertModal({ isOpen: true, order, loading: false });
        setOpenMenu({ id: null, position: null }); // Cerrar menú
    };

    const handleRevertConfirm = async () => {
        if (!revertModal.order) return;
        
        try {
            setRevertModal(prev => ({ ...prev, loading: true }));
            await revertOrderToBudget(revertModal.order._id);
            setRevertModal({ isOpen: false, order: null, loading: false });
            addToast('Pedido revertido a presupuesto exitosamente', 'success');
            fetchOrders(); // Refrescar lista
        } catch (error) {
            console.error('Error reverting order:', error);
            addToast('Error al revertir: ' + (error.response?.data?.message || error.message), 'error');
            setRevertModal({ isOpen: false, order: null, loading: false });
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
                    <Button 
                        variant="secondary" 
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                        onClick={() => exportToCSV(orders, mode)}
                    >
                        <Download size={14} strokeWidth={2.5} />
                        Exportar
                    </Button>
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
                    <div className={`grid grid-cols-1 gap-4 ${isVendedor ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={14} strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Buscar por número..."
                                className="w-full pl-9 pr-4 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-medium text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-(--bg-card) transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                            />
                        </div>

                        {/* Client Filter - Vendedores solo ven sus clientes asignados */}
                        <select
                            className="bg-(--bg-input) border border-(--border-color) rounded-lg px-3 py-2 text-xs font-medium text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                            value={filters.clientId}
                            onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
                        >
                            <option value="">{isVendedor ? 'Mis Clientes' : 'Todos los Clientes'}</option>
                            {clients
                                .filter(c => !isVendedor || isSameId(c.salesRepId, user?.id))
                                .map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.businessName}{isSuperadmin && c.companyId?.name ? ` (${c.companyId.name})` : ''}
                                    </option>
                                ))}
                        </select>

                        {/* Seller Filter - Oculto para vendedores */}
                        {!isVendedor && (
                            <select
                                className="bg-(--bg-input) border border-(--border-color) rounded-lg px-3 py-2 text-xs font-medium text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                value={filters.salesRepId}
                                onChange={(e) => setFilters({ ...filters, salesRepId: e.target.value })}
                            >
                                <option value="">Todos los Vendedores</option>
                                {sellers.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.firstName} {s.lastName}{isSuperadmin && s.companyId?.name ? ` (${s.companyId.name})` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
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
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={isSuperadmin ? 8 : 7} className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                                Sincronizando...
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-(--bg-hover) transition-colors group">
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
                                            ${order.items.reduce((acc, item) => acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Botón Convertir a Pedido - Solo para presupuestos */}
                                                {canConvertToOrder(order) && (
                                                    <button
                                                        onClick={() => handleConvertClick(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500 hover:bg-success-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <ArrowRight size={14} strokeWidth={2.5} />
                                                        Convertir
                                                    </button>
                                                )}

                                                {/* Botón Preparar - Solo admin y pedidos confirmados */}
                                                {canPrepareOrder(order) && (
                                                    <button
                                                        onClick={() => handlePrepareClick(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <Package size={14} strokeWidth={2.5} />
                                                        Preparar
                                                    </button>
                                                )}

                                                {/* Botón Completar - Solo admin y pedidos preparados */}
                                                {canCompleteOrder(order) && (
                                                    <button
                                                        onClick={() => handleCompleteClick(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500 hover:bg-success-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <CheckCircle size={14} strokeWidth={2.5} />
                                                        Completar
                                                    </button>
                                                )}

                                                {/* Botón Ver - Siempre visible si tiene permiso */}
                                                {canView(order) && (
                                                    <button
                                                        onClick={() => handleViewOrder(order)}
                                                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={16} strokeWidth={2.5} />
                                                    </button>
                                                )}

                                                {/* Menú de 3 puntos - Acciones adicionales */}
                                                <div>
                                                    <button
                                                        onClick={(e) => handleOpenMenu(e, order._id)}
                                                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    {openMenu.id === order._id && (
                                                        <ActionMenu
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
                                                                {
                                                                    icon: <Send size={16} />,
                                                                    label: 'Enviar por email',
                                                                    onClick: () => handleSendEmailClick(order)
                                                                },
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
                                                                ...(canRevertToBudget(order) ? [{
                                                                    icon: <ArrowLeft size={16} />,
                                                                    label: 'Volver a presupuesto',
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
                                                            onClose={() => setOpenMenu({ id: null, position: null })}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isSuperadmin ? 8 : 7} className="px-6 py-12 text-center">
                                        <div className="text-(--text-muted) text-[11px] font-bold uppercase tracking-widest bg-(--bg-hover) w-fit mx-auto px-4 py-2 rounded-lg border border-(--border-color)">
                                            No se encontraron {mode === 'order' ? 'pedidos' : 'presupuestos'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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

            {/* Revert to Budget Confirmation Modal */}
            <ConfirmModal
                isOpen={revertModal.isOpen}
                onClose={() => setRevertModal({ isOpen: false, order: null, loading: false })}
                onConfirm={handleRevertConfirm}
                title="¿Volver a Presupuesto?"
                description={`Está a punto de revertir el pedido #${String(revertModal.order?.orderNumber || '').padStart(5, '0')} a presupuesto. El pedido volverá a estado "espera" y podrá ser editado nuevamente.`}
                confirmText={revertModal.loading ? 'Revirtiendo...' : 'Sí, volver a presupuesto'}
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
        </div>
    );
};

export default OrdersPage;
