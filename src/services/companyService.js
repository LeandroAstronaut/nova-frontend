import api from './authService';

export const companyService = {
    // Obtener todas las compañías
    getAll: async () => {
        const response = await api.get('/companies');
        return response.data;
    },

    // Obtener una compañía por ID
    getById: async (id) => {
        const response = await api.get(`/companies/${id}`);
        return response.data;
    },

    // Crear nueva compañía
    create: async (companyData) => {
        const response = await api.post('/companies', companyData);
        return response.data;
    },

    // Actualizar compañía
    update: async (id, companyData) => {
        const response = await api.put(`/companies/${id}`, companyData);
        return response.data;
    },

    // Eliminar compañía
    delete: async (id) => {
        const response = await api.delete(`/companies/${id}`);
        return response.data;
    },

    // Toggle estado activo
    toggleStatus: async (id) => {
        const response = await api.patch(`/companies/${id}/toggle-status`);
        return response.data;
    },

    // Toggle feature específico
    toggleFeature: async (id, feature) => {
        const response = await api.patch(`/companies/${id}/toggle-feature/${feature}`);
        return response.data;
    }
};

export default companyService;
