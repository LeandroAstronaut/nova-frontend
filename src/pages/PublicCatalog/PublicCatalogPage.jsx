import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Globe, Store, AlertCircle, Search, Phone, Mail, MapPin, MessageCircle, ChevronDown, X, Menu, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCompanyBySlug } from '../../services/companyService';
import { usePublicCatalog } from '../../hooks/usePublicCatalog';
import ProductCatalog from '../../components/orders/ProductCatalog';
import ProductQuickView from '../../components/products/ProductQuickView';

const PublicCatalogPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [company, setCompany] = useState(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para QuickView
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    
    // Estado para drawer de categorías en mobile
    const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
    
    // Cargar compañía
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                setLoadingCompany(true);
                const data = await getCompanyBySlug(slug);
                
                if (!data.publicCatalog) {
                    setError('Esta compañía no tiene el catálogo público activado.');
                } else if (!data.features?.catalog) {
                    setError('Esta compañía no tiene el módulo de catálogo habilitado.');
                } else {
                    setCompany(data);
                }
            } catch (err) {
                console.error('Error fetching company:', err);
                setError('No se encontró la compañía o el catálogo no está disponible.');
            } finally {
                setLoadingCompany(false);
            }
        };

        if (slug) {
            fetchCompany();
        }
    }, [slug]);

    // Hook del catálogo
    const {
        products,
        loading: loadingProducts,
        error: productsError,
        searchQuery,
        setSearchQuery,
        pagination,
        handlePageChange,
        categoriesData,
        selectedCategory,
        setSelectedCategory,
        selectedSubcategories,
        setSelectedSubcategories,
        features,
        hasStockFeature,
        hideOutOfStock,
        showPricesWithTax
    } = usePublicCatalog(company?._id, company);

    // Configuración del catálogo público
    const publicCatalogSettings = company?.publicCatalogSettings || {};
    const showPrices = publicCatalogSettings.showPrices !== false;
    const showStock = publicCatalogSettings.showStock === true;
    const priceListId = publicCatalogSettings.priceListId;
    
    // Determinar lista de precios a mostrar
    const priceList = priceListId || 1;

    // Los productos ya vienen filtrados del backend
    const filteredProducts = products;

    // Handlers
    const handleProductClick = (product) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
        setSearchParams({ product: product._id });
    };

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false);
        setTimeout(() => {
            setSearchParams({});
        }, 300);
    };

    // Efecto para abrir producto desde URL
    useEffect(() => {
        const productId = searchParams.get('product');
        if (productId && products.length > 0) {
            const product = products.find(p => p._id === productId);
            if (product) {
                setQuickViewProduct(product);
                setIsQuickViewOpen(true);
            }
        }
    }, [searchParams, products]);

    // Manejar selección de categoría
    const handleCategoryClick = (category) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            setSelectedSubcategories([]);
        } else {
            setSelectedCategory(category);
            setSelectedSubcategories([]);
        }
    };

    // Manejar toggle de subcategoría
    const toggleSubcategory = (subcategory) => {
        setSelectedSubcategories(prev => 
            prev.includes(subcategory)
                ? prev.filter(s => s !== subcategory)
                : [...prev, subcategory]
        );
    };

    // Limpiar filtros
    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedSubcategories([]);
    };

    // Loading state
    if (loadingCompany) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-secondary-900 dark:to-secondary-800">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Package size={48} className="text-primary-500" />
                </motion.div>
                <p className="mt-4 text-secondary-600 dark:text-secondary-400 font-medium">
                    Cargando catálogo...
                </p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-secondary-800 p-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                </motion.div>
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-secondary-200 mb-2 text-center">
                    Catálogo no disponible
                </h1>
                <p className="text-secondary-600 dark:text-secondary-400 text-center max-w-md">
                    {error}
                </p>
                <a href="/" className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                    Volver al inicio
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-body)]">
            {/* Header */}
            <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3 gap-4">
                        {/* Logo y nombre */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {company?.logo ? (
                                <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                                    <Store size={20} className="text-primary-600" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                                    {company?.name}
                                </h1>
                                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                    Catálogo de productos
                                </p>
                            </div>
                        </div>

                        {/* Contacto en desktop */}
                        <div className="hidden lg:flex items-center gap-4 text-sm text-[var(--text-muted)] flex-shrink-0">
                            {company?.phone && (
                                <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                                    <Phone size={14} /> {company.phone}
                                </a>
                            )}
                            {company?.whatsapp && (
                                <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                                    <MessageCircle size={14} /> WhatsApp
                                </a>
                            )}
                        </div>

                        {/* Botón Categorías en tablet */}
                        <div className="hidden sm:flex lg:hidden items-center gap-2">
                            <button
                                onClick={() => setIsMobileCategoriesOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)]"
                            >
                                <Filter size={14} />
                                Categorías
                            </button>
                        </div>

                        {/* Búsqueda */}
                        <div className="hidden sm:block w-52 md:w-64 flex-shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-500 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barra móvil: Categorías + Búsqueda */}
                <div className="sm:hidden px-4 pb-3 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-2 pt-3">
                        {/* Botón Categorías */}
                        {categoriesData.length > 0 && (
                            <button
                                onClick={() => setIsMobileCategoriesOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] active:bg-[var(--bg-input)] transition-colors flex-shrink-0"
                            >
                                <Filter size={14} />
                                Categorías
                            </button>
                        )}
                        
                        {/* Búsqueda */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Drawer de categorías para mobile */}
            <AnimatePresence>
                {isMobileCategoriesOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileCategoriesOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[var(--bg-card)] z-50 shadow-xl"
                        >
                            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                    <Store size={18} />
                                    Categorías
                                </h3>
                                <button
                                    onClick={() => setIsMobileCategoriesOpen(false)}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
                                <div className="space-y-1">
                                    {categoriesData.map(({ category, subcategories }) => (
                                        <div key={category}>
                                            <button
                                                onClick={() => {
                                                    handleCategoryClick(category);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                                    selectedCategory === category
                                                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 font-medium'
                                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                                }`}
                                            >
                                                <span>{category}</span>
                                                {subcategories.length > 0 && (
                                                    <ChevronDown
                                                        size={16}
                                                        className={`transition-transform ${selectedCategory === category ? 'rotate-180' : ''}`}
                                                    />
                                                )}
                                            </button>
                                            
                                            {/* Subcategorías */}
                                            <AnimatePresence>
                                                {selectedCategory === category && subcategories.length > 0 && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pl-4 py-1 space-y-0.5">
                                                            {subcategories.map(sub => (
                                                                <button
                                                                    key={sub}
                                                                    onClick={() => {
                                                                        toggleSubcategory(sub);
                                                                        setIsMobileCategoriesOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                                                        selectedSubcategories.includes(sub)
                                                                            ? 'text-primary-600 font-semibold bg-primary-50 dark:bg-primary-900/20'
                                                                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                                                    }`}
                                                                >
                                                                    {sub}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                                
                                {selectedCategory && (
                                    <button
                                        onClick={() => {
                                            clearFilters();
                                            setIsMobileCategoriesOpen(false);
                                        }}
                                        className="w-full mt-4 px-3 py-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                {/* Fila: Categorías + Info de precios */}
                <div className="hidden lg:flex lg:flex-row lg:items-start justify-between gap-4 mb-6">
                    {/* Categorías (izquierda) - Oculto en mobile */}
                    {categoriesData.length > 0 && (
                        <div className="flex-1 min-w-0">
                            {/* Categorías principales */}
                            <div className="flex flex-wrap gap-1.5">
                                {categoriesData.map(({ category, subcategories }) => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryClick(category)}
                                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap ${
                                            selectedCategory === category
                                                ? 'bg-primary-600 text-white shadow-sm'
                                                : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-primary-300'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                                {(selectedCategory || selectedSubcategories.length > 0) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 rounded-full text-[12px] font-medium text-danger-600 hover:bg-danger-50 transition-all"
                                    >
                                        ✕ Limpiar
                                    </button>
                                )}
                            </div>
                            
                            {/* Subcategorías */}
                            {selectedCategory && (
                                <div className="flex flex-wrap gap-1.5 mt-2 pl-3 border-l-2 border-primary-200">
                                    {categoriesData
                                        .find(c => c.category === selectedCategory)
                                        ?.subcategories
                                        ?.map(subcategory => (
                                            <button
                                                key={subcategory}
                                                onClick={() => toggleSubcategory(subcategory)}
                                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                                                    selectedSubcategories.includes(subcategory)
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-primary-300'
                                                }`}
                                            >
                                                {subcategory}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Filtros activos (mobile/tablet) */}
                {(selectedCategory || selectedSubcategories.length > 0) && (
                    <div className="lg:hidden mb-4 flex flex-wrap gap-2">
                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 text-xs rounded-full">
                                {selectedCategory}
                                <button onClick={() => setSelectedCategory(null)}>
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {selectedSubcategories.map(sub => (
                            <span key={sub} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 text-xs rounded-full">
                                {sub}
                                <button onClick={() => toggleSubcategory(sub)}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Catálogo de productos */}
                <ProductCatalog
                    products={filteredProducts}
                    loading={loadingProducts}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    priceList={priceList}
                    itemsInCart={[]}
                    onProductClick={handleProductClick}
                    onAddDirect={() => {}}
                    isClient={true}
                    showPricesWithTax={showPricesWithTax}
                    company={{
                        ...company,
                        sellOnlyFullPackages: false,
                        excludeOfferProductsFromGlobalDiscount: false
                    }}
                    page={pagination.page}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    viewOnly={true}
                    showPrices={showPrices}
                />

                {/* Mensaje cuando no hay productos */}
                {!loadingProducts && filteredProducts.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center py-20 text-center mt-4 min-h-[300px]">
                        <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mb-4">
                            <Package size={40} className="text-[var(--text-muted)] opacity-50" />
                        </div>
                        <p className="text-[var(--text-primary)] font-medium">No se encontraron productos</p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                            {hideOutOfStock && products.length > 0 
                                ? 'Algunos productos pueden estar ocultos por falta de stock. Intenta con otra búsqueda.' 
                                : 'Intenta con otra búsqueda'}
                        </p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Info empresa */}
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                                {company?.name}
                            </h4>
                            {company?.businessName && (
                                <p className="text-xs text-[var(--text-muted)] mb-2">{company.businessName}</p>
                            )}
                        </div>
                        
                        {/* Contacto */}
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Contacto</h4>
                            <div className="space-y-2 text-sm text-[var(--text-muted)]">
                                {company?.email && (
                                    <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-primary-600">
                                        <Mail size={14} /> {company.email}
                                    </a>
                                )}
                                {company?.phone && (
                                    <a href={`tel:${company.phone}`} className="flex items-center gap-2 hover:text-primary-600">
                                        <Phone size={14} /> {company.phone}
                                    </a>
                                )}
                                {company?.whatsapp && (
                                    <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-primary-600">
                                        <MessageCircle size={14} /> {company.whatsapp}
                                    </a>
                                )}
                            </div>
                        </div>
                        
                        {/* Dirección */}
                        {company?.address && (
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Dirección</h4>
                                <p className="text-sm text-[var(--text-muted)] flex items-start gap-2">
                                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                    {company.address}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
                        <p className="text-xs text-[var(--text-muted)]">
                            © {new Date().getFullYear()} {company?.name}. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>

            {/* QuickView */}
            <ProductQuickView
                isOpen={isQuickViewOpen}
                onClose={handleCloseQuickView}
                product={quickViewProduct}
                onAddToCart={() => {}}
                isClient={true}
                viewOnly={true}
                showPricesWithTax={showPricesWithTax}
                features={features}
                company={company}
                priceList={priceList}
                user={null}
                showPrices={showPrices}
            />
        </div>
    );
};

export default PublicCatalogPage;
