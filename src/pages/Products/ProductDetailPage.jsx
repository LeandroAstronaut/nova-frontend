import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, History } from 'lucide-react';
import { getProductById, deleteProduct } from '../../services/productService';
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
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, loading: false });

    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
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

                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        onClick={() => setIsEditDrawerOpen(true)}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <Edit2 size={14} strokeWidth={2.5} />
                        Editar
                    </Button>

                    <Button 
                        variant="secondary" 
                        onClick={() => setIsStockMovementsOpen(true)}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider"
                    >
                        <History size={14} strokeWidth={2.5} />
                        Movimientos
                    </Button>

                    <Button 
                        variant="secondary" 
                        onClick={handleDeleteClick}
                        className="px-3! text-[11px] font-bold uppercase tracking-wider text-danger-600 hover:text-danger-700"
                    >
                        <Trash2 size={14} strokeWidth={2.5} />
                        Eliminar
                    </Button>
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
        </div>
    );
};

export default ProductDetailPage;
