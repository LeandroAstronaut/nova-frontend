import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Building2, User, Phone, Share2 } from 'lucide-react';
import Button from '../common/Button';
import { logWhatsAppSent } from '../../services/activityLogService';

const WhatsAppButton = ({ onClick, icon: Icon, label, phone, disabled, variant = 'default' }) => {
    const variants = {
        default: 'border-[var(--border-color)] hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20',
        company: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        seller: 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20',
        client: 'border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
        share: 'border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
    };

    const iconColors = {
        default: 'text-[var(--text-muted)]',
        company: 'text-blue-600 dark:text-blue-400',
        seller: 'text-purple-600 dark:text-purple-400',
        client: 'text-green-600 dark:text-green-400',
        share: 'text-orange-600 dark:text-orange-400'
    };

    const bgColors = {
        default: 'bg-[var(--bg-hover)]',
        company: 'bg-blue-100 dark:bg-blue-900/30',
        seller: 'bg-purple-100 dark:bg-purple-900/30',
        client: 'bg-green-100 dark:bg-green-900/30',
        share: 'bg-orange-100 dark:bg-orange-900/30'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                disabled 
                    ? 'opacity-40 cursor-not-allowed border-[var(--border-color)] bg-[var(--bg-hover)]' 
                    : variants[variant]
            }`}
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bgColors[variant]} ${iconColors[variant]}`}>
                <Icon size={18} strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
                <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                    {phone || (variant === 'share' ? 'Seleccionar contacto' : 'No configurado')}
                </p>
            </div>
            <MessageCircle size={16} className={`${iconColors[variant]} opacity-50`} />
        </button>
    );
};

const SendWhatsAppModal = ({ isOpen, onClose, order }) => {
    const handleClose = () => {
        onClose();
    };

    const generateWhatsAppMessage = () => {
        const orderNumber = String(order?.orderNumber || '').padStart(5, '0');
        const orderTypeLabel = order?.type === 'order' ? 'Pedido' : 'Presupuesto';
        const clientName = order?.clientId?.businessName || 'Cliente';
        
        // Estado formateado
        const statusLabels = {
            espera: 'En Espera',
            confirmado: 'Confirmado',
            preparado: 'Preparando',
            completo: 'Completado'
        };
        const status = statusLabels[order?.status] || order?.status || 'N/A';
        
        // Calcular subtotal (suma de items sin descuento de orden)
        const subtotal = order?.items?.reduce((acc, item) => 
            acc + (item.quantity * item.listPrice * (1 - (item.discount || 0) / 100)), 0
        ) || 0;
        
        // Descuento de la orden (si existe)
        const orderDiscount = order?.discount || 0;
        const discountAmount = subtotal * (orderDiscount / 100);
        
        // Total final
        const total = subtotal - discountAmount;
        
        const items = order?.items?.map(item => {
            const name = item.name || item.productId?.name || 'Producto';
            const discountText = item.discount > 0 ? ` (-${item.discount}%)` : '';
            return `- ${item.quantity}x ${name} ($${item.listPrice.toLocaleString()})${discountText}`;
        }).join('\n') || '';

        // Construir totales
        let totalsText = `*Subtotal:* $${subtotal.toLocaleString()}`;
        if (orderDiscount > 0) {
            totalsText += `\n*Descuento:* -$${discountAmount.toLocaleString()} (${orderDiscount}%)`;
        }
        totalsText += `\n*Total:* $${total.toLocaleString()}`;

        const message = `*${orderTypeLabel} #${orderNumber}*
*Estado:* ${status}

*Cliente:* ${clientName}

${totalsText}

*Detalle:*
${items}

_Enviado desde Nova_`;

        return encodeURIComponent(message);
    };

    const openWhatsApp = (phone = '', recipientType) => {
        const message = generateWhatsAppMessage();
        // Limpiar el número de teléfono (eliminar espacios, guiones, etc.)
        const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
        const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
        
        // Registrar actividad
        if (order?._id) {
            logWhatsAppSent(order._id, recipientType).catch(err => {
                console.error('Error logging WhatsApp:', err);
            });
        }
        
        window.open(url, '_blank');
        onClose();
    };

    const orderNumber = String(order?.orderNumber || '').padStart(5, '0');
    const orderTypeLabel = order?.type === 'order' ? 'Pedido' : 'Presupuesto';

    // Verificar si hay al menos un teléfono configurado
    const hasAnyPhone = order?.companyId?.whatsapp || order?.salesRepId?.whatsapp || order?.clientId?.whatsapp;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl z-[10000] overflow-hidden border border-[var(--border-color)]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                                    <MessageCircle size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Enviar por WhatsApp</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                        {orderTypeLabel} #{orderNumber}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                                Seleccione a quién desea enviar el {orderTypeLabel.toLowerCase()} por WhatsApp:
                            </p>

                            <div className="space-y-3">
                                {/* Company */}
                                <WhatsAppButton
                                    onClick={() => openWhatsApp(order?.companyId?.whatsapp, 'company')}
                                    icon={Building2}
                                    label="Empresa"
                                    phone={order?.companyId?.whatsapp}
                                    disabled={!order?.companyId?.whatsapp}
                                    variant="company"
                                />

                                {/* Seller */}
                                <WhatsAppButton
                                    onClick={() => openWhatsApp(order?.salesRepId?.whatsapp, 'seller')}
                                    icon={User}
                                    label="Vendedor"
                                    phone={order?.salesRepId?.whatsapp}
                                    disabled={!order?.salesRepId?.whatsapp}
                                    variant="seller"
                                />

                                {/* Client */}
                                <WhatsAppButton
                                    onClick={() => openWhatsApp(order?.clientId?.whatsapp, 'client')}
                                    icon={Phone}
                                    label="Cliente"
                                    phone={order?.clientId?.whatsapp}
                                    disabled={!order?.clientId?.whatsapp}
                                    variant="client"
                                />

                                {/* Share */}
                                <div className="relative py-1">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[var(--border-color)]"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[var(--bg-card)] px-2 text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                                            O
                                        </span>
                                    </div>
                                </div>

                                <WhatsAppButton
                                    onClick={() => openWhatsApp('', 'share')}
                                    icon={Share2}
                                    label="Compartir"
                                    phone="Seleccionar contacto"
                                    variant="share"
                                />
                            </div>

                            {!hasAnyPhone && (
                                <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-100 dark:border-warning-800">
                                    <p className="text-[10px] text-warning-700 dark:text-warning-400 font-medium">
                                        <strong>Atención:</strong> No hay teléfonos configurados. Use "Compartir" para seleccionar contacto.
                                    </p>
                                </div>
                            )}

                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                <p className="text-[10px] text-green-700 dark:text-green-400 font-medium leading-relaxed">
                                    <strong>Nota:</strong> Se abrirá WhatsApp con el detalle listo para enviar.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={handleClose}
                                className="flex-1 text-[12px] py-2"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SendWhatsAppModal;
