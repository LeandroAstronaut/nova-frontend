import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Enviar solicitud de soporte técnico
 * @param {Object} data - Datos del formulario
 * @param {string} data.name - Nombre del solicitante
 * @param {string} data.email - Email del solicitante
 * @param {string} data.message - Mensaje
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendSupportRequest = async (data) => {
    const response = await api.post('/contact/support', data);
    return response.data;
};

/**
 * Enviar solicitud de contratación/ventas
 * @param {Object} data - Datos del formulario
 * @param {string} data.name - Nombre del solicitante
 * @param {string} data.email - Email del solicitante
 * @param {string} data.message - Mensaje
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendSalesRequest = async (data) => {
    const response = await api.post('/contact/sales', data);
    return response.data;
};
