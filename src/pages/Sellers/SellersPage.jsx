import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Mail, Phone, User, Percent, Shield, Briefcase, Building2 } from 'lucide-react';
import { getStaffUsers, createStaffUser, toggleStaffStatus } from '../../services/sellerService';
import { getClients } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import SellerDrawer from '../../components/sellers/SellerDrawer';

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

const SellersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const isAdmin = user?.role?.name === 'admin';

    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modales
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [statusModal, setStatusModal] = useState({ isOpen: false, user: null, loading: false });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, clientsData] = await Promise.all([
                getStaffUsers(),
                getClients()
            ]);
            setUsers(usersData);
            setClients(clientsData);
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

    // Filtrar usuarios por búsqueda
    const filteredUsers = users.filter(u => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            u.firstName?.toLowerCase().includes(term) ||
            u.lastName?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            u.roleId?.name?.toLowerCase().includes(term) ||
            u.clientId?.businessName?.toLowerCase().includes(term)
        );
    });

    // Si no es admin, no mostrar nada
    if (!isAdmin) {
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
                        Gestione vendedores, administradores y usuarios de clientes.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="primary" 
                        onClick={() => setIsDrawerOpen(true)}
                        className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        Nuevo Usuario
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Filters */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={14} strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email, rol o cliente..."
                            className="w-full pl-9 pr-4 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-medium text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Vista Desktop - Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--bg-hover) text-[10px] font-bold text-(--text-muted) uppercase tracking-widest border-y border-(--border-color)">
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3">Rol</th>
                                <th className="px-6 py-3">Contacto</th>
                                <th className="px-6 py-3 text-center">Comisión</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-(--text-muted)">
                                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                                Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr 
                                        key={u._id} 
                                        className="hover:bg-(--bg-hover) transition-colors group"
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
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${
                                                u.roleId?.name === 'cliente'
                                                    ? 'bg-(--bg-hover) text-(--text-muted)'
                                                    : 'bg-primary-50 dark:bg-primary-900/30'
                                            }`}>
                                                <Percent size={12} className={u.roleId?.name === 'cliente' ? '' : 'text-primary-600'} />
                                                <span className={`text-[13px] font-bold ${u.roleId?.name === 'cliente' ? '' : 'text-primary-600'}`}>
                                                    {u.commission || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge active={u.active} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                                    u.active 
                                                        ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20' 
                                                        : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                                                }`}
                                            >
                                                {u.active ? 'Desactivar' : 'Activar'}
                                            </button>
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
                        <div className="p-6 text-center">
                            <div className="flex items-center justify-center gap-2 text-(--text-muted)">
                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                Cargando...
                            </div>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="divide-y divide-(--border-color)">
                            {filteredUsers.map((u) => (
                                <div key={u._id} className="p-4 hover:bg-(--bg-hover) transition-colors">
                                    {/* Header: Avatar y Estado */}
                                    <div className="flex items-center justify-between mb-3">
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
                                        <StatusBadge active={u.active} />
                                    </div>
                                    
                                    {/* Info Grid */}
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
                                        {u.roleId?.name === 'cliente' && u.clientId && (
                                            <div className="col-span-2 flex items-center gap-1 text-(--text-secondary)">
                                                <Building2 size={12} className="text-violet-600" />
                                                <span className="font-medium">{u.clientId.businessName}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-(--text-secondary)">
                                            <Percent size={12} className={u.roleId?.name === 'cliente' ? 'text-(--text-muted)' : 'text-primary-600'} />
                                            <span className={u.roleId?.name === 'cliente' ? '' : 'font-bold'}>{u.commission || 0}%</span> comisión
                                        </div>
                                    </div>
                                    
                                    {/* Acciones */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border-color)">
                                        <button
                                            onClick={() => handleToggleStatus(u)}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                                u.active 
                                                    ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20' 
                                                    : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                                            }`}
                                        >
                                            {u.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
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

                {/* Footer */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover)">
                    <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        Total {filteredUsers.length} registros
                    </span>
                </div>
            </div>

            {/* User Drawer */}
            <SellerDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedUser(null);
                }}
                onSave={selectedUser ? () => {} : handleCreateUser}
                user={selectedUser}
                clients={clients}
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

export default SellersPage;
