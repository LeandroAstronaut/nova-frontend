import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package } from 'lucide-react';
import ProductDetailContent from './ProductDetailContent';

const ProductQuickViewAdmin = ({ isOpen, onClose, product, showPricesWithTax = false, features = {}, inputPricesWithTax = false }) => {
    if (!product) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 left-4 right-4 md:left-auto md:right-4 h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[950px] bg-[var(--bg-card)] shadow-2xl z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <Package size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        Detalle de Producto
                                    </h2>
                                    <p className="text-[12px] text-[var(--text-muted)] truncate max-w-[300px] md:max-w-[450px]">
                                        {product.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - ProductDetailContent con su propia galería */}
                        <div className="flex-1 overflow-y-auto p-3 md:p-4">
                            <ProductDetailContent 
                                product={product}
                                showPricesWithTax={showPricesWithTax}
                                features={features}
                                inputPricesWithTax={inputPricesWithTax}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProductQuickViewAdmin;
