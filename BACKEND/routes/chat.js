// File: /BACKEND/routes/chat.js (Versione Temporanea e Sicura)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
// const chatController = require('../controllers/chatController'); // Commentiamo per ora

// ===============================================
// LE ROTTE PER LA CHAT VERRANNO IMPLEMENTATE QUI IN FUTURO
// Per ora, lasciamo il file così per permettere al server di avviarsi.
// ===============================================

// Esempio di come potrebbe essere una rotta futura:
// router.get('/:mealId/messages', protect, chatController.getMessages);

module.exports = router;