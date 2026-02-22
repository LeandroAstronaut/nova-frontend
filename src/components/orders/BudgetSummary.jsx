import React from 'react';
import { Package, Trash2, User, Calendar, FileText, Building2, Tag, Minus, Plus, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BudgetSummary = ({
    items,
    updateItem,
    removeItem,
    subtotal,
    total,
    discountGlobal,
    setDiscountGlobal,
    onConfirm,
    sellers = [],
    salesRepId,
    setSalesRepId,
    notes,
    setNotes,
    date,
    setDate,
    mode = 'create',
    canChangeSeller = true,
    readOnly = false,
    isClient = false,
    selectedClient = null,
    priceList = 1,
    features = {},
    // Commission editing props
    commissionRate = 0,
    setCommissionRate = null,
    commissionAmount = 0,
    canEditCommission = false,
    orderStatus = null,
    // Discount permissions
    canEditProductDiscount = true,
    canEditBudgetDiscount = true,
    // Price display
    showPricesWithTax = false,
    taxRate = 21,
    // Products y company para reglas de cantidad
    products = [],
    company = null,
    // Stock errors
    stockErrors = [],
    // Navigation callback
    onChangeStep = null
}) => {
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
                newQty = quantity + (delta > 0 ? unitsPerPackage : -unitsPerPackage);
                newQty = Math.max(unitsPerPackage, newQty);
            } else {
                newQty = Math.round(newQty / unitsPerPackage) * unitsPerPackage;
                newQty = Math.max(unitsPerPackage, newQty);
            }
        }
        
        return Math.max(1, newQty);
    };
    return (
        <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header Info - Estilo OrderDetailContent */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 md:p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Cliente - Clickeable para volver al paso 1 */}
                    <div 
                        onClick={() => onChangeStep && onChangeStep(1)}
                        className={`group ${onChangeStep ? 'cursor-pointer hover:bg-(--bg-hover)' : ''} rounded-xl p-2 -m-2 transition-colors`}
                    >
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider mb-1.5">
                            <Building2 size={12} /> Cliente
                            {onChangeStep && <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </label>
                        <p className="text-[13px] font-bold text-(--text-primary) truncate">
                            {selectedClient?.businessName || 'No seleccionado'}
                        </p>
                        {selectedClient?.cuit && (
                            <p className="text-[11px] text-(--text-muted)">CUIT: {selectedClient.cuit}</p>
                        )}
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider mb-1.5">
                            <Calendar size={12} /> Fecha
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={readOnly || isClient}
                            className="w-full px-2 py-1.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-[13px] font-medium text-(--text-primary) focus:outline-none focus:border-primary-500 disabled:opacity-50"
                        />
                    </div>

                    {/* Vendedor */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider mb-1.5">
                            <User size={12} /> Vendedor
                        </label>
                        <select
                            value={salesRepId}
                            onChange={(e) => setSalesRepId(e.target.value)}
                            disabled={!canChangeSeller || readOnly}
                            className="w-full px-2 py-1.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-[13px] font-medium text-(--text-primary) focus:outline-none focus:border-primary-500 disabled:opacity-50"
                        >
                            <option value="">Seleccionar</option>
                            {sellers.map(seller => (
                                <option key={seller._id} value={seller._id}>
                                    {seller.firstName} {seller.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Lista + Descuento */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider mb-1.5">
                            <Tag size={12} /> {features.priceLists ? 'Lista / Dto.' : 'Descuento'}
                        </label>
                        <div className="flex items-center gap-2">
                            {features.priceLists && (
                                <div className="flex-1 px-2 py-1.5 bg-(--bg-hover) border border-(--border-color) rounded-lg text-[13px] font-medium text-(--text-primary)">
                                    Lista {priceList}
                                </div>
                            )}
                            <div className="flex items-center gap-1 px-2 py-1.5 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                <input
                                    type="number"
                                    className="w-10 bg-transparent text-[13px] font-bold text-success-700 dark:text-success-400 outline-none disabled:opacity-50 text-center"
                                    value={discountGlobal}
                                    onChange={(e) => setDiscountGlobal(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                    placeholder="0"
                                    disabled={readOnly || isClient || !canEditBudgetDiscount}
                                />
                                <span className="text-[11px] font-bold text-success-600/50">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products List - Estilo CartDrawer */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-4">
                    {/* Stock Errors */}
                    {stockErrors.length > 0 && (
                        <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-100 dark:border-danger-800">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 bg-danger-100 dark:bg-danger-900/40 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-bold text-danger-700 dark:text-danger-300">
                                    Stock insuficiente
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {stockErrors.map((error, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-secondary-800 rounded-lg border border-danger-100 dark:border-danger-800">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-(--text-primary) truncate">
                                                {error.name} <span className="text-(--text-muted)">({error.code})</span>
                                            </p>
                                            {error.variantName && (
                                                <p className="text-[10px] text-primary-600">Variante: {error.variantName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="text-danger-600 font-medium">+{error.requested}</span>
                                            <span className="text-(--text-muted)">({error.available})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) overflow-hidden">
                        <div className="px-4 py-3 border-b border-(--border-color) bg-(--bg-hover) flex justify-between items-center">
                            <h3 className="text-sm font-bold text-(--text-primary)">Productos Seleccionados</h3>
                            <span className="px-2 py-0.5 bg-(--bg-card) rounded-md text-[10px] font-bold text-(--text-muted)">{items.length} items</span>
                        </div>
                        <div className="divide-y divide-(--border-color)">
                            {items.length === 0 ? (
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-(--bg-hover) rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Package size={24} className="text-(--text-muted) opacity-50" />
                                    </div>
                                    <p className="text-(--text-muted) text-xs font-medium">No hay productos</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div 
                                        key={item.lineId} 
                                        className="p-3 flex gap-3 hover:bg-(--bg-hover) transition-colors">
                                        {/* Imagen */}
                                        <div className="w-14 h-14 bg-(--bg-hover) rounded-lg flex items-center justify-center text-(--text-muted) shrink-0 overflow-hidden border border-(--border-color)">
                                            {(() => {
                                                const product = getProductData(item.productId);
                                                const images = product.images || [];
                                                const coverIndex = product.coverImageIndex ?? 0;
                                                const coverImage = images.length > 0 ? (images[coverIndex]?.url || images[0]?.url) : null;
                                                if (coverImage) {
                                                    return <img src={coverImage} alt={item.name} className="w-full h-full object-cover" />;
                                                }
                                                return <Package size={20} />;
                                            })()}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Nombre y eliminar */}
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-(--text-primary) truncate">{item.name}</p>
                                                    <p className="text-[11px] text-(--text-muted)">{item.code}</p>
                                                    {item.variantName && (
                                                        <p className="text-[10px] text-primary-600">{item.variantName}</p>
                                                    )}
                                                </div>
                                                {!readOnly && (
                                                    <button
                                                        onClick={() => removeItem(item.lineId)}
                                                        className="p-1.5 text-(--text-muted) hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* Controles y precio */}
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {readOnly ? (
                                                        <span className="text-xs text-(--text-muted)">Cant: {item.quantity}</span>
                                                    ) : (
                                                        <>
                                                            {(() => {
                                                                const product = getProductData(item.productId);
                                                                const unitsPerPackage = product.unitsPerPackage || 1;
                                                                const minOrderQuantity = product.minOrderQuantity || 1;
                                                                const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
                                                                const step = sellOnlyFullPackages ? unitsPerPackage : 1;
                                                                const minQty = sellOnlyFullPackages ? unitsPerPackage : minOrderQuantity;
                                                                
                                                                return (
                                                                    <div className="flex items-center gap-1 bg-(--bg-hover) rounded-lg border border-(--border-color)">
                                                                        <button
                                                                            onClick={() => updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, item.quantity, -step))}
                                                                            disabled={item.quantity <= minQty}
                                                                            className="w-7 h-7 flex items-center justify-center text-(--text-muted) hover:text-primary-600 rounded-md transition-colors disabled:opacity-40"
                                                                        >
                                                                            <Minus size={14} />
                                                                        </button>
                                                                        <span className="w-8 text-center text-xs font-bold text-(--text-primary)">{item.quantity}</span>
                                                                        <button
                                                                            onClick={() => updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, item.quantity, step))}
                                                                            className="w-7 h-7 flex items-center justify-center text-(--text-muted) hover:text-primary-600 rounded-md transition-colors"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                            
                                                            {/* Descuento */}
                                                            {(item.discount > 0 || !isClient) && (
                                                                <div className="flex items-center gap-1 px-2 py-1 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                                                    <input
                                                                        type="number"
                                                                        className="w-6 bg-transparent text-center text-xs font-bold text-success-700 dark:text-success-400 disabled:opacity-60"
                                                                        value={item.discount || 0}
                                                                        onChange={(e) => updateItem(item.lineId, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                                        disabled={isClient || !canEditProductDiscount}
                                                                    />
                                                                    <span className="text-[10px] font-bold text-success-600/50">%</span>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Badge sin dto global */}
                                                            {item.hasOffer && company?.excludeOfferProductsFromGlobalDiscount && (
                                                                <span className="px-1.5 py-0.5 bg-pink-100 dark:bg-pink-900/30 rounded text-[9px] font-medium text-pink-600">
                                                                    Sin dto. global
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-(--text-primary)">
                                                        ${formatPrice(applyTax(Number(item.quantity || 0) * Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100))))}
                                                    </p>
                                                    {showPricesWithTax && (
                                                        <p className="text-[9px] text-success-600">
                                                            ${formatPrice(applyTax(Number(item.listPrice || 0)))} c/u
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4">
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider mb-2">
                            <FileText size={12} /> Notas
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas adicionales..."
                            rows={2}
                            disabled={readOnly}
                            className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-primary-500 resize-none disabled:opacity-50"
                        />
                    </motion.div>
                </motion.div>

                {/* Summary - Estilo CartDrawer */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4">
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 md:p-5 sticky top-24">
                        <h3 className="text-sm font-bold text-(--text-primary) mb-4">Resumen de Totales</h3>
                        
                        <div className="space-y-2.5">
                            {(() => {
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
                                
                                const totalSubtotal = subtotalConDescuentoGlobal + subtotalSinDescuentoGlobal;
                                const discountAmount = subtotalConDescuentoGlobal * (Number(discountGlobal || 0) / 100);
                                
                                return (
                                    <>
                                        {/* Subtotal */}
                                        <div className="flex justify-between text-xs">
                                            <span className="text-(--text-muted) uppercase tracking-wider">Subtotal</span>
                                            <span className="font-semibold text-(--text-primary)">${formatPrice(totalSubtotal)}</span>
                                        </div>
                                        
                                        {/* Productos protegidos */}
                                        {protectedItemsCount > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-pink-600 flex items-center gap-1">
                                                    <Tag size={10} />
                                                    Sin dto. global
                                                </span>
                                                <span className="font-semibold text-pink-600">${formatPrice(subtotalSinDescuentoGlobal)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Descuento Global */}
                                        {Number(discountGlobal) > 0 && subtotalConDescuentoGlobal > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-success-600">Descuento ({discountGlobal}%)</span>
                                                <span className="font-semibold text-success-600">-${formatPrice(discountAmount)}</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                            
                            {/* Total Final */}
                            <div className="pt-3 border-t border-(--border-color)">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">Total Final</p>
                                        {showPricesWithTax && (
                                            <p className="text-[10px] text-success-600">Incluye IVA ({taxRate || 21}%)</p>
                                        )}
                                    </div>
                                    <p className="text-xl font-bold text-(--text-primary)">${formatPrice(applyTax(Number(total || 0)))}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Comisión */}
                        {canEditCommission && features.commissionCalculation && orderStatus !== 'completo' && (
                            <div className="pt-4 mt-4 border-t border-(--border-color)">
                                <h4 className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Comisión
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1 px-2 py-1.5 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={commissionRate}
                                                onChange={(e) => setCommissionRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                className="flex-1 bg-transparent text-sm font-bold text-success-700 outline-none text-center"
                                            />
                                            <span className="text-xs font-bold text-success-600/50">%</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 px-2 py-1.5 bg-(--bg-hover) border border-(--border-color) rounded-lg text-sm font-bold text-success-600 text-center">
                                        ${formatPrice(commissionAmount)}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Comisión solo lectura */}
                        {(orderStatus === 'completo' || !canEditCommission) && commissionAmount > 0 && features.commissionCalculation && (
                            <div className="pt-4 mt-4 border-t border-(--border-color)">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-(--text-muted)">Comisión ({commissionRate}%)</span>
                                    <span className="text-sm font-bold text-success-600">${formatPrice(commissionAmount)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default BudgetSummary;
