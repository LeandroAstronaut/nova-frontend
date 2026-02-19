import React from 'react';
import { Search, Loader2, Package, Plus, Check, Tag, Percent, Sparkles, Grid3X3 } from 'lucide-react';
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

    // Calcular precio final de una variante considerando oferta y descuento
    const calculateFinalPrice = (pricing) => {
        if (!pricing) return 0;
        const price = pricing.price || 0;
        const offer = pricing.offer || 0;
        const discount = pricing.discount || 0;
        
        const baseForDiscount = offer > 0 ? offer : price;
        return baseForDiscount * (1 - discount / 100);
    };

    // Calcular precio base (sin descuentos) de una variante
    const calculateBasePrice = (pricing) => {
        if (!pricing) return 0;
        return pricing.price || 0;
    };

    // Obtener información de precios para un producto
    const getPriceInfo = (product) => {
        const taxRate = product.pricing?.tax || 0;
        const hasTax = taxRate > 0;
        const hasVariants = product.hasVariants && product.variants?.length > 0;
        const hasUniformPricing = product.hasUniformVariantPricing !== false;
        
        let minPrice = 0;
        let maxPrice = 0;
        let minFinalPrice = 0;
        let maxFinalPrice = 0;
        let hasOffer = false;
        let hasDiscount = false;
        let maxDiscountPercent = 0;
        let priceSource = 'parent';

        if (hasVariants && !hasUniformPricing) {
            // Variantes con precios individuales - buscar rango de precios
            const variantsActive = product.variants?.filter(v => v.active !== false) || [];
            if (variantsActive.length === 0) {
                return { minPrice: 0, maxPrice: 0, hasOffer: false, hasDiscount: false, hasVariants, hasUniformPricing, taxRate, hasTax };
            }
            
            const pricingKey = priceList === 2 ? 'list2' : 'list1';
            
            const variantPrices = variantsActive.map(v => ({
                base: calculateBasePrice(v.pricing?.[pricingKey]),
                final: calculateFinalPrice(v.pricing?.[pricingKey]),
                hasOffer: (v.pricing?.[pricingKey]?.offer || 0) > 0,
                hasDiscount: (v.pricing?.[pricingKey]?.discount || 0) > 0,
                discount: v.pricing?.[pricingKey]?.discount || 0
            }));
            
            minPrice = Math.min(...variantPrices.map(p => p.base));
            maxPrice = Math.max(...variantPrices.map(p => p.base));
            minFinalPrice = Math.min(...variantPrices.map(p => p.final));
            maxFinalPrice = Math.max(...variantPrices.map(p => p.final));
            hasOffer = variantPrices.some(p => p.hasOffer);
            hasDiscount = variantPrices.some(p => p.hasDiscount);
            maxDiscountPercent = Math.max(...variantPrices.map(p => p.discount));
            priceSource = 'variants';
        } else {
            // Precio uniforme
            const pricing = priceList === 2 
                ? product.pricing?.list2 
                : product.pricing?.list1;
            
            minPrice = calculateBasePrice(pricing);
            maxPrice = minPrice;
            minFinalPrice = calculateFinalPrice(pricing);
            maxFinalPrice = minFinalPrice;
            hasOffer = (pricing?.offer || 0) > 0;
            hasDiscount = (pricing?.discount || 0) > 0;
            maxDiscountPercent = pricing?.discount || 0;
        }

        // Aplicar IVA si corresponde
        const displayMinPrice = showPricesWithTax && hasTax ? getPriceWithTax(minPrice, taxRate) : minPrice;
        const displayMaxPrice = showPricesWithTax && hasTax ? getPriceWithTax(maxPrice, taxRate) : maxPrice;
        const displayMinFinal = showPricesWithTax && hasTax ? getPriceWithTax(minFinalPrice, taxRate) : minFinalPrice;
        const displayMaxFinal = showPricesWithTax && hasTax ? getPriceWithTax(maxFinalPrice, taxRate) : maxFinalPrice;

        return {
            minPrice: displayMinPrice,
            maxPrice: displayMaxPrice,
            minFinalPrice: displayMinFinal,
            maxFinalPrice: displayMaxFinal,
            hasOffer,
            hasDiscount,
            maxDiscountPercent,
            hasVariants,
            hasUniformPricing,
            hasTax,
            taxRate,
            priceSource,
            showFrom: hasVariants && !hasUniformPricing && minFinalPrice !== maxFinalPrice
        };
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

            {/* Header con Search */}
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
                            // Sumar todas las cantidades de este producto en el carrito (incluyendo variantes/descuentos diferentes)
                            const cartItemsForProduct = itemsInCart.filter(i => i.productId === product._id);
                            const totalQuantityInCart = cartItemsForProduct.reduce((sum, item) => sum + (item.quantity || 0), 0);
                            const inCart = totalQuantityInCart > 0 ? { quantity: totalQuantityInCart } : null;
                            
                            const priceInfo = getPriceInfo(product);
                            const excludeFromGlobalDiscount = priceInfo.hasOffer && company?.excludeOfferProductsFromGlobalDiscount;
                            
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={product._id}
                                    onClick={() => onProductClick(product)}
                                    className={`group bg-(--bg-card) rounded-xl md:rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${inCart 
                                            ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md' 
                                            : 'border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
                                        }`}
                                >
                                    {/* ===== BADGES SUPERIORES (solo en imagen) ===== */}
                                    
                                    {/* Badge: SAVE X% / OFERTA */}
                                    {(priceInfo.hasOffer || priceInfo.hasDiscount) && (
                                        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-danger-500 text-white text-[9px] font-bold uppercase rounded-lg shadow-md">
                                            {priceInfo.hasOffer ? 'OFERTA' : `-${Math.round(priceInfo.maxDiscountPercent)}%`}
                                        </div>
                                    )}

                                    {/* Badge: En carrito - SIEMPRE arriba derecha */}
                                    {inCart && (
                                        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-primary-600 text-white text-[9px] font-bold uppercase rounded-lg flex items-center gap-1 shadow-md">
                                            <Check size={10} />
                                            <span className="hidden md:inline">{inCart.quantity} en carrito</span>
                                            <span className="md:hidden">{inCart.quantity}</span>
                                        </div>
                                    )}

                                    {/* ===== CONTENIDO ===== */}
                                    <div className="p-3 md:p-4 flex flex-col h-full">
                                        {/* Imagen */}
                                        <div className={`relative aspect-square rounded-lg md:rounded-xl overflow-hidden flex items-center justify-center mb-3 ${inCart ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                                            {(() => {
                                                const coverImage = getCoverImage(product);
                                                return coverImage ? (
                                                    <img src={coverImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <Package size={32} className="text-(--text-muted) opacity-40" />
                                                );
                                            })()}
                                        </div>

                                        {/* Nombre */}
                                        <h3 className="text-xs md:text-sm font-semibold text-(--text-primary) group-hover:text-primary-600 transition-colors line-clamp-2 min-h-8 md:min-h-10 leading-tight">
                                            {product.name}
                                        </h3>

                                        {/* Badge de Variaciones - Abajo del nombre */}
                                        {priceInfo.hasVariants && (
                                            <div className="mt-1 flex items-center gap-1 text-[9px] text-primary-600 font-medium">
                                                <Grid3X3 size={10} />
                                                <span>{product.variants.filter(v => v.active !== false).length} variaciones</span>
                                            </div>
                                        )}

                                        {/* Código */}
                                        <p className="text-[10px] text-(--text-muted) mt-1">{product.code}</p>

                                        {/* ===== PRECIOS ===== */}
                                        <div className="mt-auto pt-2">
                                            <div className="flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    {/* Precio tachado (original) */}
                                                    {priceInfo.minFinalPrice < priceInfo.minPrice && (
                                                        <span className="text-[10px] md:text-[11px] text-(--text-muted) line-through">
                                                            {formatPrice(priceInfo.minPrice)}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Precio final */}
                                                    <div className="flex items-baseline gap-1">
                                                        {priceInfo.showFrom && (
                                                            <span className="text-[10px] text-(--text-muted)">Desde</span>
                                                        )}
                                                        <span className={`font-bold ${priceInfo.hasOffer ? 'text-danger-600' : 'text-(--text-primary)'} text-sm md:text-lg`}>
                                                            {formatPrice(priceInfo.minFinalPrice)}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Info IVA con % específico */}
                                                    {priceInfo.hasTax ? (
                                                        <span className="text-[8px] text-(--text-muted)">
                                                            {showPricesWithTax 
                                                                ? `Incluye IVA (${priceInfo.taxRate}%)` 
                                                                : `+ IVA (${priceInfo.taxRate}%)`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] text-success-600">Sin IVA</span>
                                                    )}
                                                </div>

                                                {/* Botón Add o Info de restricciones */}
                                                {(() => {
                                                    const unitsPerPackage = product.unitsPerPackage || 1;
                                                    const minOrderQuantity = product.minOrderQuantity || 1;
                                                    const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
                                                    const hasRestrictions = unitsPerPackage > 1 || minOrderQuantity > 1 || sellOnlyFullPackages || priceInfo.hasVariants;
                                                    
                                                    if (hasRestrictions) {
                                                        return (
                                                            <div className="text-[8px] md:text-[9px] text-right space-y-0.5">
                                                                {priceInfo.hasVariants && (
                                                                    <div className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded text-[8px]">
                                                                        Elegir
                                                                    </div>
                                                                )}
                                                                {unitsPerPackage > 1 && (
                                                                    <div className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded">
                                                                        {unitsPerPackage}/bulto
                                                                    </div>
                                                                )}
                                                                {minOrderQuantity > 1 && (
                                                                    <div className="text-(--text-muted)">
                                                                        Mín: {minOrderQuantity}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onAddDirect(product); }}
                                                            className={`flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-[11px] md:text-xs font-medium transition-all active:scale-95 ${inCart 
                                                                    ? 'bg-primary-600 text-white' 
                                                                    : 'bg-(--bg-hover) text-(--text-primary) hover:bg-primary-600 hover:text-white border border-(--border-color)'
                                                                }`}
                                                        >
                                                            {inCart ? (
                                                                <>
                                                                    <Check size={14} />
                                                                    <span className="hidden md:inline">Agregado</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus size={14} />
                                                                    <span className="hidden md:inline">Agregar</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    );
                                                })()}
                                            </div>

                                            {/* Warning: No aplica dto global - Abajo de todo, sutil */}
                                            {excludeFromGlobalDiscount && (
                                                <div className="mt-2 flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                                                    <Tag size={9} className="text-amber-600" />
                                                    <span className="text-[8px] text-amber-700 dark:text-amber-400 font-medium">
                                                        No aplica descuento global
                                                    </span>
                                                </div>
                                            )}
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
                    <p className="text-(--text-primary) font-medium">No se encontraron productos</p>
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
