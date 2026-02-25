import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const searchApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token in headers
searchApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Realiza una búsqueda global de clientes y usuarios
 * @param {string} query - Término de búsqueda
 * @returns {Promise<{results: Array, total: number, query: string}>}
 */
export const globalSearch = async (query) => {
    const response = await searchApi.get('/search', { 
        params: { query } 
    });
    return response.data;
};

export default searchApi;
