import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Search,
    Plus,
    Trash2,
    Save,
    User,
    Package,
    ChevronRight,
    Calculator,
    Calendar,
    Settings,
    Tag
} from 'lucide-react';
import { getClients, getProducts, getSellers, createOrder, updateOrder } from '../../services/orderService';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';

const OrderDrawer = ({ isOpen, onClose, onSave, order = null, forcedType = 'budget' }) => {
    const { user } = useAuth();
    const isSuperadmin = user?.role?.name === 'superadmin';
    const [step, setStep] = useState(1); // 1: Cliente, 2: Productos, 3: Resumen/Campos
    const [loading, setLoading] = useState(false);

    // Data lists
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);

    // Form State
    const [selectedClient, setSelectedClient] = useState(null);
    const [items, setItems] = useState([]);
    const [searchClient, setSearchClient] = useState('');
    const [searchProduct, setSearchProduct] = useState('');

    // Header Fields
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [salesRepId, setSalesRepId] = useState('');
    const [priceList, setPriceList] = useState(1);
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (order) {
                // Pre-fill for edit
                setSelectedClient(order.clientId);
                setItems(order.items.map(item => ({
                    productId: item.productId._id || item.productId,
                    name: item.productId.name || 'Producto',
                    code: item.productId.code || '',
                    quantity: item.quantity,
                    listPrice: item.listPrice,
                    discount: item.discount || 0
                })));
                setDate(new Date(order.date).toISOString().split('T')[0]);
                setSalesRepId(order.salesRepId._id || order.salesRepId);
                setPriceList(order.priceList || 1);
                setGlobalDiscount(order.discount || 0);
                setNotes(order.notes || '');
                setStep(3); // Go straight to summary when editing
            } else {
                resetForm();
            }
        }
    }, [isOpen, order]);

    const resetForm = () => {
        setStep(1);
        setSelectedClient(null);
        setItems([]);
        setSearchClient('');
        setSearchProduct('');
        setDate(new Date().toISOString().split('T')[0]);
        setSalesRepId('');
        setPriceList(1);
        setGlobalDiscount(0);
        setNotes('');
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [clientData, sellerData] = await Promise.all([
                getClients(),
                getSellers()
            ]);
            setClients(clientData);
            setSellers(sellerData);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchClient = async (val) => {
        setSearchClient(val);
        const data = await getClients(val);
        setClients(data);
    };

    const handleSearchProduct = async (val) => {
        setSearchProduct(val);
        const data = await getProducts(val);
        setProducts(data);
    };

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setGlobalDiscount(client.discount || 0);
        setStep(2);
    };

    const addItem = (product) => {
        const existing = items.find(i => i.productId === product._id);
        const currentPrice = priceList === 1 ? product.pricing.list1 : product.pricing.list2;

        if (existing) {
            setItems(items.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, {
                productId: product._id,
                name: product.name,
                code: product.code,
                quantity: 1,
                listPrice: currentPrice,
                discount: 0 // Product-level discount
            }]);
        }
    };

    const removeItem = (id) => {
        setItems(items.filter(i => i.productId !== id));
    };

    const calculateSubtotal = () => {
        return items.reduce((acc, item) => {
            const itemPrice = item.listPrice * (1 - (item.discount / 100));
            return acc + (item.quantity * itemPrice);
        }, 0);
    };

    const calculateFinalTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal * (1 - (globalDiscount / 100));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const orderData = {
                clientId: selectedClient._id,
                salesRepId,
                date,
                priceList,
                discount: globalDiscount, // Global discount
                type: forcedType,
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    listPrice: i.listPrice,
                    discount: i.discount
                })),
                notes
            };

            if (order) {
                await updateOrder(order._id, orderData);
            } else {
                await createOrder(orderData);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving order:', error);
        } finally {
            setLoading(false);
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
                        className="fixed top-0 left-0 w-screen h-screen bg-secondary-900/40 dark:bg-black/60 backdrop-blur-[2px] z-[9999]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[540px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[10000] flex flex-col border border-[var(--border-color)] rounded-[1.25rem] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h2 className="text-[17px] font-bold text-[var(--text-primary)] tracking-tight">
                                    {isSuperadmin ? 'Ver' : (order ? 'Editar' : 'Nuevo')} Presupuesto
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Paso {step} de 3
                                    </span>
                                    {selectedClient && (
                                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest truncate max-w-[200px]">
                                            • {selectedClient.businessName}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-all">
                                <X size={20} className="text-[var(--text-muted)]" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} strokeWidth={2.5} />
                                        <input
                                            type="text"
                                            placeholder="Buscar cliente por nombre o CUIT..."
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[13px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-[var(--bg-card)] transition-all"
                                            value={searchClient}
                                            onChange={(e) => handleSearchClient(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        {clients.length > 0 ? clients.map(client => (
                                            <button
                                                key={client._id}
                                                onClick={() => handleSelectClient(client)}
                                                className="w-full text-left p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[var(--bg-hover)] rounded-lg flex items-center justify-center text-[var(--text-muted)] group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[var(--text-primary)] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-[14px]">{client.businessName}</div>
                                                        <div className="text-[11px] text-[var(--text-muted)] font-bold uppercase mt-0.5 tracking-tight">{client.cuit}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-[var(--border-color)] group-hover:text-primary-400 group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
                                            </button>
                                        )) : (
                                            <div className="py-8 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest bg-[var(--bg-hover)] rounded-2xl">
                                                No se encontraron clientes
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    {/* Client Header Recap */}
                                    <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 px-4 rounded-xl border border-primary-100 dark:border-primary-800 shadow-sm border-dashed">
                                        <div className="w-8 h-8 bg-[var(--bg-card)] rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                                            <User size={16} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{selectedClient.businessName}</div>
                                            <div className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest opacity-80">Lista {priceList} Activa</div>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-[var(--bg-card)] px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-widest border border-primary-100 dark:border-primary-800">Cambiar</button>
                                    </div>

                                    {/* Product Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} strokeWidth={2.5} />
                                        <input
                                            type="text"
                                            placeholder="Buscar productos por descripción o código..."
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[13px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-[var(--bg-card)] transition-all shadow-sm"
                                            onChange={(e) => handleSearchProduct(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    {searchProduct && (
                                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl dark:shadow-soft-lg-dark max-h-[250px] overflow-y-auto divide-y divide-[var(--border-color)] ring-4 ring-primary-500/5">
                                            {products.map(p => {
                                                const price = priceList === 1 ? p.pricing.list1 : p.pricing.list2;
                                                return (
                                                    <button
                                                        key={p._id}
                                                        onClick={() => addItem(p)}
                                                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
                                                    >
                                                        <div className="text-left flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-[var(--bg-hover)] rounded flex items-center justify-center text-[var(--text-muted)] font-bold text-[10px]">
                                                                COD
                                                            </div>
                                                            <div>
                                                                <div className="text-[13px] font-bold text-[var(--text-primary)]">{p.name}</div>
                                                                <div className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-tight">
                                                                    {p.code} • <span className="text-primary-600 dark:text-primary-400">${price.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Plus size={18} className="text-primary-500" strokeWidth={2.5} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Items List */}
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <Package size={12} strokeWidth={2.5} />
                                                DETALLE DEL PEDIDO
                                            </div>
                                            <span>{items.length} PRODUCTOS</span>
                                        </div>

                                        <div className="space-y-3">
                                            {items.map(item => (
                                                <div key={item.productId} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-4 hover:border-primary-200 dark:hover:border-primary-800 transition-all group">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{item.name}</div>
                                                            <div className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">{item.code}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.productId)}
                                                            className="p-2 text-danger-300 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-4 bg-[var(--bg-hover)] p-3 rounded-xl border border-[var(--border-color)]">
                                                        <div className="flex-1">
                                                            <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1 block mx-1">Cantidad</label>
                                                            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden h-9">
                                                                <button
                                                                    className="w-8 h-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] font-bold"
                                                                    onClick={() => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                                                                >-</button>
                                                                <input
                                                                    type="number"
                                                                    className="flex-1 w-full text-center text-[12px] font-bold text-[var(--text-primary)] border-x border-[var(--border-color)] focus:outline-none bg-[var(--bg-card)]"
                                                                    value={item.quantity}
                                                                    onChange={(e) => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: parseInt(e.target.value) || 1 } : i))}
                                                                />
                                                                <button
                                                                    className="w-8 h-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] font-bold"
                                                                    onClick={() => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i))}
                                                                >+</button>
                                                            </div>
                                                        </div>

                                                        <div className="w-24">
                                                            <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1 block mx-1">Desc %</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="w-full px-3 h-9 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[12px] font-bold text-primary-600 dark:text-primary-400 text-center focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                                                    value={item.discount || ''}
                                                                    onChange={(e) => setItems(items.map(i => i.productId === item.productId ? { ...i, discount: parseFloat(e.target.value) || 0 } : i))}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary-300 dark:text-primary-600">%</span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right min-w-[70px]">
                                                            <div className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1 mx-1">Total Item</div>
                                                            <div className="text-[13px] font-extrabold text-[var(--text-primary)] leading-tight h-9 flex items-center justify-end">
                                                                ${(item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {items.length === 0 && (
                                                <div className="py-12 flex flex-col items-center justify-center bg-[var(--bg-hover)] rounded-3xl border border-dashed border-[var(--border-color)]">
                                                    <Package size={32} className="text-[var(--border-color)] mb-2" strokeWidth={1.5} />
                                                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Carrito Vacío</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 pb-4">
                                    {/* Summary Fields (Date, Seller, List) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                                <Calendar size={12} /> Fecha
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                disabled={isSuperadmin}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                                <Settings size={12} /> Lista de Precios
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 appearance-none bg-[url('https://api.iconify.design/lucide:chevron-down.svg')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={priceList}
                                                onChange={(e) => {
                                                    const newList = parseInt(e.target.value);
                                                    setPriceList(newList);
                                                    // Refetch products or update prices if needed. Logic here assumes we already have the product price info.
                                                }}
                                                disabled={isSuperadmin}
                                            >
                                                <option value={1}>Lista 1 (Distribuidor)</option>
                                                <option value={2}>Lista 2 (Minorista)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                            <User size={12} /> Vendedor Asignado
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 appearance-none bg-[url('https://api.iconify.design/lucide:chevron-down.svg')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={salesRepId}
                                            onChange={(e) => setSalesRepId(e.target.value)}
                                            required
                                            disabled={isSuperadmin}
                                        >
                                            <option value="">Seleccionar Vendedor</option>
                                            {sellers.map(s => (
                                                <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Totals Section */}
                                    <div className="pt-2">
                                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Calculator size={12} strokeWidth={2.5} />
                                            Cálculo de Totales
                                        </div>
                                        <div className="bg-secondary-900 dark:bg-secondary-800 rounded-[1.5rem] p-7 text-white shadow-xl shadow-secondary-900/10 space-y-4 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                <Calculator size={100} />
                                            </div>

                                            <div className="flex justify-between items-center text-sm font-medium opacity-60">
                                                <span>Subtotal (Neto de Items)</span>
                                                <span className="font-bold tracking-tight">${calculateSubtotal().toLocaleString()}</span>
                                            </div>

                                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-primary-400">
                                                    <Tag size={14} /> Descuento Cliente
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-16 bg-white/10 border border-white/20 rounded-lg text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        value={globalDiscount || ''}
                                                        onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                                                        disabled={isSuperadmin}
                                                    />
                                                    <span className="text-sm font-bold opacity-60">%</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/10 flex flex-col items-end">
                                                <span className="text-[10px] font-black uppercase tracking-[.25em] text-secondary-400 mb-1">Total Final ARS</span>
                                                <span className="text-4xl font-black tracking-tight text-white flex items-start gap-1">
                                                    <span className="text-xl mt-1 opacity-50 font-bold">$</span>
                                                    {calculateFinalTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-1.5 pt-2">
                                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Observaciones / Notas</div>
                                        <textarea
                                            className="w-full p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-[1.25rem] text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 min-h-[100px] transition-all resize-none placeholder:text-[var(--text-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Ingresar notas internas o aclaraciones para el cliente..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            disabled={isSuperadmin}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-md flex gap-3">
                            {isSuperadmin ? (
                                <Button variant="secondary" className="flex-1" onClick={onClose}>
                                    Cerrar
                                </Button>
                            ) : (
                                <>
                                    {step > 1 && (
                                        <Button
                                            variant="secondary"
                                            className="flex-1 !bg-transparent border-[var(--border-color)]"
                                            onClick={() => setStep(step - 1)}
                                        >
                                            Volver
                                        </Button>
                                    )}
                                    {step < 3 ? (
                                        <Button
                                            variant="primary"
                                            className="flex-1 shadow-lg shadow-primary-500/20"
                                            onClick={() => setStep(step + 1)}
                                            disabled={step === 1 && !selectedClient || step === 2 && items.length === 0}
                                        >
                                            Siguiente Paso
                                            <ChevronRight size={18} strokeWidth={2.5} />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            className="flex-1 shadow-lg shadow-primary-500/30 font-black uppercase tracking-widest !h-12"
                                            onClick={handleSubmit}
                                            disabled={loading || !salesRepId}
                                        >
                                            {loading ? 'Guardando...' : order ? 'Actualizar Presupuesto' : 'Confirmar Presupuesto'}
                                            {!loading && <Save size={18} strokeWidth={2.5} />}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default OrderDrawer;
