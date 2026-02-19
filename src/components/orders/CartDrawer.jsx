import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Minus, Plus, Package, ShoppingCart, Tag } from 'lucide-react';
import Button from '../../components/common/Button';

const CartDrawer = ({ isOpen, onClose, items, updateItem, removeItem, onCheckout, subtotal, total, globalDiscount = 0, products = [], company = null, showPricesWithTax = false, taxRate = 21 }) => {
    // Helper para aplicar IVA si corresponde
    const applyTax = (price) => {
        if (!showPricesWithTax) return price;
        return price * (1 + (taxRate || 21) / 100);
    };
    
    // Helper para formatear precio con 2 decimales
    const formatPrice = (price) => {
        return Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    // Helper para obtener datos del producto
    const getProductData = (productId) => {
        return products.find(p => p._id === productId) || {};
    };

    // Helper para calcular cantidad válida
    const getValidQuantity = (productId, quantity, delta = 0) => {
        const product = getProductData(productId);
        const unitsPerPackage = product.unitsPerPackage || 1;
        const minOrderQuantity = product.minOrderQuantity || 1;
        const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
        
        let newQty = quantity + delta;
        
        // Aplicar mínimo
        newQty = Math.max(minOrderQuantity, newQty);
        
        // Aplicar step de bulto si corresponde
        if (sellOnlyFullPackages && unitsPerPackage > 1) {
            if (delta !== 0) {
                // Cuando se usa +/-, incrementar/decrementar por el step
                newQty = quantity + (delta > 0 ? unitsPerPackage : -unitsPerPackage);
                newQty = Math.max(unitsPerPackage, newQty);
            } else {
                // Cuando se edita manualmente, redondear al múltiplo más cercano
                newQty = Math.round(newQty / unitsPerPackage) * unitsPerPackage;
                newQty = Math.max(unitsPerPackage, newQty);
            }
        }
        
        return Math.max(1, newQty);
    };
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
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]"
                    />

                    {/* Drawer - Estilo consistente */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[520px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header - Estilo consistente */}
                        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-9 h-9 md:w-10 md:h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <ShoppingBag size={18} className="md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm md:text-base font-semibold text-[var(--text-primary)]">Mi Carrito</h2>
                                    <p className="text-[10px] md:text-[11px] text-[var(--text-muted)] font-medium">{items.length} productos</p>
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
                        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
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
                                        key={item.lineId}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group p-3 md:p-3.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                                    >
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--bg-hover)] rounded-xl flex items-center justify-center shrink-0">
                                                <Package size={20} className="md:w-6 md:h-6 text-[var(--text-muted)] opacity-50" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</h4>
                                                        <p className="text-[11px] text-[var(--text-muted)]">{item.code}</p>
                                                        {/* Mostrar variación si existe */}
                                                        {item.variantName && (
                                                            <p className="text-[10px] text-primary-600 font-medium mt-0.5">
                                                                {item.variantName}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.lineId)}
                                                        className="p-1.5 text-[var(--text-muted)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                {/* Badge de protección de oferta (arriba si aplica) */}
                                                {item.hasOffer && company?.excludeOfferProductsFromGlobalDiscount && (
                                                    <div className="mb-1.5 px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 rounded text-[9px] font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1 w-fit">
                                                        <Tag size={9} />
                                                        Sin dto. global
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between gap-3 mt-3">
                                                    <div className="flex items-center gap-3">
                                                        {/* Qty Selector */}
                                                        {(() => {
                                                            const product = getProductData(item.productId);
                                                            const unitsPerPackage = product.unitsPerPackage || 1;
                                                            const minOrderQuantity = product.minOrderQuantity || 1;
                                                            const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
                                                            const step = sellOnlyFullPackages ? unitsPerPackage : 1;
                                                            const showRestrictions = unitsPerPackage > 1 || minOrderQuantity > 1 || sellOnlyFullPackages;
                                                            
                                                            return (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center p-0.5 bg-[var(--bg-hover)] rounded-lg border border-[var(--border-color)]">
                                                                        <button
                                                                            onClick={() => updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, item.quantity, -step))}
                                                                            disabled={item.quantity <= (sellOnlyFullPackages ? unitsPerPackage : minOrderQuantity)}
                                                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:bg-[var(--bg-card)] rounded-md transition-colors disabled:opacity-40"
                                                                        >
                                                                            <Minus size={14} />
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            className="w-10 md:w-12 bg-transparent text-center text-sm font-semibold text-[var(--text-primary)] focus:outline-none"
                                                                            value={item.quantity}
                                                                            onChange={(e) => {
                                                                                const val = parseInt(e.target.value) || 0;
                                                                                updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, val, 0));
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, item.quantity, step))}
                                                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:bg-[var(--bg-card)] rounded-md transition-colors"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                    {showRestrictions && (
                                                                        <p className="text-[9px] text-[var(--text-muted)]">
                                                                            {sellOnlyFullPackages && unitsPerPackage > 1 
                                                                                ? `Múltiplos de ${unitsPerPackage}` 
                                                                                : (minOrderQuantity > 1 ? `Mín: ${minOrderQuantity}` : '')}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Disc Selector */}
                                                        <div className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                                            <input
                                                                type="number"
                                                                className="w-8 md:w-10 bg-transparent text-center text-sm font-semibold text-success-700 dark:text-success-400 focus:outline-none"
                                                                value={item.discount || 0}
                                                                onChange={(e) => updateItem(item.lineId, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                            />
                                                            <span className="text-xs font-medium text-success-600/50">%</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Precio Total */}
                                                    <div className="text-right">
                                                        <p className="text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
                                                            ${formatPrice(applyTax(Number(item.quantity || 0) * Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100))))}
                                                        </p>
                                                        {/* Precio unitario */}
                                                        <p className="text-[10px] text-[var(--text-muted)]">
                                                            ${formatPrice(applyTax(Number(item.listPrice || 0)))} c/u
                                                            {showPricesWithTax && <span className="ml-1 text-success-600">(con IVA)</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer - Acciones siempre abajo */}
                        {items.length > 0 && (
                            <div className="px-4 md:px-5 py-3 md:py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] space-y-3">
                                {(() => {
                                    // Calcular subtotales considerando protección de ofertas
                                    const excludeOfferFromGlobal = company?.excludeOfferProductsFromGlobalDiscount === true;
                                    
                                    let subtotalConDescuentoGlobal = 0;
                                    let subtotalSinDescuentoGlobal = 0;
                                    let protectedItemsCount = 0;
                                    
                                    items.forEach(item => {
                                        const itemTotal = Number(item.quantity || 0) * Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100));
                                        const itemTotalWithTax = applyTax(itemTotal);
                                        
                                        if (excludeOfferFromGlobal && item.hasOffer) {
                                            subtotalSinDescuentoGlobal += itemTotalWithTax;
                                            protectedItemsCount++;
                                        } else {
                                            subtotalConDescuentoGlobal += itemTotalWithTax;
                                        }
                                    });
                                    
                                    const discountAmount = subtotalConDescuentoGlobal * (Number(globalDiscount || 0) / 100);
                                    const calculatedTotal = subtotalConDescuentoGlobal + subtotalSinDescuentoGlobal - discountAmount;
                                    
                                    return (
                                        <div className="space-y-2">
                                            {/* Subtotal */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                                    Subtotal ({items.reduce((acc, i) => acc + Number(i.quantity || 0), 0)} items)
                                                </span>
                                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                                    ${formatPrice(subtotalConDescuentoGlobal + subtotalSinDescuentoGlobal)}
                                                </span>
                                            </div>
                                            
                                            {/* Productos protegidos (si hay) */}
                                            {protectedItemsCount > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-medium text-pink-600 uppercase tracking-wider flex items-center gap-1">
                                                        <Tag size={10} />
                                                        {protectedItemsCount} producto{protectedItemsCount > 1 ? 's' : ''} sin dto. global
                                                    </span>
                                                    <span className="text-sm font-medium text-pink-600">
                                                        ${formatPrice(subtotalSinDescuentoGlobal)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Descuento Global (solo sobre lo que aplica) */}
                                            {Number(globalDiscount) > 0 && subtotalConDescuentoGlobal > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-medium text-success-600 uppercase tracking-wider flex items-center gap-1">
                                                        <Tag size={10} />
                                                        Desc. Global ({globalDiscount}%)
                                                    </span>
                                                    <span className="text-sm font-medium text-success-600">
                                                        -${formatPrice(discountAmount)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* IVA Info */}
                                            <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]">
                                                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                                    IVA ({taxRate || 21}%)
                                                </span>
                                                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                                                    {showPricesWithTax ? 'Incluido' : 'No incluye'}
                                                </span>
                                            </div>
                                            
                                            {/* Total Final */}
                                            <div className="flex justify-between items-end pt-2 border-t border-[var(--border-color)]">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Total Final</p>
                                                    {showPricesWithTax && (
                                                        <p className="text-[9px] text-success-600">Precios con IVA incluido</p>
                                                    )}
                                                </div>
                                                <p className="text-xl md:text-2xl font-semibold text-[var(--text-primary)]">
                                                    ${formatPrice(calculatedTotal)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <Button
                                    variant="primary"
                                    onClick={onCheckout}
                                    className="w-full !py-2.5 !text-sm font-semibold uppercase tracking-wider"
                                >
                                    <ShoppingCart size={18} className="mr-2" />
                                    Revisar
                                </Button>

                                <button
                                    onClick={() => items.forEach(i => removeItem(i.lineId))}
                                    className="w-full text-center text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider hover:text-danger-500 transition-colors py-1"
                                >
                                    Limpiar Carrito
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default CartDrawer;
