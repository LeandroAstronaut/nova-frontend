import React from 'react';
import { Search, Loader2, Package, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCatalog = ({
    products,
    loading,
    searchQuery,
    setSearchQuery,
    priceList,
    itemsInCart,
    onProductClick,
    onAddDirect,
    isClient = false
}) => {
    return (
        <div className="space-y-6">
            {/* Header con Search - Estilo consistente con paso 1 */}
            <div className="bg-(--bg-card) p-4 rounded-2xl border border-(--border-color) shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} strokeWidth={2.5} />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-100 focus:border-primary-300 rounded-xl text-xs  text-secondary-800 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                    <p className="text-(--text-muted) text-sm font-medium">Cargando catálogo...</p>
                </div>
            ) : products.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                        {products.map((product) => {
                            const inCart = itemsInCart.find(i => i.productId === product._id);
                            const price = priceList === 2 ? (product.pricing?.list2 || 0) : (product.pricing?.list1 || 0);
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={product._id}
                                    onClick={() => onProductClick(product)}
                                    className={`group bg-(--bg-card) rounded-2xl border p-4 transition-all cursor-pointer relative ${inCart 
                                            ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md' 
                                            : 'border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
                                        }`}
                                >
                                    {/* Badge en carrito - dentro de los límites */}
                                    {inCart && (
                                        <div className="absolute top-3 right-3 px-2 py-1 bg-primary-600 text-white text-[9px] font-bold uppercase rounded-lg flex items-center gap-1 shadow-md z-10">
                                            <Check size={10} />
                                            {inCart.quantity} en carrito
                                        </div>
                                    )}

                                    {/* Badge de descuento para clientes */}
                                    {isClient && product.pricing?.discount > 0 && (
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-success-500 text-white text-[9px] font-bold rounded-lg shadow-md z-10">
                                            -{product.pricing.discount}%
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                        {/* Imagen */}
                                        <div className={`relative aspect-square rounded-xl overflow-hidden flex items-center justify-center ${inCart ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-(--bg-hover)'}`}>
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <Package size={40} className="text-(--text-muted) opacity-50" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">{product.category}</p>
                                            <h3 className="text-sm font-bold text-(--text-primary) group-hover:text-primary-600 transition-colors line-clamp-2 min-h-10">
                                                {product.name}
                                            </h3>
                                            <p className="text-[11px] text-(--text-muted)">{product.code}</p>
                                        </div>

                                        {/* Precio y botón */}
                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-lg font-bold text-(--text-primary) tracking-tight">
                                                ${Number(price).toLocaleString('es-AR')}
                                            </p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAddDirect(product); }}
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-90 ${inCart 
                                                        ? 'bg-primary-600 text-white' 
                                                        : 'bg-(--bg-hover) text-(--text-muted) hover:bg-primary-600 hover:text-white'
                                                    }`}
                                            >
                                                <Plus size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-16 bg-(--bg-hover) rounded-3xl border-2 border-dashed border-(--border-color)">
                    <div className="w-16 h-16 bg-(--bg-card) rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package size={32} className="text-(--text-muted) opacity-50" />
                    </div>
                    <p className="text-(--text-muted) text-sm font-medium">
                        {searchQuery ? 'No se encontraron productos' : 'Escribe para buscar productos'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductCatalog;
