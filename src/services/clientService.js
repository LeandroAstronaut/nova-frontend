import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const clientApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token in headers
clientApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const getClients = async (search = '') => {
    const params = search ? { search } : {};
    const response = await clientApi.get('/clients', { params });
    return response.data;
};

export const getClientById = async (id) => {
    const response = await clientApi.get(`/clients/${id}`);
    return response.data;
};

export const createClient = async (clientData) => {
    const response = await clientApi.post('/clients', clientData);
    return response.data;
};

export const updateClient = async (id, clientData) => {
    const response = await clientApi.put(`/clients/${id}`, clientData);
    return response.data;
};

export const toggleClientStatus = async (id) => {
    const response = await clientApi.patch(`/clients/${id}/toggle-status`);
    return response.data;
};

export default clientApi;
