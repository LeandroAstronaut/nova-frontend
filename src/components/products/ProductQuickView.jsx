import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Package,
    Plus,
    Minus,
    Barcode,
    Building2,
    Ruler,
    Tag,
    Percent,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Star,
    Grid3X3,
    Layers,
    Info
} from 'lucide-react';
import Button from '../common/Button';

const ProductQuickView = ({ 
    isOpen, 
    onClose, 
    product, 
    onAddToCart, 
    isClient = false, 
    viewOnly = false, 
    showPricesWithTax = false, 
    features = {}, 
    company = {}, 
    priceList = 1, 
    user = null 
}) => {
    const [quantity, setQuantity] = useState(1);
    const [discount, setDiscount] = useState(0);
    const [quantityError, setQuantityError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(false);
    
    // Feature flags
    const hasStockFeature = features?.stock === true;
    const hasPriceListsFeature = features?.priceLists === true;
    const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'superadmin';

    // Reset states when drawer opens
    useEffect(() => {
        if (isOpen && product && !hasInitialized) {
            const pricingKey = priceList === 2 ? 'list2' : 'list1';
            const hasVar = product.hasVariants && product.variants?.length > 0;
            const hasUniform = product.hasUniformVariantPricing !== false;
            const sellOnlyFull = company?.sellOnlyFullPackages === true;
            
            let initialVariant = null;
            if (hasVar) {
                const activeVariants = product.variants.filter(v => v.active !== false);
                initialVariant = activeVariants[0] || null;
                setSelectedVariant(initialVariant);
            } else {
                setSelectedVariant(null);
            }
            
            // Calcular descuento inicial (del producto o variante)
            let initialDiscount = 0;
            if (hasVar && !hasUniform && initialVariant) {
                initialDiscount = initialVariant.pricing?.[pricingKey]?.discount || 0;
            } else {
                initialDiscount = product?.pricing?.[pricingKey]?.discount || 0;
            }
            
            // Calcular cantidad mínima inicial
            const unitsPerPack = initialVariant?.unitsPerPackage || product.unitsPerPackage || 1;
            const minOrderQty = initialVariant?.minOrderQuantity || product.minOrderQuantity || 1;
            const minQty = Math.max(minOrderQty, sellOnlyFull ? unitsPerPack : 1);
            
            setCurrentImageIndex(0);
            setQuantityError(null);
            setDiscount(initialDiscount);
            setQuantity(minQty);
            setHasInitialized(true);
        }
    }, [isOpen, product, isClient, priceList, company, hasInitialized]);

    // Reset initialized flag when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false);
        }
    }, [isOpen]);

    if (!product) return null;

    // ============ DATA & HELPERS ============
    
    const hasVariants = product.hasVariants && product.variants?.length > 0;
    const hasUniformPricing = product.hasUniformVariantPricing !== false;
    const taxRate = product.pricing?.tax || 0;
    const hasTax = taxRate > 0;

    // Configuración de pedidos
    const unitsPerPackage = selectedVariant?.unitsPerPackage || product.unitsPerPackage || 1;
    const minOrderQuantity = selectedVariant?.minOrderQuantity || product.minOrderQuantity || 1;
    const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
    const excludeOfferFromGlobalDiscount = company?.excludeOfferProductsFromGlobalDiscount === true;

    const quantityStep = sellOnlyFullPackages ? unitsPerPackage : 1;
    
    const getEffectiveMinQuantity = () => {
        return Math.max(minOrderQuantity, sellOnlyFullPackages ? unitsPerPackage : 1);
    };

    // Imágenes ordenadas con portada primero
    const getOrderedImages = () => {
        if (!product.images || product.images.length === 0) return [];
        const images = [...product.images];
        const coverIndex = product.coverImageIndex || 0;
        if (coverIndex > 0 && coverIndex < images.length) {
            const [cover] = images.splice(coverIndex, 1);
            images.unshift(cover);
        }
        return images;
    };
    
    const orderedImages = getOrderedImages();
    const hasImages = orderedImages.length > 0;
    const hasMultipleImages = orderedImages.length > 1;

    // Precios según variante
    const getPricing = () => {
        const pricingKey = priceList === 2 ? 'list2' : 'list1';
        
        if (hasVariants && !hasUniformPricing && selectedVariant) {
            return selectedVariant.pricing?.[pricingKey] || {};
        }
        return product.pricing?.[pricingKey] || {};
    };

    const pricing = getPricing();
    const basePrice = pricing.price || 0;
    const offerPrice = pricing.offer || 0;
    const productDiscount = pricing.discount || 0; // Descuento del producto en tabla
    const hasOffer = offerPrice > 0;
    
    // Calcular precios base (sin descuento del input)
    const listPriceWithoutTax = hasOffer ? offerPrice : basePrice;
    
    // Calcular precio final con el descuento del INPUT (editable)
    const calculateFinalPriceWithDiscount = () => {
        return listPriceWithoutTax * (1 - discount / 100);
    };
    
    const finalPriceWithoutTax = calculateFinalPriceWithDiscount();
    
    const getPriceWithTax = (price) => {
        if (!price || !hasTax) return price;
        return price * (1 + taxRate / 100);
    };
    
    // Precio final mostrado (con descuento del input aplicado)
    const displayFinalPrice = showPricesWithTax 
        ? getPriceWithTax(finalPriceWithoutTax) 
        : finalPriceWithoutTax;
    
    // Precio de lista (tachado) - sin descuento del input
    const displayListPrice = showPricesWithTax 
        ? getPriceWithTax(listPriceWithoutTax) 
        : listPriceWithoutTax;
    
    // Precio base original (sin oferta)
    const displayBasePrice = showPricesWithTax 
        ? getPriceWithTax(basePrice) 
        : basePrice;

    // Stock
    const getStock = () => {
        if (hasVariants && selectedVariant) {
            return {
                stock: selectedVariant.stock || 0,
                reserved: selectedVariant.stockReserved || 0,
                quoted: selectedVariant.stockQuoted || 0,
                min: selectedVariant.minStock || 0,
                available: Math.max(0, (selectedVariant.stock || 0) - (selectedVariant.stockReserved || 0))
            };
        }
        return {
            stock: product.stock || 0,
            reserved: product.stockReserved || 0,
            quoted: product.stockQuoted || 0,
            min: product.minStock || 0,
            available: Math.max(0, (product.stock || 0) - (product.stockReserved || 0))
        };
    };
    
    const stock = getStock();
    const isLowStock = hasStockFeature && stock.min > 0 && stock.available <= stock.min && stock.available > 0;
    const isOutOfStock = hasStockFeature && stock.available === 0;

    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ============ HANDLERS ============

    const handleAdd = () => {
        if (onAddToCart) {
            const itemData = hasVariants ? { ...product, selectedVariant } : product;
            onAddToCart(itemData, quantity, discount);
        }
        onClose();
    };

    // Lightbox handlers (ORIGINAL del QuickView)
    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

    const nextLightboxImage = () => {
        setLightboxIndex((prev) => (prev === orderedImages.length - 1 ? 0 : prev + 1));
    };

    const prevLightboxImage = () => {
        setLightboxIndex((prev) => (prev === 0 ? orderedImages.length - 1 : prev - 1));
    };

    const handleLightboxSwipe = (event, info) => {
        if (info && info.offset) {
            if (info.offset.x > 100) prevLightboxImage();
            else if (info.offset.x < -100) nextLightboxImage();
        }
    };

    const handleVariantChange = (variant) => {
        setSelectedVariant(variant);
        const newMin = Math.max(
            variant.minOrderQuantity || product.minOrderQuantity || 1,
            sellOnlyFullPackages ? (variant.unitsPerPackage || product.unitsPerPackage || 1) : 1
        );
        setQuantity(newMin);
        
        // Actualizar descuento según la variante seleccionada
        if (!hasUniformPricing) {
            const pricingKey = priceList === 2 ? 'list2' : 'list1';
            const variantDiscount = variant.pricing?.[pricingKey]?.discount || 0;
            setDiscount(variantDiscount);
        }
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
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer - MÁS ANCHO (800px) */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 left-4 right-4 md:left-auto md:right-4 h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[800px] bg-[var(--bg-card)] shadow-2xl z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
                                    <Package size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[350px] md:max-w-[500px]">
                                        {product.name}
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        {product.code}
                                        {hasVariants && selectedVariant && ` • ${selectedVariant.sku || selectedVariant.value1}`}
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

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                
                                {/* ===== FILA 1: DOS COLUMNAS ===== */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* COLUMNA IZQUIERDA: Galería + Datos básicos */}
                                    <div className="space-y-4">
                                        {/* Galería ORIGINAL del QuickView */}
                                        {hasImages && (
                                            <div className="space-y-3">
                                                {/* Imagen principal con transiciones */}
                                                <div className="aspect-[4/3] bg-[var(--bg-hover)] rounded-2xl overflow-hidden relative border border-[var(--border-color)]">
                                                    <AnimatePresence mode="wait">
                                                        <motion.img
                                                            key={currentImageIndex}
                                                            src={orderedImages[currentImageIndex].url}
                                                            alt={product.name}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="w-full h-full object-cover cursor-pointer"
                                                            onClick={() => openLightbox(currentImageIndex)}
                                                        />
                                                    </AnimatePresence>

                                                    {hasMultipleImages && (
                                                        <>
                                                            <button
                                                                onClick={() => setCurrentImageIndex(prev => prev === 0 ? orderedImages.length - 1 : prev - 1)}
                                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                                                            >
                                                                <ChevronLeft size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => setCurrentImageIndex(prev => prev === orderedImages.length - 1 ? 0 : prev + 1)}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                                                            >
                                                                <ChevronRight size={20} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Miniaturas con estrella en portada */}
                                                {hasMultipleImages && (
                                                    <div className="flex gap-2 justify-center">
                                                        {orderedImages.map((img, idx) => (
                                                            <button
                                                                key={img.publicId || idx}
                                                                onClick={() => setCurrentImageIndex(idx)}
                                                                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                                                    idx === currentImageIndex 
                                                                        ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900' 
                                                                        : 'border-[var(--border-color)] hover:border-primary-300'
                                                                }`}
                                                            >
                                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                                                {idx === 0 && (
                                                                    <div className="absolute top-0.5 left-0.5">
                                                                        <Star size={8} className="text-primary-500" fill="currentColor" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Sin imagen */}
                                        {!hasImages && (
                                            <div className="aspect-[4/3] bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)] flex items-center justify-center">
                                                <Package size={64} className="text-[var(--text-muted)] opacity-30" />
                                            </div>
                                        )}

                                        {/* Nombre y código */}
                                        <div>
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight mb-1">
                                                {product.name}
                                            </h3>
                                            <p className="text-[13px] text-[var(--text-muted)] font-medium">
                                                {product.code}
                                            </p>
                                        </div>

                                        {/* Datos básicos en línea */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-[var(--text-muted)]">
                                            {product.brand && (
                                                <span className="flex items-center gap-1.5 bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg">
                                                    <Building2 size={14} /> {product.brand}
                                                </span>
                                            )}
                                            {product.category && (
                                                <span className="flex items-center gap-1.5 bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg">
                                                    <Layers size={14} /> {product.category}
                                                </span>
                                            )}
                                            {product.unit && (
                                                <span className="flex items-center gap-1.5 bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg">
                                                    <Ruler size={14} /> {product.unit}
                                                </span>
                                            )}
                                            {product.barcode && (
                                                <span className="flex items-center gap-1.5 bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg">
                                                    <Barcode size={14} /> {product.barcode}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* COLUMNA DERECHA: Precios, Variantes, Stock - Estilo Minimalista */}
                                    <div className="space-y-5">
                                        
                                        {/* Card de Precio Principal - Minimalista */}
                                        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                                    Precio {priceList === 2 ? 'Lista 2' : 'Lista 1'}
                                                </span>
                                                {showPricesWithTax && hasTax && (
                                                    <span className="text-[10px] text-success-600 font-medium bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-full">
                                                        con IVA
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                {/* Precio Final Grande (con descuento del INPUT) */}
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <span className="text-3xl font-bold text-[var(--text-primary)]">
                                                            {formatPrice(displayFinalPrice)}
                                                        </span>
                                                        {/* Precio de lista tachado */}
                                                        <span className="block text-sm text-[var(--text-muted)] line-through mt-0.5">
                                                            {formatPrice(displayListPrice)}
                                                        </span>
                                                    </div>
                                                    {/* Badge de descuento del INPUT */}
                                                    {discount > 0 && (
                                                        <span className="px-2.5 py-1 bg-success-100 dark:bg-success-900/30 text-success-600 text-[11px] font-bold rounded-lg">
                                                            -{discount}%
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Info de oferta si existe */}
                                                {hasOffer && (
                                                    <div className="flex items-center gap-2 p-2 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                                                        <span className="px-2 py-0.5 bg-danger-500 text-white text-[9px] font-bold rounded">
                                                            OFERTA
                                                        </span>
                                                        <span className="text-[11px] text-danger-600">
                                                            Precio lista: {formatPrice(displayBasePrice)}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* IVA info */}
                                                {hasTax ? (
                                                    <p className="text-[12px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                                                        {showPricesWithTax 
                                                            ? `Incluye IVA (${taxRate}%)` 
                                                            : `IVA ${taxRate}% no incluido`}
                                                    </p>
                                                ) : (
                                                    <p className="text-[12px] text-success-600 font-medium pt-2 border-t border-[var(--border-color)]">
                                                        Producto sin IVA
                                                    </p>
                                                )}
                                                
                                                {/* Warning descuento global */}
                                                {hasOffer && excludeOfferFromGlobalDiscount && (
                                                    <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                                        <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                                            No aplica descuento global del pedido
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selector de Variantes - Minimalista */}
                                        {hasVariants && (
                                            <div>
                                                <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                                    Seleccionar variación
                                                </h4>
                                                
                                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                                    {product.variants.filter(v => v.active !== false).map((variant) => {
                                                        const isSelected = selectedVariant?.id === variant.id;
                                                        
                                                        // Si tiene precios individuales, mostrar precio de la variante
                                                        // Si tiene precios uniformes, mostrar precio del producto padre
                                                        let vPrice, vOffer, vDiscount, vFinal, vDisplayFinal;
                                                        
                                                        if (hasUniformPricing) {
                                                            // Precios uniformes: usar precio del producto padre
                                                            vPrice = basePrice;
                                                            vOffer = offerPrice;
                                                            vDiscount = productDiscount;
                                                            vFinal = (vOffer > 0 ? vOffer : vPrice) * (1 - discount / 100);
                                                            vDisplayFinal = showPricesWithTax && hasTax 
                                                                ? vFinal * (1 + taxRate / 100) 
                                                                : vFinal;
                                                        } else {
                                                            // Precios individuales: usar precio de la variante
                                                            const variantPricing = variant.pricing?.[priceList === 2 ? 'list2' : 'list1'] || {};
                                                            vPrice = variantPricing.price || 0;
                                                            vOffer = variantPricing.offer || 0;
                                                            vDiscount = variantPricing.discount || 0;
                                                            vFinal = (vOffer > 0 ? vOffer : vPrice) * (1 - vDiscount / 100);
                                                            vDisplayFinal = showPricesWithTax && hasTax 
                                                                ? vFinal * (1 + taxRate / 100) 
                                                                : vFinal;
                                                        }
                                                        
                                                        return (
                                                            <button
                                                                key={variant.id}
                                                                onClick={() => handleVariantChange(variant)}
                                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                                                                    isSelected 
                                                                        ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10' 
                                                                        : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-primary-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                                                        isSelected ? 'border-primary-500 bg-primary-500' : 'border-[var(--border-color)]'
                                                                    }`}>
                                                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[13px] font-medium text-[var(--text-primary)]">
                                                                            {variant.value1}
                                                                            {variant.value2 && ` / ${variant.value2}`}
                                                                        </p>
                                                                        {variant.sku && (
                                                                            <p className="text-[10px] text-[var(--text-muted)]">{variant.sku}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {!hasUniformPricing && (
                                                                    <div className="text-right">
                                                                        <p className={`text-[14px] font-semibold ${vOffer > 0 ? 'text-danger-600' : 'text-[var(--text-primary)]'}`}>
                                                                            {formatPrice(vDisplayFinal)}
                                                                        </p>
                                                                        {vOffer > 0 && (
                                                                            <p className="text-[10px] text-[var(--text-muted)] line-through">
                                                                                {formatPrice(showPricesWithTax && hasTax ? vPrice * (1 + taxRate / 100) : vPrice)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Stock - Minimalista */}
                                        {hasStockFeature && (
                                            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Stock</span>
                                                    {isLowStock && (
                                                        <span className="text-[10px] text-warning-600 font-medium">
                                                            Stock bajo
                                                        </span>
                                                    )}
                                                    {isOutOfStock && (
                                                        <span className="text-[10px] text-danger-600 font-medium">
                                                            Sin stock
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-[var(--text-muted)]">Disponible</p>
                                                        <p className={`text-xl font-bold ${isOutOfStock ? 'text-danger-600' : isLowStock ? 'text-warning-600' : 'text-success-600'}`}>
                                                            {stock.available}
                                                        </p>
                                                    </div>
                                                    {isAdmin && (
                                                        <>
                                                            <div className="w-px h-8 bg-[var(--border-color)]" />
                                                            <div className="flex gap-4">
                                                                <div>
                                                                    <p className="text-[10px] text-[var(--text-muted)]">Físico</p>
                                                                    <p className="text-sm font-medium text-[var(--text-primary)]">{stock.stock}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-[var(--text-muted)]">Reserv.</p>
                                                                    <p className="text-sm font-medium text-warning-600">{stock.reserved}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-[var(--text-muted)]">Mín</p>
                                                                    <p className="text-sm font-medium text-[var(--text-muted)]">{stock.min || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Configuración de pedidos - Minimalista */}
                                        {(unitsPerPackage > 1 || minOrderQuantity > 1 || sellOnlyFullPackages) && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {unitsPerPackage > 1 && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[11px] rounded-md">
                                                        <Package size={12} />
                                                        {unitsPerPackage} uds/bulto
                                                    </span>
                                                )}
                                                {minOrderQuantity > 1 && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[11px] rounded-md">
                                                        Mín: {minOrderQuantity} uds
                                                    </span>
                                                )}
                                                {sellOnlyFullPackages && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-[11px] rounded-md">
                                                        Solo bultos
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ===== FILA 2: Descripción y detalles adicionales ===== */}
                                {(product.description || product.longDescription) && (
                                    <div className="pt-4 border-t border-[var(--border-color)]">
                                        {product.description && (
                                            <div className="mb-4">
                                                <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Info size={14} />
                                                    Descripción
                                                </h4>
                                                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                                                    {product.description}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {product.longDescription && (
                                            <div>
                                                <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Info size={14} />
                                                    Detalles adicionales
                                                </h4>
                                                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                                                    {product.longDescription}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ===== FOOTER: Cantidad y Agregar ===== */}
                        {!viewOnly && (
                            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] shrink-0">
                                <div className="flex items-start gap-3">
                                    {/* Cantidad */}
                                    <div className="flex-shrink-0">
                                        <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Cantidad
                                            {sellOnlyFullPackages && unitsPerPackage > 1 && (
                                                <span className="ml-1 text-[9px] normal-case text-primary-600">(x{unitsPerPackage})</span>
                                            )}
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = Math.max(getEffectiveMinQuantity(), quantity - quantityStep);
                                                    setQuantity(newQty);
                                                    setQuantityError(null);
                                                }}
                                                disabled={quantity <= getEffectiveMinQuantity()}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-300 transition-colors disabled:opacity-40"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    if (val >= getEffectiveMinQuantity()) {
                                                        if (sellOnlyFullPackages && unitsPerPackage > 1) {
                                                            const rounded = Math.round(val / unitsPerPackage) * unitsPerPackage;
                                                            setQuantity(rounded);
                                                        } else {
                                                            setQuantity(val);
                                                        }
                                                        setQuantityError(null);
                                                    }
                                                }}
                                                className="w-20 h-9 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-center font-semibold text-[15px] text-[var(--text-primary)] outline-none focus:border-primary-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQuantity(quantity + quantityStep);
                                                    setQuantityError(null);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-300 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        {(minOrderQuantity > 1 || (sellOnlyFullPackages && unitsPerPackage > 1)) ? (
                                            <p className="text-[9px] text-[var(--text-muted)] mt-1 h-3">
                                                {sellOnlyFullPackages && unitsPerPackage > 1 
                                                    ? `Múltiplos de ${unitsPerPackage}` 
                                                    : `Mín: ${minOrderQuantity}`}
                                            </p>
                                        ) : (
                                            <p className="h-3 mt-1" />
                                        )}
                                    </div>

                                    {/* Descuento manual */}
                                    {(!isClient || discount > 0) && (
                                        <div className="flex-shrink-0">
                                            <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                                Dto. %
                                            </label>
                                            <div className="flex items-center justify-center h-9 w-20 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-lg px-2">
                                                <Percent size={12} className="text-success-600 mr-1 flex-shrink-0" />
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                    disabled={isClient}
                                                    className="w-full bg-transparent text-center font-semibold text-[14px] text-success-700 dark:text-success-400 outline-none disabled:opacity-60"
                                                />
                                            </div>
                                            <p className="h-3 mt-1" />
                                        </div>
                                    )}

                                    {/* Botón Agregar */}
                                    <div className="flex-1 min-w-0">
                                        <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block opacity-0">
                                            Acción
                                        </label>
                                        <Button
                                            variant="primary"
                                            className="!w-full !py-2 !h-9 !text-sm font-semibold"
                                            onClick={handleAdd}
                                            disabled={isOutOfStock}
                                        >
                                            {isOutOfStock ? (
                                                'Sin stock'
                                            ) : (
                                                <>
                                                    <Plus size={16} className="mr-1.5" />
                                                    Agregar
                                                </>
                                            )}
                                        </Button>
                                        <p className="h-3 mt-1" />
                                    </div>
                                </div>
                                
                                {quantityError && (
                                    <p className="text-[11px] text-danger-500 mt-2 flex items-center gap-1">
                                        <AlertCircle size={12} /> {quantityError}
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* ===== LIGHTBOX ORIGINAL del QuickView ===== */}
                    {lightboxOpen && (
                        <ImageLightbox
                            images={orderedImages}
                            currentIndex={lightboxIndex}
                            isOpen={lightboxOpen}
                            onClose={closeLightbox}
                            onNext={nextLightboxImage}
                            onPrev={prevLightboxImage}
                            onSwipe={handleLightboxSwipe}
                        />
                    )}
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// Componente Lightbox ORIGINAL del QuickView
const ImageLightbox = ({ images, currentIndex, isOpen, onClose, onNext, onPrev, onSwipe }) => {
    if (!isOpen || !images || images.length === 0) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black z-[300] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-white/80 text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Imagen con drag/swipe */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.img
                                key={currentIndex}
                                src={images[currentIndex].url}
                                alt=""
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.2 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={onSwipe}
                                className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                            />
                        </AnimatePresence>

                        {/* Flechas */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={onPrev}
                                    className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={onNext}
                                    className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Miniaturas */}
                    {images.length > 1 && (
                        <div className="px-4 py-4 flex gap-2 justify-center overflow-x-auto">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (idx < currentIndex) onPrev();
                                        else if (idx > currentIndex) onNext();
                                    }}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                        idx === currentIndex 
                                            ? 'border-white opacity-100' 
                                            : 'border-transparent opacity-50 hover:opacity-80'
                                    }`}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProductQuickView;
