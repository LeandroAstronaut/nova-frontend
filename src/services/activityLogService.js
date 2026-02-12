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

const ACTIVITY_LOGS_URL = '/activity-logs';

/**
 * Obtener logs de actividad
 * @param {Object} params - Parámetros de consulta
 * @param {boolean} [params.unreadOnly] - Solo no leídos
 * @param {number} [params.limit] - Límite de resultados
 * @param {string} [params.entityType] - Tipo de entidad
 * @param {string} [params.entityId] - ID de entidad
 * @returns {Promise<Array>} Logs
 */
export const getActivityLogs = async (params = {}) => {
    const response = await api.get(ACTIVITY_LOGS_URL, { params });
    return response.data.data;
};

/**
 * Obtener conteo de notificaciones no leídas
 * @returns {Promise<number>} Cantidad de notificaciones no leídas
 */
export const getUnreadCount = async () => {
    const response = await api.get(`${ACTIVITY_LOGS_URL}/unread-count`);
    return response.data.data.count;
};

/**
 * Marcar notificaciones como leídas
 * @param {Array<string>} logIds - IDs de los logs
 * @returns {Promise<Object>} Resultado
 */
export const markAsRead = async (logIds) => {
    const response = await api.post(`${ACTIVITY_LOGS_URL}/mark-read`, { logIds });
    return response.data;
};

/**
 * Marcar todas las notificaciones como leídas
 * @returns {Promise<Object>} Resultado
 */
export const markAllAsRead = async () => {
    const response = await api.post(`${ACTIVITY_LOGS_URL}/mark-all-read`);
    return response.data;
};

/**
 * Registrar envío de WhatsApp
 * @param {string} orderId - ID del pedido/presupuesto
 * @param {string} recipientType - Tipo de destinatario (company, seller, client, share)
 * @returns {Promise<Object>} Resultado
 */
export const logWhatsAppSent = async (orderId, recipientType) => {
    const response = await api.post(`/orders/${orderId}/whatsapp`, { recipientType });
    return response.data;
};

/**
 * Obtener actividad de una entidad específica (pedido, presupuesto, etc.)
 * @param {string} entityType - Tipo de entidad (order, budget, receipt, client)
 * @param {string} entityId - ID de la entidad
 * @returns {Promise<Array>} Logs de actividad
 */
export const getEntityActivity = async (entityType, entityId) => {
    const response = await api.get(`${ACTIVITY_LOGS_URL}/entity/${entityType}/${entityId}`);
    return response.data.data;
};
