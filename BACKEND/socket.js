const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Meal = require('./models/Meal');

/**
 * Servizio Socket.io per gestire le comunicazioni in tempo reale
 * Questo servizio gestisce le connessioni WebSocket per la chat in tempo reale
 * e le notifiche per gli eventi di TableTalk
 */

// Mappa per tenere traccia degli utenti connessi
// { userId: socketId }
const connectedUsers = new Map();

// Inizializza il servizio Socket.io
function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware per l'autenticazione
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Autenticazione richiesta'));
      }
      
      // Verifica il token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Cerca l'utente nel database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Utente non trovato'));
      }
      
      // Salva l'utente nel socket per usi futuri
      socket.user = {
        id: user._id,
        nickname: user.nickname
      };
      
      next();
    } catch (error) {
      console.error('Errore di autenticazione socket:', error);
      next(new Error('Token non valido'));
    }
  });

  // Gestione della connessione
  io.on('connection', (socket) => {
    console.log('Nuovo utente connesso:', socket.id);
    
    // Aggiungi l'utente alla mappa degli utenti connessi
    connectedUsers.set(socket.user.id.toString(), socket.id);
    
    // Unisci l'utente alla sua stanza personale per le notifiche
    socket.join(`user:${socket.user.id}`);
    
    // Ascolta le richieste di join alle stanze delle chat
    socket.on('join_meal', async ({ mealId, userId }) => {
      try {
        const meal = await Meal.findById(mealId);
        if (!meal) {
          socket.emit('error', { message: 'Pasto non trovato' });
          return;
        }

        const user = await User.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'Utente non trovato' });
          return;
        }

        socket.join(mealId);
        io.to(mealId).emit('user_joined', {
          userId: user._id,
          nickname: user.nickname
        });
      } catch (error) {
        socket.emit('error', { message: 'Errore durante l\'unione al pasto' });
      }
    });
    
    // Ascolta le richieste di abbandono delle stanze delle chat
    socket.on('leave_meal', ({ mealId, userId }) => {
      socket.leave(mealId);
      io.to(mealId).emit('user_left', { userId });
    });
    
    // Ascolta l'invio di nuovi messaggi
    socket.on('chatMessage', async ({ mealId, message }) => {
      // Il messaggio è già stato salvato nel database dal controller
      // Qui facciamo solo broadcast agli altri membri della chat
      
      // Emetti il messaggio a tutti i membri della stanza
      io.to(`chat:${mealId}`).emit('newMessage', {
        mealId,
        message
      });
    });
    
    // Ascolta le richieste di stato digitazione
    socket.on('typing', ({ mealId, isTyping }) => {
      // Emetti lo stato di digitazione agli altri membri della stanza
      socket.to(`chat:${mealId}`).emit('userTyping', {
        userId: socket.user.id,
        nickname: socket.user.nickname,
        isTyping
      });
    });
    
    // Gestione disconnessione
    socket.on('disconnect', () => {
      console.log('Utente disconnesso:', socket.id);
      
      // Rimuovi l'utente dalla mappa degli utenti connessi
      connectedUsers.delete(socket.user.id.toString());
    });
  });

  // Esponi l'oggetto io per inviare notifiche da altri parti dell'applicazione
  this.io = io;
  
  console.log('📡 Servizio Socket.io inizializzato');
  
  return io;
}

module.exports = initializeSocket;

/**
 * Invia una notifica a un utente specifico
 * @param {string} userId - ID dell'utente destinatario
 * @param {string} type - Tipo di notifica (es. 'newMealJoin', 'newMessage')
 * @param {object} data - Dati della notifica
 */
exports.sendNotification = (userId, type, data) => {
  if (!this.io) {
    console.error('Socket.io non inizializzato');
    return;
  }
  
  // Invia la notifica alla stanza personale dell'utente
  this.io.to(`user:${userId}`).emit('notification', {
    type,
    data,
    timestamp: new Date()
  });
};

/**
 * Invia una notifica a tutti i partecipanti di un pasto
 * @param {string} mealId - ID del pasto
 * @param {string} type - Tipo di notifica
 * @param {object} data - Dati della notifica
 */
exports.notifyMealParticipants = (mealId, type, data) => {
  if (!this.io) {
    console.error('Socket.io non inizializzato');
    return;
  }
  
  // Invia la notifica a tutti i membri della stanza del pasto
  this.io.to(`chat:${mealId}`).emit('notification', {
    type,
    data,
    timestamp: new Date()
  });
};

/**
 * Verifica se un utente è online
 * @param {string} userId - ID dell'utente da verificare
 * @returns {boolean} - true se l'utente è online, false altrimenti
 */
exports.isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

/**
 * Ottiene l'elenco degli utenti online
 * @returns {Array} - Array di ID degli utenti online
 */
exports.getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};