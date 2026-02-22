import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    ShoppingBag,
    FileText,
    X,
    Calculator,
    Loader2
} from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useNavigationGuard } from '../../context/NavigationGuardContext';
import { useToast } from '../../context/ToastContext';
import { getClients, getProducts, getSellers, createOrder, updateOrder } from '../../services/orderService';
import ProductQuickView from '../products/ProductQuickView';
import CartDrawer from './CartDrawer';
import ClientSelection from './ClientSelection';
import PriceListSelection from './PriceListSelection';
import ProductCatalog from './ProductCatalog';
import BudgetSummary from './BudgetSummary';
import ConfirmModal from '../common/ConfirmModal';

const BudgetDrawer = ({ isOpen, onClose, onSave, order = null, mode = 'create', type = 'budget', readOnly = false }) => {
    const { user, loading: authLoading } = useAuth();
    const { setNavigationBlocked, navigationBlocked } = useNavigationGuard();
    const { addToast } = useToast();
    
    const features = user?.company?.features || {};
    const showPricesWithTax = user?.company?.showPricesWithTax === true;
    const taxRate = user?.company?.defaultTaxRate || 21;
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isVendedor = user?.role?.name === 'vendedor';
    const isClient = user?.role?.name === 'cliente';
    const isViewMode = mode === 'view';
    const effectiveReadOnly = readOnly || isViewMode; // Solo lectura si es superadmin o modo view
    const canChangeSeller = isAdmin && !effectiveReadOnly; // Solo admin puede cambiar vendedor, y solo si no es solo lectura
    
    // Permisos de edición de descuentos
    const canEditProductDiscount = isAdmin || isSuperadmin || user?.canEditProductDiscount !== false;
    const canEditBudgetDiscount = isAdmin || isSuperadmin || user?.canEditBudgetDiscount !== false;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    // Drawer States
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Form Data
    const [selectedClient, setSelectedClient] = useState(null);
    const [items, setItems] = useState([]);
    const [header, setHeader] = useState({
        date: new Date().toISOString().split('T')[0],
        salesRepId: '',
        priceList: features.priceLists ? null : 1,
        discount: 0,
        notes: ''
    });
    
    // Commission state - se carga del order al editar, o del vendedor al crear
    const [commissionRate, setCommissionRate] = useState(0);

    // Lists
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);
    
    // Cargar comisión del vendedor seleccionado en modo creación
    useEffect(() => {
        if (mode === 'create' && header.salesRepId && sellers.length > 0) {
            const selectedSeller = sellers.find(s => s._id === header.salesRepId);
            if (selectedSeller && selectedSeller.commission) {
                setCommissionRate(selectedSeller.commission);
            }
        }
    }, [header.salesRepId, sellers, mode]);
    
    const [searchQuery, setSearchQuery] = useState('');
    
    // Configuración congelada del pedido (para edición)
    const orderConfig = order?.excludeOfferProductsFromGlobalDiscount !== undefined 
        ? { excludeOfferProductsFromGlobalDiscount: order.excludeOfferProductsFromGlobalDiscount }
        : user?.company;
    
    // Product Pagination
    const [productPage, setProductPage] = useState(1);
    const [productPagination, setProductPagination] = useState({ total: 0, totalPages: 1 });
    
    // Stock validation errors
    const [stockErrors, setStockErrors] = useState([]);

    // Data Loss Protection
    const isDirty = items.length > 0 || selectedClient !== null;

    // Reset state when drawer opens/closes or order changes
    useEffect(() => {
        if (isOpen) {
            // Limpiar errores de stock al abrir
            setStockErrors([]);
            
            if (order && (mode === 'edit' || mode === 'view')) {
                // Pre-fill for edit
                setSelectedClient(order.clientId);
                setItems(order.items.map(item => {
                    const product = item.productId || {};
                    
                    return {
                        lineId: item.lineId || `${(product._id || item.productId)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        productId: product._id || item.productId,
                        name: product.name || item.name || 'Producto',
                        code: product.code || item.code || '',
                        quantity: item.quantity,
                        listPrice: item.listPrice,
                        discount: item.discount || 0,
                        variantId: item.variantId || null,
                        variantName: item.variantName || null,
                        hasOffer: item.hasOffer || false
                    };
                }));
                setHeader({
                    date: new Date(order.date).toISOString().split('T')[0],
                    salesRepId: order.salesRepId?._id || order.salesRepId || '',
                    priceList: order.priceList || 1,
                    discount: order.discount || 0,
                    notes: order.notes || ''
                });
                // Cargar comisión del order (si existe) o del vendedor
                setCommissionRate(order.commissionRate || 0);
                setStep(3); // Go straight to summary when editing
            } else {
                // Reset for create
                setItems([]);
                setProductPage(1);
                setHeader({
                    date: new Date().toISOString().split('T')[0],
                    salesRepId: '',
                    priceList: features.priceLists ? null : 1,
                    discount: 0,
                    notes: ''
                });

                if (isClient && user.client) {
                    // Cliente: pre-seleccionar su cliente y saltear selección y lista de precios
                    setSelectedClient(user.client);
                    // Usar la lista del cliente; si la empresa no tiene priceLists, forzar lista 1
                    const clientPriceList = features.priceLists ? (user.client.priceList || 1) : 1;
                    setHeader(prev => ({
                        ...prev,
                        discount: user.client.discount || 0,
                        priceList: clientPriceList,
                        salesRepId: user.client.salesRepId?.toString() || ''
                    }));
                    setCommissionRate(0); // Clientes no tienen comisión
                    setStep(2); // Siempre ir directo a productos
                } else {
                    setStep(1);
                    setSelectedClient(null);
                    setCommissionRate(0);
                }
            }
            fetchInitialData();
        }
    }, [isOpen, order, mode]);

    // Configurar protección de navegación (solo si no es modo lectura ni view)
    useEffect(() => {
        if (isOpen && !readOnly && !isViewMode) {
            setNavigationBlocked(isDirty, {
                title: mode === 'edit' ? `¿Cerrar edición?` : `¿Cerrar ${type === 'order' ? 'pedido' : 'presupuesto'}?`,
                description: 'Tienes cambios sin guardar. Si sales ahora, perderás todo el progreso.',
                confirmText: 'Sí, cerrar',
                cancelText: 'Continuar editando',
                type: 'warning'
            });
        }

        return () => setNavigationBlocked(false);
    }, [isDirty, setNavigationBlocked, isOpen, mode]);

    // Protección de cierre de pestaña (solo si no es modo lectura ni view)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty && isOpen && !readOnly && !isViewMode) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isOpen]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [cData, sData, pData] = await Promise.all([
                getClients(),
                getSellers(),
                getProducts({ page: 1, limit: 20 })
            ]);
            setClients(cData?.clients || cData || []);
            setSellers(sData || []);
            setProducts(pData?.products || pData || []);
            setProductPagination({ 
                total: pData?.total || pData?.products?.length || 0, 
                totalPages: pData?.totalPages || 1 
            });
            setProductPage(1);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchClient = async (query) => {
        setSearchQuery(query);
        const data = await getClients({ search: query });
        setClients(data?.clients || []);
    };

    const handleSearchProduct = async (query) => {
        try {
            setSearchQuery(query);
            setLoading(true);
            setProductPage(1);
            const data = await getProducts({ search: query, page: 1, limit: 20 });
            setProducts(data?.products || []);
            setProductPagination({ 
                total: data?.total || data?.products?.length || 0, 
                totalPages: data?.totalPages || 1 
            });
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductPageChange = async (page) => {
        try {
            setProductPage(page);
            setLoading(true);
            const data = await getProducts({ search: searchQuery, page, limit: 20 });
            setProducts(data?.products || []);
            setProductPagination({ 
                total: data?.total || data?.products?.length || 0, 
                totalPages: data?.totalPages || 1 
            });
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectClient = (client) => {
        setSelectedClient(client);
        setHeader(prev => ({
            ...prev,
            salesRepId: client.salesRepId?._id || client.salesRepId || '',
            discount: client.discount || 0,
            priceList: client.priceList || (features.priceLists ? null : 1)
        }));
        setSearchQuery('');

        if (!features.priceLists) {
            setStep(2);
        } else {
            setStep(1.5);
        }
    };

    const handlePriceListSelect = (num) => {
        if (items.length > 0) return;
        setHeader(prev => ({ ...prev, priceList: num }));
        setStep(2);
    };

    const addItem = (product, quantityToAdd = 1, initialDiscount = 0) => {
        if (!product) return;
        
        // Limpiar errores de stock al agregar items
        if (stockErrors.length > 0) setStockErrors([]);

        // Verificar si es una variante
        const selectedVariant = product.selectedVariant;
        const hasVariant = !!selectedVariant;
        
        // Obtener pricing según variante o producto
        let pricing;
        if (hasVariant && product.hasUniformVariantPricing === false) {
            // Variante con precio individual
            pricing = selectedVariant.pricing || { list1: { price: 0, discount: 0, offer: null }, list2: { price: 0, discount: 0, offer: null } };
        } else {
            pricing = product.pricing || { list1: { price: 0, discount: 0, offer: null }, list2: { price: 0, discount: 0, offer: null } };
        }
        
        const priceListNum = header.priceList || 1;
        const listData = priceListNum === 2 ? pricing.list2 : pricing.list1;
        
        // Calcular precio base aplicando descuento sobre oferta si existe
        const basePrice = listData?.price || 0;
        const productDiscount = listData?.discount || 0;
        const offer = listData?.offer || 0;
        const baseForDiscount = offer > 0 ? offer : basePrice;
        const finalPrice = baseForDiscount * (1 - productDiscount / 100);
        
        const hasOffer = offer > 0;
        const qty = parseInt(quantityToAdd) || 1;
        // Cliente: usar siempre el descuento del producto (ya aplicado en finalPrice)
        // Vendedor: puede aplicar descuento adicional
        const disc = isClient ? 0 : (parseFloat(initialDiscount) || 0);
        const productId = product._id || Math.random().toString(36).substr(2, 9);
        
        // Generar nombre con variante si aplica
        let itemName = product.name || 'Sin nombre';
        let variantName = null;
        if (hasVariant) {
            variantName = selectedVariant.value1 + (selectedVariant.value2 ? ` / ${selectedVariant.value2}` : '');
            itemName = `${product.name} (${variantName})`;
        }
        
        // Usar el id de la variante (nota: en MongoDB las variantes usan 'id' no '_id')
        const variantId = selectedVariant?.id || selectedVariant?._id || null;
        
        // Buscar si existe una línea con el MISMO productId, MISMA variante Y MISMO descuento
        const existing = items.find(i => 
            i.productId === productId && 
            i.variantId === variantId &&
            Number(i.discount || 0) === disc
        );

        if (existing) {
            // Si existe una línea con el mismo producto, variante y descuento, sumar cantidades
            setItems(items.map(i => 
                i.lineId === existing.lineId
                    ? { ...i, quantity: i.quantity + qty }
                    : i
            ));
        } else {
            // Crear una nueva línea con un ID único
            const lineId = `${productId}-${variantId || 'main'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            setItems([...items, {
                lineId: lineId,
                productId: productId,
                variantId: variantId,
                variantName: variantName,
                name: itemName,
                code: product.code || 'S/N',
                quantity: qty,
                listPrice: finalPrice,
                discount: disc,
                hasOffer: hasOffer
            }]);
        }
    };

    const removeItem = (lineId) => {
        if (stockErrors.length > 0) setStockErrors([]);
        setItems(items.filter(i => i.lineId !== lineId));
    };

    const updateItem = (lineId, field, value) => {
        if (stockErrors.length > 0) setStockErrors([]);
        setItems(items.map(i => i.lineId === lineId ? { ...i, [field]: value } : i));
    };

    const calculateSubtotal = () => {
        return items.reduce((acc, item) => {
            const price = Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100));
            return acc + (Number(item.quantity || 0) * price);
        }, 0) || 0;
    };

    const calculateTotal = () => {
        const excludeOfferFromGlobalDiscount = user?.company?.excludeOfferProductsFromGlobalDiscount === true;
        
        if (!excludeOfferFromGlobalDiscount) {
            // Comportamiento normal: descuento global aplica a todos los productos
            const sub = calculateSubtotal() || 0;
            return sub * (1 - (Number(header.discount || 0) / 100)) || 0;
        }
        
        // Comportamiento especial: productos con oferta no aplican descuento global
        let totalWithGlobalDiscount = 0;
        let totalWithoutGlobalDiscount = 0;
        
        items.forEach(item => {
            const itemTotal = Number(item.quantity || 0) * Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100));
            
            if (item.hasOffer) {
                // Productos con oferta: no aplican descuento global
                totalWithoutGlobalDiscount += itemTotal;
            } else {
                // Productos sin oferta: aplican descuento global
                totalWithGlobalDiscount += itemTotal;
            }
        });
        
        const discountedAmount = totalWithGlobalDiscount * (1 - (Number(header.discount || 0) / 100));
        return discountedAmount + totalWithoutGlobalDiscount;
    };
    
    const calculateCommissionAmount = () => {
        const total = calculateTotal();
        // Si se muestran precios con IVA, calcular comisión sobre el total con IVA
        const totalWithTax = showPricesWithTax ? total * (1 + (taxRate || 21) / 100) : total;
        return totalWithTax * (Number(commissionRate || 0) / 100);
    };

    const openQuickView = (product) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const data = {
                ...header,
                clientId: selectedClient._id,
                items,
                type
            };
            
            // Incluir commissionRate en el payload (solo para admin/superadmin)
            if (isAdmin || isSuperadmin) {
                data.commissionRate = commissionRate;
            }
            
            if ((mode === 'edit' || mode === 'view') && order) {
                await updateOrder(order._id, data);
                addToast(type === 'order' ? 'Pedido actualizado exitosamente' : 'Presupuesto actualizado exitosamente', 'success');
            } else {
                await createOrder(data);
                addToast(type === 'order' ? 'Pedido creado exitosamente' : 'Presupuesto creado exitosamente', 'success');
            }
            
            setNavigationBlocked(false);
            // Primero iniciar el cierre (AnimatePresence manejará la animación)
            onClose();
            // Después de la animación, notificar al padre para refrescar datos
            setTimeout(() => {
                onSave();
            }, 300);
        } catch (error) {
            console.error('Error saving budget:', error);
            
            // Manejar errores de stock
            const stockIssues = error.response?.data?.stockIssues;
            if (stockIssues && Array.isArray(stockIssues) && stockIssues.length > 0) {
                setStockErrors(stockIssues);
                addToast(error.response?.data?.message || 'Stock insuficiente', 'error');
                // NO cambiar de paso - quedarse en el summary para ver el error claro
            } else {
                addToast('Error al guardar: ' + (error.response?.data?.message || error.message), 'error');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Limpiar errores de stock al modificar items
    const updateItemsWithStockClear = (newItemsOrFn) => {
        if (stockErrors.length > 0) {
            setStockErrors([]);
        }
        setItems(newItemsOrFn);
    };

    const handleCancel = () => {
        // En modo lectura (view) no preguntar, cerrar directamente
        if (isDirty && !effectiveReadOnly) {
            setShowExitModal(true);
        } else {
            handleConfirmExit();
        }
    };

    const handleConfirmExit = () => {
        setShowExitModal(false);
        setNavigationBlocked(false);
        setStockErrors([]); // Limpiar errores de stock
        // Animación de cierre suave - AnimatePresence manejará la animación
        onClose();
    };

    if (authLoading) {
        return createPortal(
            <AnimatePresence mode="wait">
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={handleCancel}
                            className="fixed top-0 left-0 w-screen h-screen bg-secondary-900/40 dark:bg-black/60 backdrop-blur-[2px] z-[9999]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220, duration: 0.3 }}
                            className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[1100px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[10000] flex items-center justify-center border border-[var(--border-color)] rounded-[1.25rem]"
                        >
                            <Loader2 size={40} className="animate-spin text-primary-600" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        );
    }

    return (
        <>
            {createPortal(
                <AnimatePresence mode="wait">
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                        onClick={handleCancel}
                        className="fixed top-0 left-0 w-screen h-screen bg-secondary-900/40 dark:bg-black/60 backdrop-blur-[2px] z-[150]"
                    />

                    {/* Drawer - Estilo Modal */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220, duration: 0.3 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[1100px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[160] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header - Estilo Modal */}
                        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-2 md:gap-3">
                                {/* Botón Volver - desde el paso 2 en adelante */}
                                {!effectiveReadOnly && step > 1 && !(isClient && step <= 2) && (
                                    <button
                                        onClick={() => {
                                            if (step === 2) setStep(features.priceLists ? 1.5 : 1);
                                            else if (step === 1.5) setStep(1);
                                            else setStep(step - 1);
                                        }}
                                        className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors -ml-2 md:ml-0"
                                        title="Volver"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    {type === 'order' ? <ShoppingBag size={18} className="md:w-5 md:h-5" /> : <FileText size={18} className="md:w-5 md:h-5" />}
                                </div>
                                <div>
                                    <h2 className="text-sm md:text-base font-bold text-[var(--text-primary)]">
                                        {isViewMode || readOnly ? `Ver ${type === 'order' ? 'Pedido' : 'Presupuesto'}` : (mode === 'edit' ? `Editar ${type === 'order' ? 'Pedido' : 'Presupuesto'}` : `Nuevo ${type === 'order' ? 'Pedido' : 'Presupuesto'}`)}
                                    </h2>
                                    <p className="text-[10px] md:text-[11px] text-[var(--text-muted)] font-medium">
                                        {isViewMode ? 'Mostrando detalle' : (() => {
                                            if (isClient) {
                                                // Cliente ve solo 2 pasos: Productos y Resumen
                                                return `Paso ${step === 2 ? 1 : 2} de 2`;
                                            }
                                            // Mapear el valor de step al paso lógico que ve el usuario
                                            const stepMap = {
                                                1: 1,      // Cliente
                                                1.5: 2,    // Lista de precios
                                                2: features.priceLists ? 3 : 2,  // Productos
                                                3: 3       // Resumen (siempre paso 3)
                                            };
                                            const currentStep = stepMap[step] || 1;
                                            return `Paso ${currentStep} de 3`;
                                        })()}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCancel}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - Scrolleable */}
                        <div className="flex-1 overflow-y-auto bg-white dark:bg-[var(--bg-card)] pt-3 px-3 md:pt-4 md:px-6 pb-3 md:pb-6">
                            <div className="p-0 md:p-2">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <ClientSelection
                                            clients={clients}
                                            onSelect={selectClient}
                                            selectedClient={selectedClient}
                                        />
                                    )}

                                    {step === 1.5 && (
                                        <PriceListSelection
                                            selectedClient={selectedClient}
                                            currentPriceList={header.priceList}
                                            onSelect={handlePriceListSelect}
                                            hasItems={items.length > 0}
                                            salesRep={
                                                selectedClient?.salesRepId?.firstName 
                                                    ? `${selectedClient.salesRepId.firstName} ${selectedClient.salesRepId.lastName || ''}`
                                                    : sellers.find(s => s._id === (selectedClient?.salesRepId?._id || selectedClient?.salesRepId))?.firstName 
                                                        ? `${sellers.find(s => s._id === (selectedClient?.salesRepId?._id || selectedClient?.salesRepId)).firstName} ${sellers.find(s => s._id === (selectedClient?.salesRepId?._id || selectedClient?.salesRepId)).lastName || ''}`
                                                        : 'No asignado'
                                            }
                                        />
                                    )}

                                    {step === 2 && (
                                        <ProductCatalog
                                            products={products}
                                            loading={loading}
                                            searchQuery={searchQuery}
                                            setSearchQuery={handleSearchProduct}
                                            priceList={header.priceList}
                                            itemsInCart={items}
                                            onProductClick={openQuickView}
                                            onAddDirect={(p) => addItem(p)}
                                            isClient={isClient}
                                            showPricesWithTax={showPricesWithTax}
                                            company={user?.company}
                                            page={productPage}
                                            pagination={productPagination}
                                            onPageChange={handleProductPageChange}
                                        />
                                    )}

                                    {step === 3 && (
                                        <BudgetSummary
                                            items={items}
                                            updateItem={updateItem}
                                            removeItem={removeItem}
                                            subtotal={calculateSubtotal()}
                                            total={calculateTotal()}
                                            discountGlobal={header.discount}
                                            setDiscountGlobal={(val) => setHeader(prev => ({ ...prev, discount: val }))}
                                            onConfirm={handleSave}
                                            sellers={sellers}
                                            salesRepId={header.salesRepId}
                                            setSalesRepId={(val) => setHeader(prev => ({ ...prev, salesRepId: val }))}
                                            notes={header.notes}
                                            setNotes={(val) => setHeader(prev => ({ ...prev, notes: val }))}
                                            date={header.date}
                                            setDate={(val) => setHeader(prev => ({ ...prev, date: val }))}
                                            onChangeStep={setStep}
                                            mode={mode}
                                            canChangeSeller={canChangeSeller}
                                            readOnly={effectiveReadOnly}
                                            isClient={isClient}
                                            selectedClient={selectedClient}
                                            priceList={header.priceList}
                                            features={features}
                                            stockErrors={stockErrors}
                                            showPricesWithTax={showPricesWithTax}
                                            taxRate={taxRate}
                                            // Commission props
                                            commissionRate={commissionRate}
                                            setCommissionRate={setCommissionRate}
                                            commissionAmount={calculateCommissionAmount()}
                                            canEditCommission={isAdmin || isSuperadmin}
                                            orderStatus={order?.status}
                                            // Discount permissions
                                            canEditProductDiscount={canEditProductDiscount}
                                            canEditBudgetDiscount={canEditBudgetDiscount}
                                            // Products y company para reglas de cantidad
                                            products={products}
                                            company={orderConfig}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer - Acciones siempre abajo */}
                        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                {!effectiveReadOnly && items.length > 0 && (
                                    <>
                                        {/* Botón del carrito más grande - mismo alto que el botón Siguiente */}
                                        <button
                                            onClick={() => setIsCartOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
                                        >
                                            <ShoppingBag size={20} />
                                            <span className="text-sm font-semibold">{items.length}</span>
                                        </button>
                                        <div className="hidden sm:block">
                                            <span className="text-[11px] text-[var(--text-muted)]">Total:</span>
                                            <span className="text-base font-bold text-[var(--text-primary)] ml-1">
                                                ${(showPricesWithTax ? calculateTotal() * (1 + (taxRate || 21) / 100) : calculateTotal()).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            {showPricesWithTax && <span className="ml-1 text-xs text-success-600">(c/IVA)</span>}
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {effectiveReadOnly ? (
                                    <Button
                                        variant="secondary"
                                        onClick={handleCancel}
                                        className="!px-4 !py-2 !text-sm"
                                    >
                                        Cerrar
                                    </Button>
                                ) : (
                                    <>
                                        {/* Botón Volver - en todos los pasos excepto el primero */}
                                        {step > 1 && !(isClient && step <= 2) && (
                                            <button
                                                onClick={() => {
                                                    if (step === 2) setStep(features.priceLists ? 1.5 : 1);
                                                    else if (step === 1.5) setStep(1);
                                                    else setStep(step - 1);
                                                }}
                                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                                title="Volver"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                        )}
                                        
                                        {step < 3 && (
                                            (step === 1 && selectedClient) ||
                                            (step === 1.5 && header.priceList) ||
                                            (step === 2 && items.length > 0)
                                        ) && (
                                            <Button
                                                variant="primary"
                                                onClick={() => {
                                                    if (step === 1) setStep(features.priceLists ? 1.5 : 2);
                                                    else if (step === 1.5) setStep(2);
                                                    else setStep(3);
                                                }}
                                                className="!px-4 !py-2 !text-sm"
                                            >
                                                Siguiente
                                                <ChevronRight size={16} />
                                            </Button>
                                        )}
                                        
                                        {step === 3 && (
                                            <Button
                                                variant="primary"
                                                onClick={effectiveReadOnly ? handleCancel : handleSave}
                                                disabled={loading || (!effectiveReadOnly && !header.salesRepId && !isClient)}
                                                className="!px-4 !py-2 !text-sm !bg-success-600 hover:!bg-success-700"
                                            >
                                                {loading ? 'Guardando...' : (effectiveReadOnly ? 'Cerrar' : (mode === 'edit' ? 'Actualizar' : 'Crear Presupuesto'))}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Floating Cart Button -->
                        {items.length > 0 && step !== 3 && (
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="fixed bottom-6 right-6 w-12 h-12 bg-primary-600 text-white rounded-xl shadow-lg dark:shadow-soft-dark flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-[170]"
                                style={{ right: 'calc(2.5rem + min(2rem, (100vw - 900px) / 2))' }}
                            >
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-secondary-900 dark:bg-secondary-700 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[var(--bg-card)]">
                                    {items.length}
                                </span>
                                <ShoppingBag size={20} />
                            </button>
                        )}

                        {/* Drawers & Modals */}
                        <CartDrawer
                            isOpen={isCartOpen}
                            onClose={() => setIsCartOpen(false)}
                            items={items}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            subtotal={calculateSubtotal()}
                            total={calculateTotal()}
                            globalDiscount={header.discount}
                            onCheckout={() => { setIsCartOpen(false); setStep(3); }}
                            products={products}
                            company={user?.company}
                            showPricesWithTax={showPricesWithTax}
                            taxRate={taxRate}
                        />

                        <ProductQuickView
                            isOpen={isQuickViewOpen}
                            onClose={() => setIsQuickViewOpen(false)}
                            product={quickViewProduct}
                            onAddToCart={(p, q, d) => addItem(p, q, d)}
                            isClient={isClient}
                            showPricesWithTax={showPricesWithTax}
                            features={features}
                            company={user?.company}
                            priceList={header.priceList}
                            user={user}
                        />
                    </motion.div>
                </>
            )}
                </AnimatePresence>,
                document.body
            )}
            {createPortal(
                <ConfirmModal
                    isOpen={showExitModal}
                    onClose={() => setShowExitModal(false)}
                    onConfirm={handleConfirmExit}
                    title={mode === 'edit' ? '¿Cerrar edición?' : (mode === 'view' ? '¿Cerrar vista?' : '¿Cerrar presupuesto?')}
                    description="Tienes cambios sin guardar. Si sales ahora, perderás todo el progreso."
                    confirmText="Sí, cerrar"
                    cancelText="Continuar editando"
                    type="warning"
                />,
                document.body
            )}
        </>
    );
};

export default BudgetDrawer;
