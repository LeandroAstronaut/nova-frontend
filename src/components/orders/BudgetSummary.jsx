import React from 'react';
import { Package, Trash2, User, Calendar, FileText, Building2, Tag, Minus, Plus } from 'lucide-react';

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
    stockErrors = []
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
        <div className="space-y-6">
            {/* Header Fields - Estilo consistente con otros pasos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cliente */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                        <Building2 size={12} /> Cliente
                    </label>
                    <div className="px-3 py-2 bg-(--bg-hover) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary) truncate">
                        {selectedClient?.businessName || 'No seleccionado'}
                    </div>
                </div>

                {/* Fecha */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                        <Calendar size={12} /> Fecha
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        disabled={readOnly || isClient}
                        className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary) focus:outline-none focus:border-primary-500 disabled:opacity-50"
                    />
                </div>

                {/* Vendedor */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                        <User size={12} /> Vendedor
                    </label>
                    <select
                        value={salesRepId}
                        onChange={(e) => setSalesRepId(e.target.value)}
                        disabled={!canChangeSeller || readOnly}
                        className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary) focus:outline-none focus:border-primary-500 disabled:opacity-50"
                    >
                        <option value="">Seleccionar vendedor</option>
                        {sellers.map(seller => (
                            <option key={seller._id} value={seller._id}>
                                {seller.firstName} {seller.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Lista de Precios + Descuento */}
                <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                    {features.priceLists ? (
                        <>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                <Tag size={12} /> Lista / Descuento
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 bg-(--bg-hover) border border-(--border-color) rounded-lg text-xs font-semibold text-(--text-primary)">
                                    {priceList === 1 ? 'Lista 1' : 'Lista 2'}
                                </div>
                                <div className="flex items-center gap-1 px-2 py-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                    <input
                                        type="number"
                                        className="w-12 bg-transparent text-xs font-bold text-success-700 dark:text-success-400 outline-none disabled:opacity-50 text-center"
                                        value={discountGlobal}
                                        onChange={(e) => setDiscountGlobal(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                        placeholder="0"
                                        disabled={readOnly || isClient || !canEditBudgetDiscount}
                                    />
                                    <span className="text-xs font-bold text-success-600/50 dark:text-success-400/50">%</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                                Descuento Global
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                <input
                                    type="number"
                                    className="flex-1 bg-transparent text-sm font-bold text-success-700 dark:text-success-400 outline-none disabled:opacity-50"
                                    value={discountGlobal}
                                    onChange={(e) => setDiscountGlobal(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                    placeholder="0"
                                    disabled={readOnly || isClient || !canEditBudgetDiscount}
                                />
                                <span className="text-xs font-bold text-success-600/50 dark:text-success-400/50">%</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products List */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Stock Errors */}
                    {stockErrors.length > 0 && (
                        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-100 dark:border-danger-800">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 bg-danger-100 dark:bg-danger-900/40 rounded-full flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-danger-700 dark:text-danger-300">
                                    Stock insuficiente
                                </p>
                            </div>
                            <p className="text-xs text-danger-600 dark:text-danger-400 mb-3">
                                Los siguientes productos exceden el stock disponible. Reduzca las cantidades para continuar.
                            </p>
                            <div className="space-y-2">
                                {stockErrors.map((error, index) => (
                                    <div key={index} className="flex items-center justify-between p-2.5 bg-white dark:bg-secondary-800 rounded-lg border border-danger-100 dark:border-danger-800">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-(--text-primary) truncate">
                                                {error.name} <span className="text-(--text-muted)">({error.code})</span>
                                            </p>
                                            {/* Mostrar nombre de variante si existe */}
                                            {error.variantName && (
                                                <p className="text-[10px] text-primary-600 mt-0.5">
                                                    Variante: {error.variantName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-danger-600 dark:text-danger-400 font-medium">
                                                +{error.requested} solicitado
                                            </span>
                                            <span className="text-(--text-muted)">
                                                ({error.available} disponible)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-(--border-color) bg-(--bg-hover) flex justify-between items-center">
                            <h3 className="text-sm font-bold text-(--text-primary)">Productos Seleccionados</h3>
                            <span className="px-2 py-1 bg-(--bg-card) rounded-md text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">{items.length} items</span>
                        </div>
                        <div className="divide-y divide-(--border-color)">
                            {items.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-(--bg-hover) rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Package size={32} className="text-(--text-muted) opacity-50" />
                                    </div>
                                    <p className="text-(--text-muted) text-sm font-medium">No hay productos seleccionados</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.lineId} className="p-4 flex items-center gap-4 hover:bg-(--bg-hover) transition-colors">
                                        <div className="w-12 h-12 bg-(--bg-hover) rounded-xl flex items-center justify-center text-(--text-muted) shrink-0">
                                            <Package size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <p className="text-sm font-bold text-(--text-primary)">{item.name}</p>
                                                    <p className="text-[11px] text-(--text-muted)">{item.code}</p>
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
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {readOnly ? (
                                                        <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                                                            <span className="px-2 py-1 bg-(--bg-hover) rounded-md">Cant: {item.quantity}</span>
                                                            {item.discount > 0 && <span className="text-success-600 dark:text-success-400">-{item.discount}%</span>}
                                                        </div>
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
                                                                    <div className="flex items-center gap-1 p-0.5 bg-(--bg-hover) rounded-lg border border-(--border-color)">
                                                                        <button
                                                                            onClick={() => updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, item.quantity, -step))}
                                                                            disabled={item.quantity <= minQty}
                                                                            className="w-7 h-7 flex items-center justify-center text-(--text-muted) hover:text-primary-600 hover:bg-(--bg-card) rounded-md transition-colors disabled:opacity-40"
                                                                        >
                                                                            <Minus size={14} />
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            className="w-10 bg-transparent text-center text-xs font-bold text-(--text-primary)"
                                                                            value={item.quantity}
                                                                            onChange={(e) => {
                                                                                const val = parseInt(e.target.value) || 0;
                                                                                updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, val, 0));
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => updateItem(item.lineId, 'quantity', getValidQuantity(item.productId, item.quantity, step))}
                                                                            className="w-7 h-7 flex items-center justify-center text-(--text-muted) hover:text-primary-600 hover:bg-(--bg-card) rounded-md transition-colors"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                            {item.discount > 0 || !isClient ? (
                                                                <div className="flex items-center gap-1 px-2 py-1.5 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                                                    <input
                                                                        type="number"
                                                                        className="w-8 bg-transparent text-center text-xs font-bold text-success-700 dark:text-success-400 disabled:opacity-60"
                                                                        value={item.discount || 0}
                                                                        onChange={(e) => updateItem(item.lineId, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                                        disabled={isClient || !canEditProductDiscount}
                                                                    />
                                                                    <span className="text-[10px] font-bold text-success-600/50 dark:text-success-400/50">%</span>
                                                                </div>
                                                            ) : null}
                                                            
                                                            {/* Badge de protección de oferta */}
                                                            {item.hasOffer && company?.excludeOfferProductsFromGlobalDiscount && (
                                                                <div className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 rounded-lg text-[9px] font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                                                                    <Tag size={10} />
                                                                    Sin desc. global
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-(--text-primary)">
                                                        ${formatPrice(applyTax(Number(item.quantity || 0) * Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100))))}
                                                    </p>
                                                    {showPricesWithTax && (
                                                        <p className="text-[9px] text-success-600">c/IVA</p>
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
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-4 shadow-sm">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                            <FileText size={12} /> Notas / Observaciones
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ingrese notas adicionales..."
                            rows={3}
                            disabled={readOnly}
                            className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-primary-500 resize-none disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                    <div className="bg-(--bg-card) rounded-2xl border border-(--border-color) p-6 shadow-sm space-y-4 sticky top-24">
                        <h3 className="text-sm font-bold text-(--text-primary) border-b border-(--border-color) pb-3">Resumen de Totales</h3>
                        
                        <div className="space-y-3">
                            {(() => {
                                // Calcular desglose considerando protección de ofertas
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
                                const actualDiscountPercent = totalSubtotal > 0 ? (discountAmount / totalSubtotal * 100).toFixed(1) : 0;
                                
                                return (
                                    <>
                                        {/* Subtotal */}
                                        <div className="flex justify-between text-xs font-bold text-(--text-muted) uppercase tracking-wider">
                                            <span>Subtotal</span>
                                            <span>${formatPrice(totalSubtotal)}</span>
                                        </div>
                                        
                                        {/* Productos protegidos (si hay) */}
                                        {protectedItemsCount > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <Tag size={10} />
                                                    Sin dto. global
                                                </span>
                                                <span>${formatPrice(subtotalSinDescuentoGlobal)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Descuento Global (solo si aplica a algo) */}
                                        {Number(discountGlobal) > 0 && subtotalConDescuentoGlobal > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider">
                                                <span>Descuento ({discountGlobal}%)</span>
                                                <span>-${formatPrice(discountAmount)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Nota cuando todo está protegido */}
                                        {protectedItemsCount > 0 && subtotalConDescuentoGlobal === 0 && Number(discountGlobal) > 0 && (
                                            <div className="px-3 py-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-lg">
                                                <p className="text-[10px] text-pink-600 dark:text-pink-400 flex items-center gap-1">
                                                    <Tag size={12} />
                                                    Todos los productos tienen oferta - no aplica descuento global
                                                </p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                            
                            <div className="pt-3 border-t border-(--border-color) flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-1">
                                        Total Final
                                    </p>
                                    {showPricesWithTax && (
                                        <p className="text-[10px] text-success-600 font-medium">Incluye IVA ({taxRate || 21}%)</p>
                                    )}
                                    <p className="text-2xl font-black text-(--text-primary)">${formatPrice(applyTax(Number(total || 0)))}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Commission Editing - Solo admin/superadmin y si no está completo */}
                        {canEditCommission && features.commissionCalculation && orderStatus !== 'completo' && (
                            <div className="pt-4 border-t border-(--border-color) space-y-3">
                                <h4 className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">
                                    Configuración de Comisión
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-(--text-muted) mb-1 block">Porcentaje</label>
                                        <div className="flex items-center gap-1 px-3 py-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={commissionRate}
                                                onChange={(e) => setCommissionRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                className="flex-1 bg-transparent text-sm font-bold text-success-700 dark:text-success-400 outline-none"
                                            />
                                            <span className="text-xs font-bold text-success-600/50 dark:text-success-400/50">%</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-(--text-muted) mb-1 block">Monto</label>
                                        <div className="px-3 py-2 bg-(--bg-hover) border border-(--border-color) rounded-lg text-sm font-bold text-success-600 dark:text-success-400">
                                            ${formatPrice(commissionAmount)}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-(--text-muted) italic">
                                    * Esta comisión se aplicará al vendedor asignado
                                    {showPricesWithTax && <span className="text-success-600 block mt-0.5">Calculada sobre precios con IVA incluido</span>}
                                </p>
                            </div>
                        )}
                        
                        {/* Commission Display (solo lectura) */}
                        {(orderStatus === 'completo' || !canEditCommission) && commissionAmount > 0 && features.commissionCalculation && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">
                                        Comisión ({commissionRate}%)
                                        {showPricesWithTax && <span className="block text-[9px] text-success-600 font-normal">sobre precios c/IVA</span>}
                                    </span>
                                    <span className="text-sm font-bold text-success-600 dark:text-success-400">
                                        ${formatPrice(commissionAmount)}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <p className="text-[10px] text-center text-(--text-muted) font-medium leading-relaxed italic pt-3 border-t border-(--border-color)">
                            * {showPricesWithTax ? `Los precios incluyen IVA (${taxRate || 21}%)` : 'Los precios no incluyen IVA'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetSummary;
