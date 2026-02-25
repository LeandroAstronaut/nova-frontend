import React, { useState, useEffect, useMemo } from 'react';
import { Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProductCatalog from '../../components/orders/ProductCatalog';
import ProductQuickView from '../../components/products/ProductQuickView';
import { getProducts } from '../../services/productService';

const CatalogPage = () => {
    const { user } = useAuth();
    const isClient = user?.role?.name === 'cliente';
    const clientPriceList = user?.client?.priceList || 1; // Lista asignada al cliente
    
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [selectedPriceList, setSelectedPriceList] = useState(isClient ? clientPriceList : 1);
    
    // Estados para el quickview
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const showPricesWithTax = user?.company?.showPricesWithTax === true;
    const features = user?.company?.features || {};
    const hasPriceLists = features.priceLists === true;
    const company = user?.company;

    // Estados para categorías y subcategorías
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);

    // Extraer categorías y subcategorías únicas de los productos
    const categoriesData = useMemo(() => {
        const cats = new Map(); // Map<category, Set<subcategories>>
        let hasUncategorized = false;
        
        products.forEach(p => {
            if (p.category) {
                if (!cats.has(p.category)) {
                    cats.set(p.category, new Set());
                }
                if (p.subcategory) {
                    cats.get(p.category).add(p.subcategory);
                }
            } else {
                hasUncategorized = true;
            }
        });
        
        return {
            list: Array.from(cats.keys()).sort(),
            subcategoriesByCategory: cats,
            hasUncategorized
        };
    }, [products]);

    // Filtrar productos por categoría y subcategorías seleccionadas
    const filteredProducts = useMemo(() => {
        let filtered = products;
        
        // Filtrar por categoría principal
        if (selectedCategory) {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        
        // Filtrar por subcategorías
        if (selectedSubcategories.length > 0) {
            filtered = filtered.filter(p => {
                const productSubcat = p.subcategory || 'Sin subcategoría';
                return selectedSubcategories.includes(productSubcat);
            });
        }
        
        return filtered;
    }, [products, selectedCategory, selectedSubcategories]);

    // Manejar selección de categoría
    const handleCategoryClick = (category) => {
        if (selectedCategory === category) {
            // Deseleccionar categoría
            setSelectedCategory(null);
            setSelectedSubcategories([]);
        } else {
            // Seleccionar nueva categoría
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

    // Limpiar todos los filtros
    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedSubcategories([]);
    };

    // Cargar productos
    const loadProducts = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                search: search || undefined,
                active: true,
            };
            const response = await getProducts(params);
            setProducts(response.products || []);
            setPagination(response.pagination || { page: 1, total: 0, totalPages: 1 });
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts(1, '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Manejar cambio de página
    const handlePageChange = (newPage) => {
        loadProducts(newPage, searchQuery);
    };

    // Abrir quickview al hacer click en un producto
    const handleProductClick = (product) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    // Debounce para búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            loadProducts(1, searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    return (
        <div className="space-y-6">
            {/* Header con selector de lista de precios */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                        Catálogo de Productos
                    </h1>
                    {/* Badge informativo - Estilo ProductCatalog */}
                    <div className={`mt-2 px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2 ${
                        showPricesWithTax 
                            ? 'bg-success-50 dark:bg-success-900/20 text-success-600 border border-success-100 dark:border-success-800' 
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-800'
                    }`}>
                        <Tag size={14} />
                        <span>{showPricesWithTax ? 'Los precios mostrados incluyen IVA' : 'Los precios mostrados no incluyen IVA'}</span>
                        {company?.sellOnlyFullPackages && (
                            <span className="text-[11px] opacity-80">· Solo bultos cerrados</span>
                        )}
                    </div>
                </div>
                
                {/* Selector de Lista de Precios - Botones estilo radio (solo para no-clientes) */}
                {hasPriceLists && !isClient && (
                    <div className="flex items-center gap-1 bg-[var(--bg-hover)] p-1 rounded-lg">
                        <button
                            onClick={() => setSelectedPriceList(1)}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                                selectedPriceList === 1
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Lista 1
                        </button>
                        <button
                            onClick={() => setSelectedPriceList(2)}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                                selectedPriceList === 2
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Lista 2
                        </button>
                    </div>
                )}
                
                {/* Indicador de lista para clientes - Estilo igual al botón activo */}
                {isClient && hasPriceLists && (
                    <div className="px-4 py-2 bg-primary-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm">
                        Lista {clientPriceList}
                    </div>
                )}
            </div>

            {/* Fila compacta: Categorías + Búsqueda */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Categorías (izquierda) */}
                {(categoriesData.list.length > 0 || categoriesData.hasUncategorized) && (
                    <div className="flex-1 space-y-2">
                        {/* Categorías principales */}
                        <div className="flex flex-wrap gap-1.5">
                            {categoriesData.list.map(category => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                                        selectedCategory === category
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                            {categoriesData.hasUncategorized && (
                                <button
                                    onClick={() => handleCategoryClick('Sin categoría')}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                                        selectedCategory === 'Sin categoría'
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]'
                                    }`}
                                >
                                    Sin categoría
                                </button>
                            )}
                            {(selectedCategory || selectedSubcategories.length > 0) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-medium text-danger-600 hover:bg-danger-50 transition-all"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        
                        {/* Subcategorías */}
                        {selectedCategory && selectedCategory !== 'Sin categoría' && (
                            <div className="flex flex-wrap gap-1.5 pl-3 border-l-2 border-primary-200">
                                {Array.from(categoriesData.subcategoriesByCategory.get(selectedCategory) || [])
                                    .sort()
                                    .map(subcategory => (
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
                
                {/* Buscador (derecha) */}
                <div className="w-full sm:w-56 flex-shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 bg-white dark:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-500"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Catálogo usando el mismo componente que BudgetDrawer */}
            <ProductCatalog
                products={filteredProducts}
                loading={loading}
                searchQuery=""
                setSearchQuery={() => {}}
                // La búsqueda se maneja desde afuera con debounce
                priceList={selectedPriceList}
                itemsInCart={[]}
                onProductClick={handleProductClick}
                onAddDirect={() => {}}
                isClient={user?.role?.name === 'cliente'}
                showPricesWithTax={showPricesWithTax}
                company={user?.company}
                page={pagination.page}
                pagination={pagination}
                onPageChange={handlePageChange}
                viewOnly={true}
            />

            {/* QuickView en modo solo lectura (catálogo) */}
            <ProductQuickView
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={quickViewProduct}
                onAddToCart={() => {}}
                isClient={user?.role?.name === 'cliente'}
                viewOnly={true}
                showPricesWithTax={showPricesWithTax}
                features={features}
                company={user?.company}
                priceList={selectedPriceList}
                user={user}
            />
        </div>
    );
};

export default CatalogPage;
