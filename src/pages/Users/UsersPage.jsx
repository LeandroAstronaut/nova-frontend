import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, Mail, Phone, User, Percent, Shield, Briefcase, Building2, 
    Eye, MoreHorizontal, Edit2, Activity, CheckCircle, XCircle, Download,
    ChevronUp, ChevronDown
} from 'lucide-react';
import { getStaffUsers, createStaffUser, toggleStaffStatus, updateStaffUser } from '../../services/userService';
import { getClients } from '../../services/clientService';
import { getAllCompanies } from '../../services/companyService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import UserDrawer from '../../components/users/UserDrawer';
import UserActivityDrawer from '../../components/users/UserActivityDrawer';
import UserQuickView from '../../components/users/UserQuickView';


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
        
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleClickOutside);
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
                        e.preventDefault();
                        onClose();
                        setTimeout(() => item.onClick(), 0);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left text-[13px] transition-colors ${
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

    const labels = {
        true: 'Activo',
        false: 'Inactivo'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
            {labels[String(active)] || 'Inactivo'}
        </span>
    );
};

const RoleBadge = ({ roleName }) => {
    const configs = {
        'admin': {
            icon: Shield,
            label: 'Admin',
            styles: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
        },
        'vendedor': {
            icon: Briefcase,
            label: 'Vendedor',
            styles: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
        },
        'cliente': {
            icon: Building2,
            label: 'Cliente',
            styles: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800'
        }
    };

    const config = configs[roleName] || configs['vendedor'];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.styles}`}>
            <Icon size={10} />
            {config.label}
        </span>
    );
};

const UsersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const features = user?.company?.features || {};
    const maxUsers = features.maxUsers || 3;
    const clientUsersEnabled = features.clientUsers || false;

    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [companies, setCompanies] = useState([]);
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
    
    // Modales y drawers
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [statusModal, setStatusModal] = useState({ isOpen: false, user: null, loading: false });
    
    // Action Menu state
    const [openMenu, setOpenMenu] = useState({ id: null, position: null, openAbove: false });
    
    // Role Filter State
    const [roleFilter, setRoleFilter] = useState('all');
    
    // Sorting State
    const [sort, setSort] = useState({
        sortBy: 'firstName',
        order: 'asc'
    });
    
    // Activity Drawer state
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [activityUser, setActivityUser] = useState(null);
    
    // Quick View Drawer state
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [quickViewUser, setQuickViewUser] = useState(null);
    
    // Limpiar user después de que termine la animación de cierre
    useEffect(() => {
        if (!isQuickViewOpen && quickViewUser) {
            const timer = setTimeout(() => setQuickViewUser(null), 300);
            return () => clearTimeout(timer);
        }
    }, [isQuickViewOpen]);
    
    // Edit Drawer state
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    
    // Export Menu state
    const [exportMenu, setExportMenu] = useState({ open: false, position: null });
    
    // Calcular si alcanzó el límite (solo usuarios activos)
    const activeUsersCount = users.filter(u => u.active).length;
    const hasReachedLimit = activeUsersCount >= maxUsers;

    useEffect(() => {
        fetchData();
    }, [pagination.page, debouncedSearchTerm, roleFilter, sort]);

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
            const promises = [
                getStaffUsers({ 
                    page: pagination.page, 
                    limit: pagination.limit,
                    search: debouncedSearchTerm || undefined,
                    role: roleFilter !== 'all' ? roleFilter : undefined,
                    sortBy: sort.sortBy,
                    order: sort.order
                }),
                getClients()
            ];
            // Si es superadmin, también cargar compañías
            if (isSuperadmin) {
                promises.push(getAllCompanies());
            }
            const [usersData, clientsData, companiesData] = await Promise.all(promises);
            
            setUsers(usersData.users || []);
            setPagination(prev => ({
                ...prev,
                total: usersData.pagination?.total || 0,
                totalPages: usersData.pagination?.totalPages || 0
            }));
            
            setClients(clientsData);
            if (isSuperadmin && companiesData) {
                setCompanies(companiesData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            await createStaffUser(userData);
            addToast('Usuario creado exitosamente. Se envió un email de bienvenida.', 'success');
            setIsDrawerOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating user:', error);
            addToast('Error al crear usuario: ' + (error.response?.data?.message || error.message), 'error');
            throw error;
        }
    };

    const handleEditUser = async (userData) => {
        try {
            await updateStaffUser(editUser._id, userData);
            addToast('Usuario actualizado exitosamente', 'success');
            setIsEditDrawerOpen(false);
            setEditUser(null);
            fetchData();
        } catch (error) {
            console.error('Error updating user:', error);
            addToast('Error al actualizar usuario: ' + (error.response?.data?.message || error.message), 'error');
            throw error;
        }
    };

    const handleToggleStatus = (user) => {
        setStatusModal({ isOpen: true, user, loading: false });
    };

    const handleConfirmToggleStatus = async () => {
        try {
            setStatusModal(prev => ({ ...prev, loading: true }));
            await toggleStaffStatus(statusModal.user._id);
            const roleLabel = statusModal.user.roleId?.name === 'admin' ? 'Administrador' : 
                              statusModal.user.roleId?.name === 'cliente' ? 'Usuario de Cliente' : 'Vendedor';
            addToast(`${roleLabel} ${statusModal.user.active ? 'desactivado' : 'activado'} exitosamente`, 'success');
            setStatusModal({ isOpen: false, user: null, loading: false });
            fetchData();
        } catch (error) {
            console.error('Error toggling user status:', error);
            addToast('Error al cambiar estado: ' + (error.response?.data?.message || error.message), 'error');
            setStatusModal({ isOpen: false, user: null, loading: false });
        }
    };

    const handleOpenMenu = (e, userId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const menuHeight = 220; // Altura estimada del menú
        const menuWidth = 192; // Ancho del menú
        
        // Detectar si está cerca del borde inferior
        const openAbove = (rect.bottom + menuHeight) > windowHeight;
        
        // Calcular posición horizontal (alineado a la derecha del botón)
        let leftPosition = rect.left - menuWidth + rect.width;
        
        // Asegurar que no se salga por la derecha
        if (leftPosition + menuWidth > windowWidth) {
            leftPosition = windowWidth - menuWidth - 16;
        }
        
        // Asegurar que no sea negativo
        if (leftPosition < 8) {
            leftPosition = 8;
        }
        
        setOpenMenu({
            id: userId,
            position: {
                top: openAbove ? rect.top - menuHeight : rect.bottom + 8,
                left: leftPosition
            },
            openAbove
        });
    };

    const handleSort = (field) => {
        setSort(prev => ({
            sortBy: field,
            order: prev.sortBy === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ field }) => {
        if (sort.sortBy !== field) return <ChevronUp size={10} className="ml-1 opacity-20" />;
        return sort.order === 'asc' 
            ? <ChevronUp size={12} className="ml-1 text-primary-600 dark:text-primary-400" /> 
            : <ChevronDown size={12} className="ml-1 text-primary-600 dark:text-primary-400" />;
    };

    const handleViewActivity = (user) => {
        setActivityUser(user);
        setIsActivityDrawerOpen(true);
    };

    const handleEdit = (user) => {
        setEditUser(user);
        setIsEditDrawerOpen(true);
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

    const handleExport = () => {
        const headers = ['Nombre', 'Apellido', 'Email', 'Rol', 'Compañía', 'Comisión', 'Estado'];
        const rows = users.map(u => [
            u.firstName,
            u.lastName,
            u.email,
            u.roleId?.name || '',
            u.companyId?.name || '',
            u.commission || 0,
            u.active ? 'Activo' : 'Inactivo'
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        setExportMenu({ open: false, position: null });
    };

    // Nota: El filtrado ahora se hace en el backend

    // Si no es admin ni superadmin, no mostrar nada
    if (!isAdmin && !isSuperadmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-(--text-muted) text-center">
                    <User size={48} className="mx-auto mb-4 opacity-50" />
                    <h2 className="text-lg font-semibold mb-2">Acceso Restringido</h2>
                    <p className="text-sm">Solo los administradores pueden gestionar usuarios.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                        Usuarios
                    </h1>
                    <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                        {clientUsersEnabled 
                            ? 'Gestione vendedores, administradores y usuarios de clientes.'
                            : 'Gestione vendedores y administradores.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Menú de 3 puntitos - Exportar */}
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
                    {/* Botón Nuevo */}
                    <div className="flex flex-col items-end gap-1">
                        <Button 
                            variant="primary" 
                            onClick={() => setIsDrawerOpen(true)}
                            disabled={!isSuperadmin && hasReachedLimit}
                            className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            Nuevo Usuario
                        </Button>
                        {!isSuperadmin && hasReachedLimit && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Alcanzó el límite de {maxUsers} usuarios para su plan
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Filters */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                        {/* Filtro de Rol */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-(--text-muted)">Rol:</span>
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-medium text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-(--bg-card) transition-all"
                            >
                                <option value="all">Todos</option>
                                <option value="admin">Administradores</option>
                                <option value="vendedor">Vendedores</option>
                                {clientUsersEnabled && <option value="cliente">Usuarios de Cliente</option>}
                            </select>
                        </div>
                        
                        {/* Búsqueda */}
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
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('firstName')}>
                                    <div className="flex items-center">Usuario <SortIcon field="firstName" /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('roleId')}>
                                    <div className="flex items-center">Rol <SortIcon field="roleId" /></div>
                                </th>
                                <th className="px-6 py-3">Contacto</th>
                                {isSuperadmin && <th className="px-6 py-3">Compañía</th>}
                                <th className="px-6 py-3 text-center cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('commission')}>
                                    <div className="flex items-center justify-center">Comisión <SortIcon field="commission" /></div>
                                </th>
                                <th className="px-6 py-3 text-center cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('active')}>
                                    <div className="flex items-center justify-center">Estado <SortIcon field="active" /></div>
                                </th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                <tr>
                                    <td colSpan={isSuperadmin ? 7 : 6} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                            <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                            Cargando datos
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((u) => (
                                    <tr 
                                        key={u._id} 
                                        onClick={() => {
                                            setQuickViewUser(u);
                                            setIsQuickViewOpen(true);
                                        }}
                                        className="hover:bg-(--bg-hover) transition-colors even:bg-(--bg-hover)/50 group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                                    u.roleId?.name === 'admin' 
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                                                        : u.roleId?.name === 'cliente'
                                                            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                                                }`}>
                                                    {u.firstName[0]}{u.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-[13px] font-bold text-(--text-primary)">
                                                        {u.firstName} {u.lastName}
                                                    </div>
                                                    <div className="text-[10px] text-(--text-muted)">
                                                        {u.roleId?.name === 'cliente' && u.clientId ? (
                                                            <>Cliente: <span className="font-medium">{u.clientId.businessName}</span></>
                                                        ) : (
                                                            `Creado: ${new Date(u.createdAt).toLocaleDateString()}`
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge roleName={u.roleId?.name} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
                                                    <Mail size={12} />
                                                    {u.email}
                                                </div>
                                                {u.phone && (
                                                    <div className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
                                                        <Phone size={12} />
                                                        {u.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {isSuperadmin && (
                                            <td className="px-6 py-4">
                                                <span className="text-[12px] font-medium text-(--text-secondary)">
                                                    {u.companyId?.name || 'Sin compañía'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            {(u.roleId?.name === 'vendedor' || u.roleId?.name === 'admin') ? (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                                                    <span className="text-[13px] font-bold text-primary-600">
                                                        {u.commission || 0}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[12px] text-(--text-muted)">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge active={u.active} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Botón Ver Detalle - Siempre visible */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/usuarios/${u._id}`);
                                                    }}
                                                    className="p-2 rounded-lg text-(--text-muted) hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={16} strokeWidth={2.5} />
                                                </button>
                                                
                                                {/* Menú de 3 puntitos - Otras acciones */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenMenu(e, u._id);
                                                    }}
                                                    className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {openMenu.id === u._id && (
                                                    <ActionMenu
                                                        openAbove={openMenu.openAbove}
                                                        items={[
                                                            {
                                                                icon: <Eye size={16} />,
                                                                label: 'Ver detalle completo',
                                                                onClick: () => navigate(`/usuarios/${u._id}`)
                                                            },
                                                            {
                                                                icon: <Edit2 size={16} />,
                                                                label: 'Editar',
                                                                onClick: () => handleEdit(u)
                                                            },
                                                            {
                                                                icon: <Activity size={16} />,
                                                                label: 'Ver actividad',
                                                                onClick: () => handleViewActivity(u)
                                                            },
                                                            {
                                                                icon: u.active ? <XCircle size={16} /> : <CheckCircle size={16} />,
                                                                label: u.active ? 'Desactivar' : 'Activar',
                                                                variant: u.active ? 'danger' : 'success',
                                                                onClick: () => handleToggleStatus(u)
                                                            }
                                                        ]}
                                                        position={openMenu.position}
                                                        onClose={() => setOpenMenu({ id: null, position: null, openAbove: false })}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="text-(--text-muted) text-[11px] font-bold uppercase tracking-widest bg-(--bg-hover) w-fit mx-auto px-4 py-2 rounded-lg border border-(--border-color)">
                                            No se encontraron usuarios
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
                    ) : users.length > 0 ? (
                        <div className="divide-y divide-(--border-color)">
                            {users.map((u) => (
                                <div 
                                    key={u._id} 
                                    onClick={() => {
                                        setQuickViewUser(u);
                                        setIsQuickViewOpen(true);
                                    }}
                                    className="p-4 hover:bg-(--bg-hover) transition-colors even:bg-(--bg-hover)/50 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                                u.roleId?.name === 'admin' 
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                                                    : u.roleId?.name === 'cliente'
                                                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                                            }`}>
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-bold text-(--text-primary)">
                                                    {u.firstName} {u.lastName}
                                                </div>
                                                <div className="text-[10px] text-(--text-muted)">
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge active={u.active} />
                                            {(u.roleId?.name === 'vendedor' || u.roleId?.name === 'admin') && (
                                                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                                    {u.commission || 0}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                                        <div className="flex items-center gap-1 text-(--text-secondary)">
                                            <RoleBadge roleName={u.roleId?.name} />
                                        </div>
                                        {u.phone && (
                                            <div className="flex items-center gap-1 text-(--text-secondary)">
                                                <Phone size={12} />
                                                {u.phone}
                                            </div>
                                        )}
                                        {clientUsersEnabled && u.roleId?.name === 'cliente' && u.clientId && (
                                            <div className="col-span-2 flex items-center gap-1 text-(--text-secondary)">
                                                <Building2 size={12} className="text-violet-600" />
                                                <span className="font-medium">{u.clientId.businessName}</span>
                                            </div>
                                        )}
                                        {isSuperadmin && (
                                            <div className="col-span-2 flex items-center gap-1 text-(--text-secondary)">
                                                <Building2 size={12} className="text-(--text-muted)" />
                                                <span className="truncate">{u.companyId?.name || 'Sin compañía'}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Acciones Mobile */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border-color)">
                                        {/* Botón Ver Detalle - Siempre visible */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/usuarios/${u._id}`);
                                            }}
                                            className="p-2 text-(--text-muted) hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                            title="Ver detalle"
                                        >
                                            <Eye size={18} strokeWidth={2.5} />
                                        </button>
                                        
                                        {/* Menú de 3 puntitos - Otras acciones */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenMenu(e, u._id);
                                            }}
                                            className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                    
                                    {/* Menu - Mobile */}
                                    {openMenu.id === u._id && (
                                        <ActionMenu
                                            openAbove={openMenu.openAbove}
                                            items={[
                                                {
                                                    icon: <Eye size={16} />,
                                                    label: 'Ver detalle completo',
                                                    onClick: () => navigate(`/usuarios/${u._id}`)
                                                },
                                                {
                                                    icon: <Edit2 size={16} />,
                                                    label: 'Editar',
                                                    onClick: () => handleEdit(u)
                                                },
                                                {
                                                    icon: <Activity size={16} />,
                                                    label: 'Ver actividad',
                                                    onClick: () => handleViewActivity(u)
                                                },
                                                {
                                                    icon: u.active ? <XCircle size={16} /> : <CheckCircle size={16} />,
                                                    label: u.active ? 'Desactivar' : 'Activar',
                                                    variant: u.active ? 'danger' : 'success',
                                                    onClick: () => handleToggleStatus(u)
                                                }
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
                                No se encontraron usuarios
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover) flex items-center justify-between">
                    <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        Mostrando {users.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registros
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

            {/* User Drawer - Crear */}
            <UserDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedUser(null);
                }}
                onSave={handleCreateUser}
                user={null}
                clients={clients}
                features={user?.company?.features || {}}
                companies={companies}
                isSuperadmin={isSuperadmin}
                currentUser={user}
            />

            {/* Edit Drawer */}
            <UserDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => {
                    setIsEditDrawerOpen(false);
                    setEditUser(null);
                }}
                onSave={handleEditUser}
                user={editUser}
                isSuperadmin={isSuperadmin}
                features={user?.company?.features || {}}
                clients={clients}
                currentUser={user}
            />

            {/* Activity Drawer */}
            <UserActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => {
                    setIsActivityDrawerOpen(false);
                    setActivityUser(null);
                }}
                user={activityUser}
                isSuperadmin={isSuperadmin}
            />

            {/* User Quick View Drawer */}
            <UserQuickView
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                user={quickViewUser}
                isSuperadmin={isSuperadmin}
            />

            {/* Status Toggle Modal */}
            <ConfirmModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ isOpen: false, user: null, loading: false })}
                onConfirm={handleConfirmToggleStatus}
                title={statusModal.user?.active ? '¿Desactivar Usuario?' : '¿Activar Usuario?'}
                description={
                    <p>
                        Está a punto de {statusModal.user?.active ? 'desactivar' : 'activar'} a{' '}
                        <strong>{statusModal.user?.firstName} {statusModal.user?.lastName}</strong>.
                        {statusModal.user?.active 
                            ? ' El usuario no podrá iniciar sesión hasta que sea reactivado.' 
                            : ' El usuario podrá iniciar sesión nuevamente.'}
                    </p>
                }
                confirmText={statusModal.loading ? 'Procesando...' : (statusModal.user?.active ? 'Desactivar' : 'Activar')}
                type={statusModal.user?.active ? 'danger' : 'success'}
            />
        </div>
    );
};

// UsersPage component - Manage system users
export default UsersPage;
