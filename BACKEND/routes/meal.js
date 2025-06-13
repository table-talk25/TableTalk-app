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
router.get('/', mealController.getMeals);
router.get('/:id', [ check('id', 'ID pasto non valido').isMongoId() ], mealController.getMeal);

// ==================== ROTTE PROTETTE ====================

// Rotta unificata per i pasti dell'utente
// COMMENTATA PER ORA - La implementeremo quando avremo bisogno di questa logica specifica
// router.get('/user/:type', protect, [
//   check('type', 'Tipo non valido').isIn(['all', 'hosted', 'joined']),
// ], mealController.getUserMeals);

// Crea un nuovo pasto
router.post('/', [ protect, /* ...le tue validazioni... */ ], mealController.createMeal);

// Modifica un pasto esistente
router.put('/:id', [ protect, /* ...le tue validazioni... */ ], mealController.updateMeal);

// Elimina un pasto
router.delete('/:id', [ protect, check('id', 'ID pasto non valido').isMongoId() ], mealController.deleteMeal);

// Gestione partecipanti
router.post('/:id/participants', [ protect, /* ...il tuo rate limiter... */ ], mealController.joinMeal);

router.delete('/:id/participants/:userId', [ protect, /* ...le tue validazioni... */ ], mealController.leaveMeal);

// Videochiamata
// COMMENTATA PER ORA - La implementeremo con la funzionalità di videochiamata
// router.get('/:id/stream', [
//   protect,
//   check('id', 'ID pasto non valido').isMongoId()
// ], mealController.getVideoCallUrl);

// Segnalazioni
// COMMENTATA PER ORA - La implementeremo in una fase successiva
// router.post('/:id/reports', [
//   protect,
//   /* ...le tue validazioni... */
// ], mealController.reportMeal);

module.exports = router;