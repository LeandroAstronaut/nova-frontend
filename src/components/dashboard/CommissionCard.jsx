import React, { useState } from 'react';
import { DollarSign, Award, Users, ArrowUpRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommissionCard = ({ 
    type = 'seller',
    data = {},
    isLoading = false,
    isAdmin = false,
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
            <div className="card rounded-xl h-[400px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100"></div>
                    <div className="text-[var(--text-muted)] text-xs">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card rounded-xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                        <DollarSign size={18} className="text-primary-600" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)] text-base">
                            {isShowingMyCommissions ? 'Mi Comisión' : 'Comisiones'}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            {isShowingMyCommissions ? 'Mi acumulado' : isAdmin ? 'Resumen empresa' : 'Acumulado'}
                        </p>
                    </div>
                </div>
                
                {/* Toggle para Admin */}
                {isAdmin && (
                    <button
                        onClick={() => setShowMyCommissions(!showMyCommissions)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
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

            {/* Total */}
            <div className="bg-primary-50/50 rounded-lg p-4 mb-5">
                <div className="text-xs text-[var(--text-muted)] mb-1">
                    {isShowingMyCommissions ? 'Mi total del mes' : isAdmin ? 'Total empresa' : 'Total del mes'}
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-[var(--text-primary)]">
                        ${currentTotal.toLocaleString('es-AR')}
                    </span>
                    {isShowingMyCommissions && percentChange !== 0 && (
                        <span className={`text-xs font-medium ${diff >= 0 ? 'text-primary-600' : 'text-[var(--text-muted)]'}`}>
                            {diff >= 0 ? '+' : ''}{percentChange}%
                        </span>
                    )}
                </div>
                {isShowingMyCommissions && previousTotal > 0 && (
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        vs ${previousTotal.toLocaleString('es-AR')} mes anterior
                    </div>
                )}
            </div>

            {/* Contenido según vista */}
            {isShowingMyCommissions || !isAdmin ? (
                // Mis comisiones (vendedor o admin viendo las suyas)
                <div>
                    <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
                        <Award size={14} className="text-primary-500" strokeWidth={1.5} />
                        Top pedidos
                    </h4>
                    <div className="space-y-2">
                        {myTopOrders.length > 0 ? myTopOrders.map((order, index) => (
                            <div 
                                key={order.id} 
                                onClick={() => handleOrderClick(order.id)}
                                className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-primary-600 font-medium w-4">{index + 1}</span>
                                    <span className="text-sm text-[var(--text-primary)]">#{order.orderNumber}</span>
                                </div>
                                <span className="text-sm font-medium text-primary-600">
                                    +${order.commission.toLocaleString('es-AR')}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-4 text-[var(--text-muted)] text-xs">
                                Sin comisiones este mes
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Ranking de vendedores (admin viendo empresa)
                <div>
                    <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
                        <Users size={14} className="text-primary-500" strokeWidth={1.5} />
                        Ranking vendedores
                    </h4>
                    <div className="space-y-2">
                        {sellersRanking.length > 0 ? sellersRanking.map((seller, index) => (
                            <div 
                                key={seller.id} 
                                onClick={() => handleSellerClick(seller.id)}
                                className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-primary-600 font-medium w-4">{index + 1}</span>
                                    <span className="text-sm text-[var(--text-primary)] truncate max-w-[120px]">{seller.name}</span>
                                </div>
                                <span className="text-sm font-medium text-primary-600">
                                    ${seller.commission.toLocaleString('es-AR')}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-4 text-[var(--text-muted)] text-xs">
                                Sin comisiones registradas
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommissionCard;
