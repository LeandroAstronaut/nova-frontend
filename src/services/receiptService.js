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

export const getReceipts = async (params = {}) => {
    const response = await api.get('/receipts', { params });
    return response.data;
};

export const getReceipt = async (id) => {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
};

export const createReceipt = async (receiptData) => {
    const response = await api.post('/receipts', receiptData);
    return response.data;
};

export const cancelReceipt = async (id, reason) => {
    const response = await api.post(`/receipts/${id}/cancel`, { reason });
    return response.data;
};

export const sendReceiptEmail = async (id, notifications) => {
    const response = await api.post(`/receipts/${id}/email`, { notifications });
    return response.data;
};

export const logReceiptWhatsApp = async (id, recipientType) => {
    const response = await api.post(`/receipts/${id}/whatsapp`, { recipientType });
    return response.data;
};
