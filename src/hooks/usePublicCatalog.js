import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Hook para manejar el catálogo público de una compañía
 * @param {string} companyId - ID de la compañía
 * @param {Object} companyConfig - Configuración de la compañía (catalogSettings, publicCatalogSettings, etc.)
 */
export const usePublicCatalog = (companyId, companyConfig) => {
    const [products, setProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]); // Categorías de todos los productos
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 1
    });
    
    // Filtros de categoría
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);

    const features = companyConfig?.features || {};
    const hasStockFeature = features.stock === true;
    const hideOutOfStock = companyConfig?.catalogSettings?.hideOutOfStockInCatalog === true;
    const showPricesWithTax = companyConfig?.showPricesWithTax === true;

    // Helper para extraer categorías de productos
    const extractCategories = (productList) => {
        const cats = new Map();
        productList.forEach(p => {
            if (p.category) {
                if (!cats.has(p.category)) {
                    cats.set(p.category, new Set());
                }
                if (p.subcategory) {
                    cats.get(p.category).add(p.subcategory);
                }
            }
        });
        return Array.from(cats.entries()).map(([category, subcategories]) => ({
            category,
            subcategories: Array.from(subcategories)
        }));
    };

    // Categorías para mostrar: si hay búsqueda, usar allCategories; si no, usar de products
    const categoriesData = useMemo(() => {
        // Si hay una búsqueda activa y tenemos categorías guardadas, usar esas
        if (searchQuery && allCategories.length > 0) {
            return allCategories;
        }
        // Si no, calcular de los productos actuales
        return extractCategories(products);
    }, [products, allCategories, searchQuery]);

    // Fetch productos
    const fetchProducts = useCallback(async (page = 1, search = '') => {
        if (!companyId) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(search && { search })
            });
            
            const response = await axios.get(
                `${API_URL}/products/public/${companyId}?${params.toString()}`
            );
            
            setProducts(response.data.products);
            setPagination({
                page: response.data.page,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
            
            // Guardar categorías solo en la carga inicial (sin búsqueda)
            if (!search && response.data.products.length > 0) {
                setAllCategories(extractCategories(response.data.products));
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.response?.data?.message || 'Error al cargar los productos');
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    // Cargar productos iniciales
    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);
    
    // Cargar todas las categorías disponibles (una sola vez)
    useEffect(() => {
        const fetchAllCategories = async () => {
            if (!companyId) return;
            
            try {
                // Usar el endpoint específico para categorías (más ligero)
                const response = await axios.get(
                    `${API_URL}/products/public/${companyId}/categories`
                );
                
                if (response.data.length > 0) {
                    setAllCategories(response.data);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        
        fetchAllCategories();
    }, [companyId]);

    // Cambiar página
    const handlePageChange = useCallback((newPage) => {
        fetchProducts(newPage, searchQuery);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [fetchProducts, searchQuery]);

    // Actualizar búsqueda
    const handleSearchChange = useCallback((value) => {
        setSearchQuery(value);
        // Debounce para la búsqueda
        const timer = setTimeout(() => {
            fetchProducts(1, value);
        }, 400);
        return () => clearTimeout(timer);
    }, [fetchProducts]);

    return {
        products,
        loading,
        error,
        searchQuery,
        setSearchQuery: handleSearchChange,
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
        showPricesWithTax,
        refetch: () => fetchProducts(pagination.page, searchQuery)
    };
};

export default usePublicCatalog;
