import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://botica-backend-production.up.railway.app/api',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

let isRedirectingToLogin = false;

function isLoginRequest(config) {
  return String(config?.url || '').replace(/^\/+/, '').startsWith('login');
}

function redirectToExpiredSessionNotice() {
  if (isRedirectingToLogin || window.location.pathname === '/') return;

  isRedirectingToLogin = true;
  const loginUrl = new URL('/', window.location.origin);
  loginUrl.searchParams.set('notice', 'session-expired');
  window.location.replace(loginUrl);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isLoginRequest(error.config)) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      redirectToExpiredSessionNotice();
    }
    return Promise.reject(error);
  },
);

export default api;
