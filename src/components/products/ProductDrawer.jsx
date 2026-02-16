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
    AlertTriangle
} from 'lucide-react';
import Button from '../common/Button';
import { 
    createProduct, 
    updateProduct, 
    checkCodeExists, 
    checkBarcodeExists,
    getCategories,
    getSubcategories,
    getBrands
} from '../../services/productService';
import { useToast } from '../../context/ToastContext';

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
    if (!isOpen) return null;
    
    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[170] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl max-w-md w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-warning-600 dark:text-warning-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                {hasChanges ? '¿Descartar cambios?' : '¿Cerrar formulario?'}
                            </h3>
                        </div>
                    </div>
                    
                    <p className="text-[var(--text-secondary)] text-sm mb-6">
                        {hasChanges 
                            ? 'Ha realizado cambios en el producto. Si cierra ahora, perderá toda la información ingresada.' 
                            : '¿Está seguro que desea cerrar el formulario?'}
                    </p>
                    
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            {hasChanges ? 'Continuar editando' : 'Cancelar'}
                        </Button>
                        <Button variant="danger" onClick={onConfirm}>
                            {hasChanges ? 'Descartar cambios' : 'Cerrar'}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

const ProductDrawer = ({ isOpen, onClose, onSave, product = null, features = {} }) => {
    const { addToast } = useToast();
    const isEditing = !!product;
    const hasPriceListsFeature = features.priceLists === true;
    const hasStockFeature = features.stock === true;

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
            list1: '',
            list2: '',
            offer: '',
            discount: '',
            tax: 21
        },
        stock: 0,
        image: '',
        unitsPerPackage: 1,
        minOrderQuantity: 1
    });

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

    // Reset form when drawer opens
    useEffect(() => {
        if (isOpen) {
            let newFormData;
            if (product) {
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
                        list1: product.pricing?.list1 || '',
                        list2: product.pricing?.list2 || '',
                        offer: product.pricing?.offer || '',
                        discount: product.pricing?.discount || '',
                        tax: product.pricing?.tax ?? 21
                    },
                    stock: product.stock || 0,
                    image: product.image || '',
                    unitsPerPackage: product.unitsPerPackage || 1,
                    minOrderQuantity: product.minOrderQuantity || 1
                };
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
                        list1: '',
                        list2: '',
                        offer: '',
                        discount: '',
                        tax: 21
                    },
                    stock: 0,
                    image: '',
                    unitsPerPackage: 1,
                    minOrderQuantity: 1
                };
            }
            setFormData(newFormData);
            initialDataRef.current = JSON.stringify(newFormData);
            setErrors({});
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
        if (!formData.pricing.list1 || formData.pricing.list1 <= 0) {
            newErrors.list1 = 'El precio lista 1 es requerido';
        }
        
        const barcodeError = await validateBarcode(formData.barcode);
        if (barcodeError) newErrors.barcode = barcodeError;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = await validate();
        if (!isValid) return;

        setLoading(true);
        try {
            const data = {
                ...formData,
                code: formData.code.toUpperCase(),
                pricing: {
                    list1: parseFloat(formData.pricing.list1) || 0,
                    list2: parseFloat(formData.pricing.list2) || 0,
                    offer: parseFloat(formData.pricing.offer) || 0,
                    discount: parseFloat(formData.pricing.discount) || 0,
                    tax: parseFloat(formData.pricing.tax) || 0
                },
                stock: parseInt(formData.stock) || 0,
                unitsPerPackage: parseInt(formData.unitsPerPackage) || 1,
                minOrderQuantity: parseInt(formData.minOrderQuantity) || 1
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

    const handlePricingChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            pricing: { ...prev.pricing, [field]: value }
        }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleCategoryChange = (value) => {
        handleChange('category', value);
        handleChange('subcategory', '');
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
                            className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[150]"
                            onClick={handleClose}
                        />
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[600px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[160] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
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

                                    {/* Precios */}
                                    <div className="bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)] p-4 space-y-4">
                                        <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <DollarSign size={14} /> Precios
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Lista 1 *</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.pricing.list1}
                                                        onChange={(e) => handlePricingChange('list1', e.target.value)}
                                                        className={`w-full pl-8 pr-3 py-2.5 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors ${
                                                            errors.list1 ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                        }`}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                {errors.list1 && <p className="text-danger-500 text-xs mt-1">{errors.list1}</p>}
                                            </div>
                                            
                                            {hasPriceListsFeature && (
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Lista 2</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={formData.pricing.list2}
                                                            onChange={(e) => handlePricingChange('list2', e.target.value)}
                                                            className="w-full pl-8 pr-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Precio Oferta</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.pricing.offer}
                                                        onChange={(e) => handlePricingChange('offer', e.target.value)}
                                                        className="w-full pl-8 pr-3 py-2.5 bg-warning-50 dark:bg-warning-900/20 border border-warning-100 dark:border-warning-800 rounded-lg text-sm text-warning-700 dark:text-warning-400 focus:outline-none focus:border-warning-500 transition-colors"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Descuento %</label>
                                                <div className="relative">
                                                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-success-600" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        value={formData.pricing.discount}
                                                        onChange={(e) => handlePricingChange('discount', e.target.value)}
                                                        className="w-full pl-8 pr-3 py-2.5 bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 rounded-lg text-sm text-success-700 dark:text-success-400 focus:outline-none focus:border-success-500 transition-colors"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">IVA %</label>
                                                <div className="relative">
                                                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        value={formData.pricing.tax}
                                                        onChange={(e) => handlePricingChange('tax', e.target.value)}
                                                        className="w-full pl-8 pr-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 transition-colors"
                                                        placeholder="21"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock y Configuración de Pedidos */}
                                    <div className="bg-[var(--bg-hover)] rounded-2xl border border-[var(--border-color)] p-4">
                                        <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-4">
                                            <Boxes size={14} /> Configuración de Pedidos
                                        </h4>
                                        
                                        <div className="grid grid-cols-3 gap-4">
                                            {hasStockFeature && (
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Stock Disponible</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.stock}
                                                        onChange={(e) => handleChange('stock', e.target.value)}
                                                        className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Unidades por Bulto</label>
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
                                                <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Cantidad Mínima</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.minOrderQuantity}
                                                    onChange={(e) => handleChange('minOrderQuantity', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                        
                                        {(formData.unitsPerPackage > 1 || formData.minOrderQuantity > 1) && (
                                            <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    <span className="font-semibold text-primary-700 dark:text-primary-400">Información de pedido:</span>
                                                    {formData.unitsPerPackage > 1 && (
                                                        <span className="ml-1">Se vende por bultos de <strong>{formData.unitsPerPackage}</strong> unidades.</span>
                                                    )}
                                                    {formData.minOrderQuantity > 1 && (
                                                        <span className="ml-1">Mínimo de pedido: <strong>{formData.minOrderQuantity}</strong> unidades.</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Imagen URL */}
                                    <div>
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            <ImageIcon size={12} /> URL de Imagen
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.image}
                                            onChange={(e) => handleChange('image', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 transition-colors"
                                            placeholder="https://ejemplo.com/imagen.jpg"
                                        />
                                        {formData.image && (
                                            <div className="mt-3 aspect-video bg-[var(--bg-hover)] rounded-xl overflow-hidden border border-[var(--border-color)]">
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
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
