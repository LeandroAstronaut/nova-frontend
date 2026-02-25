import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    SalesChart,
    StatCard,
    AlertBanner,
    CommissionCard,
    RecentActivity,
    StockAlerts,
} from '../components/dashboard';
import BudgetDrawer from '../components/orders/BudgetDrawer';
import ClientDrawer from '../components/clients/ClientDrawer';
import ReceiptDrawer from '../components/receipts/ReceiptDrawer';
import {
    ShoppingCart,
    Users,
    FileText,
    DollarSign,
    Sun,
    Moon,
    Building2,
    User,
    LayoutDashboard,
    TrendingUp,
    Zap,
    Activity,
    Plus,
    Package,
    ChevronDown,
} from 'lucide-react';
import { getDashboardData } from '../services/dashboardService';

const Dashboard = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Estados para drawers
    const [isBudgetDrawerOpen, setIsBudgetDrawerOpen] = useState(false);
    const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
    const [isReceiptDrawerOpen, setIsReceiptDrawerOpen] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [clients, setClients] = useState([]);
    const [dashboardData, setDashboardData] = useState({
        userRole: null,
        kpis: {
            ordersThisMonth: { count: 0, amount: 0 },
            pendingBudgets: { count: 0, oldCount: 0 },
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
    
    // Configuración de impuestos
    const showPricesWithTax = user?.company?.showPricesWithTax === true;
    const taxRate = user?.company?.taxRate || user?.company?.defaultTaxRate || 21;
    
    // Admin puede ver comisiones globales, vendedor solo las suyas (si tiene permiso)
    const canViewCommissions = features.commissionCalculation && 
        ((isAdmin) || (isSeller && user?.canViewCommission));
    
    // Solo admin ve stock
    const canViewStock = isAdmin && features.stock;

    useEffect(() => {
        loadDashboardData();
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const clientData = await getClients();
            const clientsArray = Array.isArray(clientData) ? clientData : (clientData?.clients || clientData?.data || []);
            
            // Filtrar por vendedor si es vendedor
            if (isSeller && !isAdmin) {
                setClients(clientsArray.filter(c => 
                    c.salesRepId === user?.id || c.salesRepId?._id === user?.id
                ));
            } else {
                setClients(clientsArray);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

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
            'view-catalog': '/catalogo',
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
        <div className="space-y-6">
            {/* Header con botones de acción */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                            {getGreeting()}, {user?.firstName}
                        </h1>
                        {new Date().getHours() < 18 ? (
                            <Sun size={18} className="text-primary-400" strokeWidth={1.5} />
                        ) : (
                            <Moon size={18} className="text-primary-400" strokeWidth={1.5} />
                        )}
                    </div>
                    <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                        {isSuperadmin ? 'Super Admin' : isAdmin ? 'Administrador' : isSeller ? 'Vendedor' : 'Cliente'}
                    </p>
                </div>

                {/* Botones de acción */}
                {!isSuperadmin && (
                    <div className="flex items-center gap-2">
                        {/* Nuevo Presupuesto */}
                        <button
                            onClick={() => setIsBudgetDrawerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Presupuesto
                        </button>

                        {/* Ver Catálogo */}
                        {features.catalog && (
                            <button
                                onClick={() => navigate('/catalogo')}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium transition-colors"
                            >
                                <Package size={16} strokeWidth={1.5} />
                                Catálogo
                            </button>
                        )}

                        {/* Menú + (Nuevo Cliente / Nuevo Recibo) */}
                        {!isClient && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium transition-colors"
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                    <ChevronDown size={14} />
                                </button>
                                
                                {showMoreMenu && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowMoreMenu(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-color)] z-50 overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    setIsClientDrawerOpen(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                                            >
                                                <Users size={16} className="text-primary-500" />
                                                Nuevo Cliente
                                            </button>
                                            {features.receipts && (
                                                <button
                                                    onClick={() => {
                                                        setShowMoreMenu(false);
                                                        loadClients().then(() => {
                                                            setIsReceiptDrawerOpen(true);
                                                        });
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors border-t border-[var(--border-color)]"
                                                >
                                                    <FileText size={16} className="text-primary-500" />
                                                    Nuevo Recibo
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Alert Banners */}
            {(dashboardData.kpis.pendingBudgets.count > 0 || (canViewStock && dashboardData.stockAlerts.length > 0)) && (
                <div className="space-y-3">
                    {dashboardData.kpis.pendingBudgets.count > 0 && (
                        <AlertBanner
                            type={dashboardData.kpis.pendingBudgets.oldCount > 0 ? 'oldBudgets' : 'budgets'}
                            count={dashboardData.kpis.pendingBudgets.count}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ADMIN: Ventas de la Empresa */}
                {isAdmin && (
                    <StatCard
                        title={`Ventas Empresa ${showPricesWithTax ? '(c/IVA)' : '(s/IVA)'}`}
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
                        title={`Mis Ventas ${showPricesWithTax ? '(c/IVA)' : '(s/IVA)'}`}
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
                        title={`Mis Compras ${showPricesWithTax ? '(c/IVA)' : '(s/IVA)'}`}
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
                    subtitle="En espera"
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Gráfico de Ventas */}
                <div className="xl:col-span-2">
                    <SalesChart 
                        title={isAdmin ? "Ventas Empresa" : isSeller ? "Mis Ventas" : "Mis Compras"}
                        isLoading={loading}
                        onViewDetails={handleViewOrders}
                        showPricesWithTax={showPricesWithTax}
                        taxRate={taxRate}
                    />
                </div>

                {/* Comisiones - Admin ve empresa + suyas, Vendedor solo suyas */}
                {canViewCommissions && dashboardData.commissions && (
                    <CommissionCard
                        type={isAdmin ? 'admin' : 'seller'}
                        data={dashboardData.commissions}
                        isLoading={loading}
                        isAdmin={isAdmin}
                        showPricesWithTax={showPricesWithTax}
                        taxRate={taxRate}
                    />
                )}


            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Actividad Reciente */}
                <div className="lg:col-span-2">
                    <RecentActivity
                        orders={dashboardData.recentOrders}
                        isLoading={loading}
                        onViewAll={handleViewOrders}
                        userRole={dashboardData.userRole}
                    />
                </div>

                {/* Columna derecha: Stock (solo Admin) */}
                <div className="space-y-6">
                    {canViewStock && (
                        <StockAlerts
                            products={dashboardData.stockAlerts}
                            isLoading={loading}
                            onViewAll={handleViewStock}
                        />
                    )}
                </div>
            </div>

            {/* Superadmin Section */}
            {isSuperadmin && (
                <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
                    <div className="p-6">
                        <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <LayoutDashboard size={14} />
                            Superadministrador
                        </h3>
                        <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <p className="text-[13px] text-[var(--text-secondary)]">
                                    Acceso completo a todas las compañías del sistema
                                </p>
                            </div>
                            <button 
                                onClick={() => navigate('/admin/companies')}
                                className="px-4 py-2 rounded-lg text-[13px] font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                            >
                                Gestionar Compañías
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawers */}
            <BudgetDrawer
                isOpen={isBudgetDrawerOpen}
                onClose={() => setIsBudgetDrawerOpen(false)}
                onSave={() => {
                    setIsBudgetDrawerOpen(false);
                    loadDashboardData();
                    addToast('Presupuesto creado exitosamente', 'success');
                }}
                mode="create"
                type="budget"
            />

            <ClientDrawer
                isOpen={isClientDrawerOpen}
                onClose={() => setIsClientDrawerOpen(false)}
                onSave={() => {
                    setIsClientDrawerOpen(false);
                    loadDashboardData();
                    addToast('Cliente creado exitosamente', 'success');
                }}
                mode="create"
            />

            <ReceiptDrawer
                isOpen={isReceiptDrawerOpen}
                onClose={() => setIsReceiptDrawerOpen(false)}
                onSave={() => {
                    setIsReceiptDrawerOpen(false);
                    loadDashboardData();
                    loadClients();
                    addToast('Recibo creado exitosamente', 'success');
                }}
                clients={clients}
                company={user?.company}
                user={user}
                currentUser={user}
            />
        </div>
    );
};

export default Dashboard;
