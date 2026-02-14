import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Mail, Phone, Shield, Briefcase, Building2, 
    Percent, Calendar, CheckCircle, XCircle, Edit2, 
    FileText, Clock, LogIn, Activity
} from 'lucide-react';
import { getStaffUser, updateStaffUser, toggleStaffStatus } from '../../services/userService';
import { getClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import UserActivityDrawer from '../../components/users/UserActivityDrawer';
import UserDrawer from '../../components/users/UserDrawer';

const RoleBadge = ({ roleName }) => {
    const configs = {
        'admin': {
            icon: Shield,
            label: 'Administrador',
            styles: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
        },
        'vendedor': {
            icon: Briefcase,
            label: 'Vendedor',
            styles: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
        },
        'cliente': {
            icon: Building2,
            label: 'Usuario de Cliente',
            styles: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800'
        }
    };

    const config = configs[roleName] || configs['vendedor'];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${config.styles}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

const StatusBadge = ({ active }) => {
    const styles = active 
        ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800'
        : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800';

    const Icon = active ? CheckCircle : XCircle;
    const label = active ? 'Activo' : 'Inactivo';

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${styles}`}>
            <Icon size={14} />
            {label}
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

const StatCard = ({ label, value, icon: Icon, color = 'primary' }) => {
    const colorStyles = {
        primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600',
        success: 'bg-success-50 dark:bg-success-900/30 text-success-600',
        warning: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600',
        danger: 'bg-danger-50 dark:bg-danger-900/30 text-danger-600',
    };

    return (
        <div className="bg-(--bg-hover) rounded-xl p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${colorStyles[color]} flex items-center justify-center`}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="text-[11px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-black text-(--text-primary)">{value}</p>
                </div>
            </div>
        </div>
    );
};

