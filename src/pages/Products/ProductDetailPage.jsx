import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, History, Activity, MoreHorizontal, Power, PowerOff } from 'lucide-react';
import { getProductById, deleteProduct, toggleProductActive } from '../../services/productService';
import ProductActivityDrawer from '../../components/products/ProductActivityDrawer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProductDetailContent from '../../components/products/ProductDetailContent';
import ProductDrawer from '../../components/products/ProductDrawer';
import StockMovementsDrawer from '../../components/products/StockMovementsDrawer';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isStockMovementsOpen, setIsStockMovementsOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, loading: false });
    const [toggleActiveModal, setToggleActiveModal] = useState({ isOpen: false, loading: false });
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isVendedor = user?.role?.name === 'vendedor';
    const features = user?.company?.features || {};
    const showPricesWithTax = user?.company?.showPricesWithTax === true;

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const data = await getProductById(id);
            setProduct(data);
        } catch (error) {
            console.error('Error fetching product:', error);
            addToast('Error al cargar el producto', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = async (productData) => {
        try {
            const { updateProduct } = await import('../../services/productService');
            await updateProduct(id, productData);
            addToast('Producto actualizado exitosamente', 'success');
            setIsEditDrawerOpen(false);
            fetchProduct();
        } catch (error) {
            console.error('Error updating product:', error);
            addToast('Error al actualizar producto: ' + (error.response?.data?.message || error.message), 'error');
            throw error;
        }
    };

    const handleDeleteClick = () => {
        setDeleteModal({ isOpen: true, loading: false });
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            await deleteProduct(id);
            addToast('Producto eliminado exitosamente', 'success');
            setDeleteModal({ isOpen: false, loading: false });
            navigate('/productos');
        } catch (error) {
            console.error('Error deleting product:', error);
            addToast('Error al eliminar producto: ' + (error.response?.data?.message || error.message), 'error');
            setDeleteModal({ isOpen: false, loading: false });
        }
    };

    const handleToggleActiveClick = () => {
        setToggleActiveModal({ isOpen: true, loading: false });
    };

    const handleToggleActiveConfirm = async () => {
        try {
            setToggleActiveModal(prev => ({ ...prev, loading: true }));
            const result = await toggleProductActive(id);
            addToast(result.message, 'success');
            fetchProduct();
        } catch (error) {
            console.error('Error toggling product active state:', error);
            addToast('Error al cambiar estado del producto', 'error');
        } finally {
            setToggleActiveModal({ isOpen: false, loading: false });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) return null;

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
                            {product.name}
                        </h1>
                        <p className="text-[13px] text-(--text-secondary) mt-0.5">
                            {product.code || 'Sin código'} • {product.category || 'Sin categoría'}
                        </p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Editar - Solo admin/superadmin */}
                    {(isAdmin || isSuperadmin) && (
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsEditDrawerOpen(true)}
                            className="px-3! text-[11px] font-bold uppercase tracking-wider"
                        >
                            <Edit2 size={14} strokeWidth={2.5} />
                            Editar
                        </Button>
                    )}

                    {/* Movimientos de stock - Visible para todos */}
                    <Button 
                        variant="secondary" 
                        onClick={() => setIsStockMovementsOpen(true)}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <History size={14} strokeWidth={2.5} />
                        Movimientos
                    </Button>

                    {/* Menú de más acciones - alineado a la derecha */}
                    <div className="relative ml-auto">
                        <button
                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                            className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-colors"
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {showActionsMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-50 py-2">
                                <button
                                    onClick={() => { setIsActivityOpen(true); setShowActionsMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                >
                                    <Activity size={16} />
                                    Ver Actividad
                                </button>
                                {(isAdmin || isSuperadmin) && (
                                    <>
                                        <button
                                            onClick={() => { handleToggleActiveClick(); setShowActionsMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-(--text-primary) hover:bg-(--bg-hover) transition-colors"
                                        >
                                            {product.active ? <PowerOff size={16} /> : <Power size={16} />}
                                            {product.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => { handleDeleteClick(); setShowActionsMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Eliminar
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-(--border-color)">
                <ProductDetailContent 
                    product={product}
                    showPricesWithTax={showPricesWithTax}
                    features={features}
                />
            </div>

            {/* Edit Drawer */}
            <ProductDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => setIsEditDrawerOpen(false)}
                onSave={handleEditProduct}
                product={product}
                mode="edit"
            />

            {/* Stock Movements Drawer */}
            <StockMovementsDrawer
                isOpen={isStockMovementsOpen}
                onClose={() => setIsStockMovementsOpen(false)}
                product={product}
            />

            {/* Activity Drawer */}
            <ProductActivityDrawer
                isOpen={isActivityOpen}
                onClose={() => setIsActivityOpen(false)}
                product={product}
            />

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, loading: false })}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar Producto?"
                description={
                    <p>
                        Está a punto de eliminar <strong>{product.name}</strong>. 
                        Esta acción no se puede deshacer.
                    </p>
                }
                confirmText={deleteModal.loading ? 'Eliminando...' : 'Eliminar'}
                type="danger"
            />

            {/* Toggle Active Modal */}
            <ConfirmModal
                isOpen={toggleActiveModal.isOpen}
                onClose={() => setToggleActiveModal({ isOpen: false, loading: false })}
                onConfirm={handleToggleActiveConfirm}
                title={product.active ? 'Desactivar Producto' : 'Activar Producto'}
                description={
                    <p>
                        ¿Está seguro de {product.active ? 'desactivar' : 'activar'} el producto <strong>{product.name}</strong>?
                        {product.active && ' El producto no estará disponible para nuevos pedidos.'}
                    </p>
                }
                confirmText={toggleActiveModal.loading ? 'Procesando...' : (product.active ? 'Desactivar' : 'Activar')}
                type={product.active ? 'warning' : 'success'}
            />
        </div>
    );
};

export default ProductDetailPage;
