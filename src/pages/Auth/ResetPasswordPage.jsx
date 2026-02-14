import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Sun, Moon, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { resetPassword } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { addToast } = useToast();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            addToast('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (password.length < 6) {
            addToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(token, password);
            setIsSuccess(true);
            addToast('Contraseña actualizada exitosamente', 'success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.', 'error');
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

            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/30 dark:bg-primary-900/20 rounded-xl blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 dark:bg-blue-900/10 rounded-xl blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-(--bg-card)/80 backdrop-blur-xl border border-(--border-color) rounded-3xl shadow-soft dark:shadow-soft-dark p-10 md:p-12">
                    {!isSuccess && (
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1 text-sm text-(--text-secondary) hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
                        >
                            <ArrowLeft size={16} />
                            Volver al login
                        </Link>
                    )}

                    <div className="text-center mb-8">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center justify-center w-14 h-14 rounded-xl shadow-lg mb-6 ${
                                isSuccess 
                                    ? 'bg-success-600 shadow-success-200 dark:shadow-success-900/30' 
                                    : 'bg-primary-600 shadow-primary-200 dark:shadow-primary-900/30'
                            }`}
                        >
                            {isSuccess ? (
                                <CheckCircle2 className="text-white" size={28} />
                            ) : (
                                <ShieldCheck className="text-white" size={28} />
                            )}
                        </motion.div>
                        <h1 className="text-2xl font-bold text-(--text-primary) mb-1.5">
                            {isSuccess ? '¡Contraseña actualizada!' : 'Restablecer contraseña'}
                        </h1>
                        <p className="text-(--text-secondary) text-sm font-medium">
                            {isSuccess 
                                ? 'Serás redirigido al login en unos segundos...' 
                                : 'Ingresa tu nueva contraseña'}
                        </p>
                    </div>

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nueva contraseña */}
                            <div className="relative">
                                <Input
                                    label="Nueva contraseña"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 6 caracteres"
                                    icon={Lock}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                            {/* Confirmar contraseña */}
                            <div className="relative">
                                <Input
                                    label="Confirmar contraseña"
                                    name="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Repite la contraseña"
                                    icon={Lock}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-8.5 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-4 text-base rounded-xl"
                                isLoading={isLoading}
                            >
                                Guardar nueva contraseña
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center">
                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={() => navigate('/login')}
                            >
                                Ir al login
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
