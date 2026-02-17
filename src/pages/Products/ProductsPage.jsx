import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Tag,
    History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProducts, exportProducts, deleteProduct } from '../../services/productService';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProductQuickViewAdmin from '../../components/products/ProductQuickViewAdmin';
import ProductDrawer from '../../components/products/ProductDrawer';
import StockMovementsDrawer from '../../components/products/StockMovementsDrawer';

const ProductsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    // Todos los hooks deben estar ANTES de cualquier return condicional
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [sort, setSort] = useState({
        sortBy: 'name',
        order: 'asc'
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        product: null,
        loading: false
    });
    
    // Stock movements drawer
    const [stockMovementsDrawer, setStockMovementsDrawer] = useState({
        isOpen: false,
        product: null
    });
    
    // Estado para el menú de exportación
    const [exportMenu, setExportMenu] = useState({ open: false, position: null });
    
    // Estado para el menú de acciones por producto
    const [actionMenu, setActionMenu] = useState({ open: false, position: null, productId: null });
    
    // Ahora sí, después de todos los hooks, hacemos los cálculos y el return condicional
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const features = user?.company?.features || {};
    const showPricesWithTax = user?.company?.showPricesWithTax === true;
    
    const hasStockFeature = features.stock === true;
    const hasPriceListsFeature = features.priceLists === true;
    
    const totalColumns = useMemo(() => {
        let cols = 6;
        if (hasPriceListsFeature) cols++;
        if (hasStockFeature) cols++;
        return cols;
    }, [hasPriceListsFeature, hasStockFeature]);
    
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
        // Abrir drawer de quick view (click en fila)
        setSelectedProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleNavigateToDetail = (product) => {
        // Navegar a la página de detalle completa (menú "Ver detalle")
        navigate(`/productos/${product._id}`);
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

    const handleOpenExportMenu = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setExportMenu({
            open: true,
            position: { top: rect.bottom + 8, left: rect.left }
        });
    };

    const handleOpenActionMenu = (e, productId) => {
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
        
        setActionMenu({
            open: true,
            productId,
            position: {
                top: rect.bottom + 8,
                left: leftPosition
            }
        });
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
        if (e) e.stopPropagation();
        setDeleteModal({
            isOpen: true,
            product,
            loading: false
        });
    };

    const handleViewStockMovements = (product, e) => {
        e?.stopPropagation();
        setStockMovementsDrawer({
            isOpen: true,
            product
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
                        Productos
                    </h1>
                    <p className="text-[13px] text-(--text-secondary) mt-0.5 font-medium">
                        Gestione el catálogo de productos de su empresa.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Menú de 3 puntitos */}
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
                    {/* Botón Nuevo Producto */}
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
                                {hasStockFeature && (
                                    <th className="px-6 py-3 text-center cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => handleSort('stock')}>
                                        <div className="flex items-center justify-center">Disponible <SortIcon field="stock" /></div>
                                    </th>
                                )}
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-color)">
                            {loading ? (
                                <tr>
                                    <td colSpan={totalColumns} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                            <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                            Cargando datos
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr
                                        key={product._id}
                                        className="hover:bg-(--bg-hover) transition-colors even:bg-(--bg-hover)/50 group cursor-pointer"
                                        onClick={() => handleViewProduct(product)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-(--bg-hover) rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img 
                                                            src={product.images[product.coverImageIndex || 0]?.url || product.images[0]?.url} 
                                                            alt="" 
                                                            className="w-full h-full object-cover rounded-lg" 
                                                        />
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

                                                </div>
                                            ) : (
                                                <span className="text-[13px] text-(--text-muted)">-</span>
                                            )}
                                        </td>
                                        {hasStockFeature && (
                                            <td className="px-6 py-4 text-center">
                                                {(() => {
                                                    const available = Math.max(0, (product.stock || 0) - (product.stockReserved || 0));
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                            available > 10 
                                                                ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 border-success-100 dark:border-success-800' 
                                                                : available > 0 
                                                                    ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border-warning-100 dark:border-warning-800' 
                                                                    : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-100 dark:border-danger-800'
                                                        }`}>
                                                            {available}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Botón Ver Detalle - Siempre visible */}
                                                <button
                                                    onClick={(e) => { 
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigate(`/productos/${product._id}`);
                                                    }}
                                                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={16} strokeWidth={2.5} />
                                                </button>
                                                
                                                {/* Botón Editar - Siempre visible */}
                                                <button
                                                    onClick={(e) => handleEditProduct(product, e)}
                                                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                
                                                {/* Menú de 3 puntitos - Otras acciones */}
                                                <div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenActionMenu(e, product._id); }}
                                                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                    
                                                    {actionMenu.open && actionMenu.productId === product._id && (
                                                        <ActionMenu
                                                            items={[
                                                                {
                                                                    icon: <Eye size={16} />,
                                                                    label: 'Ver detalle completo',
                                                                    onClick: () => handleNavigateToDetail(product)
                                                                },
                                                                {
                                                                    icon: <Edit2 size={16} />,
                                                                    label: 'Editar',
                                                                    onClick: (e) => handleEditProduct(product, e)
                                                                },
                                                                ...(hasStockFeature ? [{
                                                                    icon: <History size={16} />,
                                                                    label: 'Ver movimientos',
                                                                    onClick: () => handleViewStockMovements(product)
                                                                }] : []),
                                                                {
                                                                    icon: <Trash2 size={16} />,
                                                                    label: 'Eliminar',
                                                                    variant: 'danger',
                                                                    onClick: () => handleDeleteClick(product)
                                                                }
                                                            ]}
                                                            position={actionMenu.position}
                                                            onClose={() => setActionMenu({ open: false, position: null, productId: null })}
                                                        />
                                                    )}
                                                </div>
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

                {/* Mobile List */}
                <div className="md:hidden divide-y divide-(--border-color)">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="flex items-center justify-center gap-2 text-(--text-muted) text-[11px] font-bold uppercase tracking-widest">
                                <div className="w-3.5 h-3.5 border-2 border-(--border-color) border-t-primary-600 rounded-full animate-spin"></div>
                                Cargando datos
                            </div>
                        </div>
                    ) : products.length > 0 ? (
                        products.map((product) => (
                            <div
                                key={product._id}
                                className="p-4 hover:bg-(--bg-hover) transition-colors even:bg-(--bg-hover)/50"
                            >
                                {/* Header: Nombre y código */}
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-(--text-primary) text-[15px]">{product.name}</h3>
                                    {product.pricing?.discount > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-success-600 font-medium">
                                            <Tag size={10} />
                                            {product.pricing.discount}% dto.
                                        </span>
                                    )}
                                </div>
                                
                                {/* Código */}
                                <p className="text-[12px] text-(--text-muted) mb-3">{product.code}</p>
                                
                                {/* Info Grid: Precios y Stock */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex flex-col gap-2">
                                        {/* Lista 1 */}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-(--text-muted) uppercase tracking-wider">Lista 1</span>
                                            <span className="text-[14px] font-bold text-(--text-primary)">
                                                {formatPrice(product.pricing?.list1)}
                                            </span>
                                            {product.pricing?.discount > 0 && (
                                                <span className="text-[10px] text-success-600 font-medium">
                                                    {formatPrice((product.pricing.list1 * (1 - product.pricing.discount / 100)).toFixed(2))} final
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Lista 2 */}
                                        {hasPriceListsFeature && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-(--text-muted) uppercase tracking-wider">Lista 2</span>
                                                <span className="text-[14px] font-bold text-primary-600">
                                                    {formatPrice(product.pricing?.list2)}
                                                </span>
                                                {product.pricing?.discount > 0 && (
                                                    <span className="text-[10px] text-success-600 font-medium">
                                                        {formatPrice((product.pricing.list2 * (1 - product.pricing.discount / 100)).toFixed(2))} final
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {hasStockFeature && (() => {
                                        const available = Math.max(0, (product.stock || 0) - (product.stockReserved || 0));
                                        return (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                available > 10 
                                                    ? 'bg-success-50 text-success-600 border-success-100' 
                                                    : available > 0 
                                                        ? 'bg-warning-50 text-warning-600 border-warning-100' 
                                                        : 'bg-danger-50 text-danger-600 border-danger-100'
                                            }`}>
                                                Disp: {available}
                                            </span>
                                        );
                                    })()}
                                </div>
                                
                                {/* Info adicional: Código, IVA */}
                                <div className="flex items-center justify-between text-[11px] text-(--text-muted) mb-3">
                                    <span>Cód: {product.code}</span>
                                    {product.pricing?.tax > 0 && (
                                        <span>IVA: {product.pricing.tax}%</span>
                                    )}
                                </div>
                                
                                {/* Acciones */}
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    {/* Botón Ver Detalle - Siempre visible */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNavigateToDetail(product); }}
                                        className="p-2 rounded-lg text-(--text-muted) hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                                        title="Ver detalle"
                                    >
                                        <Eye size={18} strokeWidth={2.5} />
                                    </button>
                                    
                                    {/* Botón Editar - Siempre visible */}
                                    <button
                                        onClick={(e) => handleEditProduct(product, e)}
                                        className="p-2 rounded-lg text-(--text-muted) hover:text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 transition-all"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    
                                    {/* Menú de 3 puntitos - Otras acciones */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenActionMenu(e, product._id); }}
                                        className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                                
                                {/* Menu - Mobile */}
                                {actionMenu.open && actionMenu.productId === product._id && (
                                    <ActionMenu
                                        items={[
                                            {
                                                icon: <Eye size={16} />,
                                                label: 'Ver detalle completo',
                                                onClick: () => handleNavigateToDetail(product)
                                            },
                                            {
                                                icon: <Edit2 size={16} />,
                                                label: 'Editar',
                                                onClick: (e) => handleEditProduct(product, e)
                                            },
                                            ...(hasStockFeature ? [{
                                                icon: <History size={16} />,
                                                label: 'Ver movimientos',
                                                onClick: () => handleViewStockMovements(product)
                                            }] : []),
                                            {
                                                icon: <Trash2 size={16} />,
                                                label: 'Eliminar',
                                                variant: 'danger',
                                                onClick: () => handleDeleteClick(product)
                                            }
                                        ]}
                                        position={actionMenu.position}
                                        onClose={() => setActionMenu({ open: false, position: null, productId: null })}
                                    />
                                )}
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
            </div>

            {/* QuickView Drawer */}
            <ProductQuickViewAdmin
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={selectedProduct}
                showPricesWithTax={showPricesWithTax}
                features={features}
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

            {/* Stock Movements Drawer */}
            <StockMovementsDrawer
                isOpen={stockMovementsDrawer.isOpen}
                onClose={() => setStockMovementsDrawer({ isOpen: false, product: null })}
                product={stockMovementsDrawer.product}
            />
        </div>
    );
};

// ActionMenu Component
const ActionMenu = ({ items, onClose, position }) => {
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
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
            style={{ position: 'fixed', top: position?.top, left: position?.left }}
            className="w-48 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-[9999] overflow-hidden"
        >
            {items.map((item, idx) => (
                <button
                    key={idx}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        setTimeout(() => item.onClick(), 0);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                        item.variant === 'danger'
                            ? 'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                            : 'text-(--text-primary) hover:bg-(--bg-hover)'
                    }`}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default ProductsPage;
