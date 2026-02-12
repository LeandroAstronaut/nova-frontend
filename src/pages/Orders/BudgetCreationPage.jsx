import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    ShoppingBag,
    X,
    Calculator,
    Loader2
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useNavigationGuard } from '../../context/NavigationGuardContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getClients, getProducts, getSellers, createOrder } from '../../services/orderService';
import ProductQuickView from '../../components/products/ProductQuickView';
import CartDrawer from '../../components/orders/CartDrawer';
import ClientSelection from '../../components/orders/ClientSelection';
import PriceListSelection from '../../components/orders/PriceListSelection';
import ProductCatalog from '../../components/orders/ProductCatalog';
import BudgetSummary from '../../components/orders/BudgetSummary';
import ConfirmModal from '../../components/common/ConfirmModal';

const BudgetCreationPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { setNavigationBlocked } = useNavigationGuard();
    
    const features = user?.company?.features || {};

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    // Drawer States
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Detectar si es usuario cliente
    const isClientUser = user?.role?.name === 'cliente';
    const clientUserClientId = user?.client?.id;

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

    // Si es usuario cliente, pre-seleccionar su cliente automáticamente
    useEffect(() => {
        if (isClientUser && clientUserClientId && clients.length > 0) {
            const myClient = clients.find(c => c._id === clientUserClientId);
            if (myClient && !selectedClient) {
                setSelectedClient(myClient);
            }
        }
    }, [isClientUser, clientUserClientId, clients, selectedClient]);

    // Lists
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Data Loss Protection
    const isDirty = items.length > 0 || selectedClient !== null;

    // Configurar protección de navegación
    useEffect(() => {
        setNavigationBlocked(isDirty, {
            title: '¿Cerrar presupuesto?',
            description: 'Tienes cambios sin guardar. Si sales ahora, perderás todo el progreso del presupuesto actual.',
            confirmText: 'Sí, cerrar',
            cancelText: 'Continuar editando',
            type: 'warning'
        });

        return () => setNavigationBlocked(false);
    }, [isDirty, setNavigationBlocked]);

    // Protección de cierre de pestaña
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Cargar datos iniciales
    useEffect(() => {
        fetchInitialData();
    }, []);

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
        const disc = parseFloat(initialDiscount) || 0;
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
                type: 'budget'
            };
            await createOrder(data);
            setNavigationBlocked(false);
            navigate('/presupuestos');
        } catch (error) {
            console.error('Error creating budget:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) {
            setShowExitModal(true);
        } else {
            navigate('/presupuestos');
        }
    };

    const handleConfirmExit = () => {
        setShowExitModal(false);
        setNavigationBlocked(false);
        navigate('/presupuestos');
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)]">
                <Loader2 size={40} className="animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
            {/* Header */}
            <div className="h-14 px-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div>
                        <h1 className="text-base font-semibold text-[var(--text-primary)]">Nuevo Presupuesto</h1>
                        <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                            Paso {step === 1.5 ? '2' : step > 1.5 ? step : 1} de {features.priceLists ? 3 : 2}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total</p>
                        <div className="flex items-center gap-1">
                            <span className="text-base font-bold text-[var(--text-primary)]">${calculateTotal().toLocaleString()}</span>
                            <Calculator size={12} className="text-primary-500" />
                        </div>
                    </div>
                    
                    {step > 1 && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (step === 2) setStep(features.priceLists ? 1.5 : 1);
                                else if (step === 1.5) setStep(1);
                                else setStep(step - 1);
                            }}
                            className="!py-1.5 !px-3 !text-xs h-8"
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
                            className="!py-1.5 !px-3 !text-xs h-8"
                        >
                            Siguiente
                            <ChevronRight size={14} />
                        </Button>
                    )}
                    
                    {step === 3 && (
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={loading || !header.salesRepId}
                            className="!py-1.5 !px-3 !text-xs h-8 !bg-success-600 hover:!bg-success-700"
                        >
                            {loading ? 'Guardando...' : 'Finalizar'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg-body)]">
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
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Floating Cart Button */}
            {items.length > 0 && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-6 right-6 w-12 h-12 bg-primary-600 text-white rounded-xl shadow-lg dark:shadow-soft-dark flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
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
            />

            <ConfirmModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={handleConfirmExit}
                title="¿Cerrar presupuesto?"
                description="Tienes cambios sin guardar. Si sales ahora, perderás todo el progreso del presupuesto actual."
                confirmText="Sí, cerrar"
                cancelText="Continuar editando"
                type="warning"
            />
        </div>
    );
};

export default BudgetCreationPage;
