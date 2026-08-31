import axios from 'axios';

// Instancia global apuntando a Railway
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://botica-backend-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para enviar el Token de Sanctum en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;