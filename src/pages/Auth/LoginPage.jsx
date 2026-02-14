import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronRight, Sun, Moon, Eye, EyeOff, Building2, Briefcase, Shield, ArrowLeft } from 'lucide-react';
import { login } from '../../services/authService';
import SupportDrawer from '../../components/common/SupportDrawer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

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

const LoginPage = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showDocsDrawer, setShowDocsDrawer] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showCompanySelector, setShowCompanySelector] = useState(false);
    const [companyOptions, setCompanyOptions] = useState([]);

    const { loginUser, selectCompany, cancelSelection } = useAuth();
    const { addToast } = useToast();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await login(credentials.email, credentials.password);
            
            // Si requiere selección de compañía
            if (data.requiresSelection && data.options?.length > 0) {
                loginUser(data); // Guarda tempToken en el contexto
                setCompanyOptions(data.options);
                setShowCompanySelector(true);
                setIsLoading(false);
                return;
            }
            
            // Login normal
            loginUser(data);
            addToast('¡Bienvenido de nuevo!', 'success');
            navigate('/');
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCompany = async (userId) => {
        setIsLoading(true);
        try {
            await selectCompany(userId);
            addToast('¡Bienvenido de nuevo!', 'success');
            navigate('/');
        } catch (err) {
            console.error('Error en handleSelectCompany:', err);
            console.error('Error response:', err.response);
            addToast(err.response?.data?.message || 'Error al seleccionar compañía', 'error');
            // Volver al formulario de login
            setShowCompanySelector(false);
            setCompanyOptions([]);
            cancelSelection();
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setShowCompanySelector(false);
        setCompanyOptions([]);
        cancelSelection();
    };

    const closeDrawer = () => {
        setShowDocsDrawer(false);
    };

    return (
        <div className="min-h-screen bg-(--bg-body) flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-3 bg-(--bg-card) hover:bg-(--bg-hover) rounded-xl shadow-soft dark:shadow-soft-dark text-(--text-secondary) transition-all z-20"
                aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
            >
                {isDarkMode ? (
                    <Sun size={20} className="text-warning-400" />
                ) : (
                    <Moon size={20} />
                )}
            </button>

            {/* Background blobs for premium feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/30 dark:bg-primary-900/20 rounded-xl blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 dark:bg-blue-900/10 rounded-xl blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-112.5 z-10"
            >
                <div className="bg-(--bg-card)/80 backdrop-blur-xl border border-(--border-color) rounded-3xl shadow-soft dark:shadow-soft-dark p-10 md:p-12">
                    
                    <AnimatePresence mode="wait">
                        {!showCompanySelector ? (
                            // Formulario de Login
                            <motion.div
                                key="login-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="text-center mb-8">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-xl shadow-lg shadow-primary-200 dark:shadow-primary-900/30 mb-6"
                                    >
                                        <LogIn className="text-white" size={28} />
                                    </motion.div>
                                    <h1 className="text-2xl font-bold text-(--text-primary) mb-1.5">¡Bienvenido!</h1>
                                    <p className="text-(--text-secondary) text-sm font-medium">Inicia sesión en NOVA Orden</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Input
                                        label="Correo Electrónico"
                                        name="email"
                                        type="email"
                                        placeholder="admin@demo.com"
                                        icon={Mail}
                                        value={credentials.email}
                                        onChange={handleChange}
                                        required
                                    />

                                    <div className="relative">
                                        <Input
                                            label="Contraseña"
                                            labelRight={
                                                <Link
                                                    to="/forgot-password"
                                                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </Link>
                                            }
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            icon={Lock}
                                            value={credentials.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-8.5 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full py-4 text-base rounded-xl"
                                        isLoading={isLoading}
                                    >
                                        Continuar
                                    </Button>
                                </form>
                            </motion.div>
                        ) : (
                            // Selector de Compañía
                            <motion.div
                                key="company-selector"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="text-center mb-8">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-xl shadow-lg shadow-primary-200 dark:shadow-primary-900/30 mb-6"
                                    >
                                        <Building2 className="text-white" size={28} />
                                    </motion.div>
                                    <h1 className="text-2xl font-bold text-(--text-primary) mb-1.5">Selecciona tu empresa</h1>
                                    <p className="text-(--text-secondary) text-sm font-medium">
                                        Tu cuenta está asociada a {companyOptions.length} empresas
                                    </p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {companyOptions.map((option, index) => {
                                        const RoleIcon = getRoleIcon(option.roleName);
                                        return (
                                            <motion.button
                                                key={option.userId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                onClick={() => handleSelectCompany(option.userId)}
                                                disabled={isLoading}
                                                className="w-full p-4 bg-(--bg-body) hover:bg-(--bg-hover) border border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700 rounded-xl transition-all group text-left"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {option.companyLogo ? (
                                                        <img 
                                                            src={option.companyLogo} 
                                                            alt={option.companyName}
                                                            className="w-12 h-12 rounded-xl object-contain bg-white p-1"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-lg">
                                                            {option.initials}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-(--text-primary) font-semibold truncate">
                                                            {option.companyName}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                                                            <RoleIcon size={12} />
                                                            <span>{getRoleLabel(option.roleName)}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} className="text-(--text-muted) group-hover:text-primary-600 transition-colors" />
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleBackToLogin}
                                    disabled={isLoading}
                                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Volver al inicio de sesión
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!showCompanySelector && (
                        <div className="mt-12 pt-8 border-t border-(--border-color) text-center">
                            <button
                                onClick={() => setShowDocsDrawer(true)}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-(--text-secondary) hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                            >
                                Sobre el sistema
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-(--text-muted) group-hover:text-primary-500" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Support Drawer */}
            <SupportDrawer isOpen={showDocsDrawer} onClose={closeDrawer} />
        </div>
    );
};

export default LoginPage;
