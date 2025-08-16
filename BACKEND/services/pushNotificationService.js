// File: BACKEND/services/pushNotificationService.js (VERSIONE AGGIORNATA)

const admin = require('firebase-admin');

/**
 * Inizializza Firebase Admin se non è già inizializzato
 */
const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      const serviceAccount = require('../firebase-service-account.json');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'tabletalk-social'
      });
      
      console.log('✅ Firebase Admin inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore nell\'inizializzazione Firebase Admin:', error);
      throw new Error('Firebase Admin non può essere inizializzato');
    }
  }
};

/**
 * Invia notifiche push a un elenco di token di dispositivo tramite FCM.
 * @param {Array<string>} tokens - Array di token di registrazione FCM.
 * @param {string} title - Il titolo della notifica.
 * @param {string} body - Il corpo del messaggio della notifica.
 * @param {object} [data={}] - Dati aggiuntivi da inviare nel payload (es. per il deep linking).
 * @param {string} [type='general'] - Tipo di notifica per gestire azioni specifiche.
 */
const sendPushNotification = async (tokens, title, body, data = {}, type = 'general') => {
  try {
    // Inizializza Firebase se necessario
    initializeFirebase();
    
    if (!tokens || tokens.length === 0) {
      console.log('[Push Notification] Nessun token a cui inviare');
      return;
    }

    // Rimuovi eventuali token duplicati per efficienza
    const uniqueTokens = [...new Set(tokens)];

    // Prepara i dati per il deep linking
    const notificationData = {
      type: type,
      timestamp: Date.now().toString(),
      ...data
    };

    const message = {
      notification: {
        title,
        body,
      },
      tokens: uniqueTokens,
      data: notificationData,
      android: {
        priority: 'high',
        notification: {
          channel_id: 'tabletalk-general',
          icon: 'ic_stat_icon_config_sample',
          color: '#488AFF',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1,
            sound: 'default',
            badge: 1
          },
        },
        fcm_options: {
          image: 'https://tabletalk.app/logo.png'
        }
      },
      webpush: {
        notification: {
          icon: 'https://tabletalk.app/logo.png',
          badge: 'https://tabletalk.app/badge.png'
        }
      }
    };

    console.log(`[Push Notification] Invio notifica "${type}" a ${uniqueTokens.length} dispositivi`);
    
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`✅ [Push Notification] Inviate con successo: ${response.successCount}/${uniqueTokens.length}`);
    
    if (response.failureCount > 0) {
      console.log(`⚠️ [Push Notification] Invii falliti: ${response.failureCount}`);
      
      // Log dei token falliti per debug
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Token fallito ${idx}:`, resp.error);
        }
      });
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ Errore durante l\'invio delle notifiche push:', error);
    throw error;
  }
};

/**
 * Invia notifica per nuovo messaggio in chat
 */
const sendChatNotification = async (tokens, senderName, message, chatId) => {
  return sendPushNotification(
    tokens,
    `Nuovo messaggio da ${senderName}`,
    message,
    { chatId, senderName },
    'new_message'
  );
};

/**
 * Invia notifica per nuovo invito
 */
const sendInvitationNotification = async (tokens, inviterName, mealTitle) => {
  return sendPushNotification(
    tokens,
    `Nuovo invito da ${inviterName}`,
    `Ti ha invitato a: ${mealTitle}`,
    { inviterName, mealTitle },
    'new_invitation'
  );
};

/**
 * Invia notifica per accettazione invito
 */
const sendInvitationAcceptedNotification = async (tokens, accepterName, mealTitle) => {
  return sendPushNotification(
    tokens,
    `Invito accettato!`,
    `${accepterName} ha accettato l'invito a: ${mealTitle}`,
    { accepterName, mealTitle },
    'invitation_accepted'
  );
};

/**
 * Invia notifica per promemoria pasto
 */
const sendMealReminderNotification = async (tokens, mealTitle, mealTime) => {
  return sendPushNotification(
    tokens,
    `Promemoria pasto`,
    `${mealTitle} tra ${mealTime}`,
    { mealTitle, mealTime },
    'meal_reminder'
  );
};

/**
 * Invia notifica per aggiornamento pasto
 */
const sendMealUpdateNotification = async (tokens, mealTitle, updateType) => {
  return sendPushNotification(
    tokens,
    `Aggiornamento pasto`,
    `${mealTitle}: ${updateType}`,
    { mealTitle, updateType },
    'meal_update'
  );
};

/**
 * Verifica se Firebase è configurato correttamente
 */
const isFirebaseConfigured = () => {
  try {
    return admin.apps.length > 0;
  } catch {
    return false;
  }
};

/**
 * Ottieni informazioni sulla configurazione Firebase
 */
const getFirebaseStatus = () => {
  try {
    if (admin.apps.length > 0) {
      const app = admin.app();
      return {
        configured: true,
        projectId: app.options.projectId,
        serviceAccount: !!app.options.credential
      };
    }
    return { configured: false };
  } catch (error) {
    return { configured: false, error: error.message };
  }
};

module.exports = { 
  sendPushNotification,
  sendChatNotification,
  sendInvitationNotification,
  sendInvitationAcceptedNotification,
  sendMealReminderNotification,
  sendMealUpdateNotification,
  isFirebaseConfigured,
  getFirebaseStatus,
  initializeFirebase
};