// File: src/services/notificationService.js
// Servizio di notifiche completo con Firebase e fallback locale

import { Capacitor } from '@capacitor/core';

class NotificationService {
  constructor() {
    this.isLocalNotificationsAvailable = false;
    this.isPushNotificationsAvailable = false;
    this.initialized = false;
    this.pushToken = null;
    this.deviceId = null;
  }

  /**
   * Inizializza il servizio di notifiche
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const isNative = Capacitor.isNativePlatform();
      if (!isNative) {
        console.log('[NotificationService] Piattaforma non nativa, notifiche disabilitate');
        return;
      }

      // Inizializza notifiche locali PRIMA delle push
      await this.initializeLocalNotifications();
      
      // Inizializza notifiche push con Firebase
      await this.initializePushNotifications();

      this.initialized = true;
      console.log('[NotificationService] Inizializzazione completata');
      
      // Log dello stato finale
      const status = this.getStatus();
      console.log('[NotificationService] Stato finale:', status);
    } catch (error) {
      console.error('[NotificationService] Errore durante l\'inizializzazione:', error);
      // Continua con notifiche locali se disponibili
    }
  }

  /**
   * Inizializza notifiche locali
   */
  async initializeLocalNotifications() {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Richiedi permessi
      const permissionStatus = await LocalNotifications.requestPermissions();
      
      if (permissionStatus.display === 'granted') {
        this.isLocalNotificationsAvailable = true;
        console.log('[NotificationService] Notifiche locali abilitate');
      } else {
        console.log('[NotificationService] Permesso notifiche locali negato');
      }
    } catch (error) {
      console.warn('[NotificationService] Notifiche locali non disponibili:', error);
    }
  }

  /**
   * Inizializza notifiche push con Firebase
   */
  async initializePushNotifications() {
    try {
      // DISABILITATO TEMPORANEAMENTE - Firebase non configurato
      console.log('[NotificationService] Notifiche push disabilitate temporaneamente - Firebase non configurato');
      this.isPushNotificationsAvailable = false;
      return;
      
      // const { PushNotifications } = await import('@capacitor/push-notifications');
      
      // // Controlla permessi esistenti
      // const permissionStatus = await PushNotifications.checkPermissions();
      
      // if (permissionStatus.receive !== 'granted') {
      //   // Richiedi permessi
      //   const result = await PushNotifications.requestPermissions();
      //   if (result.receive !== 'granted') {
      //     console.log('[NotificationService] Permesso notifiche push negato dall\'utente');
      //     return;
      //   }
      // }

      // // Registra il device per ricevere notifiche
      // await PushNotifications.register();
      // console.log('[NotificationService] Device registrato per notifiche push');

      // // Configura i listener per le notifiche
      // this.setupPushListeners(PushNotifications);

      // this.isPushNotificationsAvailable = true;
      // console.log('[NotificationService] Notifiche push abilitate con successo');
      
    } catch (error) {
      console.error('[NotificationService] Errore nell\'inizializzazione notifiche push:', error);
      // Non è un errore critico, continuiamo con notifiche locali
    }
  }

  /**
   * Configura i listener per le notifiche push
   */
  setupPushListeners(PushNotifications) {
    // DISABILITATO TEMPORANEAMENTE - Firebase non configurato
    console.log('[NotificationService] Listener notifiche push disabilitati temporaneamente');
    return;
    
    // // Notifica ricevuta quando l'app è in foreground
    // PushNotifications.addListener('pushNotificationReceived', (notification) => {
    //   console.log('[NotificationService] Notifica push ricevuta (foreground):', notification);
      
    //   // Mostra notifica locale se l'app è in foreground
    //   this.showForegroundNotification(notification);
    // });

    // // Notifica cliccata dall'utente
    // PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    //   console.log('[NotificationService] Notifica push cliccata:', notification);
      
    //   // Gestisci l'azione (es. apri chat, profilo, ecc.)
    //   this.handleNotificationAction(notification);
    // });

    // // Token FCM ricevuto
    // PushNotifications.addListener('registration', (token) => {
    //   console.log('[NotificationService] Token FCM ricevuto:', token);
    //   this.pushToken = token.value;
      
    //   // Invia il token al backend per salvare l'associazione device-utente
    //   this.sendTokenToBackend(token.value);
    // });

    // // Errore di registrazione
    // PushNotifications.addListener('registrationError', (error) => {
    //   console.error('[NotificationService] Errore registrazione FCM:', error);
    // });
  }

  /**
   * Mostra notifica locale quando l'app è in foreground
   */
  showForegroundNotification(pushNotification) {
    if (!this.isLocalNotificationsAvailable) return;

    try {
      const notification = {
        title: pushNotification.title || 'TableTalk',
        body: pushNotification.body || 'Nuova notifica',
        id: Date.now(),
        schedule: { at: new Date(Date.now() + 100) }, // Immediata
        extra: pushNotification.data || {}
      };

      this.sendLocalNotification(notification);
    } catch (error) {
      console.error('[NotificationService] Errore nel mostrare notifica foreground:', error);
    }
  }

  /**
   * Gestisce l'azione quando l'utente clicca una notifica
   */
  handleNotificationAction(notification) {
    try {
      const data = notification.notification.data;
      
      if (data && data.type) {
        switch (data.type) {
          case 'new_message':
            // Apri la chat specifica
            if (data.chatId) {
              window.location.href = `/chat/${data.chatId}`;
            }
            break;
          case 'new_invitation':
            // Apri la pagina inviti
            window.location.href = '/invitations';
            break;
          case 'meal_reminder':
            // Apri il dettaglio del pasto
            if (data.mealId) {
              window.location.href = `/meals/${data.mealId}`;
            }
            break;
          default:
            console.log('[NotificationService] Tipo notifica non gestito:', data.type);
        }
      }
    } catch (error) {
      console.error('[NotificationService] Errore nella gestione azione notifica:', error);
    }
  }

  /**
   * Invia il token FCM al backend
   */
  async sendTokenToBackend(token) {
    try {
      // Importa il servizio API
      const { default: apiClient } = await import('./apiService');
      
      // Invia il token al backend per associarlo all'utente
      await apiClient.post('/notifications/register-device', {
        token: token,
        platform: 'android',
        deviceId: this.deviceId || 'unknown'
      });
      
      console.log('[NotificationService] Token inviato al backend con successo');
    } catch (error) {
      console.error('[NotificationService] Errore nell\'invio token al backend:', error);
    }
  }

  /**
   * Invia una notifica
   */
  async sendNotification(notification) {
    try {
      // Priorità 1: Notifiche push se disponibili
      if (this.isPushNotificationsAvailable) {
        await this.sendPushNotification(notification);
        return;
      }

      // Priorità 2: Notifiche locali come fallback
      if (this.isLocalNotificationsAvailable) {
        await this.sendLocalNotification(notification);
        return;
      }

      // Fallback: console log
      console.log('[NotificationService] Notifica (console):', notification);
    } catch (error) {
      console.error('[NotificationService] Errore nell\'invio notifica:', error);
    }
  }

  /**
   * Invia notifica push
   */
  async sendPushNotification(notification) {
    // Le notifiche push vengono gestite dal server Firebase
    // Questo metodo è per notifiche programmate localmente
    console.log('[NotificationService] Notifica push programmata:', notification);
  }

  /**
   * Invia notifica locale
   */
  async sendLocalNotification(notification) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      const localNotification = {
        title: notification.title || 'TableTalk',
        body: notification.body || notification.message || 'Nuova notifica',
        id: notification.id || Date.now(),
        schedule: notification.schedule || { at: new Date(Date.now() + 1000) },
        sound: notification.sound || null,
        attachments: notification.attachments || null,
        actionTypeId: notification.actionTypeId || 'OPEN_APP',
        extra: notification.extra || {}
      };

      await LocalNotifications.schedule({
        notifications: [localNotification]
      });

      console.log('[NotificationService] Notifica locale inviata:', localNotification);
    } catch (error) {
      console.error('[NotificationService] Errore nell\'invio notifica locale:', error);
    }
  }

  /**
   * Invia notifica immediata
   */
  async sendImmediateNotification(title, body, data = {}) {
    const notification = {
      title,
      body,
      schedule: { at: new Date(Date.now() + 500) }, // 0.5 secondi dopo
      extra: data
    };

    await this.sendNotification(notification);
  }

  /**
   * Invia notifica programmata
   */
  async sendScheduledNotification(title, body, scheduledTime, data = {}) {
    const notification = {
      title,
      body,
      schedule: { at: scheduledTime },
      extra: data
    };

    await this.sendNotification(notification);
  }

  /**
   * Cancella tutte le notifiche
   */
  async cancelAllNotifications() {
    try {
      if (this.isLocalNotificationsAvailable) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({ notifications: [] });
        console.log('[NotificationService] Tutte le notifiche locali cancellate');
      }
    } catch (error) {
      console.error('[NotificationService] Errore nella cancellazione notifiche:', error);
    }
  }

  /**
   * Controlla lo stato del servizio
   */
  getStatus() {
    return {
      initialized: this.initialized,
      localNotifications: this.isLocalNotificationsAvailable,
      pushNotifications: this.isPushNotificationsAvailable,
      pushToken: this.pushToken ? 'Presente' : 'Mancante',
      platform: Capacitor.isNativePlatform() ? 'native' : 'web'
    };
  }

  /**
   * Ottieni il token FCM corrente
   */
  getPushToken() {
    return this.pushToken;
  }
}

// Esporta un'istanza singleton
const notificationService = new NotificationService();
export default notificationService;
