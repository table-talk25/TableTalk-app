import axios from 'axios';
import { isNative } from '../config/capacitorConfig';
import { DEV_SERVER_URL, SERVER_URL } from '../config/capacitorConfig';
import { Dialog } from '@capacitor/dialog';
import { authPreferences } from '../utils/preferences';

const API_BASE_URL = isNative ? DEV_SERVER_URL : SERVER_URL;

// Selezioniamo l'URL corretto in base alla piattaforma
// Nota: la guida originale aveva una logica più complessa, la semplifichiamo
// per usare la configurazione che abbiamo già definito.

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
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

export const sendLeaveReport = async ({ type, id, reason, customReason }) => {
  const url = type === 'meal'
    ? `/meals/${id}/leave-report`
    : `/chats/${id}/leave-report`;
  return apiClient.post(url, { reason, customReason });
};

export default apiClient;