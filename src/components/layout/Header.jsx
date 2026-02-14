import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Menu, ChevronDown, Sun, Moon, LogOut, User, Settings, Bell, Building2, RefreshCw, X, Briefcase, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { getUnreadCount } from '../../services/activityLogService';
import { getMyCompanies } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

const getRoleIcon = (roleName) => {
    switch (roleName) {
        case 'admin': return Shield;
        case 'vendedor': return Briefcase;
        case 'cliente': return Building2;
        default: return Briefcase;
    }
};

const getRoleLabel = (roleName) => {
    switch (roleName) {
        case 'admin': return 'Administrador';
        case 'vendedor': return 'Vendedor';
        case 'cliente': return 'Usuario de Cliente';
        default: return roleName;
    }
};

const Header = ({ onMenuClick }) => {
    const { user, logout, switchUserCompany } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [companies, setCompanies] = useState([]);
    const [hasMultipleCompanies, setHasMultipleCompanies] = useState(false);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [logoRev, setLogoRev] = useState(0);
    const menuRef = useRef(null);

    // Forzar re-render cuando cambie el logo
    useEffect(() => {
        setLogoRev(prev => prev + 1);
    }, [user?.company?.logo]);

    // Fetch unread count for the bell badge
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const count = await getUnreadCount();
                setUnreadCount(count);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };
        fetchUnreadCount();
        
        // Update every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Cargar compañías cuando se abre el menú de usuario
    useEffect(() => {
        if (isUserMenuOpen) {
            loadCompanies();
        }
    }, [isUserMenuOpen]);

    const loadCompanies = async () => {
        try {
            setIsLoadingCompanies(true);
            const data = await getMyCompanies();
            setCompanies(data.companies || []);
            setHasMultipleCompanies(data.hasMultiple);
        } catch (error) {
            console.error('Error loading companies:', error);
        } finally {
            setIsLoadingCompanies(false);
        }
    };

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSwitchCompany = async (companyUserId) => {
        if (companyUserId === user?.id) return;
        
        setIsSwitching(true);
        try {
            await switchUserCompany(companyUserId);
            addToast('Compañía cambiada exitosamente', 'success');
            setIsCompanyModalOpen(false);
            setIsUserMenuOpen(false);
            // Recargar la página para actualizar todos los datos
            window.location.reload();
        } catch (error) {
            addToast(error.response?.data?.message || 'Error al cambiar de compañía', 'error');
        } finally {
            setIsSwitching(false);
        }
    };

    const currentCompany = companies.find(c => c.isCurrent);

    return (
        <>
            <header className="app-header theme-transition">
                {/* Left side */}
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-secondary) transition-colors"
                        aria-label="Abrir menú"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Logo y Nombre de Empresa - SOLO MOBILE */}
                    <div className="flex md:hidden items-center gap-2">
                        {user?.company?.logo ? (
                            <img 
                                key={`${user.company.logo}-${logoRev}`}
                                src={user.company.logo} 
                                alt={user?.company?.name || 'Logo'} 
                                className="w-8 h-8 object-contain rounded-lg bg-white p-0.5"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                <Building2 size={16} className="text-primary-600" />
                            </div>
                        )}
                        <span className="text-sm font-semibold text-(--text-primary) truncate max-w-[140px]">
                            {user?.company?.name || 'NOVA'}
                        </span>
                    </div>

                    <div className="hidden md:flex relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente"
                            className="input pl-9 text-xs w-48 lg:w-64"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-secondary) relative transition-colors"
                        aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                    >
                        {isDarkMode ? (
                            <Sun size={20} className="text-warning-400" />
                        ) : (
                            <Moon size={20} />
                        )}
                    </button>

                    {/* Notifications */}
                    <button
                        onClick={() => setIsNotificationOpen(true)}
                        className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] relative transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-header)]">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <NotificationBell 
                        isOpen={isNotificationOpen} 
                        onClose={() => setIsNotificationOpen(false)}
                        onUnreadCountChange={setUnreadCount}
                    />

                    <div className="h-6 w-px bg-(--border-color) mx-1 hidden sm:block"></div>

                    {/* User Menu */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-2 p-1.5 hover:bg-(--bg-hover) rounded-xl transition-colors"
                        >
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </div>
                            <div className="text-left hidden sm:block">
                                <div className="text-xs font-semibold text-(--text-primary) leading-tight">
                                    {user?.firstName} {user?.lastName}
                                </div>
                                <div className="text-[10px] text-(--text-muted) leading-tight capitalize">
                                    {user?.role?.name}
                                </div>
                            </div>
                            <ChevronDown size={14} className={`text-(--text-muted) hidden sm:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isUserMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) py-2 z-50 animate-fade-in">
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-b border-(--border-color)">
                                    <div className="flex items-center gap-3">
                                        {currentCompany?.companyLogo ? (
                                            <img 
                                                key={`${currentCompany.companyLogo}-${logoRev}`}
                                                src={currentCompany.companyLogo} 
                                                alt={currentCompany.companyName}
                                                className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-(--border-color)"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm">
                                                {currentCompany?.initials || user?.initials}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-(--text-primary) truncate">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            <p className="text-xs text-(--text-muted) truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    {currentCompany && (
                                        <div className="mt-2 pt-2 border-t border-(--border-color) flex items-center gap-1.5">
                                            <Building2 size={12} className="text-primary-600" />
                                            <span className="text-[11px] text-primary-600 font-medium">
                                                {currentCompany.companyName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <Link 
                                        to="/perfil"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors"
                                    >
                                        <User size={16} />
                                        Mi Perfil
                                    </Link>
                                    {(user?.role?.name === 'admin' || user?.role?.name === 'superadmin') && (
                                        <Link 
                                            to="/configuracion"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors"
                                        >
                                            <Settings size={16} />
                                            Configuración
                                        </Link>
                                    )}
                                    
                                    {/* Cambiar de Compañía */}
                                    {hasMultipleCompanies && (
                                        <button
                                            onClick={() => {
                                                setIsCompanyModalOpen(true);
                                                setIsUserMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors"
                                        >
                                            <RefreshCw size={16} />
                                            <span className="flex-1 text-left">Cambiar de Empresa</span>
                                            <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-1.5 py-0.5 rounded">
                                                {companies.length}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-(--border-color) my-1"></div>

                                {/* Logout */}
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Modal de Selección de Compañía */}
            {isCompanyModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-(--bg-card) rounded-2xl shadow-2xl border border-(--border-color) w-full max-w-md overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-(--border-color) flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-(--text-primary)">Cambiar de Empresa</h2>
                                <p className="text-sm text-(--text-muted)">Selecciona la empresa a la que deseas acceder</p>
                            </div>
                            <button
                                onClick={() => setIsCompanyModalOpen(false)}
                                className="p-2 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Lista de Compañías */}
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            <div className="space-y-2">
                                {companies.map((company) => {
                                    const RoleIcon = getRoleIcon(company.roleName);
                                    const isCurrent = company.isCurrent;
                                    
                                    return (
                                        <button
                                            key={company.userId}
                                            onClick={() => handleSwitchCompany(company.userId)}
                                            disabled={isCurrent || isSwitching}
                                            className={`w-full p-4 rounded-xl border transition-all text-left ${
                                                isCurrent 
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 cursor-default' 
                                                    : 'bg-(--bg-body) border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {company.companyLogo ? (
                                                    <img 
                                                        src={company.companyLogo} 
                                                        alt={company.companyName}
                                                        className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-(--border-color)"
                                                    />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                                                        isCurrent 
                                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' 
                                                            : 'bg-(--bg-hover) text-(--text-secondary)'
                                                    }`}>
                                                        {company.initials}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-(--text-primary) truncate">
                                                            {company.companyName}
                                                        </p>
                                                        {isCurrent && (
                                                            <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-1.5 py-0.5 rounded font-medium">
                                                                Actual
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                                                        <RoleIcon size={12} />
                                                        <span>{getRoleLabel(company.roleName)}</span>
                                                    </div>
                                                </div>
                                                {!isCurrent && (
                                                    <RefreshCw size={18} className="text-(--text-muted)" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-(--border-color) bg-(--bg-hover)">
                            <p className="text-xs text-(--text-muted) text-center">
                                Al cambiar de empresa se recargará la página para actualizar los datos
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Header;
