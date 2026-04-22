import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        let userInfo = null;
        try {
            const stored = localStorage.getItem('userInfo');
            if (stored && stored !== 'undefined') {
                userInfo = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Corrupted session data", e);
        }

        if (userInfo && userInfo.token) {
            config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle global errors (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAuthPage = path === '/account' || path.startsWith('/admin');

        if (error.response?.status === 401 && !isAuthPage) {
            localStorage.removeItem('userInfo');
            if (typeof window !== 'undefined') {
                window.location.href = '/account';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
