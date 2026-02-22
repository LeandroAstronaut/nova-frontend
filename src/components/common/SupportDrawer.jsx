import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, Zap, ShieldCheck, HelpCircle, Briefcase, 
    MessageCircle, ArrowLeft, Send, Mail, CheckCircle, User, ChevronRight
} from 'lucide-react';
import Button from './Button';
import { sendSupportRequest, sendSalesRequest } from '../../services/contactService';
import { useToast } from '../../context/ToastContext';

const SupportDrawer = ({ isOpen, onClose, user = null }) => {
    const { addToast } = useToast();
    const [activeForm, setActiveForm] = useState(null); // null, 'support', 'sales'
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    // Precompletar datos si el usuario está logueado
    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                message: ''
            });
        }
    }, [isOpen, user]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Construir mensaje con info del usuario si está logueado
            let messageWithUserInfo = formData.message;
            if (user) {
                messageWithUserInfo = `[Usuario logueado: ${user.firstName} ${user.lastName} (${user.email}) - Rol: ${user.role?.name || 'N/A'}]\n\n${formData.message}`;
            }

            const dataToSend = {
                ...formData,
                message: messageWithUserInfo
            };

            if (activeForm === 'support') {
                await sendSupportRequest(dataToSend);
            } else {
                await sendSalesRequest(dataToSend);
            }
            
            addToast('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
            setActiveForm(null);
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            addToast('Error al enviar el mensaje. Intenta nuevamente.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        setActiveForm(null);
        setFormData({ name: '', email: '', message: '' });
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[99999]"
                    />
                    <motion.div
                        initial={{ x: '110%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '110%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-4 left-4 right-4 md:left-auto h-[calc(100vh-2rem)] w-auto md:w-full md:max-w-[420px] bg-[var(--bg-card)] shadow-2xl dark:shadow-soft-lg-dark z-[100000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Drawer Header - Estilo consistente con NotificationBell */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        {activeForm ? (
                                            activeForm === 'support' ? 'Necesito Soporte' : 'Quiero Contratar'
                                        ) : 'Sobre el Sistema'}
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        {activeForm ? 'Complete el formulario' : 'Información y novedades'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-4 relative">
                            <AnimatePresence mode="wait">
                                {!activeForm ? (
                                    <motion.div
                                        key="main"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="space-y-4"
                                    >
                                        {/* Botones de acción */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <motion.button
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                whileHover={{ scale: 1.02, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setActiveForm('support')}
                                                className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-hover)] hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-[var(--border-color)] hover:border-primary-300 dark:hover:border-primary-700 rounded-xl transition-colors group"
                                            >
                                                <motion.div 
                                                    className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors"
                                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <HelpCircle size={18} />
                                                </motion.div>
                                                <span className="text-[11px] font-semibold text-[var(--text-primary)]">Necesito Soporte</span>
                                            </motion.button>
                                            <motion.button
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                whileHover={{ scale: 1.02, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setActiveForm('sales')}
                                                className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-hover)] hover:bg-success-50 dark:hover:bg-success-900/20 border border-[var(--border-color)] hover:border-success-300 dark:hover:border-success-700 rounded-xl transition-colors group"
                                            >
                                                <motion.div 
                                                    className="w-9 h-9 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 group-hover:bg-success-600 group-hover:text-white transition-colors"
                                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <Briefcase size={18} />
                                                </motion.div>
                                                <span className="text-[11px] font-semibold text-[var(--text-primary)]">Quiero Contratar</span>
                                            </motion.button>
                                        </div>

                                        {/* Info de usuario logueado */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3, duration: 0.25 }}
                                        >
                                            {user && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-[13px]">
                                                        <User size={14} />
                                                        <span>Enviando como: <strong>{user.firstName} {user.lastName}</strong></span>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Otras vías de contacto */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.35, duration: 0.25 }}
                                            className="bg-[var(--bg-hover)] rounded-lg p-3 border border-[var(--border-color)]"
                                        >
                                            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                                <MessageCircle size={14} className="text-[var(--text-muted)]" />
                                                Otras vías de contacto
                                            </h3>
                                            <a 
                                                href="mailto:info@novaorden.com" 
                                                className="flex items-center gap-2 text-[13px] text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                <Mail size={12} />
                                                info@novaorden.com
                                            </a>
                                        </motion.div>

                                        {/* Novedades del Sistema */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4, duration: 0.25 }}
                                        >
                                            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                                <Sparkles size={14} className="text-primary-600" />
                                                Novedades del Sistema
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                <motion.div 
                                                    className="group relative"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.45, duration: 0.2 }}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 transition-colors duration-300 shrink-0">
                                                            <Zap size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <h4 className="font-semibold text-[var(--text-primary)] text-[13px]">Cuentas Corrientes</h4>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/50 px-1.5 py-0.5 rounded">Nuevo</span>
                                                            </div>
                                                            <p className="text-[12px] text-[var(--text-secondary)] leading-snug">
                                                                Visualización de saldos en tiempo real y descarga de estados de cuenta detallados en PDF.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                <motion.div 
                                                    className="group relative"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.5, duration: 0.2 }}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 group-hover:bg-success-600 group-hover:text-white dark:group-hover:bg-success-500 transition-colors duration-300 shrink-0">
                                                            <ShieldCheck size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <h4 className="font-semibold text-[var(--text-primary)] text-[13px]">Filtros Avanzados</h4>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/50 px-1.5 py-0.5 rounded">Mejora</span>
                                                            </div>
                                                            <p className="text-[12px] text-[var(--text-secondary)] leading-snug">
                                                                Optimizamos los datatables para búsquedas instantáneas incluso con miles de registros.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    /* Formulario */
                                    <motion.form 
                                        key="form"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        onSubmit={handleFormSubmit} 
                                        className="space-y-3"
                                    >
                                        <motion.button
                                            type="button"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05, duration: 0.2 }}
                                            whileHover={{ x: -3 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveForm(null)}
                                            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group px-1 -ml-1"
                                        >
                                            <motion.div
                                                initial={{ x: 0 }}
                                                whileHover={{ x: -3 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            >
                                                <ArrowLeft size={16} />
                                            </motion.div>
                                            <span>Volver atrás</span>
                                        </motion.button>
                                        
                                        {/* Info de usuario logueado en formulario */}
                                        <AnimatePresence>
                                            {user && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ delay: 0.1, duration: 0.2 }}
                                                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800"
                                                >
                                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-[12px]">
                                                        <User size={14} />
                                                        <span>De: <strong>{user.firstName} {user.lastName}</strong> ({user.email})</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15, duration: 0.2 }}
                                        >
                                            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">Nombre completo</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 transition-all"
                                                placeholder="Tu nombre"
                                            />
                                        </motion.div>
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2, duration: 0.2 }}
                                        >
                                            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">Correo electrónico</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 transition-all"
                                                placeholder="tu@email.com"
                                            />
                                        </motion.div>
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.25, duration: 0.2 }}
                                        >
                                            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">
                                                {activeForm === 'support' ? '¿En qué podemos ayudarte?' : 'Cuéntanos sobre tu empresa'}
                                            </label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 resize-none transition-all"
                                                placeholder={activeForm === 'support' ? 'Describe tu problema o consulta...' : '¿Qué tipo de negocio tienes? ¿Cuántos usuarios necesitas?'}
                                            />
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3, duration: 0.2 }}
                                        >
                                            <Button
                                                type="submit"
                                                className="w-full py-2.5 text-sm rounded-lg"
                                                isLoading={submitting}
                                            >
                                                <Send size={16} className="mr-2" />
                                                Enviar mensaje
                                            </Button>
                                        </motion.div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Drawer Footer */}
                        {!activeForm && (
                            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
                                <Button
                                    className="w-full py-2.5 text-sm rounded-lg"
                                    onClick={handleClose}
                                >
                                    <CheckCircle size={16} className="mr-2" />
                                    Entendido
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SupportDrawer;
