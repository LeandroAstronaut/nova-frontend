import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    X, 
    Building2, 
    User, 
    Users, 
    Shield, 
    Briefcase,
    Mail,
    Phone,
    Loader2
} from 'lucide-react';
import { globalSearch } from '../../services/searchService';
import { useAuth } from '../../context/AuthContext';

// Hook para debounce
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Icono según el tipo de resultado
const getTypeIcon = (type, role) => {
    if (type === 'client') {
        return Building2;
    }
    if (type === 'user') {
        if (role?.name === 'admin') return Shield;
        if (role?.name === 'vendedor') return Briefcase;
        if (role?.name === 'cliente') return User;
        return User;
    }
    return User;
};

// Color según el tipo/rol
const getTypeColor = (type, role) => {
    if (type === 'client') {
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    }
    if (type === 'user') {
        if (role?.name === 'admin') return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
        if (role?.name === 'vendedor') return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        if (role?.name === 'cliente') return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    }
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
};

// Etiqueta según tipo y rol
const getTypeLabel = (type, role) => {
    if (type === 'client') return 'Cliente';
    if (type === 'user') {
        return role?.label || 'Usuario';
    }
    return 'Desconocido';
};

// Formatear número de WhatsApp para URL
const formatWhatsAppUrl = (phone) => {
    if (!phone) return null;
    // Remover todo excepto números
    const cleaned = phone.replace(/\D/g, '');
    // Agregar código de país si no lo tiene (asumimos Argentina +54)
    const withCountry = cleaned.startsWith('54') ? cleaned : `54${cleaned}`;
    return `https://wa.me/${withCountry}`;
};

// Formatear número de teléfono para llamar
const formatPhoneCallUrl = (phone) => {
    if (!phone) return null;
    // Remover todo excepto números y el signo +
    const cleaned = phone.replace(/[^\d+]/g, '');
    return `tel:${cleaned}`;
};

// Icono de WhatsApp SVG
const WhatsAppIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

// Formatear email para mailto
const formatEmailUrl = (email) => {
    if (!email) return null;
    return `mailto:${email}`;
};

