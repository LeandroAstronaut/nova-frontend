import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, ChevronDown, Sun, Moon, LogOut, User, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { getUnreadCount } from '../../services/activityLogService';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef(null);

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

    return (
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

                <div className="hidden md:flex">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-(--text-muted) group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente"
                        className="input pl-10 text-xs"
                    />
                    {/* <h2 className="font-semibold text-(--text-primary) text-sm lg:text-base">
                        Bienvenido, {user?.firstName}
                    </h2>
                    <p className="text-[10px] text-(--text-muted) font-semibold uppercase tracking-wider hidden sm:block">
                        {user?.role?.name === 'superadmin' ? 'Super Administrador' : 'Dashboard General'}
                    </p> */}
                </div>
            </div>

            {/* Center: Search */}
            {/* <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="input"
                    />
                </div>
            </div> */}

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
                        <div className="absolute right-0 top-full mt-2 w-56 bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) py-2 z-50 animate-fade-in">
                            {/* User Info Header */}
                            <div className="px-4 py-3 border-b border-(--border-color)">
                                <p className="text-sm font-semibold text-(--text-primary)">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-(--text-muted)">{user?.email}</p>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                <button className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors">
                                    <User size={16} />
                                    Mi Perfil
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors">
                                    <Settings size={16} />
                                    Configuración
                                </button>
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
    );
};

export default Header;
