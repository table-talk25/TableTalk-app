// File: /services/authService.js (Versione Definitiva)

import apiClient, { suppressAlertsFor } from './apiService';
import { API_URL } from '../config/capacitorConfig';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { authPreferences } from '../utils/preferences';

// NOTA: Ogni funzione accetta un singolo oggetto 'data' per coerenza

/**
 * Registra un nuovo utente.
 * @param {object} registrationData - Oggetto con { name, surname, email, password }
 */
export const register = async (registrationData) => {
  // Percorso corretto: /auth/register
  const response = await apiClient.post('/auth/register', registrationData);
  await authPreferences.saveToken(response.data.token);
  await authPreferences.saveUser(response.data.user);
  return response.data;
};

/**
 * Esegue il login di un utente.
 * @param {object} credentials - Oggetto con { email, password }
 */
export const login = async (credentials) => {
  try {
    // Tentativo 1: Axios (Web)
    const response = await apiClient.post('/auth/login', credentials);
    await authPreferences.saveToken(response.data.token);
    await authPreferences.saveUser(response.data.user);
    // Silenzia gli alert per i prossimi 4s mentre partono le richieste di bootstrap
    suppressAlertsFor(4000);
    return response.data;
  } catch (error) {
    const isNetworkError = (error && (error.code === 'ERR_NETWORK' || !error.response));
    const isNative = Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';

    if (isNetworkError && isNative) {
      // Tentativo 2: CapacitorHttp (nativo) – bypass CORS/WebView
      const url = `${API_URL}/auth/login`;
      const nativeResp = await CapacitorHttp.post({
        url,
        data: credentials,
        headers: { 'Content-Type': 'application/json' },
        connectTimeout: 30000,
        readTimeout: 30000,
      });

      if (nativeResp && nativeResp.data) {
        await authPreferences.saveToken(nativeResp.data.token);
        await authPreferences.saveUser(nativeResp.data.user);
        // Silenzia gli alert per i prossimi 4s mentre partono le richieste di bootstrap (meals/profile/notifiche)
        suppressAlertsFor(4000);
        return nativeResp.data;
      }
    }
    throw error;
  }
};

/**
 * Esegue il logout.
 */
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout', undefined, { suppressErrorAlert: true });
  } catch (error) {
    console.error('Logout fallito sul server, ma il logout locale verrà eseguito:', error);
  } finally {
    await authPreferences.clearAuth();
  }
};

/**
 * Verifica il token e recupera i dati dell'utente.
 */
export const verifyToken = async () => {
    // Il token viene già aggiunto dall'interceptor di apiService,
    // quindi non dobbiamo passarlo noi.
    
    // Percorso corretto: /auth/me
    const response = await apiClient.get('/auth/me');
    await authPreferences.saveUser(response.data.data);
    return response.data.data;
};

/**
 * Richiede il reset della password.
 * @param {object} data - Oggetto con { email }
 */
export const forgotPassword = async (data) => {
  const response = await apiClient.post('/auth/forgot-password', data);
  return response.data;
};

/**
 * Cambia la password dell'utente.
 * @param {object} data - Oggetto con { currentPassword, newPassword }
 */
export const changePassword = async (data) => {
  const response = await apiClient.put('/profile/me/password', data);
  return response.data;
};


const authService = {
  register,
  login,
  logout,
  verifyToken,
  forgotPassword,
  changePassword,
};

export default authService;