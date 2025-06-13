// File: /src/config/axiosConfig.js
import axios from 'axios';

const logger = { // Logger per non mostrare log in produzione
  log: (...args) => { if (process.env.NODE_ENV === 'development') console.log(...args); },
  error: (...args) => { if (process.env.NODE_ENV === 'development') console.error(...args); },
  warn: (...args) => { if (process.env.NODE_ENV === 'development') console.warn(...args); },
};

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 15000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    logger.log('📤 Richiesta:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    logger.error('❌ Errore Richiesta Axios:', error);
    return Promise.reject({ message: 'Errore nella configurazione della richiesta.' });
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('❌ Errore Risposta Axios:', error.response || error.message);
    const isAuthRoute = error.config.url === '/auth/login' || error.config.url === '/auth/register';

    if (error.response?.status === 401 && !isAuthRoute) {
      logger.warn('🔒 Sessione non valida (401). Eseguo il logout forzato.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject({ message: 'Sessione scaduta. Effettua nuovamente il login.', status: 401 });
    }
    const errorMessage = error.response?.data?.message || 'Si è verificato un errore di comunicazione con il server.';
    return Promise.reject({ message: errorMessage, status: error.response?.status, errors: error.response?.data?.errors || [] });
  }
);

export default axiosInstance;