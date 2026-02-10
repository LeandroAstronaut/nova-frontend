import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronRight, X, Sparkles, Zap, ShieldCheck, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const LoginPage = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showDocsDrawer, setShowDocsDrawer] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { loginUser } = useAuth();
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
            loginUser(data);
            addToast('¡Bienvenido de nuevo!', 'success');
            navigate('/');
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.', 'error');
        } finally {
            setIsLoading(false);
        }
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
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
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

                    <div className="mt-12 pt-8 border-t border-(--border-color) text-center">
                        <button
                            onClick={() => setShowDocsDrawer(true)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-(--text-secondary) hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                        >
                            Ver novedades del sistema
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-(--text-muted) group-hover:text-primary-500" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Metronic-style Drawer */}
            <AnimatePresence>
                {showDocsDrawer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDocsDrawer(false)}
                            className="fixed inset-0 bg-secondary-900/10 dark:bg-black/50 backdrop-blur-md z-100"
                        />
                        <motion.div
                            initial={{ x: '110%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '110%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed top-4 right-4 bottom-4 w-full max-w-100 bg-(--bg-card) shadow-2xl dark:shadow-soft-lg-dark z-101 flex flex-col border border-(--border-color) rounded-3xl overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-6 border-b border-(--border-color)">
                                <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-3">
                                    <Sparkles className="text-primary-600 dark:text-primary-400" size={20} />
                                    Novedades
                                </h2>
                                <button
                                    onClick={() => setShowDocsDrawer(false)}
                                    className="p-1.5 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-all border border-transparent"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                <div className="group relative">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 transition-colors duration-300 shrink-0">
                                            <Zap size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-(--text-primary) text-sm">Cuentas Corrientes</h3>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/50 px-1.5 py-0.5 rounded-md">Nuevo</span>
                                            </div>
                                            <p className="text-xs text-(--text-secondary) leading-relaxed">
                                                Visualización de saldos en tiempo real y descarga de estados de cuenta detallados en PDF.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group relative">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 group-hover:bg-success-600 group-hover:text-white dark:group-hover:bg-success-500 transition-colors duration-300 shrink-0">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-(--text-primary) text-sm">Filtros Avanzados</h3>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/50 px-1.5 py-0.5 rounded-md">Mejora</span>
                                            </div>
                                            <p className="text-xs text-(--text-secondary) leading-relaxed">
                                                Optimizamos los datatables para búsquedas instantáneas incluso con miles de registros.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-6 border-t border-(--border-color)">
                                <Button
                                    className="w-full py-3.5 text-sm rounded-xl"
                                    onClick={() => setShowDocsDrawer(false)}
                                >
                                    Entendido
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginPage;
