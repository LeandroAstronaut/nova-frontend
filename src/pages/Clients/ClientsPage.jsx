import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, Mail, Phone, User, Building2, MapPin, Percent, 
    Eye, MoreHorizontal, Edit2, CheckCircle, XCircle, Truck, Tag, Activity
} from 'lucide-react';
import { getClients, createClient, toggleClientStatus } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import ClientDrawer from '../../components/clients/ClientDrawer';
import ClientActivityDrawer from '../../components/clients/ClientActivityDrawer';

// Action Menu Component
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
        
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: openAbove ? position.top - 200 : position.top,
                left: Math.min(position.left, window.innerWidth - 200),
                zIndex: 300
            }}
            className="w-48 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-color)] py-1 animate-in fade-in zoom-in-95 duration-100"
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                        onClose();
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left text-sm transition-colors ${
                        item.variant === 'danger' 
                            ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20' 
                            : item.variant === 'success'
                                ? 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                >
                    <span className={item.variant === 'danger' ? 'text-danger-600' : item.variant === 'success' ? 'text-success-600' : 'text-[var(--text-muted)]'}>
                        {item.icon}
                    </span>
                    {item.label}
                </button>
            ))}
        </div>
    );
};

const StatusBadge = ({ active }) => {
    const styles = active 
        ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800'
        : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800';

    const Icon = active ? CheckCircle : XCircle;
    const label = active ? 'Activo' : 'Inactivo';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
            <Icon size={10} />
            {label}
        </span>
    );
};

const ClientsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isVendedor = user?.role?.name === 'vendedor';

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
    
    // Modales y drawers
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editClient, setEditClient] = useState(null);
    const [activityClient, setActivityClient] = useState(null);
    const [statusModal, setStatusModal] = useState({ isOpen: false, client: null, loading: false });
    const [openMenu, setOpenMenu] = useState({ id: null, position: null, openAbove: false });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const clientsData = await getClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Error fetching clients:', error);
            addToast('Error al cargar clientes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (clientData) => {
        try {
            await createClient(clientData);
            addToast('Cliente creado exitosamente', 'success');
            setIsDrawerOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating client:', error);
            addToast('Error al crear cliente: ' + (error.response?.data?.message || error.message), 'error');
            throw error;
        }
    };

    const handleToggleStatus = (client) => {
        setStatusModal({ isOpen: true, client, loading: false });
    };

    const handleEdit = (client) => {
        setEditClient(client);
        setIsEditDrawerOpen(true);
    };

    const handleEditClient = async (clientData) => {
        try {
            const { updateClient } = await import('../../services/clientService');
            await updateClient(editClient._id, clientData);
            addToast('Cliente actualizado exitosamente', 'success');
            setIsEditDrawerOpen(false);
            setEditClient(null);
            fetchData();
        } catch (error) {
            console.error('Error updating client:', error);
            addToast('Error al actualizar cliente: ' + (error.response?.data?.message || error.message), 'error');
            throw error;
        }
    };

    const handleViewActivity = (client) => {
        setActivityClient(client);
        setIsActivityDrawerOpen(true);
    };

    const handleConfirmToggleStatus = async () => {
        try {
            setStatusModal(prev => ({ ...prev, loading: true }));
            await toggleClientStatus(statusModal.client._id);
            addToast(`Cliente ${statusModal.client.active ? 'desactivado' : 'activado'} exitosamente`, 'success');
            setStatusModal({ isOpen: false, client: null, loading: false });
            fetchData();
        } catch (error) {
            console.error('Error toggling client status:', error);
            addToast('Error al cambiar estado: ' + (error.response?.data?.message || error.message), 'error');
            setStatusModal({ isOpen: false, client: null, loading: false });
        }
    };

    const handleOpenMenu = (e, clientId) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openAbove = spaceBelow < 200;
        
        setOpenMenu({
            id: clientId,
            position: { top: rect.bottom, left: rect.left - 160 + rect.width },
            openAbove
        });
    };

    // Filtrar clientes
    const filteredClients = clients.filter(c => {
        // Filtro por estado
        if (statusFilter === 'active' && !c.active) return false;
        if (statusFilter === 'inactive' && c.active) return false;
        
        // Filtro por búsqueda
        const term = searchTerm.toLowerCase();
        return (
            c.businessName?.toLowerCase().includes(term) ||
            c.cuit?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.salesRepId?.firstName?.toLowerCase().includes(term) ||
            c.salesRepId?.lastName?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                        Clientes
                    </h1>
                    <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                        Gestiona los clientes de tu empresa
                    </p>
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                >
                    <Plus size={14} strokeWidth={2.5} />
                    Nuevo Cliente
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Filters */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="flex justify-end gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        >
                            <option value="all">Todos</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={14} strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Table - Desktop */}
                <div className="overflow-x-auto hidden lg:block">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--bg-hover) text-[10px] font-bold text-(--text-muted) uppercase tracking-widest border-y border-(--border-color)">
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Vendedor</th>
                                <th className="px-6 py-3">Contacto</th>
                                <th className="px-6 py-3 text-center">Descuento</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-(--text-muted)">
                                            <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                            Cargando...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClients.length > 0 ? (
                                filteredClients.map((c) => (
                                    <tr 
                                        key={c._id} 
                                        onClick={() => navigate(`/clientes/${c._id}`)}
                                        className="hover:bg-(--bg-hover) transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-sm">
                                                    {c.businessName?.[0] || 'C'}
                                                </div>
                                                <div>
                                                    <div className="text-[13px] font-bold text-(--text-primary)">
                                                        {c.businessName}
                                                    </div>
                                                    <div className="text-[10px] text-(--text-muted)">
                                                        {c.cuit ? `CUIT: ${c.cuit}` : 'Sin CUIT'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
                                                <User size={12} />
                                                {c.salesRepId?.firstName} {c.salesRepId?.lastName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {c.email && (
                                                    <div className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
                                                        <Mail size={12} />
                                                        {c.email}
                                                    </div>
                                                )}
                                                {c.phone && (
                                                    <div className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
                                                        <Phone size={12} />
                                                        {c.phone}
                                                    </div>
                                                )}
                                                {!c.email && !c.phone && (
                                                    <span className="text-[12px] text-(--text-muted)">Sin contacto</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {c.discount > 0 ? (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                                                    <span className="text-[13px] font-bold text-primary-600">
                                                        {c.discount}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[12px] text-(--text-muted)">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge active={c.active} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenMenu(e, c._id);
                                                    }}
                                                    className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {openMenu.id === c._id && (
                                                    <ActionMenu
                                                        items={[
                                                            {
                                                                icon: <Eye size={16} />,
                                                                label: 'Ver detalle',
                                                                onClick: () => navigate(`/clientes/${c._id}`)
                                                            },
                                                            {
                                                                icon: <Activity size={16} />,
                                                                label: 'Ver actividad',
                                                                onClick: () => handleViewActivity(c)
                                                            },
                                                            {
                                                                icon: <Edit2 size={16} />,
                                                                label: 'Editar',
                                                                onClick: () => handleEdit(c)
                                                            },
                                                            {
                                                                icon: c.active ? <XCircle size={16} /> : <CheckCircle size={16} />,
                                                                label: c.active ? 'Desactivar' : 'Activar',
                                                                variant: c.active ? 'danger' : 'success',
                                                                onClick: () => handleToggleStatus(c)
                                                            }
                                                        ]}
                                                        position={openMenu.position}
                                                        onClose={() => setOpenMenu({ id: null, position: null, openAbove: false })}
                                                        openAbove={openMenu.openAbove}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="text-(--text-muted)">
                                            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                                            <p className="text-sm font-medium">No se encontraron clientes</p>
                                            <p className="text-xs mt-1">Intenta con otra búsqueda o crea uno nuevo</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden">
                    {filteredClients.length > 0 ? (
                        filteredClients.map((c) => (
                            <div 
                                key={c._id}
                                onClick={() => navigate(`/clientes/${c._id}`)}
                                className="p-4 border-b border-(--border-color) hover:bg-(--bg-hover) cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-sm">
                                            {c.businessName?.[0] || 'C'}
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-bold text-(--text-primary)">
                                                {c.businessName}
                                            </div>
                                            <div className="text-[10px] text-(--text-muted)">
                                                {c.cuit ? `CUIT: ${c.cuit}` : 'Sin CUIT'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusBadge active={c.active} />
                                                {c.discount > 0 && (
                                                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                                        {c.discount}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenMenu(e, c._id);
                                        }}
                                        className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover)"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-(--text-secondary)">
                                    <div className="flex items-center gap-1">
                                        <User size={12} />
                                        {c.salesRepId?.firstName} {c.salesRepId?.lastName}
                                    </div>
                                    {c.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone size={12} />
                                            {c.phone}
                                        </div>
                                    )}
                                    {c.email && (
                                        <div className="flex items-center gap-1 col-span-2 truncate">
                                            <Mail size={12} />
                                            {c.email}
                                        </div>
                                    )}
                                </div>
                                {/* Acciones Mobile */}
                                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-(--border-color)">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/clientes/${c._id}`);
                                        }}
                                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                                        title="Ver detalle"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewActivity(c);
                                        }}
                                        className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) rounded-lg"
                                        title="Ver actividad"
                                    >
                                        <Activity size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(c);
                                        }}
                                        className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) rounded-lg"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStatus(c);
                                        }}
                                        className={`p-2 rounded-lg ${
                                            c.active 
                                                ? 'text-danger-600 hover:bg-danger-50' 
                                                : 'text-success-600 hover:bg-success-50'
                                        }`}
                                        title={c.active ? 'Desactivar' : 'Activar'}
                                    >
                                        {c.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center">
                            <div className="text-(--text-muted)">
                                <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="text-sm font-medium">No se encontraron clientes</p>
                                <p className="text-xs mt-1">Intenta con otra búsqueda o crea uno nuevo</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover)">
                    <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        Total {filteredClients.length} registros
                    </span>
                </div>
            </div>

            {/* Client Drawer - Crear */}
            <ClientDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedClient(null);
                }}
                onSave={handleCreateClient}
                client={null}
            />

            {/* Status Toggle Modal */}
            <ConfirmModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ isOpen: false, client: null, loading: false })}
                onConfirm={handleConfirmToggleStatus}
                title={statusModal.client?.active ? '¿Desactivar Cliente?' : '¿Activar Cliente?'}
                description={
                    <p>
                        Está a punto de {statusModal.client?.active ? 'desactivar' : 'activar'} a{' '}
                        <strong>{statusModal.client?.businessName}</strong>.
                        {statusModal.client?.active 
                            ? ' El cliente no podrá ser utilizado en pedidos hasta que sea reactivado.' 
                            : ' El cliente podrá ser utilizado nuevamente en pedidos.'}
                    </p>
                }
                confirmText={statusModal.loading ? 'Procesando...' : (statusModal.client?.active ? 'Desactivar' : 'Activar')}
                type={statusModal.client?.active ? 'danger' : 'success'}
            />

            {/* Edit Drawer */}
            <ClientDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => {
                    setIsEditDrawerOpen(false);
                    setEditClient(null);
                }}
                onSave={handleEditClient}
                client={editClient}
            />

            {/* Activity Drawer */}
            <ClientActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => {
                    setIsActivityDrawerOpen(false);
                    setActivityClient(null);
                }}
                client={activityClient}
            />
        </div>
    );
};

export default ClientsPage;
