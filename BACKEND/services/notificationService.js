// File: BACKEND/services/notificationService.js

let io;
let connectedUsers;

// Questa funzione viene chiamata una volta in server.js per dargli gli strumenti
const initialize = (usersMap) => {
  connectedUsers = usersMap;
};

/**
 * Invia una notifica a un array di destinatari tramite Socket.IO
 * @param {Array<string>} recipientIds - Array di ID utente a cui inviare la notifica
 * @param {string} type - Il tipo di notifica (es. 'meal_join', 'new_message')
 * @param {string} message - Il testo della notifica
 * @param {object} [data={}] - Dati aggiuntivi (es. mealId, chatId)
 */
const sendNotification = (recipientIds, type, message, data = {}) => {
  if (!connectedUsers) return console.error('NotificationService non inizializzato.');

  const notificationPayload = { type, message, data, date: new Date() };

  // Ci assicuriamo che recipientIds sia sempre un array
  const recipients = Array.isArray(recipientIds) ? recipientIds : [recipientIds];

  recipients.forEach(userId => {
    const socketId = connectedUsers.get(userId.toString());
    if (socketId) {
      // Ottieni l'istanza io dal modulo socket
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        io.to(socketId).emit('new_notification', notificationPayload);
        console.log(`[Notification] Inviata notifica di tipo '${type}' a utente ${userId}`);
      }
    }
  });
};

module.exports = { initialize, sendNotification }; 