import React from 'react';
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
    User
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

const PriceRow = ({ label, value, isOffer = false, isDiscounted = false }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-[11px] text-(--text-muted)">{label}</span>
        <span className={`text-[13px] font-semibold ${isOffer ? 'text-warning-600' : isDiscounted ? 'text-success-600' : 'text-(--text-primary)'}`}>
            {value}
        </span>
    </div>
);

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

const ProductDetailContent = ({ product, showPricesWithTax = false, features = {} }) => {
    if (!product) return null;

    const hasStockFeature = features.stock === true;
    const hasPriceListsFeature = features.priceLists === true;
    const hasTax = (product.pricing?.tax || 0) > 0;
    const taxRate = product.pricing?.tax || 0;

    // Calcular precios
    const getPriceWithTax = (price) => {
        if (!price) return 0;
        return price * (1 + taxRate / 100);
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR')}`;
    };

    const regularPrice = product.pricing?.list1 || 0;
    const offerPrice = product.pricing?.offer || 0;
    const hasOffer = offerPrice > 0;
    const discountPercent = product.pricing?.discount || 0;
    const hasDiscount = discountPercent > 0 && !hasOffer;
    const discountedPrice = hasDiscount ? regularPrice * (1 - discountPercent / 100) : regularPrice;
    const finalPrice = hasOffer ? offerPrice : discountedPrice;

    // Stock
    const stock = product.stock || 0;
    const stockReserved = product.stockReserved || 0;
    const stockQuoted = product.stockQuoted || 0;
    const stockAvailable = Math.max(0, stock - stockReserved);
    const minStock = product.minStock || 0;
    const isLowStock = minStock > 0 && stockAvailable <= minStock && stockAvailable > 0;
    const isOutOfStock = stockAvailable === 0;

    // Imágenes
    const hasImages = product.images && product.images.length > 0;
    const coverImage = hasImages 
        ? product.images[product.coverImageIndex || 0]?.url 
        : null;

    return (
        <div className="space-y-4">
            {/* Header con imagen y nombre */}
            <div className="bg-(--bg-card) p-4 border-b border-(--border-color)">
                <div className="flex items-start gap-4">
                    {/* Imagen */}
                    <div className="w-20 h-20 rounded-xl bg-(--bg-hover) flex items-center justify-center shrink-0 overflow-hidden">
                        {coverImage ? (
                            <img src={coverImage} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={32} className="text-(--text-muted)" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[15px] font-bold text-(--text-primary) leading-tight truncate">
                            {product.name}
                        </h2>
                        <p className="text-[11px] text-(--text-muted) mt-1">
                            Código: {product.code || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
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
                            {hasOffer && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-warning-50 dark:bg-warning-900/30 text-warning-600 border-warning-100 dark:border-warning-800">
                                    Oferta
                                </span>
                            )}
                            {hasDiscount && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-success-50 dark:bg-success-900/30 text-success-600 border-success-100 dark:border-success-800">
                                    -{discountPercent}%
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
                        {/* Información General */}
                        <div>
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
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-4">
                        {/* Precios */}
                        <div>
                            <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                Precios
                            </h3>
                            <div className="bg-(--bg-hover) rounded-xl p-4 space-y-4">
                                {/* Lista 1 */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-2">Lista 1</h4>
                                    <div className="space-y-1">
                                        <PriceRow 
                                            label="Precio Base" 
                                            value={formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(regularPrice) : regularPrice)} 
                                        />
                                        {hasDiscount && (
                                            <>
                                                <PriceRow 
                                                    label={`Descuento (${discountPercent}%)`}
                                                    value={`-${formatPrice(regularPrice - discountedPrice)}`}
                                                    isDiscounted={true}
                                                />
                                                <PriceRow 
                                                    label="Precio Final" 
                                                    value={formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(discountedPrice) : discountedPrice)}
                                                    isOffer={true}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Lista 2 */}
                                {hasPriceListsFeature && product.pricing?.list2 > 0 && (
                                    <>
                                        <div className="border-t border-(--border-color)"></div>
                                        <div>
                                            <h4 className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-2">Lista 2</h4>
                                            <div className="space-y-1">
                                                <PriceRow 
                                                    label="Precio Base" 
                                                    value={formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(product.pricing.list2) : product.pricing.list2)} 
                                                />
                                                {hasDiscount && (
                                                    <>
                                                        <PriceRow 
                                                            label={`Descuento (${discountPercent}%)`}
                                                            value={`-${formatPrice(product.pricing.list2 - (product.pricing.list2 * (1 - discountPercent / 100)))}`}
                                                            isDiscounted={true}
                                                        />
                                                        <PriceRow 
                                                            label="Precio Final" 
                                                            value={formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(product.pricing.list2 * (1 - discountPercent / 100)) : product.pricing.list2 * (1 - discountPercent / 100))}
                                                            isOffer={true}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Precio de Oferta (solo si existe y reemplaza ambas listas) */}
                                {hasOffer && (
                                    <>
                                        <div className="border-t border-(--border-color)"></div>
                                        <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-3">
                                            <h4 className="text-[10px] font-bold text-warning-600 uppercase tracking-wider mb-2">Precio de Oferta</h4>
                                            <PriceRow 
                                                label="Precio Oferta" 
                                                value={formatPrice(showPricesWithTax && hasTax ? getPriceWithTax(offerPrice) : offerPrice)}
                                                isOffer={true}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* IVA */}
                                <div className="border-t border-(--border-color) pt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-medium text-(--text-muted) uppercase tracking-wider">IVA</span>
                                        <span className="text-[11px] font-medium">{hasTax ? `${taxRate}%` : 'No aplica'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuración de Pedidos */}
                        <div className="pt-4 border-t border-(--border-color)">
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

                        {/* Stock */}
                        {hasStockFeature && (
                            <div className="pt-4 border-t border-(--border-color)">
                                <h3 className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider mb-3">
                                    Stock
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
                                    <StockRow label="Disponible" value={stockAvailable} type="available" />
                                    <StockRow label="Stock Físico" value={stock} />
                                    <StockRow label="Reservado" value={stockReserved} type="reserved" />
                                    <StockRow label="Presupuestado" value={stockQuoted} type="quoted" />
                                    <div className="border-t border-(--border-color) my-2"></div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[10px] text-(--text-muted)">Stock Mínimo</span>
                                        <span className="text-[11px] font-medium">{minStock || 'No definido'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

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
