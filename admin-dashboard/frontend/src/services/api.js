import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'felix_admin_token';
export const USER_STORAGE_KEY = 'felix_admin_user';

export const saveAuthSession = (token, user) => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
};

export const getStoredUser = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const rawUser = localStorage.getItem(USER_STORAGE_KEY);
        return rawUser ? JSON.parse(rawUser) : null;
    } catch (err) {
        console.error(err);
        return null;
    }
};

export const hasAdminAccess = (user) => user?.role === 'admin' || user?.role === 'superadmin';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'https://felix-platform-backend.onrender.com').replace(/\/$/, ''),
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

export default api;
