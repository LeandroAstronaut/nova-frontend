import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus,
    Search,
    Download,
    Package,
    Edit2,
    Trash2,
    ChevronUp,
    ChevronDown,
    Eye,
    MoreHorizontal,
    Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProducts, exportProducts, deleteProduct } from '../../services/productService';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProductQuickView from '../../components/products/ProductQuickView';
import ProductDrawer from '../../components/products/ProductDrawer';

const ProductsPage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const features = user?.company?.features || {};
    const showPricesWithTax = user?.company?.showPricesWithTax === true;
    
    // Feature flags
    const hasStockFeature = features.stock === true;
    const hasPriceListsFeature = features.priceLists === true;
    
    // Calcular número total de columnas para colspan
    const totalColumns = useMemo(() => {
        let cols = 8; // Producto, Código, Categoría, Lista 1, IVA, Oferta, Unidades/Bulto, Acciones
        if (hasPriceListsFeature) cols++; // Lista 2
        if (hasStockFeature) cols++; // Stock
        return cols;
    }, [hasPriceListsFeature, hasStockFeature]);
    
    // Redirigir si no es admin
    if (!isAdmin && !isSuperadmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-danger-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package size={32} className="text-danger-600" />
                    </div>
                    <h2 className="text-xl font-bold text-(--text-primary) mb-2">Acceso Denegado</h2>
                    <p className="text-(--text-muted)">No tiene permisos para acceder a esta sección.</p>
                </div>
            </div>
        );
    }

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    
    // Sorting
    const [sort, setSort] = useState({
        sortBy: 'name',
        order: 'asc'
    });
    
    // QuickView Drawer
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    
    // Product Drawer (create/edit)
    const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    
    // Delete Modal
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        product: null,
        loading: false
    });

    // Sort Icon Component
    const SortIcon = ({ field }) => {
        if (sort.sortBy !== field) return <MoreHorizontal size={10} className="ml-1 opacity-20" />;
        return sort.order === 'asc' 
            ? <ChevronUp size={12} className="ml-1 text-primary-600 dark:text-primary-400" /> 
            : <ChevronDown size={12} className="ml-1 text-primary-600 dark:text-primary-400" />;
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getProducts({
                search: debouncedSearchTerm,
                page: pagination.page,
                limit: pagination.limit,
                sortBy: sort.sortBy,
                order: sort.order
            });
            
            setProducts(response.products || []);
            setPagination(prev => ({
                ...prev,
                total: response.total || 0,
                totalPages: response.totalPages || 0
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            addToast('Error al cargar productos', 'error');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, pagination.page, pagination.limit, sort, addToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSort = (field) => {
        setSort(prev => ({
            sortBy: field,
            order: prev.sortBy === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleViewProduct = (product) => {
        setSelectedProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleCreateProduct = () => {
        setEditingProduct(null);
        setIsProductDrawerOpen(true);
    };

    const handleEditProduct = (product, e) => {
        e.stopPropagation();
        setEditingProduct(product);
        setIsProductDrawerOpen(true);
    };

    const handleSaveProduct = () => {
        fetchProducts();
    };

    const handleExport = async () => {
        try {
            const blob = await exportProducts();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            addToast('Productos exportados exitosamente', 'success');
        } catch (error) {
            console.error('Error exporting products:', error);
            addToast('Error al exportar productos', 'error');
        }
    };

    const handleDeleteClick = (product, e) => {
        e.stopPropagation();
        setDeleteModal({
            isOpen: true,
            product,
            loading: false
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.product) return;
        
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            await deleteProduct(deleteModal.product._id);
            addToast('Producto eliminado exitosamente', 'success');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            addToast('Error al eliminar producto', 'error');
        } finally {
            setDeleteModal({ isOpen: false, product: null, loading: false });
        }
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR')}`;
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-(--text-primary) leading-tight">
                        Listado de Productos
                    </h1>
                    <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                        Gestione el catálogo de productos de su empresa.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                        onClick={handleExport}
                    >
                        <Download size={14} strokeWidth={2.5} />
                        Exportar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreateProduct}
                        className="text-[11px] font-bold uppercase tracking-wider shadow-md shadow-primary-100 dark:shadow-primary-900/30"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
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
                                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                            />
                        </div>
                    </div>
                </div>

                {/* Vista Desktop - Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--bg-hover) text-[10px] font-bold text-(--text-muted) uppercase tracking-widest border-y border-(--border-color)">
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">Producto <SortIcon field="name" /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('code')}>
                                    <div className="flex items-center">Código <SortIcon field="code" /></div>
                                </th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3 text-right cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('pricing.list1')}>
                                    <div className="flex items-center justify-end">Lista 1 <SortIcon field="pricing.list1" /></div>
                                </th>
                                <th className="px-6 py-3 text-center cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('pricing.tax')}>
                                    <div className="flex items-center justify-center">IVA <SortIcon field="pricing.tax" /></div>
                                </th>
                                {hasPriceListsFeature && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('pricing.list2')}>
                                        <div className="flex items-center justify-end">Lista 2 <SortIcon field="pricing.list2" /></div>
                                    </th>
                                )}
                                <th className="px-6 py-3 text-right cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('pricing.offer')}>
                                    <div className="flex items-center justify-end">Oferta <SortIcon field="pricing.offer" /></div>
                                </th>
                                <th className="px-6 py-3 text-center">
                                    <div className="flex items-center justify-center">Uds/Bulto</div>
                                </th>
                                {hasStockFeature && (
                                    <th className="px-6 py-3 text-center cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('stock')}>
                                        <div className="flex items-center justify-center">Stock <SortIcon field="stock" /></div>
                                    </th>
                                )}
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={totalColumns} className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                                Sincronizando...
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr
                                        key={product._id}
                                        className="hover:bg-(--bg-hover) transition-colors group cursor-pointer"
                                        onClick={() => handleViewProduct(product)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-(--bg-hover) rounded-lg flex items-center justify-center shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Package size={18} className="text-(--text-muted)" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-(--text-primary) text-[13px] block">{product.name}</span>
                                                    {product.pricing?.discount > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-success-600 font-medium mt-0.5">
                                                            <Tag size={10} />
                                                            {product.pricing.discount}% dto.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-(--text-secondary)">{product.code}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-(--bg-hover) text-(--text-muted) border border-(--border-color)">
                                                {product.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[13px] font-medium text-(--text-primary)">
                                                    {formatPrice(product.pricing?.list1)}
                                                </span>
                                                {product.pricing?.discount > 0 && (
                                                    <span className="text-[10px] text-success-600 font-medium">
                                                        {formatPrice((product.pricing.list1 * (1 - product.pricing.discount / 100)).toFixed(2))} final
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[13px] font-medium text-(--text-secondary)">
                                                {product.pricing?.tax > 0 ? `${product.pricing.tax}%` : '-'}
                                            </span>
                                        </td>
                                        {hasPriceListsFeature && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[13px] font-medium text-primary-600">
                                                        {formatPrice(product.pricing?.list2)}
                                                    </span>
                                                    {product.pricing?.discount > 0 && (
                                                        <span className="text-[10px] text-success-600 font-medium">
                                                            {formatPrice((product.pricing.list2 * (1 - product.pricing.discount / 100)).toFixed(2))} final
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            {product.pricing?.offer > 0 ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[13px] font-bold text-warning-600">
                                                        {formatPrice(product.pricing?.offer)}
                                                    </span>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-warning-50 text-warning-600 border border-warning-100">
                                                        Precio Oferta
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[13px] text-(--text-muted)">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[13px] font-medium text-(--text-primary)">
                                                    {product.unitsPerPackage || 1}
                                                </span>
                                                {(product.unitsPerPackage > 1 || product.minOrderQuantity > 1) && (
                                                    <span className="text-[9px] text-(--text-muted)">
                                                        {product.minOrderQuantity > 1 ? `min: ${product.minOrderQuantity}` : 'x bulto'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {hasStockFeature && (
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                    product.stock > 10 
                                                        ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800' 
                                                        : product.stock > 0 
                                                            ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border-warning-100 dark:border-warning-800' 
                                                            : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800'
                                                }`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleViewProduct(product); }}
                                                    className="p-1.5 text-(--text-muted) hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleEditProduct(product, e)}
                                                    className="p-1.5 text-(--text-muted) hover:text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(product, e)}
                                                    className="p-1.5 text-(--text-muted) hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={totalColumns} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-(--bg-hover) rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Package size={32} className="text-(--text-muted) opacity-50" />
                                        </div>
                                        <p className="text-(--text-muted) font-medium">No se encontraron productos</p>
                                        {debouncedSearchTerm && (
                                            <p className="text-(--text-muted) text-sm mt-1">
                                                Intenta con otra búsqueda
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-(--border-color) bg-(--bg-hover) flex items-center justify-between">
                        <p className="text-[11px] text-(--text-muted) font-medium">
                            Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
                        </p>
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
                )}
            </div>

            {/* Mobile List */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-(--bg-card) rounded-xl border border-(--border-color) p-4 animate-pulse">
                            <div className="h-4 bg-(--bg-hover) rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-(--bg-hover) rounded w-1/2"></div>
                        </div>
                    ))
                ) : products.length > 0 ? (
                    products.map((product) => (
                        <div
                            key={product._id}
                            className="bg-(--bg-card) rounded-xl border border-(--border-color) p-4 shadow-sm active:bg-(--bg-hover) transition-colors"
                            onClick={() => handleViewProduct(product)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-(--bg-hover) rounded-lg flex items-center justify-center shrink-0">
                                    {product.image ? (
                                        <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Package size={20} className="text-(--text-muted)" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-(--text-primary) text-sm truncate">{product.name}</h3>
                                    <p className="text-[11px] text-(--text-muted) mt-0.5">{product.code}</p>
                                    {product.pricing?.discount > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-success-600 font-medium mt-1">
                                            <Tag size={10} />
                                            {product.pricing.discount}% dto.
                                        </span>
                                    )}
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[12px] font-medium text-(--text-primary)">
                                            {formatPrice(product.pricing?.list1)}
                                        </span>
                                        {hasStockFeature && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                product.stock > 10 
                                                    ? 'bg-success-50 text-success-600 border-success-100' 
                                                    : product.stock > 0 
                                                        ? 'bg-warning-50 text-warning-600 border-warning-100' 
                                                        : 'bg-danger-50 text-danger-600 border-danger-100'
                                            }`}>
                                                Stock: {product.stock}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-(--bg-hover) rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-(--text-muted) opacity-50" />
                        </div>
                        <p className="text-(--text-muted) font-medium">No se encontraron productos</p>
                    </div>
                )}
            </div>

            {/* QuickView Drawer */}
            <ProductQuickView
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={selectedProduct}
                viewOnly={true}
                showPricesWithTax={showPricesWithTax}
                features={features}
                company={user?.company}
            />

            {/* Product Drawer (Create/Edit) */}
            <ProductDrawer
                isOpen={isProductDrawerOpen}
                onClose={() => setIsProductDrawerOpen(false)}
                onSave={handleSaveProduct}
                product={editingProduct}
                features={features}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, product: null, loading: false })}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Producto"
                description={`¿Está seguro que desea eliminar "${deleteModal.product?.name}"? Esta acción no se puede deshacer.`}
                confirmText={deleteModal.loading ? 'Eliminando...' : 'Eliminar'}
                type="danger"
            />
        </div>
    );
};

export default ProductsPage;
