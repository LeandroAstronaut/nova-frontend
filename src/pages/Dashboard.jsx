import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    SalesChart,
    StatCard,
    AlertBanner,
    CommissionCard,
    RecentActivity,
    StockAlerts,
    QuickActions,
} from '../components/dashboard';
import {
    ShoppingCart,
    Users,
    FileText,
    DollarSign,
    Sun,
    Moon,
    Building2,
    User,
} from 'lucide-react';
import { getDashboardData } from '../services/dashboardService';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        userRole: null,
        kpis: {
            ordersThisMonth: { count: 0, amount: 0 },
            pendingBudgets: { count: 0, amount: 0, oldCount: 0 },
            salesTotal: 0,
            salesLastMonth: 0,
            mySales: 0,
            receiptsTotal: 0,
            activeClients: 0,
        },
        recentOrders: [],
        stockAlerts: [],
        commissions: null,
        chartData: [],
    });

    const isSuperadmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin';
    const isSeller = user?.role?.name === 'vendedor';
    const isClient = user?.role?.name === 'cliente';

    const features = user?.company?.features || {};
    
    // Admin puede ver comisiones globales, vendedor solo las suyas (si tiene permiso)
    const canViewCommissions = features.commissionCalculation && 
        ((isAdmin) || (isSeller && user?.canViewCommission));
    
    // Solo admin ve stock
    const canViewStock = isAdmin && features.stock;

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const response = await getDashboardData();
            if (response.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handlers de navegación - RUTAS EN ESPAÑOL
    const handleQuickAction = (actionId) => {
        const routes = {
            'new-order': '/pedidos/nuevo',
            'new-budget': '/presupuestos/nuevo',
            'new-client': '/clientes/nuevo',
            'view-catalog': '/productos',
            'view-products': '/productos',
            'new-receipt': '/recibos/nuevo',
            'view-commissions': '/usuarios',
            'view-account': '/cuentas',
        };
        const route = routes[actionId];
        if (route) navigate(route);
    };

    const handleViewBudgets = () => navigate('/presupuestos');
    const handleViewStock = () => navigate('/productos');
    const handleViewOrders = () => navigate('/pedidos');
    const handleViewClients = () => navigate('/clientes');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const activeModules = [
        { id: 'stock', label: 'Stock', enabled: features.stock },
        { id: 'receipts', label: 'Recibos', enabled: features.receipts },
        { id: 'commissions', label: 'Comisiones', enabled: features.commissionCalculation },
        { id: 'catalog', label: 'Catálogo', enabled: features.catalog },
    ].filter(m => m.enabled);

    // Calcular tendencia
    const salesTrend = dashboardData.kpis.salesLastMonth > 0
        ? ((dashboardData.kpis.salesTotal - dashboardData.kpis.salesLastMonth) / dashboardData.kpis.salesLastMonth * 100).toFixed(1)
        : 0;
    
    const mySalesTrend = dashboardData.kpis.salesLastMonth > 0
        ? ((dashboardData.kpis.mySales - dashboardData.kpis.salesLastMonth) / dashboardData.kpis.salesLastMonth * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-5 pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                            {getGreeting()}, {user?.firstName}
                        </h1>
                        {new Date().getHours() < 18 ? (
                            <Sun size={18} className="text-primary-400" strokeWidth={1.5} />
                        ) : (
                            <Moon size={18} className="text-primary-400" strokeWidth={1.5} />
                        )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formatDate()} · {isSuperadmin ? 'Super Admin' : isAdmin ? 'Administrador' : isSeller ? 'Vendedor' : 'Cliente'}
                    </p>
                </div>

                {activeModules.length > 0 && !isSuperadmin && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {activeModules.map(mod => (
                            <span 
                                key={mod.id}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700 border border-primary-100"
                            >
                                {mod.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Alert Banners - Solo si hay alertas */}
            {(dashboardData.kpis.pendingBudgets.count > 0 || (canViewStock && dashboardData.stockAlerts.length > 0)) && (
                <div className="space-y-2">
                    {dashboardData.kpis.pendingBudgets.count > 0 && (
                        <AlertBanner
                            type={dashboardData.kpis.pendingBudgets.oldCount > 0 ? 'oldBudgets' : 'budgets'}
                            count={dashboardData.kpis.pendingBudgets.count}
                            amount={dashboardData.kpis.pendingBudgets.amount}
                            daysOld={7}
                            onClick={handleViewBudgets}
                        />
                    )}
                    
                    {canViewStock && dashboardData.stockAlerts.length > 0 && (
                        <AlertBanner
                            type="stock"
                            count={dashboardData.stockAlerts.length}
                            onClick={handleViewStock}
                        />
                    )}
                </div>
            )}

            {/* KPI Cards - Según rol */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* ADMIN: Ventas de la Empresa */}
                {isAdmin && (
                    <StatCard
                        title="Ventas Empresa"
                        value={`$${dashboardData.kpis.salesTotal.toLocaleString('es-AR')}`}
                        subtitle={`${dashboardData.kpis.ordersThisMonth.count} pedidos`}
                        icon={Building2}
                        trend={parseFloat(salesTrend) !== 0 ? { value: Math.abs(salesTrend), isPositive: salesTrend > 0 } : null}
                        route="/pedidos"
                    />
                )}

                {/* ADMIN + VENDEDOR: Mis Ventas */}
                {(isAdmin || isSeller) && (
                    <StatCard
                        title="Mis Ventas"
                        value={`$${dashboardData.kpis.mySales.toLocaleString('es-AR')}`}
                        subtitle="Este mes"
                        icon={DollarSign}
                        trend={parseFloat(mySalesTrend) !== 0 ? { value: Math.abs(mySalesTrend), isPositive: mySalesTrend > 0 } : null}
                        route="/pedidos"
                    />
                )}

                {/* CLIENTE: Mis Compras */}
                {isClient && (
                    <StatCard
                        title="Mis Compras"
                        value={`$${dashboardData.kpis.salesTotal.toLocaleString('es-AR')}`}
                        subtitle={`${dashboardData.kpis.ordersThisMonth.count} pedidos`}
                        icon={ShoppingCart}
                        route="/pedidos"
                    />
                )}

                {/* Todos: Presupuestos Pendientes */}
                <StatCard
                    title="Presupuestos"
                    value={dashboardData.kpis.pendingBudgets.count}
                    subtitle={dashboardData.kpis.pendingBudgets.amount > 0 ? `$${dashboardData.kpis.pendingBudgets.amount.toLocaleString('es-AR')}` : 'Pendientes'}
                    icon={FileText}
                    route="/presupuestos"
                />

                {/* ADMIN + VENDEDOR: Clientes (CLIENTE no lo ve) */}
                {(isAdmin || isSeller) && (
                    <StatCard
                        title="Clientes"
                        value={dashboardData.kpis.activeClients}
                        subtitle="Activos"
                        icon={Users}
                        route="/clientes"
                    />
                )}

                {/* CLIENTE: Mi Cuenta */}
                {isClient && (
                    <StatCard
                        title="Mi Cuenta"
                        value="Ver"
                        subtitle="Estado y pedidos"
                        icon={User}
                        route="/cuentas"
                    />
                )}

                {/* Todos: Total Pedidos */}
                <StatCard
                    title="Pedidos"
                    value={dashboardData.kpis.ordersThisMonth.count}
                    subtitle="Este mes"
                    icon={ShoppingCart}
                    route="/pedidos"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Gráfico de Ventas */}
                <div className="xl:col-span-2">
                    <SalesChart 
                        title={isAdmin ? "Ventas Empresa" : isSeller ? "Mis Ventas" : "Mis Compras"}
                        isLoading={loading}
                        onViewDetails={handleViewOrders}
                    />
                </div>

                {/* Comisiones - Admin ve empresa + suyas, Vendedor solo suyas */}
                {canViewCommissions && dashboardData.commissions && (
                    <CommissionCard
                        type={isAdmin ? 'admin' : 'seller'}
                        data={dashboardData.commissions}
                        isLoading={loading}
                        isAdmin={isAdmin}
                    />
                )}

                {/* Si no hay comisiones, mostrar accesos rápidos */}
                {!canViewCommissions && !isClient && (
                    <QuickActions
                        features={features}
                        userRole={user?.role?.name}
                        onAction={handleQuickAction}
                    />
                )}
                
                {/* Cliente ve accesos rápidos también */}
                {isClient && (
                    <QuickActions
                        features={features}
                        userRole={user?.role?.name}
                        onAction={handleQuickAction}
                    />
                )}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Actividad Reciente */}
                <div className="lg:col-span-2">
                    <RecentActivity
                        orders={dashboardData.recentOrders}
                        isLoading={loading}
                        onViewAll={handleViewOrders}
                        userRole={dashboardData.userRole}
                    />
                </div>

                {/* Columna derecha: Stock (solo Admin) + Accesos rápidos */}
                <div className="space-y-5">
                    {canViewStock && (
                        <StockAlerts
                            products={dashboardData.stockAlerts}
                            isLoading={loading}
                            onViewAll={handleViewStock}
                        />
                    )}
                    
                    {/* Accesos rápidos adicionales para Admin y Vendedor */}
                    {(isAdmin || isSeller) && canViewCommissions && (
                        <QuickActions
                            features={features}
                            userRole={user?.role?.name}
                            onAction={handleQuickAction}
                        />
                    )}
                </div>
            </div>

            {/* Superadmin Section */}
            {isSuperadmin && (
                <div className="card rounded-xl p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-[var(--text-primary)] text-lg">Superadministrador</h3>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                Acceso completo a todas las compañías
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/admin/companies')}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                        >
                            Gestionar Compañías
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
