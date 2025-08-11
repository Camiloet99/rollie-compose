// src/services/api.js
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
});

// ---- Request: adjunta el token si existe ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rollie_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response: maneja token expirado (403) de forma global ----
let isHandlingAuthError = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';

    // Evita bucles y mensajes innecesarios en /auth/login
    const isAuthRoute = requestUrl.includes('/auth/login');

    if ((status === 403 || status === 401) && !isHandlingAuthError && !isAuthRoute) {
      isHandlingAuthError = true;

      // Mensaje para el usuario
      try {
        toast.error('Token expired');
      } catch (_) {
        // si react-toastify aún no está montado, simplemente seguimos
      }

      // Limpia únicamente datos de sesión
      localStorage.removeItem('rollie_token');
      localStorage.removeItem('lux_user');
      localStorage.removeItem('lux_favorites'); // opcional si los ligas a la sesión

      // Redirige al login (sin dejar historial)
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
