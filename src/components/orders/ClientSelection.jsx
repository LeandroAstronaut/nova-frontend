import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Building2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientSelection = ({ clients, onSelect, selectedClient, readOnly = false, readOnlyMessage = '' }) => {
    // Asegurar que clients sea un array
    const clientsArray = Array.isArray(clients) ? clients : [];
    
    // Estados locales para búsqueda con debounce
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Debounce: actualizar searchQuery después de 300ms de inactividad
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.toLowerCase().trim());
        }, 300);
        
        return () => clearTimeout(timer);
    }, [searchInput]);
    
    // Filtrar clientes por nombre y CUIT
    const filteredClients = useMemo(() => {
        if (!searchQuery) return clientsArray;
        
        return clientsArray.filter(client => {
            const nameMatch = client.businessName?.toLowerCase().includes(searchQuery);
            const cuitMatch = client.cuit?.toLowerCase().includes(searchQuery);
            return nameMatch || cuitMatch;
        });
    }, [clientsArray, searchQuery]);
    
    // Sort clients: selected one first
    const sortedClients = useMemo(() => {
        return [...filteredClients].sort((a, b) => {
            if (selectedClient && a._id === selectedClient._id) return -1;
            if (selectedClient && b._id === selectedClient._id) return 1;
            return 0;
        });
    }, [filteredClients, selectedClient]);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header con Search - Sin card para ahorrar espacio */}
            <div className="relative">
                {readOnly ? (
                    <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
                        <p className="text-[12px] text-violet-700 dark:text-violet-300 font-medium">
                            {readOnlyMessage || 'Cliente pre-seleccionado para su usuario'}
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o CUIT..."
                            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:bg-[var(--bg-card)] transition-all"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Grid de Clientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <AnimatePresence mode="popLayout">
                {sortedClients.length > 0 ? sortedClients.slice(0, 50).map((client, index) => {
                    const isSelected = selectedClient && client._id === selectedClient._id;
                    return (
                        <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.03 }}
                            key={client._id}
                            onClick={() => onSelect(client)}
                            className={`group relative bg-(--bg-card) rounded-2xl border p-4 hover:shadow-lg transition-all text-left ${isSelected
                                    ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md'
                                    : 'border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700'
                                }`}
                        >
                            {/* Badge Seleccionado - Círculo azul con check */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                            
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-(--bg-hover) text-(--text-muted) group-hover:text-primary-600'}`}>
                                    <Building2 size={22} />
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <p className={`font-bold text-[15px] leading-tight mb-1 ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-(--text-primary)'}`}>
                                        {client.businessName}
                                    </p>
                                    <p className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wide">
                                        CUIT: {client.cuit || 'No registrado'}
                                    </p>
                                </div>
                            </div>

                            {/* Vendedor */}
                            <div className="mt-3 pt-3 border-t border-(--border-color) flex items-center gap-2">
                                <User size={14} className="text-(--text-muted)" />
                                <span className="text-[11px] text-primary-600 dark:text-primary-400 font-medium">
                                    Vendedor: {client.salesRepId?.firstName && client.salesRepId?.lastName 
                                        ? `${client.salesRepId.firstName} ${client.salesRepId.lastName}`
                                        : client.salesRepId?.name 
                                            ? client.salesRepId.name
                                            : (client.salesRepId?._id || client.salesRepId ? 'Asignado' : 'Sin asignar')}
                                </span>
                            </div>
                        </motion.button>
                    );
                }) : (
                    <div className="col-span-full py-12 text-center">
                        <div className="w-16 h-16 bg-(--bg-hover) rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 size={32} className="text-(--text-muted) opacity-50" />
                        </div>
                        <p className="text-(--text-muted) text-sm font-medium">
                            {searchQuery ? `No se encontraron clientes para "${searchQuery}"` : 'Escribe para buscar clientes por nombre o CUIT'}
                        </p>
                    </div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ClientSelection;
