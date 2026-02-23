import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2 } from 'lucide-react';
import Button from '../common/Button';
import { logReceiptWhatsApp } from '../../services/receiptService';

// Icono de WhatsApp SVG
const WhatsAppIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const WhatsAppButton = ({ onClick, label, phone, disabled }) => (
    <button 
        onClick={onClick} 
        disabled={disabled} 
        className={`w-full flex items-center justify-between py-1 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
    >
        <div className="flex flex-col items-start">
            <span className="text-[13px] font-bold text-[var(--text-primary)]">{label}</span>
            <span className="text-[11px] text-[var(--text-muted)]">{phone || 'No configurado'}</span>
        </div>
        <div className="text-green-600 dark:text-green-500">
            <WhatsAppIcon size={20} />
        </div>
    </button>
);

const SendReceiptWhatsAppModal = ({ isOpen, onClose, receipt }) => {
    const handleClose = () => onClose();

    const generateWhatsAppMessage = () => {
        const receiptNumber = String(receipt?.receiptNumber || '').padStart(5, '0');
        const typeLabel = receipt?.type === 'ingreso' ? 'Recibo de Ingreso' : 'Recibo de Egreso';
        const clientName = receipt?.clientId?.businessName || 'Cliente';
        const statusLabel = receipt?.status === 'activo' ? 'Activo' : 'Anulado';
        const amount = receipt?.amount || 0;
        const concept = receipt?.concept || '';
        const date = receipt?.date ? new Date(receipt.date).toLocaleDateString('es-AR') : '';

        const message = `*${typeLabel} #${receiptNumber}*
*Estado:* ${statusLabel}
*Fecha:* ${date}

*Cliente:* ${clientName}

*Concepto:* ${concept}

*Monto:* $${amount.toLocaleString('es-AR')}

_Enviado desde Nova_`;

        return encodeURIComponent(message);
    };

    const openWhatsApp = (phone = '', recipientType) => {
        const message = generateWhatsAppMessage();
        const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
        const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
        
        if (receipt?._id) {
            logReceiptWhatsApp(receipt._id, recipientType).catch(err => console.error('Error logging WhatsApp:', err));
        }
        
        window.open(url, '_blank');
        onClose();
    };

    const receiptNumber = String(receipt?.receiptNumber || '').padStart(5, '0');
    const typeLabel = receipt?.type === 'ingreso' ? 'Recibo de Ingreso' : 'Recibo de Egreso';
    const hasAnyPhone = receipt?.companyId?.whatsapp || receipt?.salesRepId?.whatsapp || receipt?.clientId?.whatsapp;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl z-[10000] overflow-hidden border border-[var(--border-color)]">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                                    <WhatsAppIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">Enviar por WhatsApp</h2>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{typeLabel} #{receiptNumber}</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Destinatarios */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                    Seleccione el destinatario
                                </label>
                                <div>
                                    <WhatsAppButton 
                                        onClick={() => openWhatsApp(receipt?.companyId?.whatsapp, 'company')} 
                                        label="Empresa" 
                                        phone={receipt?.companyId?.whatsapp} 
                                        disabled={!receipt?.companyId?.whatsapp} 
                                    />
                                    <WhatsAppButton 
                                        onClick={() => openWhatsApp(receipt?.salesRepId?.whatsapp, 'seller')} 
                                        label="Vendedor" 
                                        phone={receipt?.salesRepId?.whatsapp} 
                                        disabled={!receipt?.salesRepId?.whatsapp} 
                                    />
                                    <WhatsAppButton 
                                        onClick={() => openWhatsApp(receipt?.clientId?.whatsapp, 'client')} 
                                        label="Cliente" 
                                        phone={receipt?.clientId?.whatsapp} 
                                        disabled={!receipt?.clientId?.whatsapp} 
                                    />
                                </div>
                            </div>

                            {/* Compartir */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                    Otras opciones
                                </label>
                                <button 
                                    onClick={() => openWhatsApp('', 'share')} 
                                    className="w-full flex items-center justify-between py-1 cursor-pointer hover:opacity-80 transition-colors"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-[13px] font-bold text-[var(--text-primary)]">Compartir</span>
                                        <span className="text-[11px] text-[var(--text-muted)]">Seleccionar contacto</span>
                                    </div>
                                    <div className="text-orange-600 dark:text-orange-500">
                                        <Share2 size={20} />
                                    </div>
                                </button>
                            </div>

                            {!hasAnyPhone && (
                                <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-100 dark:border-warning-800">
                                    <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium">
                                        No hay teléfonos configurados. Use "Compartir" para seleccionar contacto.
                                    </p>
                                </div>
                            )}

                            {/* Nota informativa */}
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                <p className="text-[11px] text-green-700 dark:text-green-400 font-medium">
                                    <strong>Nota:</strong> Se abrirá WhatsApp con el detalle listo para enviar.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex gap-3">
                            <Button variant="secondary" onClick={handleClose} className="flex-1">Cancelar</Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SendReceiptWhatsAppModal;
