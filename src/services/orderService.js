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

export const getOrders = async (type, params = {}) => {
    const response = await api.get('/orders', {
        params: {
            type,
            ...params
        }
    });
    return response.data;
};

export const getOrder = async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};

// Para compatibilidad hacia atrás - obtener todos los pedidos sin paginación
export const getAllOrders = async (type, params = {}) => {
    const response = await api.get('/orders', {
        params: {
            type,
            ...params,
            limit: 10000 // Número grande para traer todos
        }
    });
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const updateOrder = async (id, orderData) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
};

export const deleteOrder = async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
};

export const getClients = async (search) => {
    const response = await api.get('/clients', { params: { search } });
    return response.data;
};

export const getProducts = async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
};

// Obtener usuarios disponibles para asignar pedidos (vendedores + admins activos)
export const getSellers = async () => {
    const response = await api.get('/users/staff/assignable');
    return response.data;
};

export const convertBudgetToOrder = async (budgetId, notificationSettings) => {
    const response = await api.post(`/orders/${budgetId}/convert`, {
        notifications: notificationSettings
    });
    return response.data;
};

/**
 * Validar stock disponible antes de convertir presupuesto
 * @param {string} budgetId - ID del presupuesto
 * @returns {Promise<Object>} { canConvert, stockIssues, message }
 */
export const validateBudgetStock = async (budgetId) => {
    const response = await api.get(`/orders/${budgetId}/validate-stock`);
    return response.data;
};

export const revertOrderToBudget = async (orderId, targetStatus = 'budget') => {
    const response = await api.post(`/orders/${orderId}/revert`, { targetStatus });
    return response.data;
};

export const sendOrderEmail = async (orderId, notificationSettings, additionalEmails) => {
    const response = await api.post(`/orders/${orderId}/email`, {
        notifications: notificationSettings,
        additionalEmails
    });
    return response.data;
};

export const updateOrderStatus = async (orderId, status, notificationSettings) => {
    const response = await api.post(`/orders/${orderId}/status`, {
        status,
        notifications: notificationSettings
    });
    return response.data;
};

export const updateOrderCommission = async (orderId, commissionData) => {
    const response = await api.put(`/orders/${orderId}/commission`, commissionData);
    return response.data;
};

export const checkPriceChanges = async (orderId) => {
    const response = await api.get(`/orders/${orderId}/price-changes`);
    return response.data;
};

export const updateOrderPrices = async (orderId) => {
    const response = await api.post(`/orders/${orderId}/update-prices`);
    return response.data;
};

export const cancelOrder = async (orderId, reason) => {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
};

export const recoverOrder = async (orderId) => {
    const response = await api.post(`/orders/${orderId}/recover`);
    return response.data;
};

export const deleteBudget = async (orderId) => {
    const response = await api.post(`/orders/${orderId}/delete`);
    return response.data;
};

export default {
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getClients,
    getProducts,
    getSellers
};
