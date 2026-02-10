import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ShoppingCart,
    Package,
    Info,
    Tag,
    Plus,
    Minus,
    Check
} from 'lucide-react';
import Button from '../common/Button';

const ProductQuickView = ({ isOpen, onClose, product, onAddToCart }) => {
    const [quantity, setQuantity] = React.useState(1);
    const [discount, setDiscount] = React.useState(0);

    // Reset local state when product changes or drawer opens
    React.useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setDiscount(0);
        }
    }, [isOpen, product]);

    if (!product) return null;

    const handleAdd = () => {
        if (onAddToCart) onAddToCart(product, quantity, discount);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[150]"
                    />

                    {/* Drawer - Estilo consistente */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[420px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[160] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header - Estilo consistente con otros drawers */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Detalle del Producto</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{product.category || 'General'}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - Scrolleable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Image Section */}
                            <div className="aspect-video bg-[var(--bg-hover)] rounded-2xl overflow-hidden relative border border-[var(--border-color)]">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                                        <Package size={64} className="opacity-30" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 px-2 py-1 bg-[var(--bg-card)] rounded-lg text-[10px] font-bold text-[var(--text-muted)] uppercase border border-[var(--border-color)]">
                                    {product.code}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">{product.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-success-500' : 'bg-danger-500'}`} />
                                        <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                            Stock disponible: <span className="font-bold">{product.stock} unidades</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Precios */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)]">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Lista 1</p>
                                        <p className="text-xl font-bold text-[var(--text-primary)]">${product.pricing?.list1?.toLocaleString('es-AR')}</p>
                                    </div>
                                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                                        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mb-1">Lista 2</p>
                                        <p className="text-xl font-bold text-primary-600">${product.pricing?.list2?.toLocaleString('es-AR')}</p>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="p-4 bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info size={14} className="text-[var(--text-muted)]" />
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Descripción</span>
                                    </div>
                                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                                        {product.description || 'Sin descripción disponible.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Acciones siempre abajo */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] space-y-4">
                            <div className="flex items-center gap-3">
                                {/* Quantity Selector */}
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Cantidad</label>
                                    <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl h-11 overflow-hidden">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-4 h-full flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:bg-[var(--bg-hover)] transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="flex-1 bg-transparent text-center font-bold text-[15px] text-[var(--text-primary)] outline-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="px-4 h-full flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:bg-[var(--bg-hover)] transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Discount Input */}
                                <div className="w-28">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Descuento</label>
                                    <div className="flex items-center bg-success-50 dark:bg-success-900/30 border border-success-100 dark:border-success-800 rounded-xl h-11 px-3">
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                            className="w-full bg-transparent text-center font-bold text-[15px] text-success-700 dark:text-success-400 outline-none"
                                        />
                                        <span className="text-[12px] font-bold text-success-600/50">%</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full !py-3 !text-sm font-bold uppercase tracking-wider"
                                onClick={handleAdd}
                            >
                                <Plus size={18} strokeWidth={2.5} className="mr-2" />
                                Agregar al Presupuesto
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProductQuickView;
