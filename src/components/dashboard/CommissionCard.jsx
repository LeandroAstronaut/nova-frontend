import React, { useState } from 'react';
import { DollarSign, Award, Users, ArrowUpRight, User, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommissionCard = ({ 
    type = 'seller',
    data = {},
    isLoading = false,
    isAdmin = false,
    showPricesWithTax = false,
    taxRate = 21,
}) => {
    const navigate = useNavigate();
    const [showMyCommissions, setShowMyCommissions] = useState(false);
    
    const {
        myMonthTotal = 0,
        myPreviousMonth = 0,
        myTopOrders = [],
        companyMonthTotal = 0,
        sellersRanking = [],
    } = data;

    // Para admin: puede ver empresa o sus comisiones
    const isShowingMyCommissions = isAdmin && showMyCommissions;
    
    // Datos a mostrar
    const currentTotal = isShowingMyCommissions ? myMonthTotal : 
                        (isAdmin ? companyMonthTotal : myMonthTotal);
    const previousTotal = isShowingMyCommissions ? myPreviousMonth : 0;
    const diff = currentTotal - previousTotal;
    const percentChange = previousTotal > 0 ? ((diff / previousTotal) * 100).toFixed(1) : 0;

    const handleOrderClick = (orderId) => {
        if (orderId) navigate(`/pedidos/${orderId}`);
    };

    const handleSellerClick = (sellerId) => {
        if (sellerId) navigate(`/usuarios/${sellerId}`);
    };

    if (isLoading) {
        return (
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)] h-[400px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100"></div>
                    <div className="text-[var(--text-muted)] text-xs">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign size={14} />
                        {isShowingMyCommissions ? 'Mi Comisión' : 'Comisiones'}
                    </h3>
                    
                    {/* Toggle para Admin */}
                    {isAdmin && (
                        <button
                            onClick={() => setShowMyCommissions(!showMyCommissions)}
                            className="text-[11px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        >
                            {showMyCommissions ? (
                                <>
                                    <Users size={12} />
                                    Ver empresa
                                </>
                            ) : (
                                <>
                                    <User size={12} />
                                    Ver mías
                                </>
                            )}
                        </button>
                    )}
                </div>
                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />

                {/* Total */}
                <div className="bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800 p-4 mb-5">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        {isShowingMyCommissions ? 'Mi total del mes' : isAdmin ? 'Total empresa' : 'Total del mes'}
                        {showPricesWithTax && ' (c/IVA)'}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-[var(--text-primary)]">
                            ${currentTotal.toLocaleString('es-AR')}
                        </span>
                        {isShowingMyCommissions && percentChange !== 0 && (
                            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${diff >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                                {diff >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {diff >= 0 ? '+' : ''}{percentChange}%
                            </span>
                        )}
                    </div>
                    {isShowingMyCommissions && previousTotal > 0 && (
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            vs ${previousTotal.toLocaleString('es-AR')} mes anterior
                        </div>
                    )}
                    {showPricesWithTax && (
                        <div className="text-[10px] text-success-600 dark:text-success-400 mt-1">
                            Incluye IVA ({taxRate}%)
                        </div>
                    )}
                </div>

                {/* Contenido según vista */}
                {isShowingMyCommissions || !isAdmin ? (
                    // Mis comisiones (vendedor o admin viendo las suyas)
                    <div>
                        <h4 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Award size={14} />
                            Top pedidos
                        </h4>
                        <div className="space-y-1">
                            {myTopOrders.length > 0 ? myTopOrders.map((order, index) => (
                                <div 
                                    key={order.id} 
                                    onClick={() => handleOrderClick(order.id)}
                                    className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-primary-600 font-bold w-4">{index + 1}</span>
                                        <span className="text-[13px] font-medium text-[var(--text-primary)]">#{order.orderNumber}</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-primary-600">
                                        +${order.commission.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-[var(--text-muted)] text-[13px]">
                                    Sin comisiones este mes
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Ranking de vendedores (admin viendo empresa)
                    <div>
                        <h4 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users size={14} />
                            Ranking vendedores
                        </h4>
                        <div className="space-y-1">
                            {sellersRanking.length > 0 ? sellersRanking.map((seller, index) => (
                                <div 
                                    key={seller.id} 
                                    onClick={() => handleSellerClick(seller.id)}
                                    className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-primary-600 font-bold w-4">{index + 1}</span>
                                        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate max-w-[120px]">{seller.name}</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-primary-600">
                                        ${seller.commission.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-[var(--text-muted)] text-[13px]">
                                    Sin comisiones registradas
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommissionCard;
