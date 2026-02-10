import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Minus, Plus, Package, ShoppingCart } from 'lucide-react';
import Button from '../../components/common/Button';

const CartDrawer = ({ isOpen, onClose, items, updateItem, removeItem, onCheckout, total }) => {
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
                        {/* Header - Estilo consistente */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Mi Carrito</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{items.length} productos</p>
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
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mb-4">
                                        <ShoppingBag size={40} className="text-[var(--text-muted)] opacity-50" />
                                    </div>
                                    <p className="text-[var(--text-muted)] text-sm font-medium">El carrito está vacío</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        key={item.productId}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-[var(--bg-hover)] rounded-xl flex items-center justify-center shrink-0">
                                                <Package size={24} className="text-[var(--text-muted)] opacity-50" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{item.name}</h4>
                                                        <p className="text-[11px] text-[var(--text-muted)]">{item.code}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="p-1.5 text-[var(--text-muted)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        {/* Qty Selector */}
                                                        <div className="flex items-center p-0.5 bg-[var(--bg-hover)] rounded-lg border border-[var(--border-color)]">
                                                            <button
                                                                onClick={() => updateItem(item.productId, 'quantity', Math.max(1, item.quantity - 1))}
                                                                className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:bg-[var(--bg-card)] rounded-md transition-colors"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="w-10 bg-transparent text-center text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                                                            />
                                                            <button
                                                                onClick={() => updateItem(item.productId, 'quantity', item.quantity + 1)}
                                                                className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:bg-[var(--bg-card)] rounded-md transition-colors"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Disc Selector */}
                                                        <div className="flex items-center gap-1 px-2 py-1.5 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                                            <input
                                                                type="number"
                                                                className="w-8 bg-transparent text-center text-xs font-bold text-success-700 dark:text-success-400 focus:outline-none"
                                                                value={item.discount || 0}
                                                                onChange={(e) => updateItem(item.productId, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                            />
                                                            <span className="text-[10px] font-bold text-success-600/50">%</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">
                                                        ${(Number(item.quantity || 0) * Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100))).toLocaleString('es-AR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer - Acciones siempre abajo */}
                        {items.length > 0 && (
                            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                            Items: {items.reduce((acc, i) => acc + Number(i.quantity || 0), 0)}
                                        </span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">
                                            ${Number(total || 0).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2 border-t border-[var(--border-color)]">
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Total Final</p>
                                        </div>
                                        <p className="text-2xl font-black text-[var(--text-primary)]">
                                            ${Number(total || 0).toLocaleString('es-AR')}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={onCheckout}
                                    className="w-full !py-3 !text-sm font-bold uppercase tracking-wider"
                                >
                                    <ShoppingCart size={18} className="mr-2" />
                                    Revisar Presupuesto
                                </Button>

                                <button
                                    onClick={() => items.forEach(i => removeItem(i.productId))}
                                    className="w-full text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-danger-500 transition-colors py-1"
                                >
                                    Limpiar Carrito
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
