import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Sun, Moon, KeyRound } from 'lucide-react';
import { forgotPassword } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const { addToast } = useToast();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setIsSent(true);
            addToast('Se han enviado las instrucciones a tu email', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al procesar la solicitud', 'error');
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
                <div className="bg-(--bg-card)/80 backdrop-blur-xl border border-(--border-color) rounded-2xl shadow-soft dark:shadow-soft-dark p-6 md:p-8">
                    {/* Back Button */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-[13px] text-(--text-secondary) hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-5"
                    >
                        <ArrowLeft size={16} />
                        Volver al login
                    </Link>

                    <div className="text-center mb-6">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl shadow-lg shadow-primary-200 dark:shadow-primary-900/30 mb-4"
                        >
                            <KeyRound className="text-white" size={22} />
                        </motion.div>
                        <h1 className="text-lg font-semibold text-(--text-primary) mb-1">
                            ¿Olvidaste tu contraseña?
                        </h1>
                        <p className="text-(--text-secondary) text-[13px] font-medium">
                            {isSent 
                                ? 'Revisa tu email para continuar' 
                                : 'Te enviaremos instrucciones para recuperarla'}
                        </p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Correo Electrónico"
                                name="email"
                                type="email"
                                placeholder="tu@email.com"
                                icon={Mail}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Button
                                type="submit"
                                className="w-full py-2.5 text-sm rounded-lg"
                                isLoading={isLoading}
                            >
                                Enviar instrucciones
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-100 dark:border-success-800">
                                <p className="text-success-700 dark:text-success-300 text-[13px]">
                                    Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => navigate('/login')}
                            >
                                Volver al login
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
