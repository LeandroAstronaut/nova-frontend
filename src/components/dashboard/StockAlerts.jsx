import React from 'react';
import { Package, ArrowRight, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StockAlerts = ({ products = [], isLoading = false, onViewAll }) => {
    const navigate = useNavigate();

    const sortedProducts = [...products].sort((a, b) => {
        const aAvailable = a.stockAvailable || Math.max(0, (a.stock || 0) - (a.stockReserved || 0));
        const bAvailable = b.stockAvailable || Math.max(0, (b.stock || 0) - (b.stockReserved || 0));
        return aAvailable - bAvailable;
    });

    const handleProductClick = (productId) => {
        if (productId) navigate(`/productos/${productId}`);
    };

    if (isLoading) {
        return (
            <div className="card rounded-xl h-[350px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100"></div>
                    <div className="text-[var(--text-muted)] text-xs">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Package size={16} className="text-primary-600" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)] text-base">Stock Bajo</h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            {products.length} {products.length === 1 ? 'producto' : 'productos'}
                        </p>
                    </div>
                </div>
                
                {products.length > 0 && (
                    <button 
                        onClick={onViewAll}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                    >
                        Ver
                        <ArrowRight size={14} />
                    </button>
                )}
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {sortedProducts.length > 0 ? sortedProducts.slice(0, 5).map((product) => {
                    const available = product.stockAvailable || Math.max(0, (product.stock || 0) - (product.stockReserved || 0));
                    const minStock = product.minStock || 0;
                    const isCritical = available <= 0;
                    
                    return (
                        <div
                            key={product._id}
                            onClick={() => handleProductClick(product._id)}
                            className="p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-primary-300 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Box size={14} className="text-primary-500" strokeWidth={1.5} />
                                <span className="text-sm text-[var(--text-primary)] truncate flex-1">{product.name}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)]">Disp.</div>
                                    <div className={`text-sm font-medium ${isCritical ? 'text-primary-600' : 'text-[var(--text-primary)]'}`}>
                                        {available}
                                    </div>
                                </div>
                                <div className="border-x border-[var(--border-color)]">
                                    <div className="text-[10px] text-[var(--text-muted)]">Reserv.</div>
                                    <div className="text-sm font-medium text-[var(--text-primary)]">
                                        {product.stockReserved || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)]">Mín.</div>
                                    <div className="text-sm font-medium text-primary-600">{minStock}</div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-2">
                            <Package size={20} className="text-primary-400" strokeWidth={1.5} />
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">Sin alertas de stock</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockAlerts;
