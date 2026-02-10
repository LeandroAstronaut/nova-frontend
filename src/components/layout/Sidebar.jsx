import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Zap,
    ClipboardList,
    FileEdit,
    Receipt,
    Box,
    Landmark,
    X,
    Building2,
    Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigationGuard } from '../../context/NavigationGuardContext';

const SidebarItem = ({ to, icon: Icon, label, collapsed, onNavigated }) => {
    const navigate = useNavigate();
    const { requestNavigation } = useNavigationGuard();
    
    const handleClick = (e) => {
        e.preventDefault();
        
        requestNavigation(
            to,
            () => {
                navigate(to);
                onNavigated?.();
            },
            () => {}
        );
    };

    return (
        <NavLink
            to={to}
            onClick={handleClick}
            className={({ isActive }) => `
                sidebar-item group
                ${isActive
                    ? 'sidebar-item-active'
                    : 'sidebar-item-inactive'}
            `}
        >
            {({ isActive }) => (
                <>
                    <div className={`
                        p-1.5 rounded-md transition-colors
                        ${isActive ? 'bg-white dark:bg-secondary-700 shadow-sm' : 'group-hover:bg-white dark:group-hover:bg-secondary-700'}
                    `}>
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {!collapsed && (
                        <span className="text-[13.5px]  tracking-tight">
                            {label}
                        </span>
                    )}
                    {collapsed && (
                        <div className="fixed left-[70px] bg-secondary-900 dark:bg-secondary-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[9999] shadow-lg">
                            {label}
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
};

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
    const { logout, user } = useAuth();
    const { requestNavigation } = useNavigationGuard();
    const navigate = useNavigate();
    
    // Detectar si es mobile para aplicar animación solo en mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const features = user?.company?.features || {};

    // Verificar si es superadmin
    const isSuperadmin = user?.role?.name === 'superadmin';

    // Definición de items de navegación con visibilidad condicional
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
        { name: 'Pedidos', path: '/pedidos', icon: ClipboardList, visible: features.orders !== false },
        { name: 'Presupuestos', path: '/presupuestos', icon: FileEdit, visible: features.orders !== false },
        { name: 'Recibos', path: '/recibos', icon: Receipt, visible: features.receipts === true },
        { name: 'Catálogo', path: '/catalogo', icon: Box, visible: features.catalog === true },
        { name: 'Clientes', path: '/clientes', icon: Users, visible: true },
        { name: 'Cuentas Corrientes', path: '/cuentas', icon: Landmark, visible: features.currentAccount === true },
        // Solo para superadmin
        { name: 'Compañías', path: '/admin/companies', icon: Building2, visible: isSuperadmin },
    ].filter(item => item.visible !== false);

    const handleLogout = () => {
        requestNavigation(
            '/login',
            () => logout(),
            () => {}
        );
    };

    const handleLogoClick = () => {
        requestNavigation(
            '/',
            () => {
                navigate('/');
                setMobileOpen(false);
            },
            () => {}
        );
    };

    // Cerrar sidebar mobile al navegar
    const handleNavigated = () => {
        if (mobileOpen) {
            setMobileOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - Desktop con CSS transition, Mobile con Framer Motion */}
            <motion.aside
                initial={false}
                animate={isMobile ? {
                    x: mobileOpen ? 0 : '-100%',
                } : {}}
                transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 300
                }}
                style={{ willChange: isMobile ? 'transform' : 'auto' }}
                className={`
                    app-sidebar theme-transition
                    w-[260px] 
                    lg:transition-all lg:duration-300
                    ${collapsed ? 'lg:w-[80px]' : 'lg:w-[260px]'}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Logo Header */}
                <div className={`
                    h-16 flex items-center justify-between shrink-0
                    border-b border-[var(--border-color)]
                    ${collapsed ? 'lg:px-3' : 'lg:px-4'} px-4
                `}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button
                            onClick={handleLogoClick}
                            className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-md shrink-0 hover:bg-primary-700 transition-colors"
                        >
                            <Zap size={20} className="fill-current" />
                        </button>
                        
                        {/* Logo Text - Desktop */}
                        <div className={`hidden lg:flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="font-bold text-[13px] leading-tight text-[var(--text-primary)] truncate whitespace-nowrap">
                                {isSuperadmin ? 'NOVA Admin' : (user?.company?.name || 'Cargando...')}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5 whitespace-nowrap">
                                {isSuperadmin ? 'Sistema' : 'by'} <span className="text-primary-600 dark:text-primary-400">{isSuperadmin ? 'Super Admin' : 'NOVA'}</span>
                            </span>
                        </div>

                        {/* Logo Text - Mobile */}
                        <div className="flex lg:hidden flex-col overflow-hidden">
                            <span className="font-bold text-[13px] leading-tight text-[var(--text-primary)] truncate whitespace-nowrap">
                                {isSuperadmin ? 'NOVA Admin' : (user?.company?.name || 'Cargando...')}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5 whitespace-nowrap">
                                {isSuperadmin ? 'Sistema' : 'by'} <span className="text-primary-600 dark:text-primary-400">{isSuperadmin ? 'Super Admin' : 'NOVA'}</span>
                            </span>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            to={item.path}
                            icon={item.icon}
                            label={item.name}
                            collapsed={collapsed}
                            onNavigated={handleNavigated}
                        />
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-[var(--border-color)] shrink-0">
                    {/* Collapse Button - Desktop Only */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex w-full items-center p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-1"
                    >
                        {collapsed ? (
                            <ChevronRight size={18} className="mx-auto" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <ChevronLeft size={18} />
                                <span className="text-[11px] font-semibold uppercase tracking-wider">Contraer</span>
                            </div>
                        )}
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-[var(--text-muted)] hover:text-danger-600 dark:hover:text-danger-400 transition-colors group relative"
                    >
                        <div className="p-1.5 shrink-0">
                            <LogOut size={18} />
                        </div>
                        {!collapsed && (
                            <span className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">
                                Cerrar Sesión
                            </span>
                        )}
                        {collapsed && (
                            <div className="fixed left-[70px] bg-secondary-900 dark:bg-secondary-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[9999] shadow-lg">
                                Cerrar Sesión
                            </div>
                        )}
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
