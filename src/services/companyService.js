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
 * Obtener todas las compañías (solo superadmin)
 * @returns {Promise<Array>} Lista de compañías
 */
const getAllCompanies = async () => {
    const response = await api.get('/companies');
    return response.data;
};

/**
 * Obtener compañía por ID (solo superadmin)
 * @param {string} id - ID de la compañía
 * @returns {Promise<Object>} Datos de la compañía
 */
const getCompanyById = async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
};

/**
 * Crear nueva compañía (solo superadmin)
 * @param {Object} companyData - Datos de la compañía
 * @returns {Promise<Object>} Compañía creada
 */
const createCompany = async (companyData) => {
    const response = await api.post('/companies', companyData);
    return response.data;
};

/**
 * Actualizar compañía (solo superadmin)
 * @param {string} id - ID de la compañía
 * @param {Object} companyData - Datos a actualizar
 * @returns {Promise<Object>} Compañía actualizada
 */
const updateCompany = async (id, companyData) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
};

/**
 * Toggle estado de compañía (solo superadmin)
 * @param {string} id - ID de la compañía
 * @returns {Promise<Object>} Resultado
 */
const toggleCompanyStatus = async (id) => {
    const response = await api.patch(`/companies/${id}/toggle-status`);
    return response.data;
};

/**
 * Toggle feature de compañía (solo superadmin)
 * @param {string} id - ID de la compañía
 * @param {string} feature - Nombre del feature
 * @returns {Promise<Object>} Resultado
 */
const toggleCompanyFeature = async (id, feature) => {
    const response = await api.patch(`/companies/${id}/toggle-feature/${feature}`);
    return response.data;
};

// ==================== RUTAS DE CONFIGURACIÓN (ADMIN) ====================

/**
 * Actualizar información de contacto de la compañía
 * @param {string} id - ID de la compañía
 * @param {Object} contactData - { phone, whatsapp, email, address }
 * @returns {Promise<Object>} Compañía actualizada
 */
const updateContactInfo = async (id, contactData) => {
    const response = await api.put(`/companies/${id}/contact-info`, contactData);
    return response.data;
};

/**
 * Subir logo de la compañía
 * @param {string} id - ID de la compañía
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} Resultado con la URL del logo
 */
const uploadCompanyLogo = async (id, file) => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post(`/companies/${id}/logo`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Eliminar logo de la compañía
 * @param {string} id - ID de la compañía
 * @returns {Promise<Object>} Resultado
 */
const deleteCompanyLogo = async (id) => {
    const response = await api.delete(`/companies/${id}/logo`);
    return response.data;
};

// Exportar funciones individuales
export {
    getAllCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    toggleCompanyStatus,
    toggleCompanyFeature,
    updateContactInfo,
    uploadCompanyLogo,
    deleteCompanyLogo
};

// Exportar objeto companyService para compatibilidad con CompaniesPage.jsx
export const companyService = {
    getAll: getAllCompanies,
    getById: getCompanyById,
    create: createCompany,
    update: updateCompany,
    delete: async (id) => {
        const response = await api.delete(`/companies/${id}`);
        return response.data;
    },
    toggleStatus: toggleCompanyStatus,
    toggleFeature: toggleCompanyFeature,
    updateContactInfo,
    uploadLogo: uploadCompanyLogo,
    deleteLogo: deleteCompanyLogo
};
