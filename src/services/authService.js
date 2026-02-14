import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authService = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token in headers
authService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const login = async (email, password) => {
    const response = await authService.post('/auth/login', { email, password });
    // Si requiere selección de compañía, no guardamos token todavía
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const loginWithCompany = async (tempToken, userId) => {
    const response = await authService.post('/auth/login-with-company', { tempToken, userId });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const getMyCompanies = async () => {
    const response = await authService.get('/auth/my-companies');
    return response.data;
};

export const switchCompany = async (userId) => {
    const response = await authService.post('/auth/switch-company', { userId });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
};

export const getMe = async () => {
    // Agregar timestamp para evitar caché del navegador
    const response = await authService.get(`/auth/me?t=${Date.now()}`, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
    return response.data;
};

export default authService;