const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();

    const [user, setUser] = useState(null);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusModal, setStatusModal] = useState({ isOpen: false, loading: false });
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

    const isAdmin = currentUser?.role?.name === 'admin';
    const isSuperadmin = currentUser?.role?.name === 'superadmin';

    useEffect(() => {
        fetchUser();
        fetchClients();
    }, [id]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const data = await getStaffUser(id);
            setUser(data);
        } catch (error) {
            console.error('Error fetching user:', error);
            addToast('Error al cargar el usuario', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleToggleStatus = () => {
        setStatusModal({ isOpen: true, loading: false });
    };

    const handleConfirmToggleStatus = async () => {
        try {
            setStatusModal(prev => ({ ...prev, loading: true }));
            await toggleStaffStatus(user._id);
            const roleLabel = user.roleId?.name === 'admin' ? 'Administrador' : 
                              user.roleId?.name === 'cliente' ? 'Usuario de Cliente' : 'Vendedor';
            addToast(`${roleLabel} ${user.active ? 'desactivado' : 'activado'} exitosamente`, 'success');
            setStatusModal({ isOpen: false, loading: false });
            fetchUser();
        } catch (error) {
            console.error('Error toggling user status:', error);
            addToast('Error al cambiar estado: ' + (error.response?.data?.message || error.message), 'error');
            setStatusModal({ isOpen: false, loading: false });
        }
    };

    const handleEditUser = async (userData) => {
        try {
            await updateStaffUser(user._id, userData);
            addToast('Usuario actualizado exitosamente', 'success');
            setIsEditDrawerOpen(false);
            fetchUser();
        } catch (error) {
            console.error('Error updating user:', error);
            addToast('Error al actualizar usuario: ' + (error.response?.data?.message || error.message), 'error');
            throw error;
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

    if (!user) return null;

    const isVendedor = user.roleId?.name === 'vendedor';
    const isUserAdmin = user.roleId?.name === 'admin';
    const isCliente = user.roleId?.name === 'cliente';

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
                                {user.firstName} {user.lastName}
                            </h1>
                            <RoleBadge roleName={user.roleId?.name} />
                            <StatusBadge active={user.active} />
                        </div>
                        <p className="text-[13px] text-(--text-secondary) mt-0.5">
                            {user.email}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        onClick={() => setIsEditDrawerOpen(true)}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <Edit2 size={14} strokeWidth={2.5} />
                        Editar
                    </Button>

                    {isAdmin && (
                        <Button 
                            variant="secondary" 
                            onClick={handleToggleStatus}
                            className={`px-3! text-[11px] font-bold uppercase tracking-wider ${
                                user.active 
                                    ? 'text-danger-600 hover:text-danger-700' 
                                    : 'text-success-600 hover:text-success-700'
                            }`}
                        >
                            {user.active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                            {user.active ? 'Desactivar' : 'Activar'}
                        </Button>
                    )}

                    <Button 
                        variant="secondary" 
                        onClick={handleViewActivity}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <Activity size={14} strokeWidth={2.5} />
                        Actividad
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label="Pedidos Creados" 
                    value={user.stats?.ordersCreated || 0} 
                    icon={FileText}
                    color="primary"
                />
                <StatCard 
                    label="Presupuestos" 
                    value={user.stats?.budgetsCreated || 0} 
                    icon={FileText}
                    color="warning"
                />
                <StatCard 
                    label="Total Vendido" 
                    value={`$${(user.stats?.totalSales || 0).toLocaleString('es-AR')}`}
                    icon={Activity}
                    color="success"
                />
                <StatCard 
                    label="Último Acceso" 
                    value={user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-AR') : 'Nunca'}
                    icon={LogIn}
                    color="danger"
                />
            </div>

            {/* Main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Header de la card */}
                <div className="bg-(--bg-card) p-6 border-b border-(--border-color)">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl ${
                            user.roleId?.name === 'admin' 
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                                : user.roleId?.name === 'cliente'
                                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        }`}>
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-(--text-primary)">
                                {user.firstName} {user.lastName}
                            </h2>
                            <p className="text-[13px] text-(--text-secondary)">
                                {isCliente && user.clientId 
                                    ? `Cliente asignado: ${user.clientId.businessName}`
                                    : `Miembro desde ${new Date(user.createdAt).toLocaleDateString('es-AR')}`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna izquierda - Información de Contacto */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Información de Contacto
                                </h3>
                                <InfoRow 
                                    label="Email" 
                                    value={user.email}
                                    icon={Mail}
                                />
                                <InfoRow 
                                    label="Teléfono" 
                                    value={user.phone || 'No especificado'}
                                    icon={Phone}
                                />
                                <InfoRow 
                                    label="WhatsApp" 
                                    value={user.whatsapp || 'No especificado'}
                                    icon={Phone}
                                />
                            </div>

                            <div className="pt-6 border-t border-(--border-color)">
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Información de la Cuenta
                                </h3>
                                {isSuperadmin && (
                                    <InfoRow 
                                        label="Compañía" 
                                        value={user.companyId?.name || 'No especificada'}
                                        icon={Building2}
                                    />
                                )}
                                <InfoRow 
                                    label="Rol" 
                                    value={user.roleId?.name === 'admin' ? 'Administrador' : 
                                          user.roleId?.name === 'cliente' ? 'Usuario de Cliente' : 'Vendedor'}
                                    icon={Shield}
                                />
                                <InfoRow 
                                    label="Estado" 
                                    value={user.active ? 'Activo' : 'Inactivo'}
                                    icon={user.active ? CheckCircle : XCircle}
                                />
                                <InfoRow 
                                    label="Fecha de Creación" 
                                    value={new Date(user.createdAt).toLocaleDateString('es-AR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                    icon={Calendar}
                                />
                            </div>
                        </div>

                        {/* Columna derecha - Información Laboral */}
                        <div className="space-y-6">
                            {(isVendedor || isUserAdmin) && (
                                <div>
                                    <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                        Información Laboral
                                    </h3>
                                    <InfoRow 
                                        label="Comisión" 
                                        value={`${user.commission || 0}%`}
                                        icon={Percent}
                                    />
                                    <InfoRow 
                                        label="Clientes Asignados" 
                                        value={user.assignedClients?.length || 0}
                                        icon={Building2}
                                    />
                                </div>
                            )}

                            {isCliente && user.clientId && (
                                <div>
                                    <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                        Cliente Asociado
                                    </h3>
                                    <InfoRow 
                                        label="Razón Social" 
                                        value={user.clientId.businessName}
                                        icon={Building2}
                                    />
                                    <InfoRow 
                                        label="CUIT" 
                                        value={user.clientId.cuit}
                                        icon={FileText}
                                    />
                                </div>
                            )}

                            <div className={`${(isVendedor || isUserAdmin || (isCliente && user.clientId)) ? 'pt-6 border-t border-(--border-color)' : ''}`}>
                                <h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-4">
                                    Actividad Reciente
                                </h3>
                                <InfoRow 
                                    label="Último Inicio de Sesión" 
                                    value={user.lastLogin 
                                        ? new Date(user.lastLogin).toLocaleString('es-AR', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'Nunca ha iniciado sesión'
                                    }
                                    icon={Clock}
                                />
                                <InfoRow 
                                    label="Última Actualización" 
                                    value={new Date(user.updatedAt).toLocaleString('es-AR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    icon={Clock}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Drawer */}
            <UserActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => setIsActivityDrawerOpen(false)}
                user={user}
                isSuperadmin={isSuperadmin}
            />

            {/* Edit Drawer */}
            <UserDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => setIsEditDrawerOpen(false)}
                onSave={handleEditUser}
                user={user}
                isSuperadmin={isSuperadmin}
                features={user?.companyId?.features || {}}
                clients={clients}
            />

            {/* Status Toggle Modal */}
            <ConfirmModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ isOpen: false, loading: false })}
                onConfirm={handleConfirmToggleStatus}
                title={user.active ? 'Desactivar Usuario' : 'Activar Usuario'}
                description={user.active 
                    ? `¿Está seguro que desea desactivar a ${user.firstName} ${user.lastName}? El usuario no podrá iniciar sesión.`
                    : `¿Está seguro que desea activar a ${user.firstName} ${user.lastName}? El usuario podrá iniciar sesión nuevamente.`
                }
                confirmText={user.active ? 'Desactivar' : 'Activar'}
                cancelText="Cancelar"
                variant={user.active ? 'danger' : 'success'}
                loading={statusModal.loading}
            />
        </div>
    );
};

export default UserDetailPage;
