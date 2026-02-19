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
 * Get dashboard data
 * @returns {Promise<Object>} Dashboard data including KPIs, recent orders, etc.
 */
export const getDashboardData = async () => {
    const response = await api.get('/dashboard');
    return response.data;
};

/**
 * Get chart data for sales chart
 * @param {string} period - '30days', '3months', '6months', '1year'
 * @returns {Promise<Object>} Chart labels and values
 */
export const getChartData = async (period = '6months') => {
    const response = await api.get('/dashboard/chart', {
        params: { period }
    });
    return response.data;
};

export default {
    getDashboardData,
    getChartData,
};
