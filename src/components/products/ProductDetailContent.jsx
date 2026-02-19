import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Barcode,
    Layers,
    Building2,
    Ruler,
    Tag,
    Percent,
    DollarSign,
    Box,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    Grid3X3,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    Star
} from 'lucide-react';

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-(--border-color) last:border-0">
        {Icon && (
            <div className="w-7 h-7 rounded-lg bg-(--bg-hover) flex items-center justify-center shrink-0">
                <Icon size={14} className="text-(--text-muted)" />
            </div>
        )}
        <div className="flex-1">
            <p className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">{label}</p>
            <p className="text-[12px] font-semibold text-(--text-primary) mt-0.5">{value || '-'}</p>
        </div>
    </div>
);

// Componente completo de precios como en el drawer
const PricingDisplay = ({ pricing, label, inputPricesWithTax, taxRate, isList2 = false }) => {
    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR')}`;
    };

    const applyTax = (price) => {
        if (!price || price <= 0) return 0;
        return price * (1 + taxRate / 100);
    };

    const price = pricing?.price || 0;
    const offer = pricing?.offer || 0;
    const discount = pricing?.discount || 0;
    
    const baseForDiscount = offer > 0 ? offer : price;
    const finalWithoutTax = baseForDiscount * (1 - discount / 100);
    
    const displayPrice = inputPricesWithTax ? applyTax(price) : price;
    const displayOffer = inputPricesWithTax && offer > 0 ? applyTax(offer) : offer;
    const displayFinal = inputPricesWithTax ? applyTax(finalWithoutTax) : finalWithoutTax;
    
    const hasOffer = offer > 0;
    const hasDiscount = discount > 0;

    if (!price && !isList2) return null;
    if (isList2 && !price) return null;

    return (
        <div className="mb-4">
            <h4 className="text-[11px] font-bold text-primary-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                {label}
                {inputPricesWithTax && <span className="text-[9px] normal-case text-amber-600">(con IVA)</span>}
                {!inputPricesWithTax && taxRate > 0 && <span className="text-[9px] normal-case text-(--text-muted)">(sin IVA)</span>}
            </h4>
            
            <div className="bg-(--bg-card) rounded-xl border border-(--border-color) p-3 space-y-3">
                {/* Precio Base */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <p className="text-[10px] text-(--text-muted) mb-1">Precio {inputPricesWithTax ? '(con IVA)' : '(sin IVA)'}</p>
                        <p className="text-[14px] font-semibold text-(--text-primary)">{formatPrice(displayPrice)}</p>
                        {inputPricesWithTax && taxRate > 0 && (
                            <p className="text-[9px] text-(--text-muted)">Sin IVA: {formatPrice(price)}</p>
                        )}
                    </div>
                    
                    <div>
                        <p className="text-[10px] text-(--text-muted) mb-1">Descuento</p>
                        <p className="text-[14px] font-semibold text-(--text-primary)">{discount > 0 ? `${discount}%` : '-'}</p>
                    </div>
                    
                    <div>
                        <p className="text-[10px] text-(--text-muted) mb-1">Oferta</p>
                        {hasOffer ? (
                            <p className="text-[14px] font-semibold text-warning-600">{formatPrice(displayOffer)}</p>
                        ) : (
                            <p className="text-[14px] font-semibold text-(--text-muted)">-</p>
                        )}
                    </div>
                </div>
                
                {/* Preview del precio final */}
                {price > 0 && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 border border-primary-100 dark:border-primary-800">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-(--text-muted)">Precio final:</span>
                            <span className="font-bold text-primary-700 dark:text-primary-400">{formatPrice(displayFinal)}</span>
                            {hasOffer && (
                                <span className="text-warning-600 ml-2">Oferta: {formatPrice(displayOffer)} {hasDiscount ? `(-${discount}%)` : ''}</span>
                            )}
                            {!hasOffer && hasDiscount && (
                                <span className="text-success-600 ml-2">(-{discount}%)</span>
                            )}
                        </div>
                        {!inputPricesWithTax && taxRate > 0 && (
                            <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-primary-100 dark:border-primary-800">
                                <span className="text-(--text-muted)">Final + IVA ({taxRate}%):</span>
                                <span className="font-bold text-primary-700 dark:text-primary-400">{formatPrice(applyTax(finalWithoutTax))}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StockRow = ({ label, value, type = 'normal' }) => {
    const getColor = () => {
        if (type === 'reserved') return 'text-warning-600';
        if (type === 'quoted') return 'text-info-600';
        if (type === 'available') return 'text-success-600';
        return 'text-(--text-primary)';
    };
    
    return (
        <div className="flex justify-between items-center py-2">
            <span className="text-[11px] text-(--text-muted)">{label}</span>
            <span className={`text-[13px] font-bold ${getColor()}`}>{value}</span>
        </div>
    );
};

// Componente para mostrar precios de variantes individuales completos
const VariantPricingCard = ({ variant, index, inputPricesWithTax, taxRate, hasPriceListsFeature, hasStockFeature }) => {
    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR')}`;
    };

    const applyTax = (price) => {
        if (!price || price <= 0) return 0;
        return price * (1 + taxRate / 100);
    };

    const calculateFinal = (pricing) => {
        const price = pricing?.price || 0;
        const offer = pricing?.offer || 0;
        const discount = pricing?.discount || 0;
        const baseForDiscount = offer > 0 ? offer : price;
        return baseForDiscount * (1 - discount / 100);
    };

    const l1 = variant.pricing?.list1 || {};
    const l2 = variant.pricing?.list2 || {};
    
    const l1Price = l1.price || 0;
    const l1Offer = l1.offer || 0;
    const l1Discount = l1.discount || 0;
    const l1FinalWithoutTax = calculateFinal(l1);
    
    const l1DisplayPrice = inputPricesWithTax ? applyTax(l1Price) : l1Price;
    const l1DisplayOffer = inputPricesWithTax && l1Offer > 0 ? applyTax(l1Offer) : l1Offer;
    const l1DisplayFinal = inputPricesWithTax ? applyTax(l1FinalWithoutTax) : l1FinalWithoutTax;
    
    const hasL2 = hasPriceListsFeature && l2.price > 0;
    const l2FinalWithoutTax = hasL2 ? calculateFinal(l2) : 0;
    const l2DisplayFinal = inputPricesWithTax && hasL2 ? applyTax(l2FinalWithoutTax) : l2FinalWithoutTax;
    
    // Stock de la variante
    const variantStock = variant.stock || 0;
    const variantReserved = variant.stockReserved || 0;
    const variantQuoted = variant.stockQuoted || 0;
    const variantAvailable = Math.max(0, variantStock - variantReserved - variantQuoted);
    const variantMinStock = variant.minStock || 0;
    const isVariantLowStock = variantMinStock > 0 && variantAvailable <= variantMinStock && variantAvailable > 0;
    const isVariantOutOfStock = variantAvailable === 0;

    return (
        <div className={`p-4 rounded-xl border ${variant.active !== false ? 'bg-(--bg-card) border-(--border-color)' : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-(--border-color)">
                <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                </span>
                <div className="flex-1">
                    <span className="text-[13px] font-semibold text-(--text-primary)">
                        {variant.value1}
                        {variant.value2 && ` / ${variant.value2}`}
                    </span>
                    {variant.sku && (
                        <p className="text-[10px] text-(--text-muted) font-mono">SKU: {variant.sku}</p>
                    )}
                </div>
                {variant.active === false && (
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-[10px] font-medium">
                        Inactivo
                    </span>
                )}
            </div>
            
            {/* Stock Info (si está habilitado) */}
            {hasStockFeature && (
                <div className="mb-3 p-2 bg-(--bg-hover) rounded-lg">
                    <div className="grid grid-cols-5 gap-2 text-center">
                        <div>
                            <p className="text-[8px] text-(--text-muted) uppercase">Disp.</p>
                            <p className={`text-sm font-bold ${isVariantOutOfStock ? 'text-danger-600' : isVariantLowStock ? 'text-warning-600' : 'text-success-600'}`}>
                                {variantAvailable}
                            </p>
                        </div>
                        <div>
                            <p className="text-[8px] text-(--text-muted) uppercase">Físico</p>
                            <p className="text-sm font-semibold text-(--text-primary)">{variantStock}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-(--text-muted) uppercase">Res.</p>
                            <p className="text-sm font-semibold text-warning-600">{variantReserved}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-(--text-muted) uppercase">Pres.</p>
                            <p className="text-sm font-semibold text-info-600">{variantQuoted}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-(--text-muted) uppercase">Mín.</p>
                            <p className="text-sm font-medium text-(--text-muted)">{variantMinStock || '-'}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Lista 1 */}
            <div className="mb-3">
                <p className="text-[10px] font-bold text-(--text-muted) uppercase mb-2">Lista 1</p>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                        <span className="text-(--text-muted)">Precio:</span>
                        <p className="font-semibold">{formatPrice(l1DisplayPrice)}</p>
                    </div>
                    <div>
                        <span className="text-(--text-muted)">Dto:</span>
                        <p className="font-semibold">{l1Discount > 0 ? `${l1Discount}%` : '-'}</p>
                    </div>
                    <div>
                        <span className="text-(--text-muted)">Oferta:</span>
                        <p className={`font-semibold ${l1Offer > 0 ? 'text-warning-600' : ''}`}>{l1Offer > 0 ? formatPrice(l1DisplayOffer) : '-'}</p>
                    </div>
                </div>
                <div className="mt-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-(--text-muted)">Precio final:</span>
                        <span className="text-[13px] font-bold text-primary-700 dark:text-primary-400">{formatPrice(l1DisplayFinal)}</span>
                    </div>
                    {!inputPricesWithTax && taxRate > 0 && (
                        <div className="flex justify-between items-center mt-1 pt-1 border-t border-primary-100 dark:border-primary-800">
                            <span className="text-[10px] text-(--text-muted)">+ IVA ({taxRate}%):</span>
                            <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-400">{formatPrice(applyTax(l1FinalWithoutTax))}</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Lista 2 */}
            {hasL2 && (
                <div className="pt-3 border-t border-(--border-color)">
                    <p className="text-[10px] font-bold text-primary-600 uppercase mb-2">Lista 2</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                            <span className="text-(--text-muted)">Precio final:</span>
                            <p className="font-semibold text-primary-600">{formatPrice(l2DisplayFinal)}</p>
                        </div>
                        {!inputPricesWithTax && taxRate > 0 && (
                            <div>
                                <span className="text-(--text-muted)">+ IVA:</span>
                                <p className="font-semibold text-primary-600">{formatPrice(applyTax(l2FinalWithoutTax))}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Lightbox con AnimatePresence y drag (versión suave)
const ImageLightbox = ({ images, currentIndex, isOpen, onClose, onNext, onPrev }) => {
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
                                src={images[currentIndex]?.url}
                                alt=""
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.2 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, info) => {
                                    if (info.offset.x > 100) onPrev();
                                    else if (info.offset.x < -100) onNext();
                                }}
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
                                        if (idx < currentIndex) {
                                            for (let i = currentIndex; i > idx; i--) onPrev();
                                        } else if (idx > currentIndex) {
                                            for (let i = currentIndex; i < idx; i++) onNext();
                                        }
                                    }}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                        idx === currentIndex 
                                            ? 'border-white opacity-100' 
                                            : 'border-transparent opacity-50 hover:opacity-80'
                                    }`}
                                >
                                    <img src={img?.url} alt="" className="w-full h-full object-cover" />
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

const ProductDetailContent = ({ product, showPricesWithTax = false, features = {}, inputPricesWithTax = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(product?.coverImageIndex || 0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    
    if (!product) return null;

    const hasStockFeature = features.stock === true;
    const hasPriceListsFeature = features.priceLists === true;
    const hasTax = (product.pricing?.tax || 0) > 0;
    const taxRate = product.pricing?.tax || 0;
    const hasVariants = product.hasVariants && product.variants?.length > 0;
    const hasUniformVariantPricing = product.hasUniformVariantPricing !== false;

    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR')}`;
    };

    const applyTax = (price) => {
        if (!price || price <= 0) return 0;
        return price * (1 + taxRate / 100);
    };

    // Stock total para productos con variantes
    const getTotalStock = () => {
        if (!hasVariants) {
            return {
                stock: product.stock || 0,
                stockReserved: product.stockReserved || 0,
                stockQuoted: product.stockQuoted || 0,
                available: Math.max(0, (product.stock || 0) - (product.stockReserved || 0))
            };
        }
        return product.variants.reduce((totals, variant) => {
            if (variant.active !== false) {
                totals.stock += variant.stock || 0;
                totals.stockReserved += variant.stockReserved || 0;
                totals.stockQuoted += variant.stockQuoted || 0;
            }
            return totals;
        }, { stock: 0, stockReserved: 0, stockQuoted: 0, available: 0 });
    };
    
    const stockInfo = getTotalStock();
    
    // Calcular available después de reduce para variantes
    if (hasVariants) {
        stockInfo.available = Math.max(0, stockInfo.stock - stockInfo.stockReserved);
    }
    
    const minStock = product.minStock || 0;
    const isLowStock = minStock > 0 && stockInfo.available <= minStock && stockInfo.available > 0;
    const isOutOfStock = stockInfo.available === 0;

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
    const coverImage = hasImages ? orderedImages[0]?.url : null;

    const closeLightbox = () => setLightboxOpen(false);

    const nextLightboxImage = () => {
        setCurrentImageIndex((prev) => (prev === orderedImages.length - 1 ? 0 : prev + 1));
    };

    const prevLightboxImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? orderedImages.length - 1 : prev - 1));
    };

    return (
        <div className="space-y-4">
            {/* Lightbox con swipe suave */}
            <ImageLightbox
                images={orderedImages}
                currentIndex={currentImageIndex}
                isOpen={lightboxOpen}
                onClose={closeLightbox}
                onNext={nextLightboxImage}
                onPrev={prevLightboxImage}
            />

            {/* Header con info básica */}
            <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                <div className="flex items-start gap-4">
                    {/* Imagen miniatura */}
                    <div 
                        className="relative w-20 h-20 rounded-xl bg-(--bg-hover) flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                        onClick={() => {
                            if (hasImages) {
                                setCurrentImageIndex(0);
                                setLightboxOpen(true);
                            }
                        }}
                    >
                        {coverImage ? (
                            <>
                                <img src={coverImage} alt={product.name} className="w-full h-full object-cover" />
                                {hasImages && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Eye size={20} className="text-white" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <Package size={32} className="text-(--text-muted)" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[15px] font-bold text-(--text-primary) leading-tight">
                            {product.name}
                        </h2>
                        <p className="text-[11px] text-(--text-muted) mt-1">
                            Código: {product.code || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {product.active !== false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-success-50 dark:bg-success-900/30 text-success-600 border-success-100 dark:border-success-800">
                                    <CheckCircle size={10} />
                                    Activo
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-danger-50 dark:bg-danger-900/30 text-danger-600 border-danger-100 dark:border-danger-800">
                                    <XCircle size={10} />
                                    Inactivo
                                </span>
                            )}
                            {hasVariants && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-primary-50 dark:bg-primary-900/30 text-primary-600 border-primary-100 dark:border-primary-800">
                                    <Grid3X3 size={10} />
                                    {product.variants.filter(v => v.active !== false).length} variantes
                                </span>
                            )}
                            {hasTax && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-amber-50 dark:bg-amber-900/30 text-amber-600 border-amber-100 dark:border-amber-800">
                                    IVA {taxRate}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-4">
                        {/* Precios - Solo cuando NO tiene variantes con precios individuales */}
                        {(!hasVariants || hasUniformVariantPricing) && (
                            <div>
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Precios
                                    {inputPricesWithTax && <span className="text-[9px] normal-case ml-2 text-amber-600">(con IVA)</span>}
                                    {!inputPricesWithTax && hasTax && <span className="text-[9px] normal-case ml-2 text-(--text-muted)">(sin IVA)</span>}
                                </h3>
                                
                                {/* Lista 1 */}
                                <PricingDisplay 
                                    pricing={product.pricing?.list1}
                                    label="Lista 1 (Principal)"
                                    inputPricesWithTax={inputPricesWithTax}
                                    taxRate={taxRate}
                                />

                                {/* Lista 2 */}
                                {hasPriceListsFeature && product.pricing?.list2?.price > 0 && (
                                    <PricingDisplay 
                                        pricing={product.pricing?.list2}
                                        label="Lista 2 (Alternativa)"
                                        inputPricesWithTax={inputPricesWithTax}
                                        taxRate={taxRate}
                                        isList2={true}
                                    />
                                )}

                                {/* Mensaje de precio uniforme */}
                                {hasVariants && hasUniformVariantPricing && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                            <strong>Precio uniforme:</strong> Todas las variantes usan los mismos precios configurados arriba.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Variantes con precios individuales - Solo cuando NO es precio uniforme */}
                        {hasVariants && !hasUniformVariantPricing && (
                            <div>
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Precios
                                    {inputPricesWithTax && <span className="text-[9px] normal-case ml-2 text-amber-600">(con IVA)</span>}
                                    {!inputPricesWithTax && hasTax && <span className="text-[9px] normal-case ml-2 text-(--text-muted)">(sin IVA)</span>}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {product.variants.map((variant, idx) => (
                                        <VariantPricingCard 
                                            key={variant.id}
                                            variant={variant}
                                            index={idx}
                                            inputPricesWithTax={inputPricesWithTax}
                                            taxRate={taxRate}
                                            hasPriceListsFeature={hasPriceListsFeature}
                                            hasStockFeature={false}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Información General */}
                        <div className="pt-4 border-t border-(--border-color)">
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información General
                            </h3>
                            <div className="space-y-1">
                                <InfoRow label="Nombre" value={product.name} icon={Package} />
                                <InfoRow label="Código" value={product.code} icon={Tag} />
                                <InfoRow label="Barcode" value={product.barcode} icon={Barcode} />
                                <InfoRow label="Marca" value={product.brand} icon={Building2} />
                                <InfoRow label="Categoría" value={product.category} icon={Layers} />
                                <InfoRow label="Subcategoría" value={product.subcategory} icon={Layers} />
                                <InfoRow label="Unidad de Medida" value={product.unit} icon={Ruler} />
                                {hasVariants && (
                                    <InfoRow 
                                        label="Tipo de Variantes" 
                                        value={hasUniformVariantPricing ? 'Precio uniforme para todas' : 'Precios individuales por variante'} 
                                        icon={Grid3X3} 
                                    />
                                )}
                                <InfoRow 
                                    label="Fecha de Creación" 
                                    value={new Date(product.createdAt).toLocaleDateString('es-AR', { 
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                    })} 
                                    icon={Calendar} 
                                />
                            </div>
                        </div>

                        {/* Descripción */}
                        {product.description && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Descripción
                                </h3>
                                <p className="text-[12px] text-(--text-secondary) bg-(--bg-hover) p-3 rounded-xl">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Descripción Larga */}
                        {product.longDescription && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Descripción Detallada
                                </h3>
                                <p className="text-[12px] text-(--text-secondary) bg-(--bg-hover) p-3 rounded-xl whitespace-pre-wrap">
                                    {product.longDescription}
                                </p>
                            </div>
                        )}

                        {/* Tabla de variantes con precio uniforme */}
                        {hasVariants && hasUniformVariantPricing && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Variantes
                                </h3>
                                <div className="bg-(--bg-hover) rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-[10px] text-(--text-muted) uppercase bg-(--bg-card)">
                                                <th className="text-left py-2 px-3">{product.variantConfig?.label1 || 'Variable 1'}</th>
                                                {product.variantConfig?.label2 && (
                                                    <th className="text-left py-2 px-3">{product.variantConfig.label2}</th>
                                                )}
                                                <th className="text-left py-2 px-3">SKU</th>
                                                <th className="text-center py-2 px-3">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-(--border-color)">
                                            {product.variants.map((variant) => (
                                                <tr key={variant.id} className={variant.active === false ? 'opacity-50' : ''}>
                                                    <td className="py-2 px-3">{variant.value1}</td>
                                                    {product.variantConfig?.label2 && (
                                                        <td className="py-2 px-3">{variant.value2}</td>
                                                    )}
                                                    <td className="py-2 px-3 font-mono text-[10px]">{variant.sku}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        {variant.active !== false ? (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-success-100 text-success-600">
                                                                <CheckCircle size={8} /> Activo
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-gray-100 text-gray-600">
                                                                <XCircle size={8} /> Inactivo
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-4">
                        {/* Stock Total */}
                        {hasStockFeature && (
                            <div>
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Stock Total {hasVariants && '(Suma de variantes activas)'}
                                </h3>
                                <div className={`bg-(--bg-hover) rounded-xl p-4 ${isLowStock ? 'border border-warning-200 dark:border-warning-800' : ''} ${isOutOfStock ? 'border border-danger-200 dark:border-danger-800' : ''}`}>
                                    {isLowStock && (
                                        <div className="flex items-center gap-1 mb-2 text-warning-600">
                                            <AlertCircle size={12} />
                                            <span className="text-[10px] font-bold uppercase">Stock Bajo</span>
                                        </div>
                                    )}
                                    {isOutOfStock && (
                                        <div className="flex items-center gap-1 mb-2 text-danger-600">
                                            <XCircle size={12} />
                                            <span className="text-[10px] font-bold uppercase">Sin Stock</span>
                                        </div>
                                    )}
                                    
                                    {/* Grid de stock */}
                                    <div className="grid grid-cols-4 gap-3 mb-3">
                                        <div className="text-center p-2 bg-(--bg-card) rounded-lg">
                                            <p className="text-[9px] text-(--text-muted) mb-1">Disponible</p>
                                            <p className={`text-lg font-bold ${isOutOfStock ? 'text-danger-600' : isLowStock ? 'text-warning-600' : 'text-success-600'}`}>
                                                {stockInfo.available}
                                            </p>
                                        </div>
                                        <div className="text-center p-2 bg-(--bg-card) rounded-lg">
                                            <p className="text-[9px] text-(--text-muted) mb-1">Físico</p>
                                            <p className="text-base font-semibold text-(--text-primary)">{stockInfo.stock}</p>
                                        </div>
                                        <div className="text-center p-2 bg-(--bg-card) rounded-lg">
                                            <p className="text-[9px] text-(--text-muted) mb-1">Reservado</p>
                                            <p className="text-base font-semibold text-warning-600">{stockInfo.stockReserved}</p>
                                        </div>
                                        <div className="text-center p-2 bg-(--bg-card) rounded-lg">
                                            <p className="text-[9px] text-(--text-muted) mb-1">Presup.</p>
                                            <p className="text-base font-semibold text-info-600">{stockInfo.stockQuoted}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-(--border-color) pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-(--text-muted)">Stock Mínimo</span>
                                            <span className="text-[11px] font-medium">{minStock || 'No definido'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stock por Variante */}
                        {hasStockFeature && hasVariants && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Stock por Variante
                                </h3>
                                <div className="bg-(--bg-hover) rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-[10px] text-(--text-muted) uppercase bg-(--bg-card)">
                                                <th className="text-left py-2 px-3">{product.variantConfig?.label1 || 'Variable'}</th>
                                                {product.variantConfig?.label2 && (
                                                    <th className="text-left py-2 px-3">{product.variantConfig.label2}</th>
                                                )}
                                                <th className="text-right py-2 px-2 text-[9px]">Disp.</th>
                                                <th className="text-right py-2 px-2 text-[9px]">Físico</th>
                                                <th className="text-right py-2 px-2 text-[9px]">Res.</th>
                                                <th className="text-right py-2 px-2 text-[9px]">Pres.</th>
                                                <th className="text-right py-2 px-2 text-[9px]">Mín.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-(--border-color)">
                                            {product.variants.filter(v => v.active !== false).map((variant) => {
                                                const variantAvailable = Math.max(0, (variant.stock || 0) - (variant.stockReserved || 0));
                                                const isVariantLowStock = variant.minStock > 0 && variantAvailable <= variant.minStock && variantAvailable > 0;
                                                const isVariantOutOfStock = variantAvailable === 0;
                                                
                                                return (
                                                    <tr key={variant.id}>
                                                        <td className="py-2 px-3">
                                                            <div className="flex items-center gap-1">
                                                                {variant.value1}
                                                                {isVariantOutOfStock && <XCircle size={10} className="text-danger-500" />}
                                                                {isVariantLowStock && <AlertCircle size={10} className="text-warning-500" />}
                                                            </div>
                                                        </td>
                                                        {product.variantConfig?.label2 && (
                                                            <td className="py-2 px-3">{variant.value2}</td>
                                                        )}
                                                        <td className="py-2 px-2 text-right">
                                                            <span className={isVariantOutOfStock ? 'text-danger-600 font-semibold' : isVariantLowStock ? 'text-warning-600 font-semibold' : 'text-success-600'}>
                                                                {variantAvailable}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-2 text-right text-(--text-muted)">
                                                            {variant.stock || 0}
                                                        </td>
                                                        <td className="py-2 px-2 text-right text-warning-600">
                                                            {variant.stockReserved || 0}
                                                        </td>
                                                        <td className="py-2 px-2 text-right text-info-600">
                                                            {variant.stockQuoted || 0}
                                                        </td>
                                                        <td className="py-2 px-2 text-right text-(--text-muted)">
                                                            {variant.minStock || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Configuración de Pedidos */}
                        <div className={hasStockFeature ? 'pt-4 border-t border-(--border-color)' : ''}>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Configuración de Pedidos
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
                                    label="Unidades por Bulto" 
                                    value={product.unitsPerPackage > 1 ? `${product.unitsPerPackage} unidades` : 'No especificado'} 
                                    icon={Box} 
                                />
                                <InfoRow 
                                    label="Cantidad Mínima de Pedido" 
                                    value={product.minOrderQuantity > 1 ? `${product.minOrderQuantity} unidades` : 'No especificado'} 
                                    icon={Box} 
                                />
                                <InfoRow 
                                    label="Venta por Bultos" 
                                    value={product.sellOnlyFullPackages ? 'Solo bultos completos' : 'Unidades sueltas permitidas'} 
                                    icon={Box} 
                                />
                            </div>
                        </div>

                        {/* Información del Sistema */}
                        <div className="pt-4 border-t border-(--border-color)">
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Información del Sistema
                            </h3>
                            <div className="space-y-1">
                                <InfoRow 
                                    label="Creado por" 
                                    value={`${product.createdBy?.firstName} ${product.createdBy?.lastName}`} 
                                    icon={User} 
                                />
                                <InfoRow 
                                    label="Última actualización" 
                                    value={new Date(product.updatedAt).toLocaleString('es-AR')} 
                                    icon={Clock} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailContent;
