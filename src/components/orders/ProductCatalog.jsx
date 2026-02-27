import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package, Plus, Check, Tag, Percent, Sparkles, Grid3X3, Store, Share2, Link, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

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
    onPageChange,
    viewOnly = false,
    showPrices = true
}) => {
    // Estado local para el input de búsqueda (sin sincronización automática con props)
    const [searchInput, setSearchInput] = useState('');

    // Configuración de stock
    const hasStockFeature = company?.features?.stock === true;
    const hideOutOfStock = company?.catalogSettings?.hideOutOfStockInCatalog === true;

    // Helper para verificar si un producto tiene stock disponible
    const hasStockAvailable = (product) => {
        if (!hasStockFeature) return true; // Si no hay módulo de stock, mostrar todos
        
        const hasVariants = product.hasVariants && product.variants?.length > 0;
        
        if (hasVariants) {
            // Para productos con variantes, verificar si al menos una tiene stock
            const activeVariants = product.variants?.filter(v => v.active !== false) || [];
            if (activeVariants.length === 0) return true; // Si no hay variantes activas, mostrar
            
            return activeVariants.some(variant => {
                const available = Math.max(0, (variant.stock || 0) - (variant.stockReserved || 0));
                return available > 0;
            });
        } else {
            // Para productos simples
            const available = Math.max(0, (product.stock || 0) - (product.stockReserved || 0));
            return available > 0;
        }
    };

    // Filtrar productos según configuración
    const filteredProducts = hideOutOfStock 
        ? products.filter(hasStockAvailable)
        : products;
    
    // Estado para trackear si ya se hizo la primera búsqueda
    const [hasInitialized, setHasInitialized] = useState(false);
    
    // Solo ejecutar búsqueda después de que el usuario escribe (debounce)
    useEffect(() => {
        if (!hasInitialized) {
            setHasInitialized(true);
            return;
        }
        
        const timer = setTimeout(() => {
            if (searchInput !== searchQuery) {
                setSearchQuery(searchInput);
            }
        }, 400);
        
        return () => clearTimeout(timer);
    }, [searchInput]);
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
        
        // Usar campos con IVA de la API si showPricesWithTax está activo
        const usePriceWithTax = showPricesWithTax && hasTax;
        
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
            
            // Para variantes, aún necesitamos calcular manualmente porque no hay campos de API para cada variante
            if (usePriceWithTax) {
                minPrice = getPriceWithTax(minPrice, taxRate);
                maxPrice = getPriceWithTax(maxPrice, taxRate);
                minFinalPrice = getPriceWithTax(minFinalPrice, taxRate);
                maxFinalPrice = getPriceWithTax(maxFinalPrice, taxRate);
            }
        } else {
            // Precio uniforme - usar campos de API si están disponibles
            if (priceList === 2) {
                // Lista 2
                if (usePriceWithTax && product.priceWithTaxList2) {
                    minPrice = product.priceWithTaxList2;
                    maxPrice = minPrice;
                    minFinalPrice = product.finalPriceWithTaxList2 || minPrice;
                    maxFinalPrice = minFinalPrice;
                } else {
                    const pricing = product.pricing?.list2;
                    minPrice = calculateBasePrice(pricing);
                    maxPrice = minPrice;
                    minFinalPrice = calculateFinalPrice(pricing);
                    maxFinalPrice = minFinalPrice;
                }
                hasOffer = (product.pricing?.list2?.offer || 0) > 0 || (usePriceWithTax && product.offerWithTaxList2 > 0);
                hasDiscount = (product.pricing?.list2?.discount || 0) > 0;
                maxDiscountPercent = product.pricing?.list2?.discount || 0;
            } else {
                // Lista 1 (default)
                if (usePriceWithTax && product.priceWithTaxList1) {
                    minPrice = product.priceWithTaxList1;
                    maxPrice = minPrice;
                    minFinalPrice = product.finalPriceWithTaxList1 || minPrice;
                    maxFinalPrice = minFinalPrice;
                } else {
                    const pricing = product.pricing?.list1;
                    minPrice = calculateBasePrice(pricing);
                    maxPrice = minPrice;
                    minFinalPrice = calculateFinalPrice(pricing);
                    maxFinalPrice = minFinalPrice;
                }
                hasOffer = (product.pricing?.list1?.offer || 0) > 0 || (usePriceWithTax && product.offerWithTaxList1 > 0);
                hasDiscount = (product.pricing?.list1?.discount || 0) > 0;
                maxDiscountPercent = product.pricing?.list1?.discount || 0;
            }
        }

        return {
            minPrice,
            maxPrice,
            minFinalPrice,
            maxFinalPrice,
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

    // Hook para toast
    const { addToast } = useToast();
    const [showShareMenu, setShowShareMenu] = useState(false);
    const shareMenuRef = useRef(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
                setShowShareMenu(false);
            }
        };

        if (showShareMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showShareMenu]);

    // URL pública del catálogo (solo disponible si publicCatalog está activo)
    const publicCatalogUrl = company?.slug 
        ? `${window.location.origin}/${company.slug}`
        : window.location.href;

    // Función para copiar enlace al portapapeles
    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicCatalogUrl).then(() => {
            addToast('Enlace copiado al portapapeles', 'success');
            setShowShareMenu(false);
        }).catch(() => {
            addToast('Error al copiar el enlace', 'error');
        });
    };

    // Función para compartir por WhatsApp
    const handleShareWhatsApp = () => {
        const companyName = company?.name || 'la empresa';
        const message = `Te comparto el catálogo de ${companyName}: ${publicCatalogUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setShowShareMenu(false);
    };

    return (
        <div className="space-y-4">
            {/* Nota general sobre IVA, bultos y descuentos - Oculta en modo catálogo */}
            {!viewOnly && (
                <div className={`p-2.5 md:p-2 md:px-3  rounded-lg text-xs font-normal flex items-center gap-2 ${
                    showPricesWithTax 
                        ? 'bg-success-50 dark:bg-success-900/20 text-success-600 border border-success-100 dark:border-success-800' 
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-800'
                }`}>
                    <Tag size={14} />
                    {showPricesWithTax 
                        ? 'Los precios mostrados incluyen IVA'
                        : 'Los precios mostrados no incluyen IVA'
                    }
                    {company?.sellOnlyFullPackages && ' · Solo bultos cerrados.'}
                    {company?.excludeOfferProductsFromGlobalDiscount && ' · Productos en oferta no aplican descuento global.'}
                </div>
            )}

            {/* Indicador: Precios ocultos */}
            {viewOnly && !showPrices && (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 p-2.5 md:p-2 md:px-3 rounded-lg text-xs font-normal flex items-center gap-2 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-700">
                        <Store size={14} />
                        Los precios no están disponibles.
                    </div>
                    {/* Botón Compartir - Solo si catálogo público está activo */}
                    {company?.publicCatalog && (
                    <div className="relative" ref={shareMenuRef}>
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                            <Share2 size={14} />
                            Compartir
                        </button>
                        <AnimatePresence>
                            {showShareMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-lg z-50 py-1"
                                >
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                                    >
                                        <Link size={14} className="text-[var(--text-muted)]" />
                                        Copiar enlace
                                    </button>
                                    <button
                                        onClick={handleShareWhatsApp}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                                    >
                                        <MessageCircle size={14} className="text-green-500" />
                                        WhatsApp
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    )}
                </div>
            )}

            {/* Indicador: Info de precios en catálogo público */}
            {viewOnly && showPrices && (
                <div className="flex items-center justify-between gap-3">
                    <div className={`flex-1 p-2.5 md:p-2 md:px-3 rounded-lg text-xs font-normal flex items-center gap-2 ${
                        showPricesWithTax 
                            ? 'bg-success-50 dark:bg-success-900/20 text-success-600 border border-success-100 dark:border-success-800' 
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-800'
                    }`}>
                        <Tag size={14} />
                        {showPricesWithTax 
                            ? 'Los precios mostrados incluyen IVA'
                            : 'Los precios mostrados no incluyen IVA'
                        }
                        {company?.sellOnlyFullPackages && ' · Solo bultos cerrados.'}
                    </div>
                    {/* Botón Compartir - Solo si catálogo público está activo */}
                    {company?.publicCatalog && (
                    <div className="relative" ref={shareMenuRef}>
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                            <Share2 size={14} />
                            Compartir
                        </button>
                        <AnimatePresence>
                            {showShareMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-lg z-50 py-1"
                                >
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                                    >
                                        <Link size={14} className="text-[var(--text-muted)]" />
                                        Copiar enlace
                                    </button>
                                    <button
                                        onClick={handleShareWhatsApp}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                                    >
                                        <MessageCircle size={14} className="text-green-500" />
                                        WhatsApp
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    )}
                </div>
            )}

            {/* Header con Search - Oculto en modo catálogo (se maneja desde afuera) */}
            {!viewOnly && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} strokeWidth={2.5} />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-[var(--bg-card)] transition-all"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        autoFocus
                    />
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                    <p className="text-(--text-muted) text-sm font-medium">Cargando catálogo...</p>
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
                    {filteredProducts.map((product, index) => {
                            // Sumar todas las cantidades de este producto en el carrito (incluyendo variantes/descuentos diferentes)
                            const cartItemsForProduct = itemsInCart.filter(i => i.productId === product._id);
                            const totalQuantityInCart = cartItemsForProduct.reduce((sum, item) => sum + (item.quantity || 0), 0);
                            const inCart = totalQuantityInCart > 0 ? { quantity: totalQuantityInCart } : null;
                            
                            const priceInfo = getPriceInfo(product);
                            const excludeFromGlobalDiscount = priceInfo.hasOffer && company?.excludeOfferProductsFromGlobalDiscount;
                            
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.2 }}
                                    key={product._id}
                                    onClick={() => onProductClick(product)}
                                    className={`group bg-(--bg-card) rounded-xl border transition-all cursor-pointer relative overflow-hidden ${inCart 
                                            ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md' 
                                            : 'border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
                                        }`}
                                >
                                    {/* Badge: En carrito - Esquina superior derecha */}
                                    {inCart && (
                                        <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}

                                    {/* Badge: OFERTA / Descuento - Esquina superior izquierda */}
                                    {showPrices && (priceInfo.hasOffer || priceInfo.hasDiscount) && (
                                        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-danger-500 text-white text-[9px] font-bold uppercase rounded-lg shadow-md">
                                            {priceInfo.hasOffer ? 'OFERTA' : `-${Math.round(priceInfo.maxDiscountPercent)}%`}
                                        </div>
                                    )}

                                    {/* ===== CONTENIDO ===== */}
                                    <div className="p-4 flex flex-col h-full">
                                        {/* Imagen */}
                                        <div className={`relative aspect-square rounded-xl overflow-hidden flex items-center justify-center mb-3 ${inCart ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-[var(--bg-hover)]'}`}>
                                            {(() => {
                                                const coverImage = getCoverImage(product);
                                                return coverImage ? (
                                                    <img src={coverImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <Package size={32} className="text-(--text-muted) opacity-40" />
                                                );
                                            })()}
                                        </div>

                                        {/* Nombre y Código */}
                                        <h3 className="text-[15px] font-bold text-(--text-primary) group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight mb-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wide">Cod. {product.code}</p>

                                        {/* Badge de Opciones - Abajo del código */}
                                        {priceInfo.hasVariants && (
                                            <div className="mt-1 flex items-center gap-1 text-[11px] text-primary-600 font-medium">
                                                <Grid3X3 size={10} />
                                                <span>{product.variants.filter(v => v.active !== false).length} Opciones</span>
                                            </div>
                                        )}

                                        {/* ===== PRECIOS ===== */}
                                        {showPrices && (
                                        <div className="mt-auto pt-3">
                                            <div className="flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    {/* Precio tachado (original) */}
                                                    {priceInfo.minFinalPrice < priceInfo.minPrice && (
                                                        <span className="text-[11px] text-(--text-muted) line-through">
                                                            {formatPrice(priceInfo.minPrice)}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Precio final */}
                                                    <div className="flex items-baseline gap-1">
                                                        {priceInfo.showFrom && (
                                                            <span className="text-[11px] text-(--text-muted)">Desde</span>
                                                        )}
                                                        <span className="font-bold text-(--text-primary) text-lg">
                                                            {formatPrice(priceInfo.minFinalPrice)}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Info IVA con % específico */}
                                                    {priceInfo.hasTax ? (
                                                        <span className="text-[10px] text-(--text-muted)">
                                                            {showPricesWithTax 
                                                                ? `Incluye IVA (${priceInfo.taxRate}%)` 
                                                                : `+ IVA (${priceInfo.taxRate}%)`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-success-600">Sin IVA</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        )}
                                        
                                        {/* Espaciado cuando no hay precios */}
                                        {!showPrices && <div className="mt-auto" />}

                                        {/* Botón Add o Info de restricciones */}
                                        <div className="pt-3">
                                        {(() => {
                                                    const unitsPerPackage = product.unitsPerPackage || 1;
                                                    const minOrderQuantity = product.minOrderQuantity || 1;
                                                    const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
                                                    const hasRestrictions = unitsPerPackage > 1 || minOrderQuantity > 1 || sellOnlyFullPackages || priceInfo.hasVariants;
                                                    
                                                    // En modo catálogo (viewOnly), no mostrar botón de agregar ni info adicional
                                                    if (viewOnly) {
                                                        return null;
                                                    }
                                                    
                                                    if (hasRestrictions) {
                                                        return (
                                                            <div className="text-[8px] md:text-[9px] text-right space-y-0.5">
                                                                {sellOnlyFullPackages && unitsPerPackage > 1 && (
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
                                        </div>
                                </motion.div>
                            );
                        })}
                </div>
            ) : !viewOnly && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-(--bg-hover) rounded-2xl flex items-center justify-center mb-4">
                        <Package size={40} className="text-(--text-muted) opacity-50" />
                    </div>
                    <p className="text-(--text-primary) font-medium">No se encontraron productos</p>
                    <p className="text-(--text-muted) text-sm mt-1">
                        {hideOutOfStock && products.length > 0 
                            ? `Algunos productos pueden estar ocultos por falta de stock. Intenta con otra búsqueda.` 
                            : 'Intenta con otra búsqueda'}
                    </p>
                </div>
            )}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-(--border-color)">
                    <p className="text-xs text-(--text-muted)">
                        Mostrando {filteredProducts.length} de {pagination.total} productos
                        {hideOutOfStock && products.length !== filteredProducts.length && (
                            <span className="text-warning-600 ml-1">
                                ({products.length - filteredProducts.length} ocultos sin stock)
                            </span>
                        )}
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
