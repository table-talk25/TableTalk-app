// File: FRONTEND/services/notificationService.js
import apiService from './apiService';
import { Capacitor } from '@capacitor/core';

// Controlla se siamo su un dispositivo mobile nativo
const isNativePlatform = Capacitor.isNativePlatform();

export const registerForPushNotifications = async () => {
  // Se non siamo su un dispositivo nativo, salta la registrazione
  if (!isNativePlatform) {
    console.log('PushNotifications non disponibili su web');
    return;
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      throw new Error('Permesso per le notifiche non concesso.');
    }
    await PushNotifications.register(); // Registra l'app con APNS/FCM

    // Ottieni il token del dispositivo
    PushNotifications.addListener('registration', (token) => {
      console.log('Token FCM:', token.value);
      // Invia il token al backend
      apiService.post('/profile/add-fcm-token', { token: token.value })
        .then(response => {
          console.log('Token FCM salvato nel backend');
        })
        .catch(error => {
          console.error('Errore nel salvare il token FCM:', error);
        });
    });
  } catch (error) {
    console.log('PushNotifications non disponibili:', error.message);
  }
};

// Funzioni per gestire le notifiche dal frontend
const getMyNotifications = async () => {
  try {
    const response = await apiService.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Errore nel recuperare le notifiche:', error);
    throw error;
  }
};

const markAsRead = async () => {
  try {
    const response = await apiService.post('/notifications/read');
    return response.data;
  } catch (error) {
    console.error('Errore nel marcare le notifiche come lette:', error);
    throw error;
  }
};

const markAsReadById = async (notificationId) => {
  try {
    const response = await apiService.post(`/notifications/${notificationId}/mark-as-read`);
    return response.data;
  } catch (error) {
    console.error('Errore nel marcare la notifica come letta:', error);
    throw error;
  }
};

const deleteNotification = async (notificationId) => {
  try {
    const response = await apiService.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nel cancellare la notifica:', error);
    throw error;
  }
};

// Export default con tutte le funzioni
const notificationService = {
  registerForPushNotifications,
  getMyNotifications,
  markAsRead,
  markAsReadById,
  deleteNotification
};

export default notificationService;