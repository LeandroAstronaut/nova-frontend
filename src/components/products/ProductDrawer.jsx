import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Package,
    Barcode,
    Tag,
    Building2,
    Layers,
    Ruler,
    FileText,
    Save,
    DollarSign,
    Percent,
    Boxes,
    Image as ImageIcon,
    AlertCircle,
    ChevronDown,
    Upload,
    Trash2,
    Star,
    GripVertical,
    Loader2,
    Plus
} from 'lucide-react';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import { 
    createProduct, 
    updateProduct, 
    checkCodeExists, 
    checkBarcodeExists,
    getCategories,
    getSubcategories,
    getBrands,
    uploadProductImage,
    deleteProductImage,
    setCoverImage
} from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// Autocomplete Input Component
const AutocompleteInput = ({ 
    label, 
    icon: Icon, 
    value, 
    onChange, 
    suggestions = [], 
    placeholder, 
    error,
    disabled = false
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    
    useEffect(() => {
        if (value && suggestions.length > 0) {
            const filtered = suggestions.filter(s => 
                s.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSuggestions(filtered.slice(0, 5));
        } else {
            setFilteredSuggestions(suggestions.slice(0, 5));
        }
    }, [value, suggestions]);

    const handleSelect = (suggestion) => {
        onChange(suggestion);
        setShowSuggestions(false);
    };

    return (
        <div className="relative">
            <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {Icon && <Icon size={12} />} {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    disabled={disabled}
                    className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors ${
                        error ? 'border-danger-500' : 'border-[var(--border-color)]'
                    }`}
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {filteredSuggestions.length > 0 && showSuggestions && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSelect(suggestion)}
                                className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] first:rounded-t-lg last:rounded-b-lg"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
                {suggestions.length > 0 && (
                    <ChevronDown 
                        size={16} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" 
                    />
                )}
            </div>
            {error && <p className="text-danger-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

// Confirm Close Modal Component
const ConfirmCloseModal = ({ isOpen, onClose, onConfirm, hasChanges }) => {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={hasChanges ? '¿Descartar cambios?' : '¿Cerrar formulario?'}
            description={
                hasChanges 
                    ? 'Ha realizado cambios en el producto. Si cierra ahora, perderá toda la información ingresada.' 
                    : '¿Está seguro que desea cerrar el formulario?'
            }
            confirmText={hasChanges ? 'Descartar cambios' : 'Cerrar'}
            cancelText={hasChanges ? 'Continuar editando' : 'Cancelar'}
            type={hasChanges ? 'warning' : 'info'}
        />
    );
};

// Componente para el formulario de precios (reutilizable)
const ProductPricingForm = ({ pricing, onPricingChange, onTaxChange, hasPriceListsFeature, errors = {}, inputPricesWithTax = false }) => {
    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        return `$${Number(price).toLocaleString('es-AR')}`;
    };

    // Calcular precio sin IVA a partir del precio con IVA
    const calculatePriceWithoutTax = (priceWithTax, taxRate) => {
        if (!priceWithTax || priceWithTax <= 0) return 0;
        const tax = parseFloat(taxRate) || 0;
        return priceWithTax / (1 + tax / 100);
    };

    return (
        <div className="space-y-4">
            {/* Indicador de modo de carga */}
            <div className={`p-3 rounded-lg border ${inputPricesWithTax ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'}`}>
                <div className="flex items-center gap-2">
                    <DollarSign size={16} className={inputPricesWithTax ? 'text-amber-600' : 'text-success-600'} />
                    <span className={`text-xs font-semibold ${inputPricesWithTax ? 'text-amber-700 dark:text-amber-300' : 'text-success-700 dark:text-success-300'}`}>
                        {inputPricesWithTax 
                            ? `Estás cargando precios CON IVA incluido (el sistema calculará el precio neto)` 
                            : `Estás cargando precios SIN IVA (el sistema sumará el IVA al mostrar)`}
                    </span>
                </div>
            </div>
            {/* Lista 1 */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Lista 1</span>
                    <span className="text-[10px] text-[var(--text-muted)]">(Principal)</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">
                            Precio {inputPricesWithTax ? '(con IVA)' : '(sin IVA)'} *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={pricing.list1.price}
                                onChange={(e) => onPricingChange('list1', 'price', e.target.value)}
                                className={`w-full pl-7 pr-2 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors ${
                                    errors['pricing.list1.price'] ? 'border-danger-500' : 'border-[var(--border-color)]'
                                }`}
                                placeholder="0.00"
                            />
                        </div>
                        {errors['pricing.list1.price'] && <p className="text-danger-500 text-[9px] mt-0.5">{errors['pricing.list1.price']}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Descuento %</label>
                        <div className="relative">
                            <Percent size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={pricing.list1.discount}
                                onChange={(e) => onPricingChange('list1', 'discount', e.target.value)}
                                className="w-full pl-7 pr-2 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">
                            Oferta {inputPricesWithTax ? '(con IVA)' : '(sin IVA)'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={pricing.list1.offer}
                                onChange={(e) => onPricingChange('list1', 'offer', e.target.value)}
                                className="w-full pl-7 pr-2 py-2 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg text-sm text-warning-700 dark:text-warning-400 focus:outline-none focus:border-warning-500 transition-colors"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                </div>
                {/* Preview precio final L1 */}
                {pricing.list1.price > 0 && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                        {(() => {
                            const priceInput = parseFloat(pricing.list1.price) || 0;
                            const discount = parseFloat(pricing.list1.discount) || 0;
                            const offerInput = parseFloat(pricing.list1.offer) || 0;
                            const tax = parseFloat(pricing.tax) || 0;
                            
                            // Si inputPricesWithTax es true, el precio ingresado incluye IVA
                            const priceWithTax = priceInput;
                            const offerWithTax = offerInput;
                            const priceWithoutTax = inputPricesWithTax ? calculatePriceWithoutTax(priceWithTax, tax) : priceInput;
                            const offerWithoutTax = inputPricesWithTax && offerInput > 0 ? calculatePriceWithoutTax(offerWithTax, tax) : offerInput;
                            
                            // Base para descuento: oferta si existe, sino precio base
                            const baseForDiscountWithTax = offerWithTax > 0 ? offerWithTax : priceWithTax;
                            const baseForDiscountWithoutTax = offerWithoutTax > 0 ? offerWithoutTax : priceWithoutTax;
                            
                            // Precio final con descuento aplicado
                            // NOTA: Siempre calculamos uno primero y derivamos el otro para mantener consistencia
                            let finalPriceWithoutTax, finalPriceWithTax;
                            
                            if (inputPricesWithTax) {
                                // El usuario ingresó precios CON IVA
                                // Aplicar descuento primero, luego calcular sin IVA
                                finalPriceWithTax = baseForDiscountWithTax * (1 - discount/100);
                                finalPriceWithoutTax = finalPriceWithTax / (1 + tax/100);
                            } else {
                                // El usuario ingresó precios SIN IVA
                                // Aplicar descuento primero, luego agregar IVA
                                finalPriceWithoutTax = baseForDiscountWithoutTax * (1 - discount/100);
                                finalPriceWithTax = finalPriceWithoutTax * (1 + tax/100);
                            }
                            
                            return (
                                <>
                                    <span className="text-[var(--text-muted)]">Precio final:</span>
                                    <span className="font-semibold text-[var(--text-primary)]">
                                        ${inputPricesWithTax ? finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : finalPriceWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                    </span>
                                    {offerInput > 0 && (
                                        <span className="text-warning-600">
                                            Oferta: ${inputPricesWithTax ? offerWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : offerWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                        </span>
                                    )}
                                    {discount > 0 && (
                                        <span className="text-success-600">(-{discount}%)</span>
                                    )}
                                    {/* Solo mostrar Final + IVA si se cargan precios sin IVA */}
                                    {!inputPricesWithTax && (
                                        <span className="text-primary-600 font-medium">
                                            | Final + IVA ({tax || 0}%): ${finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                        </span>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Lista 2 */}
            {hasPriceListsFeature && (
                <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-2 pb-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">Lista 2</span>
                        <span className="text-[10px] text-[var(--text-muted)]">(Alternativa)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] text-[var(--text-muted)] mb-1 block">
                                Precio {inputPricesWithTax ? '(con IVA)' : '(sin IVA)'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={pricing.list2.price}
                                    onChange={(e) => onPricingChange('list2', 'price', e.target.value)}
                                    className="w-full pl-7 pr-2 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Descuento %</label>
                            <div className="relative">
                                <Percent size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={pricing.list2.discount}
                                    onChange={(e) => onPricingChange('list2', 'discount', e.target.value)}
                                    className="w-full pl-7 pr-2 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-[var(--text-muted)] mb-1 block">
                                Oferta {inputPricesWithTax ? '(con IVA)' : '(sin IVA)'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={pricing.list2.offer}
                                    onChange={(e) => onPricingChange('list2', 'offer', e.target.value)}
                                    className="w-full pl-7 pr-2 py-2 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg text-sm text-warning-700 dark:text-warning-400 focus:outline-none focus:border-warning-500 transition-colors"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Preview precio final L2 */}
                    {pricing.list2.price > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                            {(() => {
                                const priceInput = parseFloat(pricing.list2.price) || 0;
                                const discount = parseFloat(pricing.list2.discount) || 0;
                                const offerInput = parseFloat(pricing.list2.offer) || 0;
                                const tax = parseFloat(pricing.tax) || 0;
                                
                                // Si inputPricesWithTax es true, el precio ingresado incluye IVA
                                const priceWithTax = priceInput;
                                const offerWithTax = offerInput;
                                const priceWithoutTax = inputPricesWithTax ? calculatePriceWithoutTax(priceWithTax, tax) : priceInput;
                                const offerWithoutTax = inputPricesWithTax && offerInput > 0 ? calculatePriceWithoutTax(offerWithTax, tax) : offerInput;
                                
                                // Base para descuento: oferta si existe, sino precio base
                                const baseForDiscountWithTax = offerWithTax > 0 ? offerWithTax : priceWithTax;
                                const baseForDiscountWithoutTax = offerWithoutTax > 0 ? offerWithoutTax : priceWithoutTax;
                                
                                // Precio final con descuento aplicado
                                let finalPriceWithoutTax, finalPriceWithTax;
                                
                                if (inputPricesWithTax) {
                                    // El usuario ingresó precios CON IVA
                                    finalPriceWithTax = baseForDiscountWithTax * (1 - discount/100);
                                    finalPriceWithoutTax = finalPriceWithTax / (1 + tax/100);
                                } else {
                                    // El usuario ingresó precios SIN IVA
                                    finalPriceWithoutTax = baseForDiscountWithoutTax * (1 - discount/100);
                                    finalPriceWithTax = finalPriceWithoutTax * (1 + tax/100);
                                }
                                
                                return (
                                    <>
                                        <span className="text-[var(--text-muted)]">Precio final:</span>
                                        <span className="font-semibold text-[var(--text-primary)]">
                                            ${inputPricesWithTax ? finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : finalPriceWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                        </span>
                                        {offerInput > 0 && (
                                            <span className="text-warning-600">
                                                Oferta: ${inputPricesWithTax ? offerWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : offerWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                            </span>
                                        )}
                                        {discount > 0 && (
                                            <span className="text-success-600">(-{discount}%)</span>
                                        )}
                                        {/* Solo mostrar Final + IVA si se cargan precios sin IVA */}
                                        {!inputPricesWithTax && (
                                            <span className="text-primary-600 font-medium">
                                                | Final + IVA ({tax || 0}%): ${finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* IVA */}
            <div className="pt-2 border-t border-[var(--border-color)]">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">IVA %</label>
                        <div className="relative">
                            <Percent size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600" />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={pricing.tax}
                                onChange={(e) => onTaxChange(e.target.value)}
                                className="w-full pl-7 pr-2 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="21"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <p className="text-[10px] text-[var(--text-muted)]">
                            El IVA se aplica igual para ambas listas de precios
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

const ProductDrawer = ({ isOpen, onClose, onSave, product = null, features = {} }) => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const isEditing = !!product;
    const hasPriceListsFeature = features.priceLists === true;
    const hasStockFeature = features.stock === true;
    const inputPricesWithTax = user?.company?.inputPricesWithTax === true;

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    
    // Guardar datos iniciales para comparar cambios
    const initialDataRef = useRef(null);
    
    // Sugerencias
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [brands, setBrands] = useState([]);
    
    const [formData, setFormData] = useState({
        code: '',
        barcode: '',
        name: '',
        category: '',
        subcategory: '',
        brand: '',
        unit: '',
        description: '',
        longDescription: '',
        pricing: {
            list1: { price: '', discount: '', offer: '' },
            list2: { price: '', discount: '', offer: '' },
            tax: 21
        },
        stock: 0,
        stockReserved: 0,
        stockQuoted: 0,
        minStock: 0,
        image: '',
        unitsPerPackage: 1,
        minOrderQuantity: 1,
        images: [],
        coverImageIndex: 0
    });

    // Estados para variantes
    const [hasVariants, setHasVariants] = useState(false);
    const [hasUniformVariantPricing, setHasUniformVariantPricing] = useState(true);
    const [variantConfig, setVariantConfig] = useState({ label1: 'Variable 1', label2: 'Variable 2' });
    const [variants, setVariants] = useState([]);
    const [variantErrors, setVariantErrors] = useState({});

    // Estados para manejo de imágenes
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    // Cargar sugerencias al abrir
    useEffect(() => {
        if (isOpen) {
            loadSuggestions();
        }
    }, [isOpen]);

    // Cargar subcategorías cuando cambia la categoría
    useEffect(() => {
        if (formData.category && isOpen) {
            loadSubcategories(formData.category);
        }
    }, [formData.category, isOpen]);

    const loadSuggestions = async () => {
        try {
            const [cats, brs] = await Promise.all([
                getCategories(),
                getBrands()
            ]);
            setCategories(cats);
            setBrands(brs);
            
            if (product?.category) {
                const subs = await getSubcategories(product.category);
                setSubcategories(subs);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    };

    const loadSubcategories = async (category) => {
        try {
            const subs = await getSubcategories(category);
            setSubcategories(subs);
        } catch (error) {
            console.error('Error loading subcategories:', error);
        }
    };

    // Funciones para variantes
    const generateVariantSku = (productCode, value1, value2) => {
        const cleanValue1 = value1?.toString().toUpperCase().replace(/\s+/g, '').substring(0, 5) || '';
        const cleanValue2 = value2?.toString().toUpperCase().replace(/\s+/g, '').substring(0, 5) || '';
        return `${productCode}-${cleanValue1}${cleanValue2 ? '-' + cleanValue2 : ''}`;
    };

    const generateVariantId = () => {
        return 'var-' + Math.random().toString(36).substr(2, 9);
    };

    const generateVariantCombinations = () => {
        // Pedir valores posibles separados por coma
        const values1 = prompt(`Ingresa los valores posibles para "${variantConfig.label1}" separados por coma:\nEjemplo: S, M, L, XL`);
        if (!values1) return;
        
        const values2 = prompt(`Ingresa los valores posibles para "${variantConfig.label2}" separados por coma (opcional):\nEjemplo: Rojo, Azul, Negro`);
        
        const list1 = values1.split(',').map(v => v.trim()).filter(Boolean);
        const list2 = values2 ? values2.split(',').map(v => v.trim()).filter(Boolean) : [''];
        
        const newVariants = [];
        list1.forEach((val1, idx1) => {
            list2.forEach((val2, idx2) => {
                // Verificar si ya existe esta combinación
                const exists = variants.some(v => 
                    v.value1 === val1 && v.value2 === val2
                );
                
                if (!exists) {
                    newVariants.push({
                        id: generateVariantId(),
                        value1: val1,
                        value2: val2,
                        sku: generateVariantSku(formData.code, val1, val2),
                        stock: 0,
                        stockReserved: 0,
                        stockQuoted: 0,
                        minStock: 0,
                        active: true,
                        // Precios: null = usar del padre
                        pricing: hasUniformVariantPricing 
                            ? null  // En modo mismo precio, null = usa precios del padre
                            : {  // Precios propios
                                list1: { price: 0, discount: 0, offer: null },
                                list2: { price: 0, discount: 0, offer: null }
                            }
                    });
                }
            });
        });
        
        setVariants([...variants, ...newVariants]);
    };

    const addManualVariant = () => {
        setVariants([...variants, {
            id: generateVariantId(),
            value1: '',
            value2: '',
            sku: formData.code ? `${formData.code}-` : '',
            stock: 0,
            stockReserved: 0,
            stockQuoted: 0,
            minStock: 0,
            active: true,
            pricing: hasUniformVariantPricing 
                ? null  // En modo mismo precio, null = usa precios del padre
                : {
                    list1: { price: 0, discount: 0, offer: null },
                    list2: { price: 0, discount: 0, offer: null }
                }
        }]);
    };

    const updateVariant = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        
        // Auto-generar SKU si cambia value1 o value2 y el SKU está vacío o es el default
        if ((field === 'value1' || field === 'value2') && formData.code) {
            const currentSku = updated[index].sku;
            const expectedSku = generateVariantSku(formData.code, updated[index].value1, updated[index].value2);
            if (!currentSku || currentSku === `${formData.code}-` || currentSku.startsWith(`${formData.code}-`)) {
                updated[index].sku = expectedSku;
            }
        }
        
        setVariants(updated);
    };

    const removeVariant = (index) => {
        if (window.confirm('¿Eliminar esta variante?')) {
            setVariants(variants.filter((_, i) => i !== index));
        }
    };

    // Reset form when drawer opens
    useEffect(() => {
        if (isOpen) {
            let newFormData;
            if (product) {
                // Usar los nuevos campos de la API si inputPricesWithTax está activo
                const usePricesWithTax = user?.company?.inputPricesWithTax === true;
                
                newFormData = {
                    code: product.code || '',
                    barcode: product.barcode || '',
                    name: product.name || '',
                    category: product.category || '',
                    subcategory: product.subcategory || '',
                    brand: product.brand || '',
                    unit: product.unit || '',
                    description: product.description || '',
                    longDescription: product.longDescription || '',
                    pricing: {
                        list1: {
                            price: usePricesWithTax && product.priceWithTaxList1
                                ? product.priceWithTaxList1.toFixed(2)
                                : (product.pricing?.list1?.price || ''),
                            discount: product.pricing?.list1?.discount || '',
                            offer: usePricesWithTax && product.offerWithTaxList1
                                ? product.offerWithTaxList1.toFixed(2)
                                : (product.pricing?.list1?.offer || '')
                        },
                        list2: {
                            price: usePricesWithTax && product.priceWithTaxList2
                                ? product.priceWithTaxList2.toFixed(2)
                                : (product.pricing?.list2?.price || ''),
                            discount: product.pricing?.list2?.discount || '',
                            offer: usePricesWithTax && product.offerWithTaxList2
                                ? product.offerWithTaxList2.toFixed(2)
                                : (product.pricing?.list2?.offer || '')
                        },
                        tax: product.pricing?.tax ?? 21
                    },
                    stock: product.stock || 0,
                    stockReserved: product.stockReserved || 0,
                    stockQuoted: product.stockQuoted || 0,
                    minStock: product.minStock || 0,
                    image: product.image || '',
                    unitsPerPackage: product.unitsPerPackage || 1,
                    minOrderQuantity: product.minOrderQuantity || 1,
                    images: product.images || [],
                    coverImageIndex: product.coverImageIndex || 0
                };
                // Cargar datos de variantes
                setHasVariants(product.hasVariants || false);
                setHasUniformVariantPricing(product.hasUniformVariantPricing !== false); // default true
                setVariantConfig(product.variantConfig || { label1: 'Variable 1', label2: 'Variable 2' });
                
                // Función para convertir precios sin IVA a con IVA
                const applyTax = (price, taxRate) => {
                    if (!price || price <= 0) return price;
                    const tax = parseFloat(taxRate) || 21;
                    return (price * (1 + tax / 100)).toFixed(2);
                };
                
                const taxRate = product.pricing?.tax ?? 21;
                
                // Limpiar variantes de campos obsoletos y aplicar conversión de precios si es necesario
                const cleanVariants = (product.variants || []).map(v => {
                    const cleaned = { ...v };
                    if (cleaned.pricing && cleaned.pricing.adjustment !== undefined) {
                        delete cleaned.pricing.adjustment;
                    }
                    
                    // Si inputPricesWithTax está activo, convertir precios para mostrar con IVA
                    if (usePricesWithTax && cleaned.pricing) {
                        cleaned.pricing = {
                            list1: {
                                price: applyTax(cleaned.pricing.list1?.price, taxRate),
                                discount: cleaned.pricing.list1?.discount || 0,
                                offer: cleaned.pricing.list1?.offer ? applyTax(cleaned.pricing.list1.offer, taxRate) : null
                            },
                            list2: {
                                price: applyTax(cleaned.pricing.list2?.price, taxRate),
                                discount: cleaned.pricing.list2?.discount || 0,
                                offer: cleaned.pricing.list2?.offer ? applyTax(cleaned.pricing.list2.offer, taxRate) : null
                            }
                        };
                    }
                    
                    return cleaned;
                });
                setVariants(cleanVariants);
            } else {
                newFormData = {
                    code: '',
                    barcode: '',
                    name: '',
                    category: '',
                    subcategory: '',
                    brand: '',
                    unit: '',
                    description: '',
                    longDescription: '',
                    pricing: {
                        list1: { price: '', discount: '', offer: '' },
                        list2: { price: '', discount: '', offer: '' },
                        tax: 21
                    },
                    stock: 0,
                    stockReserved: 0,
                    stockQuoted: 0,
                    minStock: 0,
                    image: '',
                    unitsPerPackage: 1,
                    minOrderQuantity: 1,
                    images: [],
                    coverImageIndex: 0
                };
                // Resetear variantes para nuevo producto
                setHasVariants(false);
                setHasUniformVariantPricing(true);
                setVariantConfig({ label1: 'Variable 1', label2: 'Variable 2' });
                setVariants([]);
            }
            setFormData(newFormData);
            initialDataRef.current = JSON.stringify(newFormData);
            setErrors({});
            setVariantErrors({});
            setShowConfirmClose(false);
        }
    }, [isOpen, product]);

    // Verificar si hay cambios
    const hasChanges = () => {
        if (!initialDataRef.current) return false;
        return JSON.stringify(formData) !== initialDataRef.current;
    };

    // Validación asíncrona de código
    const validateCode = useCallback(async (code) => {
        if (!code.trim()) return 'El código es requerido';
        try {
            const exists = await checkCodeExists(code, product?._id);
            if (exists) return 'Este código ya existe en la empresa';
        } catch (error) {
            console.error('Error checking code:', error);
        }
        return null;
    }, [product?._id]);

    // Validación asíncrona de código de barras
    const validateBarcode = useCallback(async (barcode) => {
        if (!barcode.trim()) return null;
        try {
            const exists = await checkBarcodeExists(barcode, product?._id);
            if (exists) return 'Este código de barras ya existe en la empresa';
        } catch (error) {
            console.error('Error checking barcode:', error);
        }
        return null;
    }, [product?._id]);

    const validate = async () => {
        const newErrors = {};
        
        const codeError = await validateCode(formData.code);
        if (codeError) newErrors.code = codeError;
        
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        
        const barcodeError = await validateBarcode(formData.barcode);
        if (barcodeError) newErrors.barcode = barcodeError;
        
        // Validación de precios y variantes
        if (hasVariants) {
            if (variants.length === 0) {
                newErrors.variants = 'Debe tener al menos una variante';
            }
            
            // Validar que no haya SKUs duplicados
            const skus = variants.map(v => v.sku?.toLowerCase()?.trim()).filter(Boolean);
            const uniqueSkus = [...new Set(skus)];
            if (skus.length !== uniqueSkus.length) {
                newErrors.variants = 'Hay SKUs duplicados entre las variantes';
            }
            
            // Validar que todas las variantes tengan valor1
            const emptyValues = variants.some(v => !v.value1?.trim());
            if (emptyValues) {
                newErrors.variants = 'Todas las variantes deben tener valor en Variable 1';
            }
            
            // Validar precios según el modo
            if (hasUniformVariantPricing) {
                // Modo mismo precio: el padre debe tener precio
                if (!formData.pricing.list1.price || formData.pricing.list1.price <= 0) {
                    newErrors['pricing.list1.price'] = 'El precio lista 1 es requerido';
                }
            } else {
                // Modo precios individuales: cada variante debe tener precio
                const variantsWithoutPrice = variants.some(v => !v.pricing?.list1?.price || v.pricing.list1.price <= 0);
                if (variantsWithoutPrice) {
                    newErrors.variants = 'Todas las variantes deben tener un precio en Lista 1';
                }
            }
        } else {
            // Producto simple: el padre debe tener precio
            if (!formData.pricing.list1.price || formData.pricing.list1.price <= 0) {
                newErrors['pricing.list1.price'] = 'El precio lista 1 es requerido';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = await validate();
        if (!isValid) return;

        setLoading(true);
        
        // Función para convertir precios con IVA a sin IVA
        const convertPrice = (priceWithTax, taxRate) => {
            if (!priceWithTax || priceWithTax <= 0) return 0;
            const tax = parseFloat(taxRate) || 0;
            return priceWithTax / (1 + tax / 100);
        };
        
        try {
            const taxRate = parseFloat(formData.pricing.tax) || 21;
            
            // Convertir precios si inputPricesWithTax está activo
            const l1Price = parseFloat(formData.pricing.list1.price) || 0;
            const l1Offer = parseFloat(formData.pricing.list1.offer) || 0;
            const l2Price = parseFloat(formData.pricing.list2.price) || 0;
            const l2Offer = parseFloat(formData.pricing.list2.offer) || 0;
            
            const data = {
                ...formData,
                code: formData.code.toUpperCase(),
                pricing: {
                    list1: {
                        price: inputPricesWithTax && l1Price > 0 ? convertPrice(l1Price, taxRate) : l1Price,
                        discount: parseFloat(formData.pricing.list1.discount) || 0,
                        offer: inputPricesWithTax && l1Offer > 0 ? convertPrice(l1Offer, taxRate) : (l1Offer || null)
                    },
                    list2: {
                        price: inputPricesWithTax && l2Price > 0 ? convertPrice(l2Price, taxRate) : l2Price,
                        discount: parseFloat(formData.pricing.list2.discount) || 0,
                        offer: inputPricesWithTax && l2Offer > 0 ? convertPrice(l2Offer, taxRate) : (l2Offer || null)
                    },
                    tax: taxRate
                },
                // Solo incluir stock simple si NO tiene variantes
                stock: hasVariants ? 0 : parseInt(formData.stock) || 0,
                stockReserved: hasVariants ? 0 : parseInt(formData.stockReserved) || 0,
                stockQuoted: hasVariants ? 0 : parseInt(formData.stockQuoted) || 0,
                minStock: hasVariants ? 0 : parseInt(formData.minStock) || 0,
                unitsPerPackage: parseInt(formData.unitsPerPackage) || 1,
                minOrderQuantity: parseInt(formData.minOrderQuantity) || 1,
                // Campos de variantes
                hasVariants,
                hasUniformVariantPricing,
                variantConfig: hasVariants ? variantConfig : undefined,
                variants: hasVariants ? variants.map(v => ({
                    ...v,
                    pricing: v.pricing ? {
                        list1: {
                            price: inputPricesWithTax && v.pricing.list1?.price > 0 
                                ? convertPrice(v.pricing.list1.price, taxRate) 
                                : (v.pricing.list1?.price || 0),
                            discount: v.pricing.list1?.discount || 0,
                            offer: inputPricesWithTax && v.pricing.list1?.offer > 0 
                                ? convertPrice(v.pricing.list1.offer, taxRate) 
                                : (v.pricing.list1?.offer || null)
                        },
                        list2: {
                            price: inputPricesWithTax && v.pricing.list2?.price > 0 
                                ? convertPrice(v.pricing.list2.price, taxRate) 
                                : (v.pricing.list2?.price || 0),
                            discount: v.pricing.list2?.discount || 0,
                            offer: inputPricesWithTax && v.pricing.list2?.offer > 0 
                                ? convertPrice(v.pricing.list2.offer, taxRate) 
                                : (v.pricing.list2?.offer || null)
                        }
                    } : undefined
                })) : []
            };

            if (isEditing) {
                await updateProduct(product._id, data);
                addToast('Producto actualizado exitosamente', 'success');
            } else {
                await createProduct(data);
                addToast('Producto creado exitosamente', 'success');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            addToast(error.response?.data?.message || 'Error al guardar producto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handlePricingChange = (list, field, value) => {
        setFormData(prev => ({
            ...prev,
            pricing: { 
                ...prev.pricing, 
                [list]: { ...prev.pricing[list], [field]: value }
            }
        }));
        const errorKey = `pricing.${list}.${field}`;
        if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: null }));
    };
    
    const handleTaxChange = (value) => {
        setFormData(prev => ({
            ...prev,
            pricing: { ...prev.pricing, tax: value }
        }));
    };

    const handleCategoryChange = (value) => {
        handleChange('category', value);
        handleChange('subcategory', '');
    };

    // Funciones para manejo de imágenes
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            addToast('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }

        // Validar tamaño (1MB máximo)
        if (file.size > 1 * 1024 * 1024) {
            addToast('La imagen no debe superar los 1MB', 'error');
            return;
        }

        // Validar máximo de imágenes
        if (formData.images.length >= 5) {
            addToast('Máximo 5 imágenes permitidas por producto', 'error');
            return;
        }

        // Si es un producto nuevo, primero guardarlo
        if (!isEditing) {
            addToast('Primero debes crear el producto para poder subir imágenes', 'warning');
            return;
        }

        setUploadingImage(true);
        try {
            const result = await uploadProductImage(product._id, file);
            
            // Actualizar el estado con las nuevas imágenes
            setFormData(prev => ({
                ...prev,
                images: result.images
            }));
            
            addToast('Imagen subida exitosamente', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            addToast(error.response?.data?.message || 'Error al subir la imagen', 'error');
        } finally {
            setUploadingImage(false);
            // Resetear el input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteImage = async (imageIndex) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

        try {
            const result = await deleteProductImage(product._id, imageIndex);
            
            setFormData(prev => ({
                ...prev,
                images: result.images,
                coverImageIndex: result.coverImageIndex
            }));
            
            addToast('Imagen eliminada exitosamente', 'success');
        } catch (error) {
            console.error('Error deleting image:', error);
            addToast(error.response?.data?.message || 'Error al eliminar la imagen', 'error');
        }
    };

    const handleSetCoverImage = async (imageIndex) => {
        try {
            const result = await setCoverImage(product._id, imageIndex);
            
            setFormData(prev => ({
                ...prev,
                coverImageIndex: result.coverImageIndex
            }));
            
            addToast('Imagen de portada actualizada', 'success');
        } catch (error) {
            console.error('Error setting cover image:', error);
            addToast(error.response?.data?.message || 'Error al establecer la imagen de portada', 'error');
        }
    };

    // Manejar el cierre del drawer
    const handleClose = () => {
        if (hasChanges()) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    // Confirmar cierre sin guardar
    const handleConfirmClose = () => {
        setShowConfirmClose(false);
        onClose();
    };

    return createPortal(
        <>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[200]"
                            onClick={handleClose}
                        />
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[900px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[210] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                                            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                                        </h2>
                                        <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                            {isEditing ? 'Modifique los datos del producto' : 'Complete los datos del nuevo producto'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Código y Código de Barras */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                                <Tag size={12} /> Código *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.code}
                                                onChange={(e) => handleChange('code', e.target.value)}
                                                className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors ${
                                                    errors.code ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="Ej: PROD001"
                                            />
                                            {errors.code && (
                                                <p className="text-danger-500 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} /> {errors.code}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                                <Barcode size={12} /> Código de Barras
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.barcode}
                                                onChange={(e) => handleChange('barcode', e.target.value)}
                                                className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors ${
                                                    errors.barcode ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="Ej: 123456789012"
                                            />
                                            {errors.barcode && (
                                                <p className="text-danger-500 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} /> {errors.barcode}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nombre */}
                                    <div>
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            <Package size={12} /> Nombre del Producto *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors ${
                                                errors.name ? 'border-danger-500' : 'border-[var(--border-color)]'
                                            }`}
                                            placeholder="Ej: Monitor LED 24 pulgadas"
                                        />
                                        {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    {/* Categoría y Subcategoría */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <AutocompleteInput
                                            label="Categoría"
                                            icon={Layers}
                                            value={formData.category}
                                            onChange={handleCategoryChange}
                                            suggestions={categories}
                                            placeholder="Ej: Electrónica"
                                        />
                                        <AutocompleteInput
                                            label="Subcategoría"
                                            icon={Layers}
                                            value={formData.subcategory}
                                            onChange={(value) => handleChange('subcategory', value)}
                                            suggestions={subcategories}
                                            placeholder={formData.category ? "Ej: Monitores" : "Seleccione categoría primero"}
                                            disabled={!formData.category}
                                        />
                                    </div>

                                    {/* Marca y Unidad */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <AutocompleteInput
                                            label="Marca / Proveedor"
                                            icon={Building2}
                                            value={formData.brand}
                                            onChange={(value) => handleChange('brand', value)}
                                            suggestions={brands}
                                            placeholder="Ej: Samsung"
                                        />
                                        <AutocompleteInput
                                            label="Unidad de Medida"
                                            icon={Ruler}
                                            value={formData.unit}
                                            onChange={(value) => handleChange('unit', value)}
                                            suggestions={['Unidad', 'kg', 'metro', 'litro', 'caja', 'par', 'set']}
                                            placeholder="Ej: Unidad, kg, metro"
                                        />
                                    </div>

                                    {/* Descripciones */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                                <FileText size={12} /> Descripción Corta
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                placeholder="Descripción breve del producto"
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                                <FileText size={12} /> Descripción Larga
                                            </label>
                                            <textarea
                                                value={formData.longDescription}
                                                onChange={(e) => handleChange('longDescription', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors resize-none"
                                                placeholder="Descripción detallada del producto..."
                                            />
                                        </div>
                                    </div>

                                    {/* Configuración de Pedidos */}
                                    <div className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 p-5 space-y-4">
                                        <h4 className="text-[12px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider flex items-center gap-2">
                                            <Package size={16} /> Configuración de Pedidos
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">Unidades por Bulto</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.unitsPerPackage}
                                                    onChange={(e) => handleChange('unitsPerPackage', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                    placeholder="1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">Cantidad Mínima</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.minOrderQuantity}
                                                    onChange={(e) => handleChange('minOrderQuantity', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                    placeholder="1"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.sellOnlyFullPackages || false}
                                                        onChange={(e) => handleChange('sellOnlyFullPackages', e.target.checked)}
                                                        className="w-4 h-4 rounded border-[var(--border-color)]"
                                                    />
                                                    <span className="text-xs text-[var(--text-secondary)]">Solo bultos completos</span>
                                                </label>
                                            </div>
                                        </div>
                                        {(formData.unitsPerPackage > 1 || formData.minOrderQuantity > 1) && (
                                            <div className="p-3 bg-primary-100/50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                                                <p className="text-xs text-primary-800 dark:text-primary-300">
                                                    <span className="font-semibold">Resumen:</span>
                                                    {formData.unitsPerPackage > 1 && (
                                                        <span className="ml-1">Bulto de <strong>{formData.unitsPerPackage}</strong> unidades.</span>
                                                    )}
                                                    {formData.minOrderQuantity > 1 && (
                                                        <span className="ml-1">Mínimo <strong>{formData.minOrderQuantity}</strong> unidades.</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Gestión de Stock y Precios / Gestión de Precios */}
                                    <div className="bg-gradient-to-br from-[var(--bg-hover)] to-transparent rounded-2xl border-2 border-primary-200 dark:border-primary-800 p-5 space-y-5">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[13px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider flex items-center gap-2">
                                                <Boxes size={18} /> {hasStockFeature ? 'Gestión de Stock y Precios' : 'Gestión de Precios'}
                                            </h4>
                                        </div>

                                        {/* Toggle: Producto con variantes */}
                                        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <span className="text-sm font-semibold text-[var(--text-primary)]">Producto con variantes</span>
                                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                        {hasVariants ? 'Este producto tiene diferentes versiones (talle, color, etc.)' : 'Producto único sin variaciones'}
                                                    </p>
                                                </div>
                                                <div className={`relative w-14 h-7 rounded-full transition-colors ${hasVariants ? 'bg-primary-600' : 'bg-gray-200'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={hasVariants}
                                                        onChange={(e) => {
                                                            if (isEditing && product?.hasVariants !== e.target.checked) {
                                                                alert('No se puede cambiar el tipo de producto porque puede estar en pedidos');
                                                                return;
                                                            }
                                                            setHasVariants(e.target.checked);
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${hasVariants ? 'translate-x-7' : ''}`} />
                                                </div>
                                            </label>
                                        </div>

                                        {!hasVariants ? (
                                            /* PRODUCTO SIMPLE: Stock + Precios */
                                            <div className="space-y-5">
                                                {/* Stock */}
                                                {hasStockFeature && (
                                                    <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                        <h5 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <Boxes size={14} /> Stock
                                                        </h5>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] text-[var(--text-muted)] mb-1.5 block">Stock Físico</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={formData.stock}
                                                                    onChange={(e) => handleChange('stock', e.target.value)}
                                                                    className="w-full px-3 py-2.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-[var(--text-muted)] mb-1.5 block">Stock Mínimo</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={formData.minStock}
                                                                    onChange={(e) => handleChange('minStock', e.target.value)}
                                                                    className="w-full px-3 py-2.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Precios */}
                                                <ProductPricingForm 
                                                    pricing={formData.pricing}
                                                    onPricingChange={handlePricingChange}
                                                    onTaxChange={handleTaxChange}
                                                    hasPriceListsFeature={hasPriceListsFeature}
                                                    errors={errors}
                                                    inputPricesWithTax={inputPricesWithTax}
                                                />
                                            </div>
                                        ) : (
                                            /* PRODUCTO CON VARIANTES */
                                            <div className="space-y-5">
                                                {/* IVA - Siempre visible para variantes */}
                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-32">
                                                            <label className="text-[10px] text-[var(--text-muted)] mb-1 block">IVA %</label>
                                                            <div className="relative">
                                                                <Percent size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600" />
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="100"
                                                                    value={formData.pricing.tax}
                                                                    onChange={(e) => handleTaxChange(e.target.value)}
                                                                    className="w-full pl-7 pr-2 py-2 bg-white dark:bg-secondary-800 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 transition-colors"
                                                                    placeholder="21"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] text-[var(--text-muted)]">
                                                                El IVA se aplica igual para todas las variantes y listas de precios
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Toggle: Precios individuales */}
                                                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                                                    <label className="flex items-center justify-between cursor-pointer">
                                                        <div>
                                                            <span className="text-sm font-semibold text-primary-800 dark:text-primary-300">Cada variante tiene su propio precio</span>
                                                            <p className="text-[11px] text-primary-600 dark:text-primary-400 mt-0.5">
                                                                {hasUniformVariantPricing ? 'Las variantes usan los precios del producto base' : 'Cada variante define sus propios precios'}
                                                            </p>
                                                        </div>
                                                        <div className={`relative w-14 h-7 rounded-full transition-colors ${!hasUniformVariantPricing ? 'bg-primary-600' : 'bg-gray-200'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={!hasUniformVariantPricing}
                                                                onChange={(e) => setHasUniformVariantPricing(!e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${!hasUniformVariantPricing ? 'translate-x-7' : ''}`} />
                                                        </div>
                                                    </label>
                                                </div>

                                                {errors.variants && (
                                                    <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-100 dark:border-danger-800">
                                                        <p className="text-xs text-danger-700 dark:text-danger-300 flex items-center gap-1">
                                                            <AlertCircle size={12} /> {errors.variants}
                                                        </p>
                                                    </div>
                                                )}

                                                {hasUniformVariantPricing ? (
                                                    /* MODO: Mismo precio - Precios del padre + Tabla simple */
                                                    <>
                                                        {/* Precios del padre - PRIMERO */}
                                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
                                                                <strong>Precio único:</strong> Todas las variantes usarán los precios configurados aquí.
                                                            </p>
                                                            <ProductPricingForm 
                                                                pricing={formData.pricing}
                                                                onPricingChange={handlePricingChange}
                                                                onTaxChange={handleTaxChange}
                                                                hasPriceListsFeature={hasPriceListsFeature}
                                                                errors={errors}
                                                                inputPricesWithTax={inputPricesWithTax}
                                                            />
                                                        </div>

                                                        {/* Config de variables - DESPUÉS DE PRECIOS */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">Nombre Variable 1 *</label>
                                                                <input
                                                                    type="text"
                                                                    value={variantConfig.label1}
                                                                    onChange={(e) => setVariantConfig({...variantConfig, label1: e.target.value})}
                                                                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm"
                                                                    placeholder="Ej: Talle"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">Nombre Variable 2 (opcional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={variantConfig.label2}
                                                                    onChange={(e) => setVariantConfig({...variantConfig, label2: e.target.value})}
                                                                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm"
                                                                    placeholder="Ej: Color"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Botones - Después de variables, más chicos */}
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={generateVariantCombinations}
                                                                className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-[11px] font-medium hover:bg-primary-700 transition-colors"
                                                            >
                                                                <Plus size={14} />
                                                                Generar Combinaciones
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={addManualVariant}
                                                                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg text-[11px] font-medium hover:bg-[var(--bg-hover)] transition-colors"
                                                            >
                                                                <Plus size={14} />
                                                                Agregar Manual
                                                            </button>
                                                        </div>

                                                        {/* Tabla simple de variantes - AL FINAL */}
                                                        {variants.length > 0 && (
                                                            <div className="overflow-x-auto bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="text-[10px] text-[var(--text-muted)] uppercase bg-[var(--bg-hover)]">
                                                                            <th className="text-left py-3 px-3 rounded-tl-lg">{variantConfig.label1}</th>
                                                                            <th className="text-left py-3 px-3">{variantConfig.label2 || '-'}</th>
                                                                            <th className="text-left py-3 px-3">SKU</th>
                                                                            {hasStockFeature && (
                                                                                <>
                                                                                    <th className="text-right py-3 px-3">Stock</th>
                                                                                    <th className="text-right py-3 px-3">Stock Min</th>
                                                                                </>
                                                                            )}
                                                                            <th className="text-center py-3 px-3">Activo</th>
                                                                            <th className="text-center py-3 px-3 rounded-tr-lg"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-[var(--border-color)]">
                                                                        {variants.map((variant, index) => (
                                                                            <tr key={variant.id} className="hover:bg-[var(--bg-hover)]">
                                                                                <td className="py-2 px-3">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={variant.value1}
                                                                                        onChange={(e) => updateVariant(index, 'value1', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs"
                                                                                        placeholder="Valor"
                                                                                    />
                                                                                </td>
                                                                                <td className="py-2 px-3">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={variant.value2}
                                                                                        onChange={(e) => updateVariant(index, 'value2', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs"
                                                                                        placeholder="Valor"
                                                                                        disabled={!variantConfig.label2}
                                                                                    />
                                                                                </td>
                                                                                <td className="py-2 px-3">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={variant.sku}
                                                                                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs font-mono"
                                                                                    />
                                                                                </td>
                                                                                {hasStockFeature && (
                                                                                    <>
                                                                                        <td className="py-2 px-3">
                                                                                            <input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                value={variant.stock}
                                                                                                onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                                                                                className="w-16 px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs text-right"
                                                                                            />
                                                                                        </td>
                                                                                        <td className="py-2 px-3">
                                                                                            <input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                value={variant.minStock}
                                                                                                onChange={(e) => updateVariant(index, 'minStock', parseInt(e.target.value) || 0)}
                                                                                                className="w-16 px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs text-right"
                                                                                            />
                                                                                        </td>
                                                                                    </>
                                                                                )}
                                                                                <td className="py-2 px-3 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={variant.active !== false}
                                                                                        onChange={(e) => updateVariant(index, 'active', e.target.checked)}
                                                                                        className="w-4 h-4 rounded border-[var(--border-color)]"
                                                                                    />
                                                                                </td>
                                                                                <td className="py-2 px-3 text-center">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeVariant(index)}
                                                                                        className="p-1.5 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    /* MODO: Precios individuales - Solo Cards de variantes */
                                                    <>
                                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                                <strong>Precios por variante:</strong> Completá todos los precios para cada variante en las tarjetas de abajo.
                                                            </p>
                                                        </div>

                                                        {/* Config de variables */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">Nombre Variable 1 *</label>
                                                                <input
                                                                    type="text"
                                                                    value={variantConfig.label1}
                                                                    onChange={(e) => setVariantConfig({...variantConfig, label1: e.target.value})}
                                                                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm"
                                                                    placeholder="Ej: Talle"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 block">Nombre Variable 2 (opcional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={variantConfig.label2}
                                                                    onChange={(e) => setVariantConfig({...variantConfig, label2: e.target.value})}
                                                                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm"
                                                                    placeholder="Ej: Color"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Botones - Después de variables, más chicos */}
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={generateVariantCombinations}
                                                                className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-[11px] font-medium hover:bg-primary-700 transition-colors"
                                                            >
                                                                <Plus size={14} />
                                                                Generar Combinaciones
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={addManualVariant}
                                                                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg text-[11px] font-medium hover:bg-[var(--bg-hover)] transition-colors"
                                                            >
                                                                <Plus size={14} />
                                                                Agregar Manual
                                                            </button>
                                                        </div>

                                                        {/* Indicador de modo de carga para variantes */}
                                                        <div className={`p-3 rounded-lg border ${inputPricesWithTax ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign size={16} className={inputPricesWithTax ? 'text-amber-600' : 'text-success-600'} />
                                                                <span className={`text-xs font-semibold ${inputPricesWithTax ? 'text-amber-700 dark:text-amber-300' : 'text-success-700 dark:text-success-300'}`}>
                                                                    {inputPricesWithTax 
                                                                        ? `Estás cargando precios CON IVA incluido (el sistema calculará el precio neto)` 
                                                                        : `Estás cargando precios SIN IVA (el sistema sumará el IVA al mostrar)`}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {variants.length > 0 && (
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                {variants.map((variant, index) => (
                                                                    <div key={variant.id} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4">
                                                                        {/* Header de la card */}
                                                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                                                    {index + 1}
                                                                                </span>
                                                                                <div className="flex gap-2">
                                                                                    <span className="px-2 py-0.5 bg-[var(--bg-hover)] rounded text-xs font-medium">
                                                                                        {variantConfig.label1}: {variant.value1 || '-'}
                                                                                    </span>
                                                                                    {variantConfig.label2 && (
                                                                                        <span className="px-2 py-0.5 bg-[var(--bg-hover)] rounded text-xs font-medium">
                                                                                            {variantConfig.label2}: {variant.value2 || '-'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeVariant(index)}
                                                                                className="p-1.5 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                        
                                                                        {/* Campos básicos */}
                                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                                            <div>
                                                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">{variantConfig.label1}</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={variant.value1}
                                                                                    onChange={(e) => updateVariant(index, 'value1', e.target.value)}
                                                                                    className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs"
                                                                                />
                                                                            </div>
                                                                            {variantConfig.label2 ? (
                                                                                <div>
                                                                                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">{variantConfig.label2}</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={variant.value2}
                                                                                        onChange={(e) => updateVariant(index, 'value2', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div>
                                                                                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">SKU</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={variant.sku}
                                                                                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs font-mono"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {variantConfig.label2 && (
                                                                            <div className="mb-4">
                                                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">SKU</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={variant.sku}
                                                                                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                                                    className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs font-mono"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {/* Stock */}
                                                                        {hasStockFeature && (
                                                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                                                <div>
                                                                                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Stock</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        value={variant.stock}
                                                                                        onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                                                                        className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs text-right"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Stock Mínimo</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        value={variant.minStock}
                                                                                        onChange={(e) => updateVariant(index, 'minStock', parseInt(e.target.value) || 0)}
                                                                                        className="w-full px-2 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded text-xs text-right"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {/* Precios Lista 1 */}
                                                                        <div className="mb-4 p-3 bg-[var(--bg-hover)] rounded-lg">
                                                                            <h5 className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Lista 1</h5>
                                                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                                                <div>
                                                                                    <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">
                                                                                        {inputPricesWithTax ? 'Precio (con IVA)' : 'Precio (sin IVA)'}
                                                                                    </label>
                                                                                    <div className="relative">
                                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">$</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={variant.pricing?.list1?.price || ''}
                                                                                            onChange={(e) => updateVariant(index, 'pricing', { 
                                                                                                ...variant.pricing, 
                                                                                                list1: { ...variant.pricing?.list1, price: parseFloat(e.target.value) || 0 }
                                                                                            })}
                                                                                            className="w-full pl-5 pr-2 py-1.5 bg-white dark:bg-secondary-800 border border-[var(--border-color)] rounded text-xs text-right"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">Dto %</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        value={variant.pricing?.list1?.discount || ''}
                                                                                        onChange={(e) => updateVariant(index, 'pricing', { 
                                                                                            ...variant.pricing, 
                                                                                            list1: { ...variant.pricing?.list1, discount: parseFloat(e.target.value) || 0 }
                                                                                        })}
                                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-secondary-800 border border-[var(--border-color)] rounded text-xs text-right"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">
                                                                                        {inputPricesWithTax ? 'Oferta (con IVA)' : 'Oferta (sin IVA)'}
                                                                                    </label>
                                                                                    <div className="relative">
                                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">$</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={variant.pricing?.list1?.offer || ''}
                                                                                            onChange={(e) => updateVariant(index, 'pricing', { 
                                                                                                ...variant.pricing, 
                                                                                                list1: { ...variant.pricing?.list1, offer: parseFloat(e.target.value) || null }
                                                                                            })}
                                                                                            className="w-full pl-5 pr-2 py-1.5 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded text-xs text-right"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {/* Preview precio final L1 */}
                                                                            {(variant.pricing?.list1?.price > 0) && (
                                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] bg-white dark:bg-secondary-800 rounded p-2">
                                                                                    {(() => {
                                                                                        const priceInput = parseFloat(variant.pricing?.list1?.price) || 0;
                                                                                        const discount = parseFloat(variant.pricing?.list1?.discount) || 0;
                                                                                        const offerInput = parseFloat(variant.pricing?.list1?.offer) || 0;
                                                                                        const tax = parseFloat(formData.pricing?.tax) || 0;
                                                                                        
                                                                                        // Si inputPricesWithTax es true, el precio ingresado incluye IVA
                                                                                        const priceWithTax = priceInput;
                                                                                        const offerWithTax = offerInput;
                                                                                        const priceWithoutTax = inputPricesWithTax ? priceWithTax / (1 + tax/100) : priceInput;
                                                                                        const offerWithoutTax = inputPricesWithTax && offerInput > 0 ? offerWithTax / (1 + tax/100) : offerInput;
                                                                                        
                                                                                        const baseForDiscountWithTax = offerWithTax > 0 ? offerWithTax : priceWithTax;
                                                                                        const baseForDiscountWithoutTax = offerWithoutTax > 0 ? offerWithoutTax : priceWithoutTax;
                                                                                        
                                                                                        let finalPriceWithoutTax, finalPriceWithTax;
                                                                                        if (inputPricesWithTax) {
                                                                                            finalPriceWithTax = baseForDiscountWithTax * (1 - discount/100);
                                                                                            finalPriceWithoutTax = finalPriceWithTax / (1 + tax/100);
                                                                                        } else {
                                                                                            finalPriceWithoutTax = baseForDiscountWithoutTax * (1 - discount/100);
                                                                                            finalPriceWithTax = finalPriceWithoutTax * (1 + tax/100);
                                                                                        }
                                                                                        
                                                                                        return (
                                                                                            <>
                                                                                                <span className="text-[var(--text-muted)]">Precio final:</span>
                                                                                                <span className="font-semibold text-[var(--text-primary)]">
                                                                                                    ${inputPricesWithTax ? finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : finalPriceWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                                                                                </span>
                                                                                                {offerInput > 0 && (
                                                                                                    <span className="text-warning-600">
                                                                                                        Oferta: ${inputPricesWithTax ? offerWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : offerWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                                                                                        {discount > 0 ? `(-${discount}%)` : ''}
                                                                                                    </span>
                                                                                                )}
                                                                                                {!offerInput > 0 && discount > 0 && (
                                                                                                    <span className="text-success-600">(-{discount}%)</span>
                                                                                                )}
                                                                                                {!inputPricesWithTax && (
                                                                                                    <span className="text-primary-600 font-medium">
                                                                                                        | Final + IVA: ${finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                                                                                    </span>
                                                                                                )}
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {/* Precios Lista 2 */}
                                                                        <div className="mb-4 p-3 bg-[var(--bg-hover)] rounded-lg">
                                                                            <h5 className="text-[10px] font-bold text-primary-600 uppercase mb-2">Lista 2</h5>
                                                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                                                <div>
                                                                                    <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">
                                                                                        {inputPricesWithTax ? 'Precio (con IVA)' : 'Precio (sin IVA)'}
                                                                                    </label>
                                                                                    <div className="relative">
                                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">$</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={variant.pricing?.list2?.price || ''}
                                                                                            onChange={(e) => updateVariant(index, 'pricing', { 
                                                                                                ...variant.pricing, 
                                                                                                list2: { ...variant.pricing?.list2, price: parseFloat(e.target.value) || 0 }
                                                                                            })}
                                                                                            className="w-full pl-5 pr-2 py-1.5 bg-white dark:bg-secondary-800 border border-[var(--border-color)] rounded text-xs text-right"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">Dto %</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        value={variant.pricing?.list2?.discount || ''}
                                                                                        onChange={(e) => updateVariant(index, 'pricing', { 
                                                                                            ...variant.pricing, 
                                                                                            list2: { ...variant.pricing?.list2, discount: parseFloat(e.target.value) || 0 }
                                                                                        })}
                                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-secondary-800 border border-[var(--border-color)] rounded text-xs text-right"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">
                                                                                        {inputPricesWithTax ? 'Oferta (con IVA)' : 'Oferta (sin IVA)'}
                                                                                    </label>
                                                                                    <div className="relative">
                                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">$</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={variant.pricing?.list2?.offer || ''}
                                                                                            onChange={(e) => updateVariant(index, 'pricing', { 
                                                                                                ...variant.pricing, 
                                                                                                list2: { ...variant.pricing?.list2, offer: parseFloat(e.target.value) || null }
                                                                                            })}
                                                                                            className="w-full pl-5 pr-2 py-1.5 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded text-xs text-right"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {/* Preview precio final L2 */}
                                                                            {(variant.pricing?.list2?.price > 0) && (
                                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] bg-white dark:bg-secondary-800 rounded p-2">
                                                                                    {(() => {
                                                                                        const priceInput = parseFloat(variant.pricing?.list2?.price) || 0;
                                                                                        const discount = parseFloat(variant.pricing?.list2?.discount) || 0;
                                                                                        const offerInput = parseFloat(variant.pricing?.list2?.offer) || 0;
                                                                                        const tax = parseFloat(formData.pricing?.tax) || 0;
                                                                                        
                                                                                        // Si inputPricesWithTax es true, el precio ingresado incluye IVA
                                                                                        const priceWithTax = priceInput;
                                                                                        const offerWithTax = offerInput;
                                                                                        const priceWithoutTax = inputPricesWithTax ? priceWithTax / (1 + tax/100) : priceInput;
                                                                                        const offerWithoutTax = inputPricesWithTax && offerInput > 0 ? offerWithTax / (1 + tax/100) : offerInput;
                                                                                        
                                                                                        const baseForDiscountWithTax = offerWithTax > 0 ? offerWithTax : priceWithTax;
                                                                                        const baseForDiscountWithoutTax = offerWithoutTax > 0 ? offerWithoutTax : priceWithoutTax;
                                                                                        
                                                                                        let finalPriceWithoutTax, finalPriceWithTax;
                                                                                        if (inputPricesWithTax) {
                                                                                            finalPriceWithTax = baseForDiscountWithTax * (1 - discount/100);
                                                                                            finalPriceWithoutTax = finalPriceWithTax / (1 + tax/100);
                                                                                        } else {
                                                                                            finalPriceWithoutTax = baseForDiscountWithoutTax * (1 - discount/100);
                                                                                            finalPriceWithTax = finalPriceWithoutTax * (1 + tax/100);
                                                                                        }
                                                                                        
                                                                                        return (
                                                                                            <>
                                                                                                <span className="text-[var(--text-muted)]">Precio final:</span>
                                                                                                <span className="font-semibold text-[var(--text-primary)]">
                                                                                                    ${inputPricesWithTax ? finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : finalPriceWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                                                                                </span>
                                                                                                {offerInput > 0 && (
                                                                                                    <span className="text-warning-600">
                                                                                                        Oferta: ${inputPricesWithTax ? offerWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2}) : offerWithoutTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                                                                                        {discount > 0 ? `(-${discount}%)` : ''}
                                                                                                    </span>
                                                                                                )}
                                                                                                {!offerInput > 0 && discount > 0 && (
                                                                                                    <span className="text-success-600">(-{discount}%)</span>
                                                                                                )}
                                                                                                {!inputPricesWithTax && (
                                                                                                    <span className="text-primary-600 font-medium">
                                                                                                        | Final + IVA: ${finalPriceWithTax.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                                                                                    </span>
                                                                                                )}
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {/* Activo */}
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={variant.active}
                                                                                onChange={(e) => updateVariant(index, 'active', e.target.checked)}
                                                                                className="w-4 h-4 rounded border-[var(--border-color)]"
                                                                            />
                                                                            <span className="text-xs text-[var(--text-secondary)]">Activo</span>
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* CÓDIGO VIEJO ELIMINADO */}

                                    {/* Imágenes del Producto */}
                                    <div className="bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)] p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                                <ImageIcon size={14} /> Imágenes del Producto
                                            </h4>
                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                {formData.images.length}/5
                                            </span>
                                        </div>

                                        {/* Grid de imágenes */}
                                        {formData.images.length > 0 && (
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                {formData.images.map((image, index) => (
                                                    <div 
                                                        key={image.publicId || index} 
                                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                                            index === formData.coverImageIndex 
                                                                ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900' 
                                                                : 'border-[var(--border-color)]'
                                                        }`}
                                                    >
                                                        <img 
                                                            src={image.url} 
                                                            alt={`Producto ${index + 1}`} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        
                                                        {/* Overlay con acciones */}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                            {/* Botón de portada */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetCoverImage(index)}
                                                                className={`p-2 rounded-full transition-colors ${
                                                                    index === formData.coverImageIndex
                                                                        ? 'bg-primary-500 text-white'
                                                                        : 'bg-white/90 text-[var(--text-primary)] hover:bg-white'
                                                                }`}
                                                                title={index === formData.coverImageIndex ? 'Imagen de portada' : 'Establecer como portada'}
                                                            >
                                                                <Star size={14} fill={index === formData.coverImageIndex ? 'currentColor' : 'none'} />
                                                            </button>
                                                            
                                                            {/* Botón de eliminar */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteImage(index)}
                                                                className="p-2 rounded-full bg-danger-500/90 text-white hover:bg-danger-500 transition-colors"
                                                                title="Eliminar imagen"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Badge de portada */}
                                                        {index === formData.coverImageIndex && (
                                                            <div className="absolute top-1 left-1 px-2 py-0.5 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                                                                <Star size={8} fill="currentColor" />
                                                                Portada
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Mensaje para producto nuevo */}
                                        {!isEditing && (
                                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 mb-4">
                                                <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                                                    Primero debes crear el producto para poder subir imágenes
                                                </p>
                                            </div>
                                        )}

                                        {/* Botón de subir */}
                                        {isEditing && formData.images.length < 5 && (
                                            <div className="flex justify-center">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    disabled={uploadingImage}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingImage}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] border-dashed rounded-xl text-sm text-[var(--text-secondary)] hover:text-primary-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {uploadingImage ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin" />
                                                            Subiendo...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={16} />
                                                            Agregar Imagen
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* Instrucciones */}
                                        <p className="text-[10px] text-[var(--text-muted)] mt-3 text-center">
                                            Formatos: JPG, PNG, WEBP • Máximo 1MB por imagen • Hasta 5 imágenes
                                        </p>
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex items-center justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={handleClose}
                                    className="text-[11px] font-bold uppercase tracking-wider"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    isLoading={loading}
                                    className="text-[11px] font-bold uppercase tracking-wider"
                                >
                                    <Save size={16} className="mr-2" />
                                    {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Confirm Close Modal */}
            <ConfirmCloseModal
                isOpen={showConfirmClose}
                onClose={() => setShowConfirmClose(false)}
                onConfirm={handleConfirmClose}
                hasChanges={hasChanges()}
            />
        </>,
        document.body
    );
};

export default ProductDrawer;
