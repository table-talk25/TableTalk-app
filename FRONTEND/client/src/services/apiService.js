import axios from 'axios';
// 1. Importiamo la nostra NUOVA e unica variabile intelligente
import { API_URL } from '../config/capacitorConfig';

import { Dialog } from '@capacitor/dialog';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { authPreferences } from '../utils/preferences';

// Anti-spam per gli alert e regole di filtro
let lastAlertTimestampMs = 0;
const ALERT_COOLDOWN_MS = 10000; // massimo 1 alert ogni 10s
const STARTUP_GRACE_MS = 5000;   // nei primi 5s sopprimiamo alert non critici
const appStartTimestampMs = Date.now();
const CRITICAL_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const NOISY_PATH_KEYWORDS = ['analytics', 'notification', 'notifications', 'push'];

function shouldSuppressForNoise(url = '') {
  const lowerUrl = url.toLowerCase();
  return NOISY_PATH_KEYWORDS.some((kw) => lowerUrl.includes(kw));
}

function shouldShowErrorAlert({ method, url, status, code, suppressErrorAlert }) {
  const now = Date.now();
  if (suppressErrorAlert) return false;
  if (now - lastAlertTimestampMs < ALERT_COOLDOWN_MS) return false;

  const upperMethod = (method || '').toUpperCase();
  const isAuthFlow = CRITICAL_PATHS.some((p) => (url || '').includes(p));
  const isWriteOperation = upperMethod && upperMethod !== 'GET';
  const isServerError = typeof status === 'number' && status >= 500;
  const isNetworkLevel = code === 'ERR_NETWORK' || typeof status !== 'number';

  // Sopprimi richieste notoriamente rumorose (es. analytics/notifications)
  if (shouldSuppressForNoise(url)) return false;

  // Durante la fase di bootstrap (primi secondi), evita alert se non auth o 5xx
  const isWithinGrace = now - appStartTimestampMs < STARTUP_GRACE_MS;
  if (isWithinGrace && !isAuthFlow && !isServerError) return false;

  // Mostra alert solo in questi casi (riduce falsi positivi):
  return isAuthFlow || isWriteOperation || isServerError || isNetworkLevel;
}

function buildFullUrl(config = {}) {
  const rawUrl = config.url || '';
  if (/^https?:/i.test(rawUrl)) return rawUrl;
  const base = (config.baseURL || API_URL || '').replace(/\/+$/, '');
  const path = rawUrl.replace(/^\/+/, '');
  return `${base}/${path}`;
}

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
    const code = error?.code; // es. ECONNABORTED (timeout), ERR_NETWORK
    const method = (error?.config?.method || '').toUpperCase();
    const url = error?.config?.url;

    // Log esteso in console per debug via Chrome DevTools (non visibile all’utente)
    // eslint-disable-next-line no-console
    console.error('[API ERROR]', { status, statusText, code, method, url, serverMessage });

    // Retry nativo su ERR_NETWORK/ECONNABORTED (bypass WebView/CORS) per GET
    const isNetworkLike = code === 'ERR_NETWORK' || code === 'ECONNABORTED' || (!status && !error.response);
    const isGet = method === 'GET';
    if (isNetworkLike && isGet && Capacitor.isNativePlatform()) {
      try {
        const fullUrl = buildFullUrl(error.config || {});
        const nativeResp = await CapacitorHttp.get({
          url: fullUrl,
          headers: error?.config?.headers || { 'Content-Type': 'application/json' },
          params: error?.config?.params || undefined,
          connectTimeout: 30000,
          readTimeout: 30000,
        });
        // Adatta la risposta nativa al formato Axios
        return Promise.resolve({
          data: nativeResp.data,
          status: nativeResp.status,
          statusText: nativeResp.statusText || '',
          headers: nativeResp.headers || {},
          config: error.config,
          request: null,
        });
      } catch (nativeErr) {
        // Continua con la gestione standard se anche il nativo fallisce
      }
    }

    // Mostra alert solo se la regola lo consente (evita spam e falsi positivi)
    const suppress = Boolean(error?.config?.suppressErrorAlert);
    if (shouldShowErrorAlert({ method, url, status, code, suppressErrorAlert: suppress })) {
      const friendlyMessage = [
        status ? `Stato: ${status} ${statusText || ''}`.trim() : undefined,
        code ? `Codice: ${code}` : undefined,
        method || url ? `Richiesta: ${[method, url].filter(Boolean).join(' ')}` : undefined,
        serverMessage ? `Server: ${serverMessage}` : undefined,
        !status && !serverMessage && !code ? 'Possibile problema di rete o server non raggiungibile.' : undefined,
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await Dialog.alert({
          title: 'Errore di rete',
          message: friendlyMessage,
        });
        lastAlertTimestampMs = Date.now();
      } catch (_) {
        // Ignora eventuali errori del dialog
      }
    }

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