import React from 'react';
import { Tag, Info, Check } from 'lucide-react';

const PriceListSelection = ({ selectedClient, currentPriceList, onSelect, hasItems }) => {
    const lists = [
        { num: 1, name: 'Lista 1', desc: 'Distribuidor / Mayorista' },
        { num: 2, name: 'Lista 2', desc: 'Minorista / Público' }
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header - Sin card para ahorrar espacio */}
            <div className="text-center">
                <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">Seleccionar Lista de Precios</h2>
                <p className="text-[12px] text-[var(--text-muted)] font-medium">
                    Cliente: <span className="text-primary-600 font-bold">{selectedClient?.businessName}</span>
                </p>
            </div>
            
            {hasItems && (
                <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-100 dark:border-warning-800 rounded-xl flex items-center gap-3">
                    <Info className="text-warning-500 shrink-0" size={16} />
                    <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium text-left leading-tight">
                        La lista está bloqueada porque ya hay productos en el carrito.
                    </p>
                </div>
            )}

            {/* Grid de listas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {lists.map((list) => {
                    const isSelected = currentPriceList === list.num;
                    return (
                        <button
                            key={list.num}
                            disabled={hasItems}
                            onClick={() => onSelect(list.num)}
                            className={`group relative bg-[var(--bg-card)] rounded-xl md:rounded-2xl border p-4 md:p-6 transition-all text-left ${isSelected
                                    ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md'
                                    : 'border-[var(--border-color)] hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
                                } ${hasItems && !isSelected ? 'opacity-40 grayscale' : ''}
                                ${hasItems ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {/* Badge seleccionado */}
                            {isSelected && (
                                <div className="absolute -top-2 -right-2 px-2 py-1 bg-primary-600 text-white text-[9px] font-bold uppercase rounded-lg flex items-center gap-1 shadow-md">
                                    <Check size={10} />
                                    <span className="hidden md:inline">Seleccionada</span>
                                </div>
                            )}

                            <div className="flex items-start gap-3 md:gap-4">
                                {/* Icon */}
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] group-hover:text-primary-600'}`}>
                                    <Tag size={20} className="md:w-7 md:h-7" />
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <p className={`font-bold text-base md:text-lg mb-0.5 md:mb-1 ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-[var(--text-primary)]'}`}>
                                        {list.name}
                                    </p>
                                    <p className="text-[11px] md:text-xs text-[var(--text-muted)]">
                                        {list.desc}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PriceListSelection;
