const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const upload = require('../middleware/upload'); 

// Configurazione rate limiter per prevenire abusi
const createMealLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5, // 5 pasti all'ora
  message: 'Troppi TableTalk® creati. Riprova tra un\'ora.'
});

const joinMealLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 10, // 10 partecipazioni all'ora
  message: 'Troppe partecipazioni. Riprova tra un\'ora.'
});

const {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  joinMeal,
  leaveMeal,
  searchMeals,
  getVideoCallUrl 
} = require('../controllers/mealController');

// ==================== ROTTE PUBBLICHE ====================
router.get('/', protect, mealController.getMeals);

/**
 * @route   GET /api/meals/search
 * @desc    Cerca pasti in base a una query testuale
 * @access  Private
 */
router.get('/search', protect, mealController.searchMeals); 

router.get('/user/all', protect, mealController.getUserMeals);

router.get('/:id', [ protect, check('id', 'ID pasto non valido').isMongoId() ], mealController.getMeal);


// ==================== ROTTE PROTETTE ====================

router.use(protect);

router.route('/').post(upload.single('coverImage'), createMeal);

router.route('/:id')
  .put(upload.single('coverImage'), updateMeal)
  .delete(deleteMeal);

// ▼▼▼ 2. ROTTA VIDEOCHIAMATA SCOMMENTATA E ATTIVA ▼▼▼
router.route('/:id/stream').get(getVideoCallUrl);

router.route('/:id/participants')
  .post(joinMeal)
  .delete(leaveMeal);

// Rotta unificata per i pasti dell'utente
// COMMENTATA PER ORA - La implementeremo quando avremo bisogno di questa logica specifica
// router.get('/user/:type', protect, [
//   check('type', 'Tipo non valido').isIn(['all', 'hosted', 'joined']),
// ], mealController.getUserMeals);

// Crea un nuovo pasto
router.post('/', protect, upload.single('coverImage'), mealController.createMeal);

// Modifica un pasto esistente
router.put('/:id', protect, upload.single('coverImage'), mealController.updateMeal);

// Elimina un pasto
router.delete('/:id', [ protect, check('id', 'ID pasto non valido').isMongoId() ], mealController.deleteMeal);

// Gestione partecipanti
router.post('/:id/participants', protect, joinMealLimiter, mealController.joinMeal);

router.delete('/:id/participants', protect, mealController.leaveMeal);



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