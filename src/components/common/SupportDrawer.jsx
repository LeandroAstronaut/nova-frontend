import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, Zap, ShieldCheck, HelpCircle, Briefcase, 
    MessageCircle, ArrowLeft, Send, Mail, CheckCircle, User
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
                        className="fixed inset-0 bg-secondary-900/10 dark:bg-black/50 backdrop-blur-md z-[9999]"
                    />
                    <motion.div
                        initial={{ x: '110%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '110%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-4 right-4 bottom-4 w-full max-w-100 bg-(--bg-card) shadow-2xl dark:shadow-soft-lg-dark z-[10000] flex flex-col border border-(--border-color) rounded-3xl overflow-hidden"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-6 border-b border-(--border-color)">
                            <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-3">
                                <Sparkles className="text-primary-600 dark:text-primary-400" size={20} />
                                {activeForm ? (
                                    activeForm === 'support' ? 'Necesito Soporte' : 'Quiero Contratar'
                                ) : 'Sobre el Sistema'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-1.5 hover:bg-(--bg-hover) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-all border border-transparent"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            {!activeForm ? (
                                <>
                                    {/* Botones de acción */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setActiveForm('support')}
                                            className="flex flex-col items-center gap-2 p-4 bg-(--bg-hover) hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700 rounded-xl transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                <HelpCircle size={20} />
                                            </div>
                                            <span className="text-xs font-semibold text-(--text-primary)">Necesito Soporte</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveForm('sales')}
                                            className="flex flex-col items-center gap-2 p-4 bg-(--bg-hover) hover:bg-success-50 dark:hover:bg-success-900/20 border border-(--border-color) hover:border-success-300 dark:hover:border-success-700 rounded-xl transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 group-hover:bg-success-600 group-hover:text-white transition-colors">
                                                <Briefcase size={20} />
                                            </div>
                                            <span className="text-xs font-semibold text-(--text-primary)">Quiero Contratar</span>
                                        </button>
                                    </div>

                                    {/* Info de usuario logueado */}
                                    {user && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                                                <User size={16} />
                                                <span>Enviando como: <strong>{user.firstName} {user.lastName}</strong></span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Otras vías de contacto */}
                                    <div className="bg-(--bg-hover) rounded-xl p-4 border border-(--border-color)">
                                        <h3 className="text-sm font-bold text-(--text-primary) mb-3 flex items-center gap-2">
                                            <MessageCircle size={16} className="text-(--text-muted)" />
                                            Otras vías de contacto
                                        </h3>
                                        <a 
                                            href="mailto:info@novaorden.com" 
                                            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                                        >
                                            <Mail size={14} />
                                            info@novaorden.com
                                        </a>
                                    </div>

                                    {/* Novedades del Sistema */}
                                    <div>
                                        <h3 className="text-sm font-bold text-(--text-primary) mb-4 flex items-center gap-2">
                                            <Sparkles size={16} className="text-primary-600" />
                                            Novedades del Sistema
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div className="group relative">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 transition-colors duration-300 shrink-0">
                                                        <Zap size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-bold text-(--text-primary) text-sm">Cuentas Corrientes</h4>
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
                                                            <h4 className="font-bold text-(--text-primary) text-sm">Filtros Avanzados</h4>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/50 px-1.5 py-0.5 rounded-md">Mejora</span>
                                                        </div>
                                                        <p className="text-xs text-(--text-secondary) leading-relaxed">
                                                            Optimizamos los datatables para búsquedas instantáneas incluso con miles de registros.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Formulario */
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveForm(null)}
                                        className="flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--text-primary) transition-colors mb-2"
                                    >
                                        <ArrowLeft size={14} />
                                        Volver
                                    </button>
                                    
                                    {/* Info de usuario logueado en formulario */}
                                    {user && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800 mb-4">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs">
                                                <User size={14} />
                                                <span>De: <strong>{user.firstName} {user.lastName}</strong> ({user.email})</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">Nombre completo</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">Correo electrónico</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">
                                            {activeForm === 'support' ? '¿En qué podemos ayudarte?' : 'Cuéntanos sobre tu empresa'}
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-(--bg-input) border border-(--border-color) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 resize-none"
                                            placeholder={activeForm === 'support' ? 'Describe tu problema o consulta...' : '¿Qué tipo de negocio tienes? ¿Cuántos usuarios necesitas?'}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full py-3 text-sm rounded-xl"
                                        isLoading={submitting}
                                    >
                                        <Send size={16} className="mr-2" />
                                        Enviar mensaje
                                    </Button>
                                </form>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        {!activeForm && (
                            <div className="p-6 border-t border-(--border-color)">
                                <Button
                                    className="w-full py-3.5 text-sm rounded-xl"
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
