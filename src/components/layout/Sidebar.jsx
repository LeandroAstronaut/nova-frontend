import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Zap,
    ClipboardList,
    FileEdit,
    Receipt,
    Box,
    Landmark,
    X,
    Building2,
    ChevronLeft,
    ChevronRight,
    Briefcase
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
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                    ? 'bg-primary-50/80 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                    : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-hover)'
                }
                ${collapsed ? 'justify-center' : ''}
            `}
        >
            {({ isActive }) => (
                <>
                    {/* Indicador de activo - línea lateral */}
                    {isActive && (
                        <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                    
                    {/* Icono */}
                    <div className={`
                        relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                        ${isActive 
                            ? 'bg-white dark:bg-primary-800/50 shadow-sm' 
                            : 'bg-transparent group-hover:bg-white/50 dark:group-hover:bg-white/5'
                        }
                    `}>
                        <Icon 
                            size={18} 
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}
                        />
                    </div>
                    
                    {/* Label */}
                    {!collapsed && (
                        <span className={`
                            text-[13px] font-medium tracking-tight transition-all duration-200
                            ${isActive ? 'font-semibold' : ''}
                        `}>
                            {label}
                        </span>
                    )}
                    
                    {/* Tooltip cuando está colapsado */}
                    {collapsed && (
                        <div className="fixed left-[72px] bg-(--bg-card) text-(--text-primary) text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999] shadow-lg border border-(--border-color) translate-x-2 group-hover:translate-x-0">
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
    const [showCollapseTrigger, setShowCollapseTrigger] = useState(false);
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const features = user?.company?.features || {};
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin';
    const isClient = user?.role?.name === 'cliente';

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
        { name: 'Pedidos', path: '/pedidos', icon: ClipboardList, visible: features.orders !== false },
        { name: 'Presupuestos', path: '/presupuestos', icon: FileEdit, visible: features.orders !== false },
        { name: 'Recibos', path: '/recibos', icon: Receipt, visible: features.receipts === true },
        { name: 'Catálogo', path: '/catalogo', icon: Box, visible: !isClient && features.catalog === true },
        { name: 'Clientes', path: '/clientes', icon: Users, visible: !isClient },
        { name: 'Usuarios', path: '/usuarios', icon: Briefcase, visible: isAdmin },
        { name: 'Cuentas Corrientes', path: '/cuentas', icon: Landmark, visible: !isClient && features.currentAccount === true },
        { name: 'Compañías', path: '/admin/companies', icon: Building2, visible: isSuperadmin },
    ].filter(item => item.visible !== false);

    const handleLogout = () => {
        requestNavigation('/login', () => logout(), () => {});
    };

    const handleLogoClick = () => {
        requestNavigation('/', () => {
            navigate('/');
            setMobileOpen(false);
        }, () => {});
    };

    const handleNavigated = () => {
        if (mobileOpen) setMobileOpen(false);
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
                        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={isMobile ? { x: mobileOpen ? 0 : '-100%' } : {}}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onMouseEnter={() => setShowCollapseTrigger(true)}
                onMouseLeave={() => setShowCollapseTrigger(false)}
                className={`
                    fixed inset-y-0 left-0 z-[60] pointer-events-auto
                    bg-(--bg-card) border-r border-(--border-color)
                    flex flex-col h-screen
                    transition-all duration-300 ease-out
                    ${collapsed ? 'w-[76px]' : 'w-[260px]'}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >                {/* Logo Header */}
                <div className={`
                    h-16 flex items-center shrink-0
                    border-b border-(--border-color)
                    transition-all duration-300
                    ${collapsed ? 'px-3 justify-center' : 'px-4'}
                `}>
                    <button
                        onClick={handleLogoClick}
                        className={`
                            flex items-center gap-3 overflow-hidden transition-all duration-300
                            ${collapsed ? 'w-full justify-center' : 'w-full'}
                        `}
                    >
                        {/* Logo Icon */}
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25 shrink-0 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Zap size={20} className="relative fill-current" />
                        </div>
                        
                        {/* Logo Text */}
                        <div className={`
                            flex flex-col overflow-hidden transition-all duration-300
                            ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                        `}>
                            <span className="font-bold text-sm leading-tight text-(--text-primary) truncate whitespace-nowrap">
                                {isSuperadmin ? 'NOVA Admin' : (user?.company?.name || 'Cargando...')}
                            </span>
                            <span className="text-[10px] font-medium text-(--text-muted) tracking-wide mt-0.5 whitespace-nowrap">
                                {isSuperadmin ? 'Sistema' : 'by'} <span className="text-primary-600 dark:text-primary-400 font-semibold">{isSuperadmin ? 'Super Admin' : 'NOVA'}</span>
                            </span>
                        </div>
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 no-scrollbar">
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
                <div className="p-3 border-t border-(--border-color) shrink-0">
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-(--text-muted) hover:text-danger-600 dark:hover:text-danger-400
                            hover:bg-danger-50/50 dark:hover:bg-danger-900/10
                            transition-all duration-200 group
                            ${collapsed ? 'justify-center' : ''}
                        `}
                    >
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 group-hover:bg-white dark:group-hover:bg-white/5">
                            <LogOut size={18} />
                        </div>
                        
                        {!collapsed && (
                            <span className="text-[13px] font-medium tracking-tight">
                                Cerrar Sesión
                            </span>
                        )}
                        
                        {collapsed && (
                            <div className="fixed left-[72px] bg-(--bg-card) text-(--text-primary) text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999] shadow-lg border border-(--border-color) translate-x-2 group-hover:translate-x-0">
                                Cerrar Sesión
                            </div>
                        )}
                    </button>
                </div>

                {/* Collapse Trigger - Flecha en el borde derecho */}
                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`
                            absolute -right-3 top-1/2 -translate-y-1/2
                            w-6 h-12 rounded-full
                            bg-(--bg-card) border border-(--border-color)
                            flex items-center justify-center
                            text-(--text-muted) hover:text-(--text-primary)
                            shadow-sm hover:shadow-md
                            transition-all duration-200
                            ${showCollapseTrigger ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
                        `}
                    >
                        {collapsed ? (
                            <ChevronRight size={14} strokeWidth={2.5} />
                        ) : (
                            <ChevronLeft size={14} strokeWidth={2.5} />
                        )}
                    </button>
                )}
            </motion.aside>
        </>
    );
};

export default Sidebar;
