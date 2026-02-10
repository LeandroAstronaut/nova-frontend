import React from 'react';
import { Search, User, Building2, Check } from 'lucide-react';

const ClientSelection = ({ clients, searchQuery, onSearch, onSelect, selectedClient }) => {
    // Sort clients: selected one first
    const sortedClients = [...clients].sort((a, b) => {
        if (selectedClient && a._id === selectedClient._id) return -1;
        if (selectedClient && b._id === selectedClient._id) return 1;
        return 0;
    });

    return (
        <div className="space-y-6">
            {/* Header con Search */}
            <div className="bg-(--bg-card) p-4 rounded-2xl border border-(--border-color) shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={16} strokeWidth={2.5} />
                    <input
                        type="text"
                        placeholder="Buscar cliente por nombre o razón social..."
                        className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-100 focus:border-primary-300 rounded-xl text-xs  text-secondary-800 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Grid de Clientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedClients.length > 0 ? sortedClients.map(client => {
                    const isSelected = selectedClient && client._id === selectedClient._id;
                    return (
                        <button
                            key={client._id}
                            onClick={() => onSelect(client)}
                            className={`group relative bg-(--bg-card) rounded-2xl border p-4 hover:shadow-lg transition-all text-left ${isSelected
                                    ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md'
                                    : 'border-(--border-color) hover:border-primary-300 dark:hover:border-primary-700'
                                }`}
                        >
                            {/* Badge Seleccionado - Esquina superior derecha */}
                            {isSelected && (
                                <div className="absolute -top-2 -right-2 px-2 py-1 bg-primary-600 text-white text-[9px] font-bold uppercase rounded-lg flex items-center gap-1 shadow-md z-10">
                                    <Check size={10} />
                                    Seleccionado
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
                                <span className="text-[12px] text-primary-600 dark:text-primary-400 font-medium">
                                    {client.salesRepId?.firstName && client.salesRepId?.lastName 
                                        ? `${client.salesRepId.firstName} ${client.salesRepId.lastName}`
                                        : client.salesRepId?.name 
                                            ? client.salesRepId.name
                                            : (client.salesRepId?._id || client.salesRepId ? 'Vendedor asignado' : 'Sin vendedor asignado')}
                                </span>
                            </div>
                        </button>
                    );
                }) : (
                    <div className="col-span-full py-12 text-center">
                        <div className="w-16 h-16 bg-(--bg-hover) rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 size={32} className="text-(--text-muted) opacity-50" />
                        </div>
                        <p className="text-(--text-muted) text-sm font-medium">
                            {searchQuery ? 'No se encontraron clientes' : 'Escribe para buscar clientes'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientSelection;
