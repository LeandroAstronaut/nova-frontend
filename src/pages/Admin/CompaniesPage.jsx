import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Building2, Plus, Edit2, Trash2, Power, Check, X, 
    Package, FileText, Receipt, Users, Landmark, ShoppingCart, 
    Search, Download, MoreHorizontal, ChevronUp, ChevronDown,
    Briefcase, Shield, Mail, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const StatusBadge = ({ active }) => {
    return (
        <span className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
            ${active 
                ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800' 
                : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800'}
        `}>
            {active ? <Check size={10} /> : <X size={10} />}
            {active ? 'Activa' : 'Inactiva'}
        </span>
    );
};

const FeatureBadge = ({ active, icon: Icon, label }) => (
    <span
        className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border
            ${active 
                ? 'bg-success-50 text-success-700 border-success-100' 
                : 'bg-secondary-50 text-secondary-400 border-secondary-100'}
        `}
    >
        <Icon size={9} />
        {label}
    </span>
);

const PlanBadge = ({ plan }) => {
    const plans = {
        basico: { color: 'bg-secondary-100 text-secondary-800 border-secondary-200', label: 'Básico' },
        estandar: { color: 'bg-primary-100 text-primary-800 border-primary-200', label: 'Estándar' },
        premium: { color: 'bg-warning-100 text-warning-800 border-warning-200', label: 'Premium' }
    };
    const { color, label } = plans[plan] || plans.basico;
    
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${color}`}>
            {label}
        </span>
    );
};

// Función para exportar a CSV
const exportToCSV = (data) => {
    const headers = ['Nombre', 'Email', 'Slug', 'Plan', 'Estado', 'Usuarios Activos', 'Max Usuarios', 'Pedidos', 'Catálogo', 'Recibos', 'Ctas.Corrientes', 'Stock', 'Listas', 'Usr.Cliente'];
    const rows = data.map(company => [
        company.name,
        company.email,
        company.slug,
        company.plan,
        company.active ? 'Activa' : 'Inactiva',
        company.activeUsersCount || 0,
        company.features.maxUsers,
        company.features.orders ? 'Sí' : 'No',
        company.features.catalog ? 'Sí' : 'No',
        company.features.receipts ? 'Sí' : 'No',
        company.features.currentAccount ? 'Sí' : 'No',
        company.features.stock ? 'Sí' : 'No',
        company.features.priceLists ? 'Sí' : 'No',
        company.features.clientUsers ? 'Sí' : 'No'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `companias_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, company: null });
    const { addToast: showToast } = useToast();

    // Sorting State
    const [sort, setSort] = useState({
        sortBy: 'name',
        order: 'asc'
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        slug: '',
        plan: 'basico',
        active: true,
        features: {
            catalog: false,
            importador: false,
            stock: false,
            priceLists: false,
            receipts: false,
            currentAccount: false,
            orders: true,
            clientUsers: false,
            maxUsers: 3
        }
    });

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            showToast('Error al cargar compañías', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleSort = (field) => {
        setSort(prev => ({
            sortBy: field,
            order: prev.sortBy === field && prev.order === 'desc' ? 'asc' : 'desc'
        }));
    };

    const SortIcon = ({ field }) => {
        if (sort.sortBy !== field) return <MoreHorizontal size={10} className="ml-1 opacity-20" />;
        return sort.order === 'asc' 
            ? <ChevronUp size={12} className="ml-1 text-primary-600 dark:text-primary-400" /> 
            : <ChevronDown size={12} className="ml-1 text-primary-600 dark:text-primary-400" />;
    };

    // Sort companies
    const sortedCompanies = [...companies].sort((a, b) => {
        let aVal = a[sort.sortBy];
        let bVal = b[sort.sortBy];
        
        if (sort.sortBy === 'features.maxUsers') {
            aVal = a.features.maxUsers;
            bVal = b.features.maxUsers;
        }
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sort.order === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.order === 'asc' ? 1 : -1;
        return 0;
    });

    // Filter companies
    const filteredCompanies = sortedCompanies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('features.')) {
            const featureName = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                features: { ...prev.features, [featureName]: type === 'checkbox' ? checked : value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCompany) {
                await companyService.update(editingCompany._id, formData);
                showToast('Compañía actualizada exitosamente', 'success');
            } else {
                await companyService.create(formData);
                showToast('Compañía creada exitosamente', 'success');
            }
            setShowDrawer(false);
            setEditingCompany(null);
            resetForm();
            fetchCompanies();
        } catch (error) {
            showToast(error.response?.data?.message || 'Error al guardar compañía', 'error');
        }
    };

    const handleEdit = (company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            email: company.email,
            slug: company.slug,
            plan: company.plan,
            active: company.active,
            features: { ...company.features }
        });
        setShowDrawer(true);
    };

    const handleDelete = async () => {
        try {
            await companyService.delete(deleteModal.company._id);
            showToast('Compañía eliminada exitosamente', 'success');
            setDeleteModal({ open: false, company: null });
            fetchCompanies();
        } catch (error) {
            showToast('Error al eliminar compañía', 'error');
        }
    };

    const handleToggleStatus = async () => {
        try {
            await companyService.toggleStatus(editingCompany._id);
            const newStatus = !editingCompany.active;
            showToast(`Compañía ${newStatus ? 'activada' : 'desactivada'}`, 'success');
            setEditingCompany(prev => ({ ...prev, active: newStatus }));
            setFormData(prev => ({ ...prev, active: newStatus }));
            fetchCompanies();
        } catch (error) {
            showToast('Error al cambiar estado', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            slug: '',
            plan: 'basico',
            active: true,
            features: {
                catalog: false,
                importador: false,
                stock: false,
                priceLists: false,
                receipts: false,
                currentAccount: false,
                orders: true,
                clientUsers: false,
                maxUsers: 3
            }
        });
    };

    const openCreateDrawer = () => {
        setEditingCompany(null);
        resetForm();
        setShowDrawer(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                        Gestión de Compañías
                    </h1>
                    <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                        Administre todas las compañías del sistema y sus configuraciones de módulos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                        onClick={() => exportToCSV(companies)}
                    >
                        <Download size={14} strokeWidth={2.5} />
                        Exportar
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={openCreateDrawer} 
                        className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        Nueva Compañía
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card !p-4">
                    <div className="text-2xl font-bold text-primary-600">{companies.length}</div>
                    <div className="text-[10px] text-(--text-muted) uppercase tracking-wider font-bold">Total Compañías</div>
                </div>
                <div className="card !p-4">
                    <div className="text-2xl font-bold text-success-600">
                        {companies.filter(c => c.active).length}
                    </div>
                    <div className="text-[10px] text-(--text-muted) uppercase tracking-wider font-bold">Activas</div>
                </div>
                <div className="card !p-4">
                    <div className="text-2xl font-bold text-warning-600">
                        {companies.filter(c => !c.active).length}
                    </div>
                    <div className="text-[10px] text-(--text-muted) uppercase tracking-wider font-bold">Inactivas</div>
                </div>
                <div className="card !p-4">
                    <div className="text-2xl font-bold text-primary-600">
                        {companies.filter(c => c.plan === 'premium').length}
                    </div>
                    <div className="text-[10px] text-(--text-muted) uppercase tracking-wider font-bold">Premium</div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                {/* Filters Header */}
                <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={14} strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o slug..."
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
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">Compañía <SortIcon field="name" /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('plan')}>
                                    <div className="flex items-center">Plan <SortIcon field="plan" /></div>
                                </th>
                                <th className="px-6 py-3">Módulos Activos</th>
                                <th className="px-6 py-3 text-center cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('features.maxUsers')}>
                                    <div className="flex items-center justify-center">Usuarios <SortIcon field="features.maxUsers" /></div>
                                </th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="6" className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                                Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredCompanies.length > 0 ? (
                                filteredCompanies.map((company) => (
                                    <tr 
                                        key={company._id} 
                                        className="hover:bg-(--bg-hover) transition-colors group cursor-pointer"
                                        onClick={() => handleEdit(company)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-[13px] font-bold text-(--text-primary)">{company.name}</div>
                                            <div className="text-[10px] text-(--text-muted) font-bold tracking-tight uppercase">/{company.slug}</div>
                                            <div className="text-[11px] text-primary-600 dark:text-primary-400 mt-0.5">{company.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <PlanBadge plan={company.plan} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                {company.features.orders && (
                                                    <FeatureBadge active={true} icon={ShoppingCart} label="Pedidos" />
                                                )}
                                                {company.features.catalog && (
                                                    <FeatureBadge active={true} icon={Package} label="Catálogo" />
                                                )}
                                                {company.features.receipts && (
                                                    <FeatureBadge active={true} icon={Receipt} label="Recibos" />
                                                )}
                                                {company.features.currentAccount && (
                                                    <FeatureBadge active={true} icon={Landmark} label="Ctas.Ctes" />
                                                )}
                                                {company.features.stock && (
                                                    <FeatureBadge active={true} icon={Building2} label="Stock" />
                                                )}
                                                {company.features.priceLists && (
                                                    <FeatureBadge active={true} icon={FileText} label="Listas" />
                                                )}
                                                {company.features.clientUsers && (
                                                    <FeatureBadge active={true} icon={Users} label="Usr.Cliente" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[12px] font-semibold text-(--text-secondary)">
                                                <span className={company.activeUsersCount >= company.features.maxUsers ? 'text-danger-600 font-bold' : ''}>
                                                    {company.activeUsersCount || 0}
                                                </span>
                                                <span className="text-(--text-muted)">/{company.features.maxUsers}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge active={company.active} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(company); }}
                                                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, company }); }}
                                                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="text-(--text-muted) text-[11px] font-bold uppercase tracking-widest bg-(--bg-hover) w-fit mx-auto px-4 py-2 rounded-lg border border-(--border-color)">
                                            No se encontraron compañías
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
                                Cargando...
                            </div>
                        </div>
                    ) : filteredCompanies.length > 0 ? (
                        <div className="divide-y divide-(--border-color)">
                            {filteredCompanies.map((company) => (
                                <div 
                                    key={company._id} 
                                    className="p-4 hover:bg-(--bg-hover) transition-colors cursor-pointer"
                                    onClick={() => handleEdit(company)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-[14px] font-bold text-(--text-primary)">{company.name}</div>
                                            <div className="text-[10px] text-(--text-muted)">/{company.slug}</div>
                                        </div>
                                        <StatusBadge active={company.active} />
                                    </div>
                                    <div className="mb-3">
                                        <PlanBadge plan={company.plan} />
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {company.features.orders && (
                                            <FeatureBadge active={true} icon={ShoppingCart} label="Pedidos" />
                                        )}
                                        {company.features.catalog && (
                                            <FeatureBadge active={true} icon={Package} label="Catálogo" />
                                        )}
                                        {company.features.receipts && (
                                            <FeatureBadge active={true} icon={Receipt} label="Recibos" />
                                        )}
                                        {company.features.currentAccount && (
                                            <FeatureBadge active={true} icon={Landmark} label="Ctas.Ctes" />
                                        )}
                                        {company.features.stock && (
                                            <FeatureBadge active={true} icon={Building2} label="Stock" />
                                        )}
                                        {company.features.priceLists && (
                                            <FeatureBadge active={true} icon={FileText} label="Listas" />
                                        )}
                                        {company.features.clientUsers && (
                                            <FeatureBadge active={true} icon={Users} label="Usr.Cliente" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-(--text-muted)">
                                            Usuarios: 
                                            <span className={company.activeUsersCount >= company.features.maxUsers ? 'text-danger-600 font-bold' : 'font-semibold'}>
                                                {company.activeUsersCount || 0}/{company.features.maxUsers}
                                            </span>
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, company }); }}
                                            className="p-1.5 rounded-lg text-(--text-muted) hover:text-danger-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <div className="text-(--text-muted) text-[11px] font-bold uppercase tracking-widest bg-(--bg-hover) w-fit mx-auto px-4 py-2 rounded-lg border border-(--border-color)">
                                No se encontraron compañías
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-3 border-t border-(--border-color) bg-(--bg-hover) flex items-center justify-between">
                    <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        Total {filteredCompanies.length} registros
                    </span>
                    <div className="flex gap-1">
                        <Button variant="secondary" className="px-3! py-1! text-[10px]! font-bold uppercase tracking-wider">Anterior</Button>
                        <Button variant="secondary" className="px-3! py-1! text-[10px]! font-bold uppercase tracking-wider">Siguiente</Button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Drawer */}
            {showDrawer && createPortal(
                <AnimatePresence>
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDrawer(false)}
                            className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[480px] bg-(--bg-card) shadow-2xl z-[10000] flex flex-col border border-(--border-color) rounded-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-(--border-color) flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-(--text-primary)">
                                            {editingCompany ? 'Editar Compañía' : 'Nueva Compañía'}
                                        </h2>
                                        <p className="text-[11px] text-(--text-muted)">
                                            {editingCompany ? 'Modifique los datos de la compañía' : 'Complete los datos de la nueva compañía'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDrawer(false)}
                                    className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <form id="company-form" onSubmit={handleSubmit} className="space-y-5">
                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Nombre *
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Nombre de la compañía"
                                                required
                                                className="w-full pl-10 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Email *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="empresa@ejemplo.com"
                                                required
                                                className="w-full pl-10 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Slug */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Slug *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm">/</span>
                                            <input
                                                type="text"
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                placeholder="nombre-compania"
                                                required
                                                disabled={!!editingCompany}
                                                className={`w-full pl-8 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 ${editingCompany ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            />
                                        </div>
                                        {editingCompany && (
                                            <p className="text-[10px] text-(--text-muted) mt-1">El slug no se puede modificar</p>
                                        )}
                                    </div>

                                    {/* Plan */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Plan *
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { key: 'basico', label: 'Básico', color: 'secondary' },
                                                { key: 'estandar', label: 'Estándar', color: 'primary' },
                                                { key: 'premium', label: 'Premium', color: 'warning' }
                                            ].map(({ key, label, color }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, plan: key }))}
                                                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border-2 transition-all ${
                                                        formData.plan === key
                                                            ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                                                            : 'border-(--border-color) hover:border-(--border-color) hover:bg-(--bg-hover)'
                                                    }`}
                                                >
                                                    <span className={`text-[11px] font-bold text-center leading-tight ${formData.plan === key ? `text-${color}-600` : 'text-(--text-secondary)'}`}>
                                                        {label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Máximo de Usuarios */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                            Máximo de Usuarios
                                        </label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} />
                                            <input
                                                type="number"
                                                name="features.maxUsers"
                                                value={formData.features.maxUsers}
                                                onChange={handleInputChange}
                                                min="1"
                                                max="100"
                                                className="w-full pl-10 pr-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Módulos Habilitados */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                            Módulos Habilitados
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
                                                { key: 'catalog', label: 'Catálogo', icon: Package },
                                                { key: 'receipts', label: 'Recibos', icon: Receipt },
                                                { key: 'currentAccount', label: 'Ctas. Corrientes', icon: Landmark },
                                                { key: 'stock', label: 'Stock', icon: Building2 },
                                                { key: 'priceLists', label: 'Listas de Precio', icon: FileText },
                                                { key: 'clientUsers', label: 'Usuarios Cliente', icon: Users },
                                            ].map(({ key, label, icon: Icon }) => (
                                                <label
                                                    key={key}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                                        ${formData.features[key] 
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                                            : 'border-(--border-color) hover:bg-(--bg-hover)'}
                                                    `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name={`features.${key}`}
                                                        checked={formData.features[key]}
                                                        onChange={handleInputChange}
                                                        className="hidden"
                                                    />
                                                    <Icon size={18} className={formData.features[key] ? 'text-primary-600' : 'text-(--text-muted)'} />
                                                    <span className={`text-sm ${formData.features[key] ? 'font-semibold text-primary-700' : 'text-(--text-secondary)'}`}>
                                                        {label}
                                                    </span>
                                                    {formData.features[key] && <Check size={14} className="text-primary-600 ml-auto" />}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Estado Activo - Solo en edición */}
                                    {editingCompany && (
                                        <div className="pt-4 border-t border-(--border-color)">
                                            <label className="block text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                                Estado de la Compañía
                                            </label>
                                            <div className="flex items-center justify-between p-4 bg-(--bg-hover) rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.active ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'}`}>
                                                        <Power size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-(--text-primary)">
                                                            {formData.active ? 'Compañía Activa' : 'Compañía Inactiva'}
                                                        </p>
                                                        <p className="text-[11px] text-(--text-muted)">
                                                            {formData.active 
                                                                ? 'Los usuarios pueden iniciar sesión' 
                                                                : 'Los usuarios no pueden iniciar sesión'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleToggleStatus}
                                                    className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                                        formData.active 
                                                            ? 'bg-danger-100 text-danger-600 hover:bg-danger-200' 
                                                            : 'bg-success-100 text-success-600 hover:bg-success-200'
                                                    }`}
                                                >
                                                    {formData.active ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-(--border-color) bg-(--bg-hover) flex gap-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowDrawer(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="primary"
                                    className="flex-1"
                                    form="company-form"
                                >
                                    {editingCompany ? 'Guardar Cambios' : 'Crear Compañía'}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                </AnimatePresence>,
                document.body
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, company: null })}
                onConfirm={handleDelete}
                title="Eliminar Compañía"
                description={`¿Estás seguro de eliminar "${deleteModal.company?.name}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.`}
                confirmText="Eliminar"
                type="danger"
            />
        </div>
    );
};

export default CompaniesPage;
