import React, { useState, useEffect } from 'react';
import { 
    Building2, Plus, Edit2, Trash2, Power, Check, X, 
    Package, FileText, Receipt, Users, Landmark, ShoppingCart, 
    Search, Download, MoreHorizontal, ChevronUp, ChevronDown,
    Grid3X3, Upload, Percent
} from 'lucide-react';
import { motion } from 'framer-motion';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import Button from '../../components/common/Button';
import CompanyDrawer from '../../components/companies/CompanyDrawer';

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
        {Icon && <Icon size={9} />}
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
    const headers = ['Nombre', 'Email', 'Slug', 'Plan', 'Estado', 'Usuarios Activos', 'Max Usuarios', 'Pedidos', 'Catálogo', 'Recibos', 'Ctas.Corrientes', 'Stock', 'Listas', 'Importador', 'Usr.Cliente', 'Prod.Variables'];
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
        company.features.clientUsers ? 'Sí' : 'No',
        company.features.importer ? 'Sí' : 'No',
        company.features.productVariants ? 'Sí' : 'No'
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

    // Handle create/edit company
    const handleSaveCompany = async (companyIdOrData, maybeFormData) => {
        // Detectar si es creación o edición según el tipo del primer parámetro
        const isCreating = typeof companyIdOrData === 'object';
        
        if (isCreating) {
            // Creación: recibimos (formData)
            await companyService.create(companyIdOrData);
            showToast('Compañía creada exitosamente', 'success');
        } else {
            // Edición: recibimos (companyId, formData)
            await companyService.update(companyIdOrData, maybeFormData);
            showToast('Compañía actualizada exitosamente', 'success');
        }
        fetchCompanies();
    };

    const handleOpenCreate = () => {
        setEditingCompany(null);
        setShowDrawer(true);
    };

    const handleEdit = (company) => {
        setEditingCompany(company);
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

    const handleToggleStatus = async (companyId) => {
        try {
            await companyService.toggleStatus(companyId);
            // Refresh the companies list to reflect the status change
            fetchCompanies();
        } catch (error) {
            showToast('Error al cambiar estado', 'error');
            throw error;
        }
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
                        onClick={handleOpenCreate} 
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
                                                {company.features.importer && (
                                                    <FeatureBadge active={true} icon={Upload} label="Importador" />
                                                )}
                                                {company.features.commissionCalculation && (
                                                    <FeatureBadge active={true} icon={Percent} label="Comisiones" />
                                                )}
                                                {company.features.productVariants && (
                                                    <FeatureBadge active={true} icon={Grid3X3} label="Variables" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[11px] font-bold ${company.activeUsersCount >= company.features.maxUsers ? 'text-danger-600' : ''}`}>
                                                {company.activeUsersCount || 0}/{company.features.maxUsers}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge active={company.active} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(company); }}
                                                className="p-1.5 rounded-lg text-(--text-muted) hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
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
                        <div className="p-6 flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                            <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                            Cargando...
                        </div>
                    ) : filteredCompanies.length > 0 ? (
                        <div className="divide-y divide-(--border-color)">
                            {filteredCompanies.map((company) => (
                                <div 
                                    key={company._id}
                                    className="p-4 hover:bg-(--bg-hover) cursor-pointer transition-colors"
                                    onClick={() => handleEdit(company)}
                                >
                                    <div className="flex items-start justify-between mb-2">
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
                                        {company.features.importer && (
                                            <FeatureBadge active={true} icon={Upload} label="Importador" />
                                        )}
                                        {company.features.commissionCalculation && (
                                            <FeatureBadge active={true} icon={Percent} label="Comisiones" />
                                        )}
                                        {company.features.productVariants && (
                                            <FeatureBadge active={true} icon={Grid3X3} label="Variables" />
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

            {/* Create/Edit Drawer - Componente separado */}
            <CompanyDrawer
                isOpen={showDrawer}
                onClose={() => setShowDrawer(false)}
                company={editingCompany}
                onSave={handleSaveCompany}
                onToggleStatus={editingCompany ? () => handleToggleStatus(editingCompany._id) : null}
            />

            {/* Delete Confirmation Modal */}
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
