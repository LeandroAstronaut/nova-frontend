import React from 'react';
import { Search, Loader2, Package, Plus, Check, Tag, Percent, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCatalog = ({
    products,
    loading,
    searchQuery,
    setSearchQuery,
    priceList,
    itemsInCart,
    onProductClick,
    onAddDirect,
    isClient = false,
    showPricesWithTax = false,
    company,
    page = 1,
    pagination = { total: 0, totalPages: 1 },
    onPageChange
}) => {
    // Helper para calcular precio con IVA
    const getPriceWithTax = (price, taxRate) => {
        if (!price) return 0;
        return price * (1 + (taxRate || 0) / 100);
    };

    // Helper para obtener la imagen de portada del producto
    const getCoverImage = (product) => {
        if (!product.images || product.images.length === 0) return null;
        const coverIndex = product.coverImageIndex || 0;
        return product.images[coverIndex]?.url || product.images[0]?.url;
    };

    return (
        <div className="space-y-4">
            {/* Nota general sobre configuración de pedidos o IVA */}
            {company?.sellOnlyFullPackages ? (
                <div className="p-2.5 md:p-3 rounded-xl text-xs font-medium flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-100 dark:border-orange-800">
                    <Package size={14} />
                    Solo se permiten pedidos en bultos cerrados
                </div>
            ) : (
                <div className={`p-2.5 md:p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    showPricesWithTax 
                        ? 'bg-success-50 dark:bg-success-900/20 text-success-600 border border-success-100 dark:border-success-800' 
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-800'
                }`}>
                    {showPricesWithTax ? (
                        <>
                            <Tag size={14} />
                            Los precios mostrados incluyen IVA
                        </>
                    ) : (
                        <>
                            <Tag size={14} />
                            Los precios mostrados no incluyen IVA
                        </>
                    )}
                </div>
            )}

            {/* Header con Search - Sin card para ahorrar espacio */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} strokeWidth={2.5} />
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    className="w-full pl-10 pr-4 py-2.5 bg-(--bg-card) border border-(--border-color) focus:border-primary-300 rounded-xl text-sm text-(--text-primary) transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                    <p className="text-(--text-muted) text-sm font-medium">Cargando catálogo...</p>
                </div>
            ) : products.length > 0 ? (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
                    <AnimatePresence mode="popLayout">
                        {products.map((product) => {
                            const inCart = itemsInCart.find(i => i.productId === product._id);
                            
                            // Determinar precio base según lista
                            const basePrice = priceList === 2 ? (product.pricing?.list2 || 0) : (product.pricing?.list1 || 0);
                            const taxRate = product.pricing?.tax || 0;
                            const hasTax = taxRate > 0;
                            const hasOffer = product.pricing?.offer > 0;
                            const hasDiscount = product.pricing?.discount > 0 && !hasOffer;
                            
                            // Calcular precio a mostrar
                            let displayPrice = basePrice;
                            let originalPrice = null;
                            
                            if (hasOffer) {
                                // Precio de oferta tiene prioridad
                                displayPrice = product.pricing.offer;
                                originalPrice = basePrice;
                            } else if (hasDiscount) {
                                // Aplicar descuento sobre el precio base
                                displayPrice = basePrice * (1 - product.pricing.discount / 100);
                                originalPrice = basePrice;
                            }
                            
                            // Si showPricesWithTax, agregar IVA al precio de display
                            const finalDisplayPrice = showPricesWithTax && hasTax 
                                ? getPriceWithTax(displayPrice, taxRate)
                                : displayPrice;
                            
                            const finalOriginalPrice = originalPrice && (showPricesWithTax && hasTax)
                                ? getPriceWithTax(originalPrice, taxRate)
                                : originalPrice;
                            
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={product._id}
                                    onClick={() => onProductClick(product)}
                                    className={`group bg-(--bg-card) rounded-xl md:rounded-2xl border p-2.5 md:p-4 transition-all cursor-pointer relative ${inCart 
                                            ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md' 
                                            : 'border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
                                        }`}
                                >
                                    {/* Badge en carrito */}
                                    {inCart && (
                                        <div className="absolute top-2 right-2 md:top-3 md:right-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-primary-600 text-white text-[8px] md:text-[9px] font-bold uppercase rounded-lg flex items-center gap-1 shadow-md z-10">
                                            <Check size={8} className="md:w-2.5 md:h-2.5" />
                                            <span className="hidden md:inline">{inCart.quantity} en carrito</span>
                                            <span className="md:hidden">{inCart.quantity}</span>
                                        </div>
                                    )}

                                    {/* Badge de Precio de Oferta - Prioridad máxima */}
                                    {hasOffer && (
                                        <div className="absolute top-2 left-2 md:top-3 md:left-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-warning-500 text-white text-[8px] md:text-[9px] font-bold uppercase rounded-lg shadow-md z-10 flex items-center gap-1">
                                            <Sparkles size={8} className="md:w-2.5 md:h-2.5" />
                                            <span className="hidden md:inline">Oferta</span>
                                        </div>
                                    )}

                                    {/* Badge de protección de oferta (si está activada la config) */}
                                    {hasOffer && company?.excludeOfferProductsFromGlobalDiscount && (
                                        <div className="absolute bottom-2 left-2 right-2 md:bottom-3 md:left-3 md:right-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-pink-500 text-white text-[8px] md:text-[9px] font-bold uppercase rounded-lg shadow-md z-10 flex items-center justify-center gap-1">
                                            <Tag size={8} className="md:w-2.5 md:h-2.5" />
                                            <span className="hidden md:inline">No aplica dto</span>
                                        </div>
                                    )}

                                    {/* Badge de descuento (solo si no hay oferta) */}
                                    {!hasOffer && hasDiscount && (
                                        <div className="absolute top-2 left-2 md:top-3 md:left-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-success-500 text-white text-[8px] md:text-[9px] font-bold rounded-lg shadow-md z-10">
                                            -{product.pricing.discount}%
                                        </div>
                                    )}

        

                                    <div className="flex flex-col gap-2 md:gap-3">
                                        {/* Imagen de portada */}
                                        <div className={`relative aspect-square rounded-lg md:rounded-xl overflow-hidden flex items-center justify-center ${inCart ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-(--bg-hover)'}`}>
                                            {(() => {
                                                const coverImage = getCoverImage(product);
                                                return coverImage ? (
                                                    <img src={coverImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <Package size={28} className="md:w-10 md:h-10 text-(--text-muted) opacity-50" />
                                                );
                                            })()}
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-0.5 md:space-y-1">
                                            <p className="hidden md:block text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">{product.category}</p>
                                            <h3 className="text-xs md:text-sm font-bold text-(--text-primary) group-hover:text-primary-600 transition-colors line-clamp-2 min-h-8 md:min-h-10">
                                                {product.name}
                                            </h3>
                                            <p className="text-[10px] md:text-[11px] text-(--text-muted)">{product.code}</p>
                                        </div>

                                        {/* Precio */}
                                        <div className="flex items-center justify-between pt-1 md:pt-2">
                                            <div className="flex flex-col">
                                                {finalOriginalPrice && (
                                                    <p className="text-[10px] md:text-[11px] text-(--text-muted) line-through">
                                                        ${Number(finalOriginalPrice).toLocaleString('es-AR')}
                                                    </p>
                                                )}
                                                <p className={`font-semibold tracking-tight ${hasOffer ? 'text-warning-600 text-base md:text-xl' : 'text-(--text-primary) text-sm md:text-lg'}`}>
                                                    ${Number(finalDisplayPrice).toLocaleString('es-AR')}
                                                </p>
                                                {hasTax && (
                                                    <p className="text-[8px] md:text-[9px] text-(--text-muted)">
                                                        {showPricesWithTax ? `Incluye IVA (${taxRate}%)` : `+ IVA (${taxRate}%)`}
                                                    </p>
                                                )}
                                                {!showPricesWithTax && hasTax && (
                                                    <p className="text-[8px] md:text-[9px] text-amber-600">
                                                        +${Number(getPriceWithTax(displayPrice, taxRate) - displayPrice).toLocaleString('es-AR')} IVA
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {/* Info de bulto/mínimo y botón de agregar */}
                                            {(() => {
                                                const unitsPerPackage = product.unitsPerPackage || 1;
                                                const minOrderQuantity = product.minOrderQuantity || 1;
                                                const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
                                                const hasRestrictions = unitsPerPackage > 1 || minOrderQuantity > 1 || sellOnlyFullPackages;
                                                
                                                if (hasRestrictions) {
                                                    return (
                                                        <div className="text-[9px] md:text-[10px] text-right leading-tight space-y-0.5 md:space-y-1">
                                                            {unitsPerPackage > 1 && (
                                                                <div className="px-1.5 py-0.5 md:px-2 md:py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded">
                                                                    <span className="font-semibold">{unitsPerPackage}</span> uds/bulto
                                                                </div>
                                                            )}
                                                            {minOrderQuantity > 1 && (
                                                                <div className="px-1.5 py-0.5 md:px-2 md:py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded">
                                                                    Mín: <span className="font-semibold">{minOrderQuantity}</span>
                                                                </div>
                                                            )}
                                                            {sellOnlyFullPackages && unitsPerPackage > 1 && (
                                                                <div className="px-1.5 py-0.5 md:px-2 md:py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded text-[8px] md:text-[9px]">
                                                                    Solo bultos
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onAddDirect(product); }}
                                                        className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-all active:scale-90 ${inCart 
                                                                ? 'bg-primary-600 text-white' 
                                                                : 'bg-(--bg-hover) text-(--text-muted) hover:bg-primary-600 hover:text-white'
                                                            }`}
                                                    >
                                                        {inCart ? <Check size={16} className="md:w-[18px] md:h-[18px]" /> : <Plus size={16} className="md:w-[18px] md:h-[18px]" />}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-(--bg-hover) rounded-2xl flex items-center justify-center mb-4">
                        <Package size={40} className="text-(--text-muted) opacity-50" />
                    </div>
                    <p className="text-(--bg-hover) font-medium">No se encontraron productos</p>
                    <p className="text-(--text-muted) text-sm mt-1">Intenta con otra búsqueda</p>
                </div>
            )}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-(--border-color)">
                    <p className="text-xs text-(--text-muted)">
                        Mostrando {products.length} de {pagination.total} productos
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-(--border-color) bg-(--bg-card) text-(--text-primary) hover:bg-(--bg-hover) disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium text-(--text-muted)">
                            {page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === pagination.totalPages}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-(--border-color) bg-(--bg-card) text-(--text-primary) hover:bg-(--bg-hover) disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCatalog;
