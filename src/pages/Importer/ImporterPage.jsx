import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle,
    AlertCircle,
    X,
    DollarSign,
    Package,
    AlertTriangle,
    CheckSquare,
    FileWarning,
    Settings,
    ArrowRight,
    Save
} from 'lucide-react';
import Button from '../../components/common/Button';
import { exportProducts, validateImportProducts, importProducts, detectColumns } from '../../services/productService';
import { companyService } from '../../services/companyService';

const ImporterPage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    // Solo importación de productos
    
    // Estados para el preview de importación
    const [validationResult, setValidationResult] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    // Estados para el mapeo de columnas (modo standard)
    const [showMapping, setShowMapping] = useState(false);
    const [detectedColumns, setDetectedColumns] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [detectingColumns, setDetectingColumns] = useState(false);
    const [detectedFormat, setDetectedFormat] = useState('standard'); // Formato detectado por el backend
    
    // Opción para Winmak: usar lookup de categorías (rubros/subrubros del archivo)
    const [useCategoryLookup, setUseCategoryLookup] = useState(
        user?.company?.importConfig?.winmak?.useCategoryLookup !== false // true por defecto
    );
    
    // Usar el formato configurado en la compañía como default
    const companyFormat = user?.company?.importConfig?.format || 'standard';

    const isAdmin = user?.role?.name === 'admin';
    const features = user?.company?.features || {};

    // Solo importación de productos (simplificado)
    const importType = 'products';

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
                addToast('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV', 'error');
                return;
            }
            setSelectedFile(file);
            setValidationResult(null);
            setShowConfirmation(false);
            setShowMapping(false);
            
            // Detectar columnas para mapeo (tanto standard como winmak)
            if (importType === 'products') {
                await detectFileColumns(file);
            }
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
                addToast('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV', 'error');
                return;
            }
            setSelectedFile(file);
            setValidationResult(null);
            setShowConfirmation(false);
            setShowMapping(false);
            
            // Detectar columnas para mapeo (tanto standard como winmak)
            if (importType === 'products') {
                await detectFileColumns(file);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setValidationResult(null);
        setShowConfirmation(false);
        setShowMapping(false);
        setDetectedColumns([]);
        setColumnMapping({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Detectar columnas del archivo para mapeo
    const detectFileColumns = async (file) => {
        setDetectingColumns(true);
        try {
            const result = await detectColumns(file);
            setDetectedColumns(result.columns || []);
            
            // Usar el formato detectado por el backend o el de la compañía
            const format = result.format || companyFormat;
            setDetectedFormat(format);
            
            // Obtener el mapeo guardado directamente del user (PRIORIDAD #1)
            const rawMapping = user?.company?.importConfig?.columnMapping || {};
            const mappingFromUser = rawMapping instanceof Map ? Object.fromEntries(rawMapping) : rawMapping;
            
            console.log('=== DETECT FILE COLUMNS ===');
            console.log('User company importConfig:', user?.company?.importConfig);
            console.log('Raw mapping from DB:', rawMapping);
            console.log('Parsed mapping:', mappingFromUser);
            console.log('Has keys:', Object.keys(mappingFromUser).length);
            
            // SIEMPRE dar prioridad al mapeo guardado de la compañía
            const hasSavedMapping = mappingFromUser && 
                                   Object.keys(mappingFromUser).length > 0 &&
                                   Object.values(mappingFromUser).some(v => v && v.trim && v.trim() !== '');
            
            if (hasSavedMapping) {
                console.log('✅ USING SAVED MAPPING (PRIORITY):', mappingFromUser);
                setColumnMapping({...mappingFromUser});
            } else {
                console.log('⚠️ No saved mapping found, auto-detecting...');
                const autoMapping = autoDetectMapping(result.columns);
                console.log('Auto-detected mapping:', autoMapping);
                setColumnMapping(autoMapping);
            }
            
            setShowMapping(true);
        } catch (error) {
            console.error('Error detecting columns:', error);
            addToast('Error al detectar columnas del archivo', 'error');
        } finally {
            setDetectingColumns(false);
        }
    };

    // Auto-detectar mapeo basado en coincidencias de nombres
    const autoDetectMapping = (columns) => {
        const mapping = {};
        const fieldPatterns = {
            code: ['codigo', 'code', 'id', 'sku', 'articulo', 'producto'],
            name: ['nombre', 'name', 'producto', 'articulo'],
            description: ['descripcion', 'descripción', 'description', 'desc', 'detalle'],
            longDescription: ['descripcion larga', 'desc larga', 'detalle largo', 'long desc'],
            category: ['categoria', 'category', 'rubro', 'tipo', 'familia'],
            subcategory: ['subcategoria', 'subcategory', 'subrubro'],
            brand: ['marca', 'brand', 'proveedor', 'fabricante'],
            barcode: ['barra', 'barcode', 'ean', 'codbarra', 'codigo barra'],
            unit: ['unidad', 'unit', 'medida'],
            priceList1: ['precio l1', 'precio1', 'precio 1', 'precio', 'price', 'costo'],
            discountL1: ['descuento l1', 'desc l1', 'dto l1', 'descuento 1'],
            offerL1: ['oferta l1', 'oferta 1', 'promo l1'],
            priceList2: ['precio l2', 'precio2', 'precio 2'],
            discountL2: ['descuento l2', 'desc l2', 'dto l2', 'descuento 2'],
            offerL2: ['oferta l2', 'oferta 2', 'promo l2'],
            stock: ['stock', 'cantidad', 'quantity', 'existencia'],
            minStock: ['stock minimo', 'stock min', 'minimo stock'],
            taxRate: ['iva', 'tax', 'impuesto'],
            unitsPerPackage: ['unidades por bulto', 'uxb', 'unidad bulto'],
            minOrderQuantity: ['minimo venta', 'min order', 'cantidad minima'],
            active: ['activo', 'active', 'estado', 'habilitado'],
            isVariant: ['es variante', 'variante'],
            hasUniformVariantPricing: ['precio uniforme', 'uniforme'],
            variable1: ['label variable 1', 'variable 1 label', 'label var 1'],
            variable2: ['label variable 2', 'variable 2 label', 'label var 2'],
            sku: ['sku', 'codigo variante'],
            value1: ['valor variable 1', 'valor var 1', 'valor1'],
            value2: ['valor variable 2', 'valor var 2', 'valor2'],
            variantPriceL1: ['precio var l1', 'precio variante l1'],
            variantDiscountL1: ['desc var l1', 'descuento var l1'],
            variantOfferL1: ['oferta var l1', 'promo var l1'],
            variantPriceL2: ['precio var l2', 'precio variante l2'],
            variantDiscountL2: ['desc var l2', 'descuento var l2'],
            variantOfferL2: ['oferta var l2', 'promo var l2'],
            variantStock: ['stock var', 'stock variante'],
            variantMinStock: ['stock min var', 'min stock var']
        };

        columns.forEach(col => {
            const colLower = col.toLowerCase().trim();
            for (const [field, patterns] of Object.entries(fieldPatterns)) {
                // Solo asignar si no hay un mapeo previo para este campo
                if (!mapping[field] && patterns.some(p => colLower.includes(p))) {
                    mapping[field] = col;
                    break;
                }
            }
        });

        return mapping;
    };

    // Guardar mapeo en la compañía
    const handleSaveMapping = async () => {
        try {
            // Determinar el formato a guardar (el detectado o el de la compañía)
            const formatToSave = detectedFormat || companyFormat || 'standard';
            
            const configToSave = {
                format: formatToSave,
                columnMapping: columnMapping
            };
            
            // Si es Winmak, también guardar la config específica
            if (formatToSave === 'winmak') {
                configToSave.winmak = {
                    ...(user?.company?.importConfig?.winmak || {}),
                    useCategoryLookup: useCategoryLookup
                };
            }
            
            await companyService.updateImportConfig(user.company._id, configToSave);
            
            // Actualizar el user en el context para reflejar el nuevo mapeo
            if (user?.company) {
                user.company.importConfig = {
                    ...user.company.importConfig,
                    ...configToSave
                };
            }
            addToast('Mapeo guardado exitosamente', 'success');
        } catch (error) {
            console.error('Error saving mapping:', error);
            addToast('Error al guardar el mapeo', 'error');
        }
    };

    // Continuar con la validación después del mapeo
    const handleContinueWithMapping = () => {
        setShowMapping(false);
        // El mapeo se usará en la validación
    };

    const handleDownloadTemplate = async () => {
        if (importType === 'products') {
            try {
                addToast('Descargando plantilla...', 'info');
                const blob = await exportProducts(true); // true = plantilla vacía
                
                const url = window.URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `plantilla_productos_${new Date().toISOString().split('T')[0]}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                addToast('Plantilla descargada exitosamente', 'success');
            } catch (error) {
                console.error('Error downloading template:', error);
                addToast('Error al descargar plantilla', 'error');
            }
        } else {
            addToast('Descargando plantilla de productos...', 'info');
        }
    };

    const handleDownloadProducts = async () => {
        try {
            addToast('Descargando productos...', 'info');
            const blob = await exportProducts();
            
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            addToast('Productos descargados exitosamente', 'success');
        } catch (error) {
            console.error('Error downloading products:', error);
            addToast('Error al descargar productos', 'error');
        }
    };

    const handleValidate = async () => {
        if (!selectedFile || importType !== 'products') return;

        setValidating(true);
        setValidationResult(null);
        
        try {
            // Usar el formato detectado o el de la compañía
            const currentFormat = detectedFormat || companyFormat;
            
            // Preparar opciones según el formato
            const options = {};
            
            // Enviar el mapeo si existe (para cualquier formato)
            if (Object.keys(columnMapping).length > 0) {
                options.columnMapping = columnMapping;
            }
            
            // Para Winmak, enviar la opción de lookup de categorías
            if (currentFormat === 'winmak') {
                options.useCategoryLookup = useCategoryLookup;
            }
            
            const result = await validateImportProducts(selectedFile, options);
            setValidationResult(result);
            
            if (result.success) {
                setShowConfirmation(true);
                addToast('Validación completada. Revisa el resumen antes de confirmar.', 'success');
            } else {
                addToast(`Se encontraron ${result.summary?.errors || result.errors?.length || 0} errores`, 'error');
            }
        } catch (error) {
            console.error('Error validating file:', error);
            console.log('Error response data:', error.response?.data);
            
            // Si el backend devuelve errores de validación, mostrarlos
            if (error.response?.data?.errors || error.response?.data?.summary?.errors > 0) {
                const errorData = {
                    success: false,
                    errors: error.response.data.errors || [],
                    summary: error.response.data.summary || { errors: error.response.data.errors?.length || 0 }
                };
                console.log('Setting validation result with errors:', errorData);
                setValidationResult(errorData);
                addToast(`Se encontraron ${errorData.summary.errors} errores`, 'error');
            } else {
                addToast(error.response?.data?.message || 'Error al validar el archivo', 'error');
            }
        } finally {
            setValidating(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!selectedFile) return;

        setUploading(true);
        
        try {
            // Preparar opciones según el formato
            const currentFormat = detectedFormat || companyFormat;
            const options = {};
            
            // Enviar el mapeo si existe
            if (Object.keys(columnMapping).length > 0) {
                options.columnMapping = columnMapping;
            }
            
            // Para Winmak, enviar la opción de lookup de categorías
            if (currentFormat === 'winmak') {
                options.useCategoryLookup = useCategoryLookup;
            }
            
            const result = await importProducts(selectedFile, options);
            
            if (result.success) {
                addToast(
                    `Importación completada: ${result.results.created} creados, ${result.results.updated} actualizados`,
                    'success'
                );
                
                // Limpiar estado
                setSelectedFile(null);
                setValidationResult(null);
                setShowConfirmation(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            console.error('Error importing file:', error);
            addToast(error.response?.data?.message || 'Error al importar el archivo', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCancelConfirmation = () => {
        setShowConfirmation(false);
        setValidationResult(null);
    };

    // Verificar acceso
    if (!isAdmin || features.importer !== true) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-[var(--text-muted)] text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <h2 className="text-lg font-semibold mb-2">Acceso Restringido</h2>
                    <p className="text-sm">No tienes permiso para acceder a esta sección o el módulo no está habilitado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    Importador
                </h1>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 font-medium">
                    Importa datos masivamente desde archivos Excel o CSV.
                </p>
            </div>

            <div className="space-y-6">
                    {/* Indicador de configuración de IVA - Solo para productos */}
                    {importType === 'products' && (
                        <div className={`rounded-xl p-4 border ${user?.company?.inputPricesWithTax 
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
                            : 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'}`}>
                            <div className="flex items-start gap-3">
                                <DollarSign size={16} className={`mt-0.5 ${user?.company?.inputPricesWithTax ? 'text-amber-600' : 'text-success-600'}`} />
                                <div>
                                    <p className={`text-[12px] font-semibold mb-1 ${user?.company?.inputPricesWithTax ? 'text-amber-700 dark:text-amber-300' : 'text-success-700 dark:text-success-300'}`}>
                                        Configuración de Precios
                                    </p>
                                    <p className={`text-[11px] leading-relaxed ${user?.company?.inputPricesWithTax ? 'text-amber-600 dark:text-amber-400' : 'text-success-600 dark:text-success-400'}`}>
                                        {user?.company?.inputPricesWithTax 
                                            ? 'Tu empresa está configurada para cargar precios CON IVA incluido. En la planilla, ingresa los precios finales con IVA.' 
                                            : 'Tu empresa está configurada para cargar precios SIN IVA. En la planilla, ingresa los precios base sin impuestos.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                        <div className="p-5">
                            <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Upload size={14} />
                                Subir Archivo
                            </h3>

                            {/* Nota para formato Winmak */}
                            {(detectedFormat === 'winmak' || companyFormat === 'winmak') && selectedFile && (
                                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-[12px] text-amber-700 dark:text-amber-400">
                                        <strong>Formato Winmak detectado:</strong> Las columnas son fijas (Código de Articulo, Descripcion, Precio 1, etc.) y los lookups de rubros/subrubros se aplican automáticamente. No es necesario configurar mapeo.
                                    </p>
                                </div>
                            )}

                            {/* Drop Zone */}
                            {!selectedFile ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className="border-2 border-dashed border-[var(--border-color)] hover:border-primary-400 rounded-xl p-10 text-center cursor-pointer transition-all duration-200 hover:bg-primary-50/30 dark:hover:bg-primary-900/10"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                                        <FileSpreadsheet size={28} className="text-primary-600" />
                                    </div>
                                    <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
                                        Arrastra un archivo aquí o haz clic para seleccionar
                                    </p>
                                    <p className="text-[12px] text-[var(--text-muted)]">
                                        Formatos soportados: .xlsx, .xls, .csv
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <FileSpreadsheet size={24} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)]">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveFile}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-[var(--text-muted)] hover:text-red-600 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* UI de Mapeo de Columnas */}
                            <AnimatePresence>
                                {showMapping && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 border-t border-[var(--border-color)] pt-4"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <Settings size={16} className="text-primary-600" />
                                            <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">
                                                Mapeo de Columnas
                                            </h4>
                                            {(() => {
                                                const raw = user?.company?.importConfig?.columnMapping || {};
                                                const mapping = raw instanceof Map ? Object.fromEntries(raw) : raw;
                                                return mapping && Object.keys(mapping).length > 0;
                                            })() && (
                                                <span className="text-[10px] bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
                                                    Mapeo guardado
                                                </span>
                                            )}
                                        </div>
                                        
                                        {detectedFormat === 'winmak' && (
                                            <div className="mb-3">
                                                <div className="p-2 bg-info-50 border border-info-200 rounded text-[11px] text-info-700 mb-2">
                                                    <strong>Formato Winmak detectado.</strong> Algunos campos usan valores por defecto:
                                                    <span className="block mt-1">• Marca: vacío • IVA: {user?.company?.taxRate || 21}% • Activo: SI</span>
                                                </div>
                                                <label className="flex items-center gap-2 text-[11px] text-[var(--text-primary)] cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={useCategoryLookup}
                                                        onChange={(e) => setUseCategoryLookup(e.target.checked)}
                                                        className="rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span>Resolver categorías desde rubros/subrubros del archivo</span>
                                                </label>
                                            </div>
                                        )}
                                        
                                        <p className="text-[11px] text-[var(--text-muted)] mb-3">
                                            Asigna cada columna de tu archivo al campo correspondiente en NOVA:
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                                            {[
                                                // CÓDIGO Y NOMBRE
                                                { key: 'code', label: 'Código', required: true },
                                                { key: 'name', label: 'Nombre', required: true },
                                                
                                                // DESCRIPCIONES
                                                { key: 'description', label: 'Descripción', required: false },
                                                { key: 'longDescription', label: 'Descripción Larga', required: false },
                                                
                                                // CATEGORIZACIÓN
                                                { key: 'category', label: 'Categoría', required: false },
                                                { key: 'subcategory', label: 'Subcategoría', required: false },
                                                { key: 'brand', label: 'Marca', required: false },
                                                { key: 'barcode', label: 'Código de Barras', required: false },
                                                { key: 'unit', label: 'Unidad', required: false },
                                                
                                                // PRECIOS LISTA 1
                                                { key: 'priceList1', label: 'Precio L1', required: false },
                                                { key: 'discountL1', label: 'Descuento L1 %', required: false },
                                                { key: 'offerL1', label: 'Oferta L1', required: false },
                                                
                                                // PRECIOS LISTA 2
                                                { key: 'priceList2', label: 'Precio L2', required: false },
                                                { key: 'discountL2', label: 'Descuento L2 %', required: false },
                                                { key: 'offerL2', label: 'Oferta L2', required: false },
                                                
                                                // STOCK Y CONFIG
                                                { key: 'stock', label: 'Stock', required: false },
                                                { key: 'minStock', label: 'Stock Mínimo', required: false, hint: 'Por defecto: 1' },
                                                { key: 'taxRate', label: 'IVA (%)', required: false, 
                                                  hint: `Por defecto: ${user?.company?.taxRate || 21}%` },
                                                { key: 'unitsPerPackage', label: 'Unid. por Bulto', required: false, hint: 'Por defecto: 1' },
                                                { key: 'minOrderQuantity', label: 'Mín. de Venta', required: false, hint: 'Por defecto: 1' },
                                                { key: 'active', label: 'Activo (SI/NO)', required: false, hint: 'Por defecto: SI' },
                                                
                                                // SEPARADOR
                                                { key: '_separator', label: '────────── VARIANTES ──────────', isSeparator: true },
                                                
                                                // VARIANTES - CONFIG
                                                { key: 'isVariant', label: 'Es Variante (SI/NO)', required: false, hint: 'Por defecto: NO' },
                                                { key: 'hasUniformVariantPricing', label: 'Precio Uniforme (SI/NO)', required: false },
                                                { key: 'variable1', label: 'Label Variable 1', required: false },
                                                { key: 'variable2', label: 'Label Variable 2', required: false },
                                                
                                                // VARIANTES - DATOS
                                                { key: 'sku', label: 'SKU Variante', required: false },
                                                { key: 'value1', label: 'Valor Variable 1', required: false },
                                                { key: 'value2', label: 'Valor Variable 2', required: false },
                                                { key: 'variantPriceL1', label: 'Precio Var. L1', required: false },
                                                { key: 'variantDiscountL1', label: 'Desc. Var. L1 %', required: false },
                                                { key: 'variantOfferL1', label: 'Oferta Var. L1', required: false },
                                                { key: 'variantPriceL2', label: 'Precio Var. L2', required: false },
                                                { key: 'variantDiscountL2', label: 'Desc. Var. L2 %', required: false },
                                                { key: 'variantOfferL2', label: 'Oferta Var. L2', required: false },
                                                { key: 'variantStock', label: 'Stock Variante', required: false },
                                                { key: 'variantMinStock', label: 'Stock Mín. Variante', required: false, hint: 'Por defecto: 1' },
                                            ].map((field) => (
                                                field.isSeparator ? (
                                                    <div key={field.key} className="col-span-2 py-2 border-t border-[var(--border-color)]">
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                            {field.label}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div key={field.key} className="flex items-center gap-2">
                                                        <label className="text-[11px] font-medium text-[var(--text-secondary)] w-28 shrink-0 flex flex-col">
                                                            <span>{field.label}</span>
                                                            {field.hint && (
                                                                <span className="text-[9px] text-[var(--text-muted)] font-normal">
                                                                    {field.hint}
                                                                </span>
                                                            )}
                                                        </label>
                                                        <select
                                                            value={columnMapping[field.key] || ''}
                                                            onChange={(e) => setColumnMapping(prev => ({ 
                                                                ...prev, 
                                                                [field.key]: e.target.value 
                                                            }))}
                                                            className="flex-1 px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                                                        >
                                                            <option value="">-- Sin asignar --</option>
                                                            {detectedColumns.map(col => (
                                                                <option key={col} value={col}>{col}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row gap-2 mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={handleDownloadTemplate}
                                    className="flex-1 text-[13px] font-normal py-2"
                                >
                                    <Download size={14} className="mr-1.5" />
                                    Descargar Plantilla
                                </Button>
                                {(
                                    <Button
                                        variant="secondary"
                                        onClick={handleDownloadProducts}
                                        className="flex-1 text-[13px] font-normal py-2"
                                    >
                                        <Package size={14} className="mr-1.5" />
                                        Descargar Productos Actuales
                                    </Button>
                                )}
                                
                                {importType === 'products' ? (
                                    showMapping ? (
                                        <>
                                            <Button
                                                variant="secondary"
                                                onClick={() => setShowMapping(false)}
                                                className="flex-1"
                                            >
                                                <X size={16} className="mr-2" />
                                                Ocultar Mapeo
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={handleSaveMapping}
                                                className="flex-1"
                                            >
                                                <Save size={16} className="mr-2" />
                                                Guardar Mapeo
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={handleContinueWithMapping}
                                                className="flex-1"
                                            >
                                                <ArrowRight size={16} className="mr-2" />
                                                Continuar
                                            </Button>
                                        </>
                                    ) : showConfirmation ? (
                                        <>
                                            <Button
                                                variant="secondary"
                                                onClick={handleCancelConfirmation}
                                                className="flex-1 text-[13px] font-normal py-2"
                                            >
                                                <X size={14} className="mr-1.5" />
                                                Cancelar
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={handleConfirmImport}
                                                loading={uploading}
                                                className="flex-1 text-[13px] font-normal py-2"
                                            >
                                                <CheckCircle size={14} className="mr-1.5" />
                                                Confirmar Importación
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            onClick={handleValidate}
                                            loading={validating || detectingColumns}
                                            disabled={!selectedFile || showMapping}
                                            className="flex-1 text-[13px] font-normal py-2"
                                        >
                                            <FileWarning size={14} className="mr-1.5" />
                                            {validating ? 'Validando...' : detectingColumns ? 'Detectando columnas...' : 'Validar Importación'}
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={handleValidate}
                                        loading={validating}
                                        disabled={!selectedFile}
                                        className="flex-1 text-[13px] font-normal py-2"
                                    >
                                        <Upload size={14} className="mr-1.5" />
                                        {validating ? 'Importando...' : 'Importar Datos'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resultado de validación */}
                    <AnimatePresence>
                        {validationResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]"
                            >
                                <div className="p-5">
                                    <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        {validationResult.success ? (
                                            <>
                                                <CheckCircle size={14} className="text-success-600" />
                                                Resumen de Importación
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle size={14} className="text-danger-600" />
                                                Errores Encontrados
                                            </>
                                        )}
                                    </h3>

                                    {validationResult.success ? (
                                        <div className="space-y-4">
                                            {/* Resumen numérico */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-center">
                                                    <p className="text-2xl font-bold text-primary-600">
                                                        {validationResult.summary?.total || 0}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)]">Total filas</p>
                                                </div>
                                                <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-4 text-center">
                                                    <p className="text-2xl font-bold text-success-600">
                                                        {validationResult.summary?.toCreate || 0}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)]">Nuevos</p>
                                                </div>
                                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                                                    <p className="text-2xl font-bold text-amber-600">
                                                        {validationResult.summary?.toUpdate || 0}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)]">A actualizar</p>
                                                </div>
                                            </div>

                                            {/* Lista de productos nuevos */}
                                            {validationResult.summary?.newProducts?.length > 0 && (
                                                <div>
                                                    <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">
                                                        Productos a crear ({validationResult.summary.newProducts.length})
                                                    </p>
                                                    <div className="max-h-32 overflow-y-auto bg-[var(--bg-hover)] rounded-lg p-2">
                                                        {validationResult.summary.newProducts.map((p, i) => (
                                                            <div key={i} className="text-[11px] py-1 flex items-center gap-2">
                                                                <span className="font-mono bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded text-primary-700">
                                                                    {p.code}
                                                                </span>
                                                                <span className="text-[var(--text-secondary)] truncate">
                                                                    {p.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Lista de productos a actualizar */}
                                            {validationResult.summary?.updatedProducts?.length > 0 && (
                                                <div>
                                                    <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">
                                                        Productos a actualizar ({validationResult.summary.updatedProducts.length})
                                                    </p>
                                                    <div className="max-h-32 overflow-y-auto bg-[var(--bg-hover)] rounded-lg p-2">
                                                        {validationResult.summary.updatedProducts.map((p, i) => (
                                                            <div key={i} className="text-[11px] py-1 flex items-center gap-2">
                                                                <span className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-amber-700">
                                                                    {p.code}
                                                                </span>
                                                                <span className="text-[var(--text-secondary)] truncate">
                                                                    {p.name}
                                                                    {p.isVariant && <span className="text-[10px] text-amber-600 ml-1">(variante)</span>}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-4 border border-success-200 dark:border-success-800">
                                                <div className="flex items-start gap-3">
                                                    <CheckSquare size={16} className="text-success-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-[12px] font-semibold text-success-700 dark:text-success-300">
                                                            Validación exitosa
                                                        </p>
                                                        <p className="text-[11px] text-success-600 dark:text-success-400">
                                                            No se encontraron errores. Revisa el resumen y confirma para proceder con la importación.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl p-4 border border-danger-200 dark:border-danger-800">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle size={16} className="text-danger-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-[12px] font-semibold text-danger-700 dark:text-danger-300">
                                                            Se encontraron {validationResult.summary?.errors || validationResult.errors?.length || 0} errores
                                                        </p>
                                                        <p className="text-[11px] text-danger-600 dark:text-danger-400">
                                                            Corrige los errores en la planilla y vuelve a intentarlo.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="max-h-64 overflow-y-auto bg-[var(--bg-hover)] rounded-lg p-3 space-y-2">
                                                {validationResult.errors?.map((error, i) => (
                                                    <div key={i} className="text-[11px] py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-danger-200 dark:border-danger-800">
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle size={12} className="text-danger-500 mt-0.5" />
                                                            <div>
                                                                <span className="font-semibold text-danger-600">{error.type}</span>
                                                                <p className="text-[var(--text-secondary)] mt-0.5">{error.message}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
    );
};

export default ImporterPage;
