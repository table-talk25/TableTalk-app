// File: /services/authService.js (Versione Definitiva)

import apiClient from './apiService';
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
  // Percorso corretto: /auth/login
  const response = await apiClient.post('/auth/login', credentials);
  await authPreferences.saveToken(response.data.token);
  await authPreferences.saveUser(response.data.user);
  return response.data;
};

/**
 * Esegue il logout.
 */
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
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