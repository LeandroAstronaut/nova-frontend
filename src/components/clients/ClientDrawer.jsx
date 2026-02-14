import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Building2, User, Mail, Phone, MapPin, Percent, 
    Truck, Tag, Briefcase, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const ClientDrawer = ({ isOpen, onClose, onSave, client = null }) => {
    const { user } = useAuth();
    const isEditing = !!client;
    const isAdmin = user?.role?.name === 'admin';
    const isSuperadmin = user?.role?.name === 'superadmin';
    const isVendedor = user?.role?.name === 'vendedor';

    const [loading, setLoading] = useState(false);
    const [vendedores, setVendedores] = useState([]);
    const [errors, setErrors] = useState({});
    
    const [formData, setFormData] = useState({
        businessName: '',
        cuit: '',
        code: '',
        discount: '',
        email: '',
        phone: '',
        whatsapp: '',
        contactFirstName: '',
        contactLastName: '',
        address: {
            street: '',
            city: '',
            postalCode: '',
            province: ''
        },
        shipping: {
            company: '',
            address: '',
            phone: ''
        },
        salesRepId: '',
        priceList: '1'
    });

    // Cargar vendedores para el selector (solo admin)
    useEffect(() => {
        if ((isAdmin || isSuperadmin) && isOpen) {
            // Aquí deberíamos cargar los vendedores de la empresa
            // Por ahora usamos el usuario actual como default
            setVendedores([]);
        }
    }, [isAdmin, isSuperadmin, isOpen]);

    useEffect(() => {
        if (isOpen && client) {
            setFormData({
                businessName: client.businessName || '',
                cuit: client.cuit || '',
                code: client.code || '',
                discount: client.discount || '',
                email: client.email || '',
                phone: client.phone || '',
                whatsapp: client.whatsapp || '',
                contactFirstName: client.contactFirstName || '',
                contactLastName: client.contactLastName || '',
                address: {
                    street: client.address?.street || '',
                    city: client.address?.city || '',
                    postalCode: client.address?.postalCode || '',
                    province: client.address?.province || ''
                },
                shipping: {
                    company: client.shipping?.company || '',
                    address: client.shipping?.address || '',
                    phone: client.shipping?.phone || ''
                },
                salesRepId: client.salesRepId?._id || '',
                priceList: String(client.priceList || '1')
            });
        } else if (isOpen) {
            // Default values para nuevo cliente
            setFormData({
                businessName: '',
                cuit: '',
                code: '',
                discount: '',
                email: '',
                phone: '',
                whatsapp: '',
                contactFirstName: '',
                contactLastName: '',
                address: {
                    street: '',
                    city: '',
                    postalCode: '',
                    province: ''
                },
                shipping: {
                    company: '',
                    address: '',
                    phone: ''
                },
                salesRepId: isVendedor ? user.id : '',
                priceList: '1'
            });
        }
        setErrors({});
    }, [isOpen, client, isVendedor, user.id]);

    const validate = () => {
        const newErrors = {};
        if (!formData.businessName.trim()) {
            newErrors.businessName = 'El nombre del cliente es requerido';
        }
        if (formData.discount && (formData.discount < 0 || formData.discount > 100)) {
            newErrors.discount = 'El descuento debe estar entre 0 y 100';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        
        try {
            setLoading(true);
            const dataToSend = {
                ...formData,
                discount: formData.discount ? parseFloat(formData.discount) : 0,
                priceList: parseInt(formData.priceList)
            };
            await onSave(dataToSend);
        } catch (error) {
            console.error('Error saving client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleAddressChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));
    };

    const handleShippingChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            shipping: { ...prev.shipping, [field]: value }
        }));
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-900/50 dark:bg-black/60 backdrop-blur-sm z-[9999]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-4 right-4 h-[calc(100vh-2rem)] w-full max-w-[600px] bg-[var(--bg-card)] shadow-2xl z-[10000] flex flex-col border border-[var(--border-color)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                                        {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {isEditing ? 'Modifique los datos del cliente' : 'Complete los datos del nuevo cliente'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Sección: Información Principal */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                    <Building2 size={14} />
                                    Información del Cliente
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Razón Social / Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.businessName}
                                            onChange={(e) => handleChange('businessName', e.target.value)}
                                            className={`w-full px-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                                errors.businessName ? 'border-danger-500' : 'border-[var(--border-color)]'
                                            }`}
                                            placeholder="Ej: Distribuidora del Sur S.A."
                                        />
                                        {errors.businessName && <p className="text-danger-500 text-xs mt-1">{errors.businessName}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            CUIT
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cuit}
                                            onChange={(e) => handleChange('cuit', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="30-12345678-9"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Código
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => handleChange('code', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Código interno"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Descuento (%)
                                        </label>
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.discount}
                                                onChange={(e) => handleChange('discount', e.target.value)}
                                                className={`w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                                    errors.discount ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="0"
                                            />
                                        </div>
                                        {errors.discount && <p className="text-danger-500 text-xs mt-1">{errors.discount}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Lista de Precios
                                        </label>
                                        <select
                                            value={formData.priceList}
                                            onChange={(e) => handleChange('priceList', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                        >
                                            <option value="1">Lista 1</option>
                                            <option value="2">Lista 2</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Vendedor Asignado */}
                            {(isAdmin || isSuperadmin) && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                        <Briefcase size={14} />
                                        Vendedor Asignado
                                    </h3>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Vendedor
                                        </label>
                                        <select
                                            value={formData.salesRepId}
                                            onChange={(e) => handleChange('salesRepId', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                        >
                                            <option value="">Seleccionar vendedor...</option>
                                            <option value={user.id}>{user.firstName} {user.lastName} (Yo)</option>
                                            {/* Aquí se cargarían los demás vendedores */}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Sección: Dirección */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={14} />
                                    Dirección
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Domicilio
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address.street}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Calle y número"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Localidad
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Ciudad"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Provincia
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address.province}
                                            onChange={(e) => handleAddressChange('province', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Provincia"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Código Postal
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address.postalCode}
                                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="CP"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Contacto */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} />
                                    Persona de Contacto
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.contactFirstName}
                                            onChange={(e) => handleChange('contactFirstName', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Nombre del contacto"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Apellido
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.contactLastName}
                                            onChange={(e) => handleChange('contactLastName', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Apellido del contacto"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                className={`w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-lg text-sm ${
                                                    errors.email ? 'border-danger-500' : 'border-[var(--border-color)]'
                                                }`}
                                                placeholder="contacto@empresa.com"
                                            />
                                        </div>
                                        {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Teléfono / WhatsApp
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                                placeholder="Teléfono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Transporte */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                    <Truck size={14} />
                                    Transporte
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Empresa de Transporte
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shipping.company}
                                            onChange={(e) => handleShippingChange('company', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Nombre del transporte"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Teléfono Transporte
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shipping.phone}
                                            onChange={(e) => handleShippingChange('phone', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Teléfono"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                            Dirección de Entrega
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shipping.address}
                                            onChange={(e) => handleShippingChange('address', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm"
                                            placeholder="Dirección donde se entregan los pedidos"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)] flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                className="flex-1"
                            >
                                {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ClientDrawer;
