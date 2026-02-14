import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
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
    const { setNavigationBlocked } = useNavigationGuard();
    const { addToast } = useToast();
    
    const features = user?.company?.features || {};
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isVendedor = user?.role?.name === 'vendedor';
    const isClient = user?.role?.name === 'cliente';
    const isViewMode = mode === 'view';
    const effectiveReadOnly = readOnly || isViewMode; // Solo lectura si es superadmin o modo view
    const canChangeSeller = isAdmin && !effectiveReadOnly; // Solo admin puede cambiar vendedor, y solo si no es solo lectura

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

    // Lists
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Data Loss Protection
    const isDirty = items.length > 0 || selectedClient !== null;

    // Reset state when drawer opens/closes or order changes
    useEffect(() => {
        if (isOpen) {
            if (order && (mode === 'edit' || mode === 'view')) {
                // Pre-fill for edit
                setSelectedClient(order.clientId);
                setItems(order.items.map(item => ({
                    productId: item.productId._id || item.productId,
                    name: item.productId.name || item.name || 'Producto',
                    code: item.productId.code || item.code || '',
                    quantity: item.quantity,
                    listPrice: item.listPrice,
                    discount: item.discount || 0
                })));
                setHeader({
                    date: new Date(order.date).toISOString().split('T')[0],
                    salesRepId: order.salesRepId?._id || order.salesRepId || '',
                    priceList: order.priceList || 1,
                    discount: order.discount || 0,
                    notes: order.notes || ''
                });
                setStep(3); // Go straight to summary when editing
            } else {
                // Reset for create
                setItems([]);
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
                    setStep(2); // Siempre ir directo a productos
                } else {
                    setStep(1);
                    setSelectedClient(null);
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
                getProducts()
            ]);
            setClients(cData || []);
            setSellers(sData || []);
            setProducts(pData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchClient = async (query) => {
        setSearchQuery(query);
        const data = await getClients(query);
        setClients(data);
    };

    const handleSearchProduct = async (query) => {
        try {
            setSearchQuery(query);
            setLoading(true);
            const data = await getProducts(query);
            setProducts(data || []);
        } catch (error) {
            console.error('Error searching products:', error);
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

        const pricing = product.pricing || { list1: 0, list2: 0 };
        const priceListNum = header.priceList || 1;
        const price = (priceListNum === 2 ? (pricing.list2 || 0) : (pricing.list1 || 0)) || 0;

        const qty = parseInt(quantityToAdd) || 1;
        // Cliente: usar siempre el descuento del producto, no editable
        const disc = isClient ? (parseFloat(pricing.discount) || 0) : (parseFloat(initialDiscount) || 0);
        const productId = product._id || Math.random().toString(36).substr(2, 9);
        const existing = items.find(i => i.productId === productId);

        if (existing) {
            setItems(items.map(i => 
                i.productId === productId 
                    ? { ...i, quantity: i.quantity + qty, discount: Math.max(Number(i.discount || 0), disc) } 
                    : i
            ));
        } else {
            setItems([...items, {
                productId: productId,
                name: product.name || 'Sin nombre',
                code: product.code || 'S/N',
                quantity: qty,
                listPrice: price,
                discount: disc
            }]);
        }
    };

    const removeItem = (id) => {
        setItems(items.filter(i => i.productId !== id));
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(i => i.productId === id ? { ...i, [field]: value } : i));
    };

    const calculateSubtotal = () => {
        return items.reduce((acc, item) => {
            const price = Number(item.listPrice || 0) * (1 - (Number(item.discount || 0) / 100));
            return acc + (Number(item.quantity || 0) * price);
        }, 0) || 0;
    };

    const calculateTotal = () => {
        const sub = calculateSubtotal() || 0;
        return sub * (1 - (Number(header.discount || 0) / 100)) || 0;
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
            
            if ((mode === 'edit' || mode === 'view') && order) {
                await updateOrder(order._id, data);
                addToast(type === 'order' ? 'Pedido actualizado exitosamente' : 'Presupuesto actualizado exitosamente', 'success');
            } else {
                await createOrder(data);
                addToast(type === 'order' ? 'Pedido creado exitosamente' : 'Presupuesto creado exitosamente', 'success');
            }
            
            setNavigationBlocked(false);
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving budget:', error);
            addToast('Error al guardar: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
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
        onClose();
    };

    if (authLoading) {
        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="fixed top-0 left-0 w-screen h-screen bg-secondary-900/40 dark:bg-black/60 backdrop-blur-[2px] z-[9999]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[900px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[10000] flex items-center justify-center border border-[var(--border-color)] rounded-[1.25rem]"
                        >
                            <Loader2 size={40} className="animate-spin text-primary-600" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        );
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancel}
                        className="fixed top-0 left-0 w-screen h-screen bg-secondary-900/40 dark:bg-black/60 backdrop-blur-[2px] z-[150]"
                    />

                    {/* Drawer - Estilo Modal */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[900px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[160] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header - Estilo Modal */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    {type === 'order' ? <ShoppingBag size={20} /> : <FileText size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        {isViewMode || readOnly ? `Ver ${type === 'order' ? 'Pedido' : 'Presupuesto'}` : (mode === 'edit' ? `Editar ${type === 'order' ? 'Pedido' : 'Presupuesto'}` : `Nuevo ${type === 'order' ? 'Pedido' : 'Presupuesto'}`)}
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
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
                        <div className="flex-1 overflow-y-auto bg-[var(--bg-body)] p-6">
                            <div className="p-4">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <ClientSelection
                                            clients={clients}
                                            searchQuery={searchQuery}
                                            onSearch={handleSearchClient}
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
                                            mode={mode}
                                            canChangeSeller={canChangeSeller}
                                            readOnly={effectiveReadOnly}
                                            isClient={isClient}
                                            selectedClient={selectedClient}
                                            priceList={header.priceList}
                                            features={features}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer - Acciones siempre abajo */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                {!effectiveReadOnly && items.length > 0 && (
                                    <>
                                        <button
                                            onClick={() => setIsCartOpen(true)}
                                            className="flex items-center gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
                                        >
                                            <ShoppingBag size={18} />
                                            <span className="text-sm font-semibold">{items.length}</span>
                                        </button>
                                        <div className="text-[11px] text-[var(--text-muted)]">
                                            Total: <span className="font-bold text-[var(--text-primary)]">${calculateTotal().toLocaleString()}</span>
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
                                        {step > 1 && !(isClient && step <= 2) && (
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    if (step === 2) setStep(features.priceLists ? 1.5 : 1);
                                                    else if (step === 1.5) setStep(1);
                                                    else setStep(step - 1);
                                                }}
                                                className="!px-4 !py-2 !text-sm"
                                            >
                                                Volver
                                            </Button>
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
                                                {loading ? 'Guardando...' : (effectiveReadOnly ? 'Cerrar' : (mode === 'edit' ? 'Actualizar' : 'Finalizar'))}
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
                            total={calculateTotal()}
                            onCheckout={() => { setIsCartOpen(false); setStep(3); }}
                        />

                        <ProductQuickView
                            isOpen={isQuickViewOpen}
                            onClose={() => setIsQuickViewOpen(false)}
                            product={quickViewProduct}
                            onAddToCart={(p, q, d) => addItem(p, q, d)}
                            isClient={isClient}
                        />

                        <ConfirmModal
                            isOpen={showExitModal}
                            onClose={() => setShowExitModal(false)}
                            onConfirm={handleConfirmExit}
                            title={mode === 'edit' ? '¿Cerrar edición?' : (mode === 'view' ? '¿Cerrar vista?' : '¿Cerrar presupuesto?')}
                            description="Tienes cambios sin guardar. Si sales ahora, perderás todo el progreso."
                            confirmText="Sí, cerrar"
                            cancelText="Continuar editando"
                            type="warning"
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BudgetDrawer;
