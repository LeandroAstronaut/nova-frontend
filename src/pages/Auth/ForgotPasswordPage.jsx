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
                <div className="bg-(--bg-card)/80 backdrop-blur-xl border border-(--border-color) rounded-3xl shadow-soft dark:shadow-soft-dark p-10 md:p-12">
                    {/* Back Button */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-sm text-(--text-secondary) hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
                    >
                        <ArrowLeft size={16} />
                        Volver al login
                    </Link>

                    <div className="text-center mb-8">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-xl shadow-lg shadow-primary-200 dark:shadow-primary-900/30 mb-6"
                        >
                            <KeyRound className="text-white" size={28} />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-(--text-primary) mb-1.5">
                            ¿Olvidaste tu contraseña?
                        </h1>
                        <p className="text-(--text-secondary) text-sm font-medium">
                            {isSent 
                                ? 'Revisa tu email para continuar' 
                                : 'Te enviaremos instrucciones para recuperarla'}
                        </p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="w-full py-4 text-base rounded-xl"
                                isLoading={isLoading}
                            >
                                Enviar instrucciones
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-100 dark:border-success-800">
                                <p className="text-success-700 dark:text-success-300 text-sm">
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
