// File: BACKEND/routes/chat.js (Versione Pulita)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// ▼▼▼ IMPORT CORRETTI: abbiamo rimosso createMealChat che non esiste ▼▼▼
const {
  getChat,
  getMealChat,
  sendMessage, // <-- Ora questa funzione esiste e viene importata
  markAsRead,
  getUnreadMessages,
  getMyChats,
  leaveChat
} = require('../controllers/chatController');

// Ottieni le chat dell'utente e i messaggi non letti
router.route('/').get(protect, getMyChats);
router.route('/unread').get(protect, getUnreadMessages);

// Ottieni la chat di un pasto specifico
router.route('/meal/:mealId').get(protect, getMealChat);

// Operazioni su una chat specifica usando il suo ID
router.route('/:chatId').get(protect, getChat);
// ▼▼▼ QUESTA ROTTA ORA FUNZIONERÀ ▼▼▼
router.route('/:chatId/messages').post(protect, sendMessage);
router.route('/:chatId/read').put(protect, markAsRead);

// Lascia una chat
router.route('/:chatId/participants').delete(protect, leaveChat);

module.exports = router;