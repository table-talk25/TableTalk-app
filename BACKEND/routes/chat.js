const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Configurazione rate limiter per prevenire spam
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 messaggi al minuto
  message: 'Troppi messaggi inviati. Riprova tra un minuto.'
});

const videoCallLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5, // 5 videochiamate all'ora
  message: 'Troppe videochiamate avviate. Riprova tra un\'ora.'
});

/**
 * Router per le operazioni relative alle chat
 * Tutte le rotte qui definite hanno il prefisso /api/chat
 */

/**
 * @route   POST api/chat/meals/:mealId/messages
 * @desc    Invia un messaggio nella chat di un pasto
 * @access  Private
 */
router.post('/meals/:mealId/messages', 
  protect,
  messageLimiter,
    [
    check('content', 'Il contenuto del messaggio è obbligatorio').not().isEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  (req, res, next) => {
    // Adatta i parametri per usare sendMessage con il formato corretto
    req.params.id = req.params.mealId;
    chatController.sendMessage(req, res, next);
  }
);

// Ottieni le chat dell'utente corrente
router.get('/', protect, (req, res, next) => {
  chatController.getMyChats(req, res, next);
});

/**
 * @route   DELETE api/chat/messages/:messageId
 * @desc    Elimina un messaggio
 * @access  Private
 */
router.delete('/messages/:messageId', protect, (req, res) => {
  // Questa funzionalità non è ancora implementata nel controller
  return res.status(501).json({ msg: 'Funzionalità non ancora implementata' });
});

/**
 * @route   POST api/chat/meals/:mealId/video
 * @desc    Avvia una videochiamata per un pasto
 * @access  Private
 */
router.post('/meals/:mealId/video', protect, videoCallLimiter, chatController.startVideoCall);

/**
 * @route   GET api/chat/meals/:mealId/video
 * @desc    Ottieni le informazioni della videochiamata attiva
 * @access  Private
 */
router.get('/meals/:mealId/video', protect, chatController.getVideoCall);

// Ottieni i messaggi di una chat specifica
router.get('/:mealId', protect, (req, res, next) => {
  // Adatta i parametri per usare getChat con il formato corretto
  req.params.id = req.params.mealId;
  chatController.getChat(req, res, next);
});

// Invia un nuovo messaggio in una chat
router.post('/:mealId', 
  protect,
  messageLimiter, 
  [
    check('content', 'Il contenuto del messaggio è obbligatorio').not().isEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  (req, res, next) => {
    // Adatta i parametri per usare sendMessage con il formato corretto
    req.params.id = req.params.mealId;
    chatController.sendMessage(req, res, next);
  }
);

// Segna i messaggi di una chat come letti
router.put('/:mealId/read', protect, (req, res, next) => {
  // Adatta i parametri per usare markAsRead con il formato corretto
  req.params.id = req.params.mealId;
  chatController.markAsRead(req, res, next);
});

/**
 * @route   POST api/chat/:mealId/reactions
 * @desc    Aggiungi una reazione a un messaggio
 * @access  Private
 */
router.post('/:mealId/reactions', 
  protect,
  [
  check('messageId', 'ID messaggio non valido').isMongoId(),
  check('reaction', 'Reazione non valida')
    .isIn(['like', 'heart', 'laugh', 'wow', 'sad', 'angry'])
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  chatController.addReaction
);

/**
 * @route   DELETE api/chat/:mealId/reactions/:reactionId
 * @desc    Rimuovi una reazione da un messaggio
 * @access  Private
 */
router.delete('/:mealId/reactions/:reactionId', 
  protect,
  [
  check('reactionId', 'ID reazione non valido').isMongoId()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  chatController.removeReaction
);

/**
 * @route   POST api/chat/:mealId/typing
 * @desc    Notifica che l'utente sta scrivendo
 * @access  Private
 */
router.post('/:mealId/typing', 
  protect,
  [
  check('isTyping', 'Stato digitazione non valido').isBoolean()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  chatController.updateTypingStatus
);

module.exports = router;