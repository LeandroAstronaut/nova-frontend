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

// ========== GESTIÓN DE USUARIOS STAFF (VENDEDORES + ADMINS) ==========

// Obtener todos los usuarios staff (vendedores + admins)
export const getStaffUsers = async () => {
    const response = await api.get('/users/staff');
    return response.data;
};

// Obtener usuarios disponibles para asignar pedidos (vendedores + admins activos)
export const getAssignableUsers = async () => {
    const response = await api.get('/users/staff/assignable');
    return response.data;
};

// Obtener un usuario staff por ID
export const getStaffUser = async (id) => {
    const response = await api.get(`/users/staff/${id}`);
    return response.data;
};

// Crear nuevo usuario staff (vendedor o admin)
export const createStaffUser = async (userData) => {
    const response = await api.post('/users/staff', userData);
    return response.data;
};

// Actualizar usuario staff
export const updateStaffUser = async (id, userData) => {
    const response = await api.put(`/users/staff/${id}`, userData);
    return response.data;
};

// Activar/Desactivar usuario
export const toggleStaffStatus = async (id) => {
    const response = await api.patch(`/users/staff/${id}/toggle-status`);
    return response.data;
};

// ========== BACKWARDS COMPATIBILITY (DEPRECATED) ==========
// Estos métodos se mantienen por compatibilidad temporal

export const getSellers = getStaffUsers;
export const getSeller = getStaffUser;
export const createSeller = createStaffUser;
export const updateSeller = updateStaffUser;
export const toggleSellerStatus = toggleStaffStatus;

// ========== RECUPERACIÓN DE CONTRASEÑA (público) ==========

export const forgotPassword = async (email) => {
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token, password) => {
    const response = await api.post(`/users/reset-password/${token}`, { password });
    return response.data;
};
