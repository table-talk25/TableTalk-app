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
     // 3. MOSTRIAMO L'ERRORE IN UN ALERT NATIVO
     await Dialog.alert({
      title: 'ERRORE DI RETE DETTAGLIATO',
      message: `Errore: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`
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