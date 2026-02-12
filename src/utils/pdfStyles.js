/**
 * Estilos y utilidades comunes para generación de PDFs
 */

// Colores del tema
export const themeColors = {
    primary: [37, 99, 235],      // Azul
    primaryLight: [59, 130, 246],
    primaryDark: [29, 78, 216],
    success: [34, 197, 94],      // Verde
    danger: [239, 68, 68],       // Rojo
    warning: [245, 158, 11],     // Amarillo
    info: [59, 130, 246],        // Azul claro
    gray: [107, 114, 128],
    darkGray: [55, 65, 81],
    lightGray: [243, 244, 246],
    white: [255, 255, 255],
    black: [0, 0, 0]
};

// Estados de órdenes/pedidos
export const statusStyles = {
    espera: {
        bg: [251, 191, 36],
        text: [146, 64, 14],
        label: 'En Espera'
    },
    confirmado: {
        bg: [59, 130, 246],
        text: [30, 64, 175],
        label: 'Confirmado'
    },
    preparando: {
        bg: [139, 92, 246],
        text: [91, 33, 182],
        label: 'Preparando'
    },
    completo: {
        bg: [34, 197, 94],
        text: [21, 128, 61],
        label: 'Completo'
    },
    entregado: {
        bg: [16, 185, 129],
        text: [6, 95, 70],
        label: 'Entregado'
    },
    anulado: {
        bg: [239, 68, 68],
        text: [153, 27, 27],
        label: 'Anulado'
    }
};

// Estados de recibos
export const receiptStatusStyles = {
    activo: {
        bg: [34, 197, 94],
        text: [21, 128, 61],
        label: 'Activo'
    },
    anulado: {
        bg: [239, 68, 68],
        text: [153, 27, 27],
        label: 'Anulado'
    }
};

// Tipos de recibos
export const receiptTypeStyles = {
    ingreso: {
        bg: [34, 197, 94],
        text: [21, 128, 61],
        label: 'Ingreso'
    },
    egreso: {
        bg: [245, 158, 11],
        text: [180, 83, 9],
        label: 'Egreso'
    }
};

/**
 * Obtener el texto del estado
 * @param {string} status - Estado
 * @returns {string} Texto legible
 */
export const getStatusText = (status) => {
    return statusStyles[status]?.label || status || 'Desconocido';
};

/**
 * Formatear moneda
 * @param {number} value - Valor numérico
 * @param {string} locale - Locale (default: 'es-AR')
 * @param {string} currency - Moneda (default: 'ARS')
 * @returns {string} Valor formateado
 */
export const formatCurrency = (value, locale = 'es-AR', currency = 'ARS') => {
    if (value === undefined || value === null) return '$0,00';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

/**
 * Formatear fecha
 * @param {string|Date} date - Fecha
 * @param {string} locale - Locale
 * @param {Object} options - Opciones de Intl.DateTimeFormat
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, locale = 'es-AR', options = {}) => {
    if (!date) return '-';
    const d = new Date(date);
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
};

/**
 * Formatear número con separadores
 * @param {number} num - Número
 * @param {string} locale - Locale
 * @returns {string} Número formateado
 */
export const formatNumber = (num, locale = 'es-AR') => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat(locale).format(num);
};

/**
 * Truncar texto
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Formatear porcentaje
 * @param {number} value - Valor decimal (ej: 0.15 para 15%)
 * @param {string} locale - Locale
 * @returns {string} Porcentaje formateado
 */
export const formatPercent = (value, locale = 'es-AR') => {
    if (value === undefined || value === null) return '0%';
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
};

export default {
    themeColors,
    statusStyles,
    receiptStatusStyles,
    receiptTypeStyles,
    getStatusText,
    formatCurrency,
    formatDate,
    formatNumber,
    truncateText,
    formatPercent
};
