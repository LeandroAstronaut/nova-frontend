import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Package,
    Info,
    Tag,
    Plus,
    Minus,
    Barcode,
    Layers,
    Building2,
    Ruler,
    Percent,
    DollarSign,
    Sparkles,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Star
} from 'lucide-react';
import Button from '../common/Button';

const ProductQuickView = ({ isOpen, onClose, product, onAddToCart, isClient = false, viewOnly = false, showPricesWithTax = false, features, company, priceList = 1 }) => {
    const [quantity, setQuantity] = React.useState(1);
    const [discount, setDiscount] = React.useState(0);
    const [quantityError, setQuantityError] = React.useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Configuración de pedidos desde producto y compañía
    const unitsPerPackage = product?.unitsPerPackage || 1;
    const minOrderQuantity = product?.minOrderQuantity || 1;
    const sellOnlyFullPackages = company?.sellOnlyFullPackages === true;
    
    // Calcular step para el input de cantidad
    const quantityStep = sellOnlyFullPackages ? unitsPerPackage : 1;
    
    // Calcular cantidad mínima válida (el mayor entre minOrderQuantity y el primer step válido)
    const effectiveMinQuantity = Math.max(minOrderQuantity, sellOnlyFullPackages ? unitsPerPackage : 1);

    // Reset local state when drawer opens
    React.useEffect(() => {
        if (isOpen) {
            const initialQty = Math.max(effectiveMinQuantity, quantityStep);
            setQuantity(initialQty);
            setQuantityError(null);
            setDiscount(isClient ? (product?.pricing?.discount || 0) : 0);
            setCurrentImageIndex(0);
        }
    }, [isOpen, product, isClient, effectiveMinQuantity, quantityStep]);

    if (!product) return null;

    // Funciones para el lightbox
    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextLightboxImage = () => {
        setLightboxIndex((prev) => (prev === orderedImages.length - 1 ? 0 : prev + 1));
    };

    const prevLightboxImage = () => {
        setLightboxIndex((prev) => (prev === 0 ? orderedImages.length - 1 : prev - 1));
    };

    const handleLightboxSwipe = (event, info) => {
        if (info && info.offset) {
            if (info.offset.x > 100) {
                prevLightboxImage();
            } else if (info.offset.x < -100) {
                nextLightboxImage();
            }
        }
    };

    // Obtener imágenes ordenadas con la portada primero
    let orderedImages = [];
    let hasImages = false;
    let hasMultipleImages = false;
    
    if (product.images && product.images.length > 0) {
        orderedImages = [...product.images];
        const coverIndex = product.coverImageIndex || 0;
        
        // Mover la imagen de portada al principio
        if (coverIndex > 0 && coverIndex < orderedImages.length) {
            const [coverImage] = orderedImages.splice(coverIndex, 1);
            orderedImages.unshift(coverImage);
        }
        hasImages = true;
        hasMultipleImages = orderedImages.length > 1;
    }

    const handleAdd = () => {
        if (onAddToCart) onAddToCart(product, quantity, discount);
        onClose();
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR')}`;
    };

    const getPriceWithTax = (price) => {
        if (!price) return 0;
        const taxRate = (product.pricing?.tax || 0) / 100;
        return price * (1 + taxRate);
    };

    // Feature flags
    const hasStockFeature = features ? features.stock === true : true;
    const hasPriceListsFeature = features ? features.priceLists === true : true;

    // Datos del producto
    const taxRate = product.pricing?.tax || 0;
    const hasTax = taxRate > 0;
    const hasOffer = product.pricing?.offer > 0;
    const hasDiscount = product.pricing?.discount > 0 && !hasOffer;

    // Calcular precio base (con o sin IVA según setting)
    const getDisplayPrice = (basePrice) => {
        if (!basePrice) return 0;
        if (showPricesWithTax && hasTax) {
            return getPriceWithTax(basePrice);
        }
        return basePrice;
    };

    // Precios a mostrar
    const regularPrice = product.pricing?.list1 || 0;
    const offerPrice = product.pricing?.offer || 0;
    const discountedPrice = hasDiscount ? regularPrice * (1 - product.pricing.discount / 100) : regularPrice;
    const finalPrice = hasOffer ? offerPrice : (showPricesWithTax ? getDisplayPrice(discountedPrice) : discountedPrice);
    const finalPriceWithTax = hasOffer ? getPriceWithTax(offerPrice) : getPriceWithTax(discountedPrice);

    // Campos a mostrar
    const showBarcode = product.barcode;
    const showSubcategory = product.subcategory;
    const showBrand = product.brand;
    const showUnit = product.unit;
    const showLongDescription = product.longDescription;
    const showPackageInfo = unitsPerPackage > 1 || minOrderQuantity > 1 || sellOnlyFullPackages;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[480px] bg-[var(--bg-card)] shadow-2xl z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Detalle del Producto</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{product.code} • {product.category || 'General'}</p>
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
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Image Slider Section */}
                            <div className="aspect-video bg-[var(--bg-hover)] rounded-2xl overflow-hidden relative border border-[var(--border-color)]">
                                {hasImages ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                        <Package size={64} className="opacity-30" />
                                    </div>
                                )}
                            </div>

                            {/* Miniaturas */}
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

                            {/* Nombre y descripción corta */}
                            <div>
                                <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">{product.name}</h4>
                                {product.description && (
                                    <p className="text-[13px] text-[var(--text-secondary)]">{product.description}</p>
                                )}
                            </div>

                            {/* Info adicional en grid */}
                            {(showBarcode || showSubcategory || showBrand || showUnit) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {showBarcode && (
                                        <div className="p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Barcode size={12} className="text-[var(--text-muted)]" />
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Código de Barras</span>
                                            </div>
                                            <p className="text-[12px] font-medium">{product.barcode}</p>
                                        </div>
                                    )}
                                    {showSubcategory && (
                                        <div className="p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Layers size={12} className="text-[var(--text-muted)]" />
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Subcategoría</span>
                                            </div>
                                            <p className="text-[12px] font-medium">{product.subcategory}</p>
                                        </div>
                                    )}
                                    {showBrand && (
                                        <div className="p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Building2 size={12} className="text-[var(--text-muted)]" />
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Marca/Proveedor</span>
                                            </div>
                                            <p className="text-[12px] font-medium">{product.brand}</p>
                                        </div>
                                    )}
                                    {showUnit && (
                                        <div className="p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Ruler size={12} className="text-[var(--text-muted)]" />
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Unidad</span>
                                            </div>
                                            <p className="text-[12px] font-medium">{product.unit}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Descripción larga */}
                            {showLongDescription && (
                                <div className="p-4 bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info size={14} className="text-[var(--text-muted)]" />
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Descripción Completa</span>
                                    </div>
                                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{product.longDescription}</p>
                                </div>
                            )}

                            {/* Stock */}
                            {hasStockFeature && (
                                <div className="flex items-center gap-3 p-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                                    <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-success-500' : 'bg-danger-500'}`} />
                                    <div>
                                        <p className="text-[11px] text-[var(--text-muted)] font-medium">Stock disponible</p>
                                        <p className="text-[14px] font-bold text-[var(--text-primary)]">{product.stock || 0} unidades</p>
                                    </div>
                                </div>
                            )}

                            {/* Configuración de Pedidos */}
                            {showPackageInfo && (
                                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Package size={16} className="text-primary-600" />
                                        <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider">Configuración de Pedido</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {unitsPerPackage > 1 && (
                                            <div>
                                                <p className="text-[10px] text-[var(--text-muted)]">Unidades por bulto</p>
                                                <p className="text-lg font-bold text-[var(--text-primary)]">{unitsPerPackage}</p>
                                                {sellOnlyFullPackages && (
                                                    <p className="text-[10px] text-primary-600 font-medium">Solo bultos cerrados</p>
                                                )}
                                            </div>
                                        )}
                                        {minOrderQuantity > 1 && (
                                            <div>
                                                <p className="text-[10px] text-[var(--text-muted)]">Cantidad mínima</p>
                                                <p className="text-lg font-bold text-[var(--text-primary)]">{minOrderQuantity}</p>
                                                <p className="text-[10px] text-warning-600 font-medium">Mínimo requerido</p>
                                            </div>
                                        )}
                                    </div>
                                    {sellOnlyFullPackages && unitsPerPackage > 1 && (
                                        <p className="mt-3 text-[11px] text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-800/50 px-3 py-2 rounded-lg">
                                            Solo se permiten pedidos en múltiplos de {unitsPerPackage} unidades
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Precios */}
                            <div className="space-y-3">
                                <h5 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                    <DollarSign size={14} />
                                    {showPricesWithTax ? 'Precio (IVA incluido)' : 'Precio (sin IVA)'}
                                </h5>
                                
                                {/* Precio de Oferta */}
                                {hasOffer && (
                                    <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-2xl border border-warning-100 dark:border-warning-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles size={16} className="text-warning-600" />
                                            <span className="text-[11px] font-bold text-warning-600 uppercase tracking-wider">Precio Especial</span>
                                        </div>
                                        <p className="text-3xl font-bold text-warning-600">
                                            {formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(offerPrice) : offerPrice)}
                                        </p>
                                        {showPricesWithTax && hasTax && (
                                            <p className="text-[11px] text-warning-600/70 mt-1">Incluye IVA ({taxRate}%)</p>
                                        )}
                                        {!showPricesWithTax && hasTax && (
                                            <p className="text-[11px] text-warning-600/70 mt-1">+{taxRate}% IVA = {formatPrice(getPriceWithTax(offerPrice))}</p>
                                        )}
                                        {company?.excludeOfferProductsFromGlobalDiscount && (
                                            <div className="mt-3 px-3 py-2 bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 rounded-lg">
                                                <p className="text-[11px] text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1">
                                                    <Tag size={12} />
                                                    No aplica descuento global del pedido
                                                </p>
                                            </div>
                                        )}
                                        <div className="mt-3 pt-3 border-t border-warning-200 dark:border-warning-700">
                                            <p className="text-[11px] text-[var(--text-muted)] mb-1">Precio regular</p>
                                            <p className="text-lg font-medium text-[var(--text-muted)] line-through">
                                                {formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(regularPrice) : regularPrice)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Precio Lista 1 */}
                                {!hasOffer && (!priceList || priceList === 1) && (
                                    <div className="p-4 bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                {showPricesWithTax ? 'Precio' : (hasPriceListsFeature && priceList === 1 ? 'Lista 1' : 'Precio')}
                                            </span>
                                            {hasDiscount && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded-md text-[10px] font-bold">
                                                    <Tag size={10} />
                                                    {product.pricing.discount}% dto.
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-3xl font-bold text-[var(--text-primary)]">
                                            {formatPrice(finalPrice)}
                                        </p>
                                        {showPricesWithTax && hasTax && (
                                            <p className="text-[11px] text-[var(--text-muted)] mt-1">Incluye IVA ({taxRate}%)</p>
                                        )}
                                        {!showPricesWithTax && hasTax && (
                                            <p className="text-[11px] text-[var(--text-muted)] mt-1">+{taxRate}% IVA = {formatPrice(finalPriceWithTax)}</p>
                                        )}
                                        {hasDiscount && (
                                            <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                                                <p className="text-[11px] text-[var(--text-muted)] mb-1">Precio sin descuento</p>
                                                <p className="text-lg font-medium text-[var(--text-muted)] line-through">
                                                    {formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(regularPrice) : regularPrice)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Precio Lista 2 */}
                                {!hasOffer && hasPriceListsFeature && product.pricing?.list2 > 0 && (!priceList || priceList === 2) && (
                                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold text-primary-500 uppercase tracking-wider">
                                                {priceList === 2 ? 'Precio' : 'Lista 2'}
                                            </span>
                                            {hasDiscount && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-primary-800 text-success-600 dark:text-success-400 rounded-md text-[10px] font-bold">
                                                    <Tag size={10} />
                                                    {product.pricing.discount}% dto.
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-3xl font-bold text-primary-600">
                                            {formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(product.pricing.list2 * (hasDiscount ? (1 - product.pricing.discount / 100) : 1)) : product.pricing.list2 * (hasDiscount ? (1 - product.pricing.discount / 100) : 1))}
                                        </p>
                                        {showPricesWithTax && hasTax && (
                                            <p className="text-[11px] text-primary-500/70 mt-1">Incluye IVA ({taxRate}%)</p>
                                        )}
                                        {!showPricesWithTax && hasTax && (
                                            <p className="text-[11px] text-primary-500/70 mt-1">+{taxRate}% IVA = {formatPrice(getPriceWithTax(product.pricing.list2 * (hasDiscount ? (1 - product.pricing.discount / 100) : 1)))}</p>
                                        )}
                                        {hasDiscount && (
                                            <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-700">
                                                <p className="text-[11px] text-primary-500/70 mb-1">Sin descuento</p>
                                                <p className="text-lg font-medium text-primary-500/50 line-through">
                                                    {formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(product.pricing.list2) : product.pricing.list2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer - Acciones de pedido */}
                        {!viewOnly && (
                            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] space-y-4">
                                <div className={`flex ${(!isClient || discount > 0) ? 'flex-row gap-6' : 'flex-col'}`}>
                                    {/* Quantity Selector */}
                                    <div className={`${(!isClient || discount > 0) ? 'flex-1 pr-2' : 'max-w-xs mx-auto w-full'}`}>
                                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                                            Cantidad {sellOnlyFullPackages && unitsPerPackage > 1 && `(x${unitsPerPackage})`}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = Math.max(effectiveMinQuantity, quantity - quantityStep);
                                                    setQuantity(newQty);
                                                    setQuantityError(null);
                                                }}
                                                disabled={quantity <= effectiveMinQuantity}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                                    if (val >= effectiveMinQuantity) {
                                                        if (sellOnlyFullPackages && unitsPerPackage > 1) {
                                                            const rounded = Math.round(val / unitsPerPackage) * unitsPerPackage;
                                                            setQuantity(rounded);
                                                        } else {
                                                            setQuantity(val);
                                                        }
                                                        setQuantityError(null);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    let finalQty = quantity;
                                                    if (sellOnlyFullPackages && unitsPerPackage > 1) {
                                                        finalQty = Math.round(quantity / unitsPerPackage) * unitsPerPackage;
                                                        if (finalQty < unitsPerPackage) finalQty = unitsPerPackage;
                                                    }
                                                    finalQty = Math.max(effectiveMinQuantity, finalQty);
                                                    setQuantity(finalQty);
                                                    setQuantityError(null);
                                                }}
                                                className="flex-1 h-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-center font-semibold text-[15px] text-[var(--text-primary)] outline-none focus:border-primary-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQuantity(quantity + quantityStep);
                                                    setQuantityError(null);
                                                }}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-300 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        {quantityError && (
                                            <p className="text-[10px] text-danger-500 mt-1 flex items-center gap-1">
                                                <AlertCircle size={10} /> {quantityError}
                                            </p>
                                        )}
                                        {(minOrderQuantity > 1 || (sellOnlyFullPackages && unitsPerPackage > 1)) && !quantityError && (
                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                                {sellOnlyFullPackages && unitsPerPackage > 1 
                                                    ? `Múltiplos de ${unitsPerPackage} unidades` 
                                                    : `Mínimo: ${minOrderQuantity} unidades`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Discount Input */}
                                    {(!isClient || discount > 0) && (
                                        <div className="min-w-0 flex-1 pl-2">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Descuento</label>
                                            <div className="flex items-center justify-center h-10 bg-success-50 dark:bg-success-900/30 border border-success-100 dark:border-success-800 rounded-lg px-3">
                                                <Percent size={14} className="text-success-600 mr-2 flex-shrink-0" />
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                    disabled={isClient}
                                                    className="w-full min-w-0 bg-transparent text-center font-semibold text-[15px] text-success-700 dark:text-success-400 outline-none disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                    )}
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
                        )}
                    </motion.div>
                    
                    {/* Lightbox Modal */}
                    <ImageLightbox
                        images={orderedImages}
                        currentIndex={lightboxIndex}
                        isOpen={lightboxOpen}
                        onClose={closeLightbox}
                        onNext={nextLightboxImage}
                        onPrev={prevLightboxImage}
                        onSwipe={handleLightboxSwipe}
                    />
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// Componente Lightbox separado
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

                    {/* Imagen con swipe */}
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

                        {/* Flechas de navegación */}
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

                    {/* Miniaturas abajo */}
                    {images.length > 1 && (
                        <div className="px-4 py-4 flex gap-2 justify-center overflow-x-auto">
                            {images.map((img, idx) => (
                                <button
                                    key={img.publicId || idx}
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
