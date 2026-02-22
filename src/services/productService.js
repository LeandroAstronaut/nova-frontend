import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Obtener todos los productos
 * @param {Object} params - { search, page, limit, sortBy, order }
 * @returns {Promise<Object>} { products, total, page, totalPages }
 */
export const getProducts = async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
};

/**
 * Obtener un producto por ID
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Producto
 */
export const getProductById = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

/**
 * Crear un nuevo producto
 * @param {Object} productData - Datos del producto
 * @returns {Promise<Object>} Producto creado
 */
export const createProduct = async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
};

/**
 * Actualizar un producto
 * @param {string} id - ID del producto
 * @param {Object} productData - Datos a actualizar
 * @returns {Promise<Object>} Producto actualizado
 */
export const updateProduct = async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
};

/**
 * Eliminar un producto
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Resultado
 */
export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

/**
 * Activar/Desactivar producto
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Producto actualizado
 */
export const toggleProductActive = async (id) => {
    const response = await api.patch(`/products/${id}/toggle-active`);
    return response.data;
};

/**
 * Exportar productos a Excel
 * @returns {Promise<Blob>} Archivo Excel
 */
export const exportProducts = async () => {
    const response = await api.get('/products/export', {
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Actualizar stock de un producto
 * @param {string} id - ID del producto
 * @param {number} stock - Nuevo stock
 * @returns {Promise<Object>} Producto actualizado
 */
export const updateProductStock = async (id, stock) => {
    const response = await api.patch(`/products/${id}/stock`, { stock });
    return response.data;
};

/**
 * Verificar si un código ya existe
 * @param {string} code - Código a verificar
 * @param {string} excludeId - ID del producto a excluir (para edición)
 * @returns {Promise<boolean>} true si existe
 */
export const checkCodeExists = async (code, excludeId = null) => {
    const response = await api.get('/products/check-code', { params: { code, excludeId } });
    return response.data.exists;
};

/**
 * Verificar si un código de barras ya existe
 * @param {string} barcode - Código de barras a verificar
 * @param {string} excludeId - ID del producto a excluir (para edición)
 * @returns {Promise<boolean>} true si existe
 */
export const checkBarcodeExists = async (barcode, excludeId = null) => {
    if (!barcode) return false;
    const response = await api.get('/products/check-barcode', { params: { barcode, excludeId } });
    return response.data.exists;
};

/**
 * Obtener categorías existentes
 * @returns {Promise<Array>} Lista de categorías
 */
export const getCategories = async () => {
    const response = await api.get('/products/categories');
    return response.data;
};

/**
 * Obtener subcategorías de una categoría
 * @param {string} category - Nombre de la categoría
 * @returns {Promise<Array>} Lista de subcategorías
 */
export const getSubcategories = async (category) => {
    const response = await api.get('/products/subcategories', { params: { category } });
    return response.data;
};

/**
 * Obtener marcas/proveedores existentes
 * @returns {Promise<Array>} Lista de marcas
 */
export const getBrands = async () => {
    const response = await api.get('/products/brands');
    return response.data;
};

/**
 * Subir imagen a un producto
 * @param {string} productId - ID del producto
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} Resultado con la imagen subida
 */
export const uploadProductImage = async (productId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(`/products/${productId}/images`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Eliminar imagen de un producto
 * @param {string} productId - ID del producto
 * @param {number} imageIndex - Índice de la imagen a eliminar
 * @returns {Promise<Object>} Resultado
 */
export const deleteProductImage = async (productId, imageIndex) => {
    const response = await api.delete(`/products/${productId}/images/${imageIndex}`);
    return response.data;
};

/**
 * Establecer imagen de portada
 * @param {string} productId - ID del producto
 * @param {number} imageIndex - Índice de la imagen de portada
 * @returns {Promise<Object>} Resultado
 */
export const setCoverImage = async (productId, imageIndex) => {
    const response = await api.patch(`/products/${productId}/cover-image`, { imageIndex });
    return response.data;
};

/**
 * Reordenar imágenes de un producto
 * @param {string} productId - ID del producto
 * @param {Array<number>} newOrder - Array de índices en el nuevo orden
 * @returns {Promise<Object>} Resultado
 */
export const reorderProductImages = async (productId, newOrder) => {
    const response = await api.patch(`/products/${productId}/images/reorder`, { newOrder });
    return response.data;
};

/**
 * Obtener movimientos de stock de un producto
 * @param {string} productId - ID del producto
 * @param {Object} params - { page, limit }
 * @returns {Promise<Object>} { movements, total, page, totalPages }
 */
export const getProductStockMovements = async (productId, params = {}) => {
    const response = await api.get(`/products/${productId}/stock-movements`, { params });
    return response.data;
};

/**
 * Obtener stock por variante
 * @param {string} productId - ID del producto
 * @returns {Promise<Object>} { productId, productName, variantConfig, variants }
 */
export const getVariantStock = async (productId) => {
    const response = await api.get(`/products/${productId}/variant-stock`);
    return response.data;
};

/**
 * Obtener actividad de un producto
 * @param {string} productId - ID del producto
 * @param {Object} params - { page, limit }
 * @returns {Promise<Object>} { data, page, total }
 */
export const getProductActivity = async (productId, params = {}) => {
    const response = await api.get(`/activity-logs/entity/product/${productId}`, { params });
    return response.data;
};

/**
 * Verificar si un SKU de variante ya existe
 * @param {string} sku - SKU a verificar
 * @param {string} excludeProductId - ID del producto a excluir (para edición)
 * @returns {Promise<boolean>} true si existe
 */
export const checkVariantSkuExists = async (sku, excludeProductId = null) => {
    if (!sku) return false;
    const response = await api.get('/products/check-variant-sku', { params: { sku, excludeProductId } });
    return response.data.exists;
};

/**
 * Actualizar stock de una variante específica
 * @param {string} productId - ID del producto
 * @param {string} variantId - ID de la variante
 * @param {number} stock - Nuevo stock
 * @returns {Promise<Object>} Producto actualizado
 */
export const updateVariantStock = async (productId, variantId, stock) => {
    const response = await api.patch(`/products/${productId}/stock`, { stock, variantId });
    return response.data;
};

export default {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    exportProducts,
    updateProductStock,
    checkCodeExists,
    checkBarcodeExists,
    getCategories,
    getSubcategories,
    getBrands,
    uploadProductImage,
    deleteProductImage,
    setCoverImage,
    reorderProductImages,
    getProductStockMovements,
    getProductActivity,
    getVariantStock,
    checkVariantSkuExists,
    updateVariantStock,
};
