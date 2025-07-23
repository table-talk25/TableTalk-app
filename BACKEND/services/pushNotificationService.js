// File: BACKEND/services/pushNotificationService.js (NUOVO FILE)

const admin = require('firebase-admin');

/**
 * Invia notifiche push a un elenco di token di dispositivo tramite FCM.
 * @param {Array<string>} tokens - Array di token di registrazione FCM.
 * @param {string} title - Il titolo della notifica.
 * @param {string} body - Il corpo del messaggio della notifica.
 * @param {object} [data={}] - Dati aggiuntivi da inviare nel payload (es. per il deep linking).
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!admin.apps.length) {
    console.error('❌ Firebase Admin non è stato inizializzato. Impossibile inviare notifiche push.');
    return;
  }

  if (!tokens || tokens.length === 0) {
    return; // Nessun token a cui inviare
  }

  // Rimuovi eventuali token duplicati per efficienza
  const uniqueTokens = [...new Set(tokens)];

  const message = {
    notification: {
      title,
      body,
    },
    tokens: uniqueTokens,
    data: data, // Puoi usare questo per inviare l'ID del pasto, es: { mealId: '...' }
    android: {
        priority: 'high',
    },
    apns: {
        payload: {
            aps: {
                'content-available': 1,
            },
        },
    },
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`[Push Notification] Inviate con successo: ${response.successCount}`);
    if (response.failureCount > 0) {
      console.log(`[Push Notification] Invii falliti: ${response.failureCount}`);
      // Qui potresti aggiungere logica per rimuovere dal DB i token non validi
    }
  } catch (error) {
    console.error('Errore durante l\'invio delle notifiche push:', error);
  }
};

module.exports = { sendPushNotification };