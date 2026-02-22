import React from 'react';
import { Tag, Info, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PriceListSelection = ({ selectedClient, currentPriceList, onSelect, hasItems, salesRep }) => {
    const lists = [
        { num: 1, name: 'Lista 1', desc: selectedClient?.businessName },
        { num: 2, name: 'Lista 2', desc: selectedClient?.businessName }
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            {hasItems && (
                <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-100 dark:border-warning-800 rounded-xl flex items-center gap-3">
                    <Info className="text-warning-500 shrink-0" size={16} />
                    <p className="text-[11px] text-warning-700 dark:text-warning-400 font-medium text-left leading-tight">
                        La lista está bloqueada porque ya hay productos en el carrito.
                    </p>
                </div>
            )}

            {/* Grid de listas - 2 columnas en mobile, 4 en desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <AnimatePresence mode="popLayout">
                {lists.map((list, index) => {
                    const isSelected = currentPriceList === list.num;
                    return (
                        <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            key={list.num}
                            disabled={hasItems}
                            onClick={() => onSelect(list.num)}
                            className={`group relative bg-[var(--bg-card)] rounded-xl border p-3 md:p-4 transition-all text-left ${index === 0 ? 'md:col-start-2' : ''} ${isSelected
                                    ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 shadow-md'
                                    : 'border-[var(--border-color)] hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
                                } ${hasItems && !isSelected ? 'opacity-40 grayscale' : ''}
                                ${hasItems ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {/* Badge seleccionado - Círculo azul con check */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] group-hover:text-primary-600'}`}>
                                    <Tag size={22} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-[15px] leading-tight mb-1 ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-[var(--text-primary)]'}`}>
                                        {list.name}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wide">
                                        {list.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Vendedor asignado */}
                            <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                                <User size={14} className="text-[var(--text-muted)]" />
                                <span className="text-[11px] text-primary-600 dark:text-primary-400 font-medium truncate">
                                    {salesRep || 'Sin vendedor'}
                                </span>
                            </div>
                        </motion.button>
                    );
                })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PriceListSelection;
