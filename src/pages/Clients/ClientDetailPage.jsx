import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Mail, Phone, MapPin, Building2, Truck, User, 
    Percent, Calendar, CheckCircle, XCircle, Edit2, Tag,
    Briefcase, Activity, MoreHorizontal
} from 'lucide-react';
import { getClientById, updateClient, toggleClientStatus } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import ClientDrawer from '../../components/clients/ClientDrawer';
import ClientActivityDrawer from '../../components/clients/ClientActivityDrawer';
import ClientDetailContent from '../../components/clients/ClientDetailContent';

const StatusBadge = ({ active }) => {
    const styles = active 
        ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800'
        : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800';

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
            {active ? 'Activo' : 'Inactivo'}
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
        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
            <p className="text-[13px] font-semibold text-(--text-primary) mt-0.5 truncate">{value || '-'}</p>
        </div>
    </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="bg-(--bg-hover) px-6 py-3 border-b border-(--border-color)">
        <h3 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider flex items-center gap-2">
            <Icon size={14} />
            {title}
        </h3>
    </div>
);

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, loading: false });

    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isVendedor = user?.role?.name === 'vendedor';

    useEffect(() => {
        fetchClient();
    }, [id]);

    const fetchClient = async () => {
        try {
            setLoading(true);
            const data = await getClientById(id);
            setClient(data);
        } catch (error) {
            console.error('Error fetching client:', error);
            addToast('Error al cargar el cliente', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClient = async (clientData) => {
        try {
            await updateClient(id, clientData);
            addToast('Cliente actualizado exitosamente', 'success');
            setIsEditDrawerOpen(false);
            fetchClient();
        } catch (error) {
            console.error('Error updating client:', error);
            addToast('Error al actualizar cliente: ' + (error.response?.data?.message || error.message), 'error');
            throw error;
        }
    };

    const handleToggleStatus = () => {
        setStatusModal({ isOpen: true, loading: false });
    };

    const handleConfirmToggleStatus = async () => {
        try {
            setStatusModal(prev => ({ ...prev, loading: true }));
            await toggleClientStatus(id);
            addToast(`Cliente ${client.active ? 'desactivado' : 'activado'} exitosamente`, 'success');
            setStatusModal({ isOpen: false, loading: false });
            fetchClient();
        } catch (error) {
            console.error('Error toggling client status:', error);
            addToast('Error al cambiar estado: ' + (error.response?.data?.message || error.message), 'error');
            setStatusModal({ isOpen: false, loading: false });
        }
    };

    const canEdit = isSuperadmin || isAdmin || (isVendedor && client?.salesRepId?._id === user?.id);
    const canToggleStatus = isAdmin || isSuperadmin || (isVendedor && client?.salesRepId?._id === user?.id);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!client) return null;

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
                        <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                            {client.businessName}
                            {isSuperadmin && <span className="ml-2 text-sm font-normal text-primary-600">({client.companyId?.name})</span>}
                        </h1>
                        <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                            {client.cuit ? `CUIT: ${client.cuit}` : 'Sin CUIT'} • Código: {client.code || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón Editar */}
                    {canEdit && (
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsEditDrawerOpen(true)}
                            className="px-3! text-[11px] font-bold uppercase tracking-wider"
                        >
                            <Edit2 size={14} strokeWidth={2.5} />
                            Editar
                        </Button>
                    )}

                    {/* Menú de más acciones */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                            className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-colors"
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {showActionsMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-50 py-2">
                                <button
                                    onClick={() => { setIsActivityDrawerOpen(true); setShowActionsMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                >
                                    <Activity size={16} />
                                    Ver Actividad
                                </button>
                                {canEdit && (
                                    <button
                                        onClick={() => { setIsEditDrawerOpen(true); setShowActionsMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Editar
                                    </button>
                                )}
                                {canToggleStatus && (
                                    <>
                                        <div className="border-t border-(--border-color) my-1"></div>
                                        <button
                                            onClick={() => { handleToggleStatus(); setShowActionsMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] hover:bg-(--bg-hover) transition-colors ${
                                                client.active ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
                                            }`}
                                        >
                                            {client.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                            {client.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - Usando componente reutilizable */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                <ClientDetailContent client={client} showCompany={isSuperadmin} />
            </div>

            {/* Edit Drawer */}
            <ClientDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => setIsEditDrawerOpen(false)}
                onSave={handleEditClient}
                client={client}
            />

            {/* Activity Drawer */}
            <ClientActivityDrawer
                isOpen={isActivityDrawerOpen}
                onClose={() => setIsActivityDrawerOpen(false)}
                client={client}
            />

            {/* Status Toggle Modal */}
            <ConfirmModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ isOpen: false, loading: false })}
                onConfirm={handleConfirmToggleStatus}
                title={client.active ? '¿Desactivar Cliente?' : '¿Activar Cliente?'}
                description={
                    <p>
                        Está a punto de {client.active ? 'desactivar' : 'activar'} a{' '}
                        <strong>{client.businessName}</strong>.
                        {client.active 
                            ? ' El cliente no podrá ser utilizado en pedidos hasta que sea reactivado.' 
                            : ' El cliente podrá ser utilizado nuevamente en pedidos.'}
                    </p>
                }
                confirmText={statusModal.loading ? 'Procesando...' : (client.active ? 'Desactivar' : 'Activar')}
                type={client.active ? 'danger' : 'success'}
            />
        </div>
    );
};

export default ClientDetailPage;
