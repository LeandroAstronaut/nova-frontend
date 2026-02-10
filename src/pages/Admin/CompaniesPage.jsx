import React, { useState, useEffect } from 'react';
import { 
    Building2, Plus, Edit2, Trash2, Power, Check, X, 
    Package, FileText, Receipt, Users, Landmark, ShoppingCart, 
    Search, Download, MoreHorizontal, ChevronUp, ChevronDown
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

const FeatureBadge = ({ active, icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all border
            ${active 
                ? 'bg-success-50 text-success-700 border-success-100 hover:bg-success-100' 
                : 'bg-secondary-50 text-secondary-500 border-secondary-100 hover:bg-secondary-100'}
        `}
        title={`${label} - Click para ${active ? 'desactivar' : 'activar'}`}
    >
        <Icon size={9} />
        {label}
    </button>
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
    const headers = ['Nombre', 'Email', 'Slug', 'Plan', 'Estado', 'Max Usuarios', 'Pedidos', 'Catálogo', 'Recibos', 'Ctas.Corrientes', 'Stock', 'Listas'];
    const rows = data.map(company => [
        company.name,
        company.email,
        company.slug,
        company.plan,
        company.active ? 'Activa' : 'Inactiva',
        company.features.maxUsers,
        company.features.orders ? 'Sí' : 'No',
        company.features.catalog ? 'Sí' : 'No',
        company.features.receipts ? 'Sí' : 'No',
        company.features.currentAccount ? 'Sí' : 'No',
        company.features.stock ? 'Sí' : 'No',
        company.features.priceLists ? 'Sí' : 'No'
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

    const handleToggleStatus = async (company) => {
        try {
            await companyService.toggleStatus(company._id);
            showToast(`Compañía ${company.active ? 'desactivada' : 'activada'}`, 'success');
            fetchCompanies();
        } catch (error) {
            showToast('Error al cambiar estado', 'error');
        }
    };

    const handleToggleFeature = async (company, feature) => {
        try {
            await companyService.toggleFeature(company._id, feature);
            fetchCompanies();
        } catch (error) {
            showToast('Error al cambiar feature', 'error');
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
                    <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                        Gestión de Compañías
                    </h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 font-medium">
                        Administre todas las compañías del sistema y sus configuraciones de módulos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        className="!px-3 text-[11px] font-bold uppercase tracking-wider"
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
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Total Compañías</div>
                </div>
                <div className="card !p-4">
                    <div className="text-2xl font-bold text-success-600">
                        {companies.filter(c => c.active).length}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Activas</div>
                </div>
                <div className="card !p-4">
                    <div className="text-2xl font-bold text-warning-600">
                        {companies.filter(c => !c.active).length}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Inactivas</div>
                </div>
                <div className="card !p-4">
                    <div className="text-2xl font-bold text-primary-600">
                        {companies.filter(c => c.plan === 'premium').length}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Premium</div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card !p-0 overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                {/* Filters Header */}
                <div className="bg-[var(--bg-card)] p-4 border-b border-[var(--border-color)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative md:col-span-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o slug..."
                                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-[var(--bg-card)] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-hover)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-y border-[var(--border-color)]">
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">Compañía <SortIcon field="name" /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('plan')}>
                                    <div className="flex items-center">Plan <SortIcon field="plan" /></div>
                                </th>
                                <th className="px-6 py-3">Módulos</th>
                                <th className="px-6 py-3 text-center cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('features.maxUsers')}>
                                    <div className="flex items-center justify-center">Usuarios <SortIcon field="features.maxUsers" /></div>
                                </th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="6" className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-widest">
                                                <div className="w-3.5 h-3.5 border-2 border-[var(--border-color)] border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                                Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredCompanies.length > 0 ? (
                                filteredCompanies.map((company) => (
                                    <tr key={company._id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-[13px] font-bold text-[var(--text-primary)]">{company.name}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] font-bold tracking-tight uppercase">/{company.slug}</div>
                                            <div className="text-[11px] text-primary-600 dark:text-primary-400 mt-0.5">{company.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <PlanBadge plan={company.plan} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                <FeatureBadge 
                                                    active={company.features.orders} 
                                                    icon={ShoppingCart} 
                                                    label="Pedidos"
                                                    onClick={() => handleToggleFeature(company, 'orders')}
                                                />
                                                <FeatureBadge 
                                                    active={company.features.catalog} 
                                                    icon={Package} 
                                                    label="Catálogo"
                                                    onClick={() => handleToggleFeature(company, 'catalog')}
                                                />
                                                <FeatureBadge 
                                                    active={company.features.receipts} 
                                                    icon={Receipt} 
                                                    label="Recibos"
                                                    onClick={() => handleToggleFeature(company, 'receipts')}
                                                />
                                                <FeatureBadge 
                                                    active={company.features.currentAccount} 
                                                    icon={Landmark} 
                                                    label="Ctas.Ctes"
                                                    onClick={() => handleToggleFeature(company, 'currentAccount')}
                                                />
                                                <FeatureBadge 
                                                    active={company.features.stock} 
                                                    icon={Building2} 
                                                    label="Stock"
                                                    onClick={() => handleToggleFeature(company, 'stock')}
                                                />
                                                <FeatureBadge 
                                                    active={company.features.priceLists} 
                                                    icon={FileText} 
                                                    label="Listas"
                                                    onClick={() => handleToggleFeature(company, 'priceLists')}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
                                                {company.features.maxUsers}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(company)}
                                                className="transition-transform active:scale-95"
                                            >
                                                <StatusBadge active={company.active} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(company)}
                                                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ open: true, company })}
                                                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-all"
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
                                        <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-widest bg-[var(--bg-hover)] w-fit mx-auto px-4 py-2 rounded-lg border border-[var(--border-color)]">
                                            No se encontraron compañías
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                        Total {filteredCompanies.length} registros
                    </span>
                    <div className="flex gap-1">
                        <Button variant="secondary" className="!px-3 !py-1 !text-[10px] font-bold uppercase tracking-wider">Anterior</Button>
                        <Button variant="secondary" className="!px-3 !py-1 !text-[10px] font-bold uppercase tracking-wider">Siguiente</Button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Drawer */}
            <AnimatePresence>
                {showDrawer && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDrawer(false)}
                            className="fixed top-0 left-0 w-screen h-screen bg-secondary-900/40 dark:bg-black/60 backdrop-blur-[2px] z-[150]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[540px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[160] flex flex-col border border-[var(--border-color)] rounded-[1.25rem] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]/80 backdrop-blur-md sticky top-0 z-10">
                                <h2 className="text-[17px] font-bold text-[var(--text-primary)] tracking-tight">
                                    {editingCompany ? 'Editar Compañía' : 'Nueva Compañía'}
                                </h2>
                                <button onClick={() => setShowDrawer(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-all">
                                    <X size={20} className="text-[var(--text-muted)]" strokeWidth={2.5} />
                                </button>
                            </div>
                            
                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Nombre</label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Nombre de la compañía"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Email</label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="empresa@ejemplo.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Slug</label>
                                            <Input
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                placeholder="nombre-compania"
                                                required
                                                disabled={!!editingCompany}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Plan</label>
                                            <select
                                                name="plan"
                                                value={formData.plan}
                                                onChange={handleInputChange}
                                                className="input"
                                            >
                                                <option value="basico">Básico</option>
                                                <option value="estandar">Estándar</option>
                                                <option value="premium">Premium</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">Máximo de Usuarios</label>
                                        <Input
                                            type="number"
                                            name="features.maxUsers"
                                            value={formData.features.maxUsers}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="100"
                                        />
                                    </div>

                                    <div>
                                        <label className="label mb-3">Módulos Habilitados</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
                                                { key: 'catalog', label: 'Catálogo', icon: Package },
                                                { key: 'receipts', label: 'Recibos', icon: Receipt },
                                                { key: 'currentAccount', label: 'Ctas. Corrientes', icon: Landmark },
                                                { key: 'stock', label: 'Stock', icon: Building2 },
                                                { key: 'priceLists', label: 'Listas de Precio', icon: FileText },
                                            ].map(({ key, label, icon: Icon }) => (
                                                <label
                                                    key={key}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                                        ${formData.features[key] 
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                                            : 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]'}
                                                    `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name={`features.${key}`}
                                                        checked={formData.features[key]}
                                                        onChange={handleInputChange}
                                                        className="hidden"
                                                    />
                                                    <Icon size={18} className={formData.features[key] ? 'text-primary-600' : 'text-[var(--text-muted)]'} />
                                                    <span className={`text-sm ${formData.features[key] ? 'font-semibold text-primary-700' : 'text-[var(--text-secondary)]'}`}>
                                                        {label}
                                                    </span>
                                                    {formData.features[key] && <Check size={14} className="text-primary-600 ml-auto" />}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500"
                                        />
                                        <label className="text-sm text-[var(--text-secondary)]">
                                            Compañía activa
                                        </label>
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-md flex gap-3">
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
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, company: null })}
                onConfirm={handleDelete}
                title="Eliminar Compañía"
                message={`¿Estás seguro de eliminar "${deleteModal.company?.name}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default CompaniesPage;
