const ENV_URL = import.meta.env.VITE_API_URL;
export const API_URL = ENV_URL ? (ENV_URL.endsWith('/api') ? ENV_URL : `${ENV_URL}/api`) : 'http://localhost:8085/api';

export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'API request failed');
    }

    // Return empty object for 204 No Content or empty response
    const text = await response.text();
    return text ? JSON.parse(text) : {};
};
