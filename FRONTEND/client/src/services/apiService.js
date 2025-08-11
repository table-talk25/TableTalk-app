import axios from 'axios';
// 1. Importiamo la nostra NUOVA e unica variabile intelligente
import { API_URL } from '../config/capacitorConfig';

import { Dialog } from '@capacitor/dialog';
import { authPreferences } from '../utils/preferences';

const apiClient = axios.create({
  // 2. Usiamo direttamente la nuova variabile API_URL
  // (che contiene già /api alla fine, grazie alla nostra nuova logica)
  baseURL: API_URL, 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Aggiungiamo un interceptor per inserire il token in automatico
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await authPreferences.getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Errore nel recuperare il token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const statusText = error?.response?.statusText;
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === 'string' ? error.response.data : undefined);
    const code = error?.code; // es. ECONNABORTED (timeout)
    const method = (error?.config?.method || '').toUpperCase();
    const url = error?.config?.url;

    const friendlyMessage = [
      status ? `Stato: ${status} ${statusText || ''}`.trim() : undefined,
      code ? `Codice: ${code}` : undefined,
      method || url ? `Richiesta: ${[method, url].filter(Boolean).join(' ')}` : undefined,
      serverMessage ? `Server: ${serverMessage}` : undefined,
      !status && !serverMessage && !code ? 'Problema di rete o server non raggiungibile.' : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Dialog.alert({
        title: 'Errore di rete',
        message: friendlyMessage,
      });
    } catch (_) {
      // Ignora eventuali errori del dialog
    }

    // Log esteso in console per debug via Chrome DevTools
    // Utile quando si ispeziona l’app con chrome://inspect/#devices
    // Non visibile all’utente
    // eslint-disable-next-line no-console
    console.error('[API ERROR]', {
      status,
      statusText,
      code,
      method,
      url,
      serverMessage,
    });

    return Promise.reject(error);
  }
);

// Funzioni per le segnalazioni di sicurezza
export const createReport = async (reportData) => {
  return apiClient.post('/reports', reportData);
};

export const getMyReports = async () => {
  return apiClient.get('/reports/my-reports');
};

// Funzioni per admin
export const getReports = async (params = {}) => {
  return apiClient.get('/reports', { params });
};

export const getReport = async (reportId) => {
  return apiClient.get(`/reports/${reportId}`);
};

export const updateReportStatus = async (reportId, statusData) => {
  return apiClient.put(`/reports/${reportId}/status`, statusData);
};

export const deleteReport = async (reportId) => {
  return apiClient.delete(`/reports/${reportId}`);
};

export const getReportStats = async () => {
  return apiClient.get('/reports/stats');
};

// Manteniamo la funzione legacy per compatibilità
export const sendLeaveReport = async ({ type, id, reason, customReason }) => {
  const url = type === 'meal'
    ? `/meals/${id}/leave-report`
    : `/chats/${id}/leave-report`;
  return apiClient.post(url, { reason, customReason });
};

// Funzioni per il blocco utenti
export const blockUser = async (userId) => {
  return apiClient.post(`/users/${userId}/block`);
};

export const unblockUser = async (userId) => {
  return apiClient.delete(`/users/${userId}/block`);
};

export const getBlockedUsers = async () => {
  return apiClient.get('/users/blocked');
};

export const isUserBlocked = async (userId) => {
  return apiClient.get(`/users/${userId}/is-blocked`);
};

export default apiClient;