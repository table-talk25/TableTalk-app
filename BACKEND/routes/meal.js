const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Configurazione rate limiter per prevenire abusi
const createMealLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5, // 5 pasti all'ora
  message: 'Troppi pasti creati. Riprova tra un\'ora.'
});

const joinMealLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 10, // 10 partecipazioni all'ora
  message: 'Troppe partecipazioni. Riprova tra un\'ora.'
});

/**
 * Router per le operazioni relative ai pasti virtuali
 * Tutte le rotte qui definite hanno il prefisso /api/meals
 */

// ==================== ROTTE PUBBLICHE ====================

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TableTalk API is running',
    timestamp: new Date().toISOString()
  });
});

// Ottieni tutti i pasti
router.get('/', [
  check('page', 'Numero di pagina non valido').optional().isInt({ min: 1 }),
  check('limit', 'Limite non valido').optional().isInt({ min: 1, max: 50 }),
  check('type', 'Tipo pasto non valido').optional().isIn(['breakfast', 'lunch', 'dinner', 'aperitif']),
  check('language', 'Lingua non valida').optional().isString(),
  check('date', 'Data non valida').optional().isISO8601(),
  check('status', 'Stato non valido').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']),
  check('sortBy', 'Campo di ordinamento non valido').optional().isIn(['date', 'title', 'participants', 'createdAt']),
  check('sortOrder', 'Ordine non valido').optional().isIn(['asc', 'desc']),
  check('search', 'Termine di ricerca non valido').optional().isString().isLength({ max: 100 })
], mealController.getMeals);

// Ottieni un pasto specifico
router.get('/:id', [
  check('id', 'ID pasto non valido').isMongoId(),
  check('status', 'Stato non valido').optional().isIn(['pianificato', 'in corso', 'completato', 'cancellato'])
], mealController.getMeal);

// ==================== ROTTE PROTETTE ====================

// Rotta unificata per i pasti dell'utente
router.get('/user/:type', protect, [
  check('type', 'Tipo non valido').isIn(['all', 'hosted', 'joined']),
  check('status', 'Stato non valido').optional().isIn(['pianificato', 'in corso', 'completato', 'cancellato'])
], mealController.getUserMeals);

// Creazione pasto
router.post('/', [
  protect,
  createMealLimiter,
  check('title', 'Il titolo è obbligatorio')
    .not()
    .isEmpty()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Il titolo deve essere tra 10 e 100 caratteri'),
  check('description', 'La descrizione è obbligatoria')
    .not()
    .isEmpty()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('La descrizione deve essere tra 10 e 200 caratteri'),
  check('type', 'Tipo pasto non valido')
    .isIn(['breakfast', 'lunch', 'dinner', 'aperitif'])
    .withMessage('Il tipo di pasto deve essere uno tra: breakfast, lunch, dinner, aperitif'),
  check('date', 'La data è obbligatoria e deve essere futura')
    .isISO8601()
    .withMessage('Formato data non valido')
    .custom((value) => new Date(value) > new Date())
    .withMessage('La data deve essere futura'),
  check('duration', 'Durata non valida')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('La durata deve essere tra 15 e 180 minuti'),
  check('maxParticipants', 'Numero massimo partecipanti non valido')
    .isInt({ min: 2, max: 10 })
    .withMessage('Il numero di partecipanti deve essere tra 2 e 10'),
  check('language', 'Lingua non valida')
    .not()
    .isEmpty()
    .isIn(['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'])
    .withMessage('Lingua non supportata'),
  check('topics', 'Argomenti non validi')
    .isArray({ min: 1, max: 5 })
    .withMessage('Devi specificare da 1 a 5 argomenti'),
  check('topics.*', 'Argomento non valido')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ogni argomento deve essere una stringa tra 2 e 50 caratteri'),
  check('settings.allowLateJoin', 'Impostazione allowLateJoin non valida')
    .optional()
    .isBoolean()
    .withMessage('allowLateJoin deve essere vero o falso'),
  check('settings.requireApproval', 'Impostazione requireApproval non valida')
    .optional()
    .isBoolean()
    .withMessage('requireApproval deve essere vero o falso'),
  check('settings.videoQuality', 'Impostazione videoQuality non valida')
    .optional()
    .isIn(['SD', 'HD', 'FullHD'])
    .withMessage('La qualità video deve essere SD, HD o FullHD'),
  check('settings.backgroundBlur', 'Impostazione backgroundBlur non valida')
    .optional()
    .isBoolean()
    .withMessage('backgroundBlur deve essere vero o falso')
], mealController.createMeal);

// Aggiornamento pasto
router.put('/:id', [
  protect,
  check('id', 'ID pasto non valido').isMongoId(),
  check('title', 'Titolo non valido')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }),
  check('description', 'Descrizione non valida')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }),
  check('date', 'Data non valida')
    .optional()
    .isISO8601()
    .custom((value) => new Date(value) > new Date()),
  check('maxParticipants', 'Numero massimo partecipanti non valido')
    .optional()
    .isInt({ min: 2, max: 10 }),
  check('status', 'Stato non valido')
    .optional()
    .isIn(['pianificato', 'in corso', 'completato', 'cancellato'])
    .withMessage('Lo stato deve essere uno tra: pianificato, in corso, completato, cancellato'),
], mealController.updateMeal);

// Supporto per entrambi i metodi di cancellazione
router.delete('/:id', [
  protect,
  check('id', 'ID pasto non valido').isMongoId()
], mealController.deleteMeal);

router.post('/:id/cancel', [
  protect,
  check('id', 'ID pasto non valido').isMongoId()
], mealController.cancelMeal);

// Partecipazione ai pasti
router.post('/:id/join', [
  protect,
  joinMealLimiter,
  check('id', 'ID pasto non valido').isMongoId(),
  check('message', 'Messaggio non valido')
    .optional()
    .isString()
    .isLength({ max: 200 })
], mealController.joinMeal);

router.post('/:id/leave', [
  protect,
  check('id', 'ID pasto non valido').isMongoId()
], mealController.leaveMeal);

// Videochiamata
router.get('/:id/video-call', [
  protect,
  check('id', 'ID pasto non valido').isMongoId()
], mealController.getVideoCallUrl);

// Gestione approvazioni
router.post('/:id/approve/:userId', [
  protect,
  check('id', 'ID pasto non valido').isMongoId(),
  check('userId', 'ID utente non valido').isMongoId()
], mealController.approveParticipant);

router.post('/:id/reject/:userId', [
  protect,
  check('id', 'ID pasto non valido').isMongoId(),
  check('userId', 'ID utente non valido').isMongoId()
], mealController.rejectParticipant);

// Segnalazioni
router.post('/:id/report', [
  protect,
  check('id', 'ID pasto non valido').isMongoId(),
  check('reason', 'Motivo segnalazione obbligatorio')
    .not()
    .isEmpty()
    .isIn(['inappropriato', 'spam', 'violenza', 'altro']),
  check('description', 'Descrizione segnalazione obbligatoria')
    .not()
    .isEmpty()
    .isLength({ min: 10, max: 500 })
], mealController.reportMeal);

module.exports = router;