const GlobalSearch = ({ onClose, isMobileOpen }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Verificar si el usuario puede usar la búsqueda (no clientes)
    const canSearch = user?.role?.name !== 'cliente';

    // Realizar búsqueda cuando cambia el término debounced
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
                setResults([]);
                setHasSearched(false);
                return;
            }

            setIsLoading(true);
            try {
                const data = await globalSearch(debouncedSearchTerm);
                setResults(data.results || []);
                setHasSearched(true);
            } catch (error) {
                console.error('Error en búsqueda:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (canSearch) {
            performSearch();
        }
    }, [debouncedSearchTerm, canSearch]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                // En mobile, también cerramos el modo expandido si se hace click fuera
                if (onClose && window.innerWidth < 768) {
                    onClose();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Abrir dropdown cuando hay resultados
    useEffect(() => {
        if (results.length > 0 || (hasSearched && searchTerm.length >= 2)) {
            setIsOpen(true);
        }
    }, [results, hasSearched, searchTerm]);

    // Navegar al detalle
    const handleResultClick = (result) => {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
        
        // Llamar onClose si existe (modo mobile)
        if (onClose) {
            onClose();
        }
        
        if (result.type === 'client') {
            navigate(`/clientes/${result.id}`);
        } else if (result.type === 'user') {
            navigate(`/usuarios/${result.id}`);
        }
    };

    // Manejar click en botón de WhatsApp
    const handleWhatsAppClick = (e, phone) => {
        e.stopPropagation();
        const url = formatWhatsAppUrl(phone);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // Manejar click en botón de Llamar
    const handlePhoneClick = (e, phone) => {
        e.stopPropagation();
        const url = formatPhoneCallUrl(phone);
        if (url) {
            window.location.href = url;
        }
    };

    // Manejar click en botón de Email
    const handleEmailClick = (e, email) => {
        e.stopPropagation();
        const url = formatEmailUrl(email);
        if (url) {
            window.location.href = url;
        }
    };

    // Limpiar búsqueda
    const clearSearch = () => {
        setSearchTerm('');
        setResults([]);
        setHasSearched(false);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Si el usuario no puede buscar, no mostrar nada
    if (!canSearch) {
        return null;
    }

    return (
        <div ref={containerRef} className="relative w-full min-w-0">
            {/* Input de búsqueda */}
            <div className="relative group w-full">
                <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) group-focus-within:text-primary-500 transition-colors pointer-events-none" 
                    size={18} 
                />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        if (results.length > 0 || (hasSearched && searchTerm.length >= 2)) {
                            setIsOpen(true);
                        }
                    }}
                    className="input pl-9 pr-9 text-xs w-full"
                    autoFocus={!!onClose}
                />
                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-(--bg-hover) rounded-full text-(--text-muted) transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown de resultados */}
            {isOpen && (
                <div 
                    className={`bg-(--bg-card) rounded-xl shadow-xl border border-(--border-color) z-[200] animate-fade-in overflow-hidden ${
                        isMobileOpen 
                            ? 'fixed left-3 right-3 top-[70px] w-auto mt-0' 
                            : 'absolute top-full left-0 mt-2 w-80 md:w-96 lg:w-[450px] max-w-[450px]'
                    }`}
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-(--border-color) bg-(--bg-hover)/50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-(--text-secondary)">
                                {isLoading ? 'Buscando...' : 
                                 results.length > 0 ? `${results.length} resultado${results.length !== 1 ? 's' : ''}` : 
                                 hasSearched ? 'Sin resultados' : 'Escribe para buscar'}
                            </span>
                            {isLoading && (
                                <Loader2 size={14} className="animate-spin text-primary-500" />
                            )}
                        </div>
                    </div>

                    {/* Lista de resultados */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {results.length === 0 && hasSearched && !isLoading && (
                            <div className="px-4 py-8 text-center">
                                <Search size={32} className="mx-auto text-(--text-muted) mb-2 opacity-50" />
                                <p className="text-sm text-(--text-secondary)">
                                    No se encontraron resultados
                                </p>
                                <p className="text-xs text-(--text-muted) mt-1">
                                    Intenta con otro término
                                </p>
                            </div>
                        )}

                        {results.map((result) => {
                            const TypeIcon = getTypeIcon(result.type, result.role);
                            const typeColorClass = getTypeColor(result.type, result.role);
                            const typeLabel = getTypeLabel(result.type, result.role);
                            const hasWhatsApp = !!result.whatsapp;
                            const hasEmail = !!result.email;
                            
                            return (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleResultClick(result)}
                                    className="group px-4 py-3 hover:bg-(--bg-hover) cursor-pointer border-b border-(--border-color) last:border-b-0 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icono de tipo */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColorClass}`}>
                                            <TypeIcon size={20} />
                                        </div>

                                        {/* Información principal */}
                                        <div className="flex-1 min-w-0">
                                            {/* Nombre */}
                                            <h4 className="text-sm font-semibold text-(--text-primary) truncate group-hover:text-primary-600 transition-colors">
                                                {result.name}
                                            </h4>

                                            {/* Tipo y Compañía */}
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeColorClass}`}>
                                                    {typeLabel}
                                                </span>
                                                {result.company && (
                                                    <span className="text-[10px] text-(--text-muted) flex items-center gap-1">
                                                        <Building2 size={10} />
                                                        {result.company.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Información adicional según tipo */}
                                            <div className="mt-1.5 space-y-0.5">
                                                {/* Si es usuario cliente, mostrar cliente asignado */}
                                                {result.type === 'user' && result.client && (
                                                    <p className="text-[11px] text-(--text-secondary) flex items-center gap-1">
                                                        <Building2 size={10} className="text-orange-500" />
                                                        <span>Cliente: <span className="font-medium">{result.client.name}</span></span>
                                                        {result.client.code && (
                                                            <span className="text-(--text-muted)">({result.client.code})</span>
                                                        )}
                                                    </p>
                                                )}

                                                {/* Si es cliente, mostrar vendedor asignado */}
                                                {result.type === 'client' && result.salesRep && (
                                                    <p className="text-[11px] text-(--text-secondary) flex items-center gap-1">
                                                        <User size={10} className="text-green-500" />
                                                        <span>Vendedor: <span className="font-medium">{result.salesRep.name}</span></span>
                                                    </p>
                                                )}

                                                {/* Email */}
                                                {result.email && (
                                                    <p className="text-[11px] text-(--text-muted) truncate">
                                                        {result.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                                            {/* Botón Llamar */}
                                            {(result.phone || result.whatsapp) && (
                                                <button
                                                    onClick={(e) => handlePhoneClick(e, result.phone || result.whatsapp)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-sm"
                                                    title={`Llamar: ${result.phone || result.whatsapp}`}
                                                >
                                                    <Phone size={16} />
                                                </button>
                                            )}
                                            
                                            {/* Botón WhatsApp */}
                                            {hasWhatsApp && (
                                                <button
                                                    onClick={(e) => handleWhatsAppClick(e, result.whatsapp)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors shadow-sm"
                                                    title={`WhatsApp: ${result.whatsapp}`}
                                                >
                                                    <WhatsAppIcon />
                                                </button>
                                            )}
                                            
                                            {/* Botón Email */}
                                            {hasEmail && (
                                                <button
                                                    onClick={(e) => handleEmailClick(e, result.email)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm"
                                                    title={`Email: ${result.email}`}
                                                >
                                                    <Mail size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer con atajos de teclado */}
                    {results.length > 0 && (
                        <div className="px-4 py-2 border-t border-(--border-color) bg-(--bg-hover)/50">
                            <p className="text-[10px] text-(--text-muted) text-center">
                                Click para ver detalles • Llamar, WhatsApp o Email
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
