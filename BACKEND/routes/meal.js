const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { protect, requireProfileComplete } = require('../middleware/auth');
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
  getVideoCallUrl,
  getMealStatusStats,
  syncMealStatus,
  getMealsForMap,
  getMealsGeoStats,
  advancedGeospatialSearch
} = require('../controllers/mealController');

// ==================== ROTTE PUBBLICHE ====================
router.get('/', protect, mealController.getMeals);

// 🗺️ ROTTE GEOSPAZIALI OTTIMIZZATE
router.get('/map', mealController.getMealsForMap); // Ricerca pasti per mappa con coordinate e raggio
router.get('/geostats', mealController.getMealsGeoStats); // Statistiche geospaziali
router.get('/search/advanced', mealController.advancedGeospatialSearch); // Ricerca avanzata con filtri multipli

// 🕐 ROTTE STATUS VIRTUALE
router.get('/status/stats', protect, mealController.getMealStatusStats);
router.post('/:id/sync-status', protect, mealController.syncMealStatus);

// 🔄 ROTTE AGGIORNAMENTO (PATCH per modifiche parziali)
// PATCH è più appropriato per aggiornamenti parziali di una risorsa
// PUT richiederebbe l'invio dell'intera risorsa

/**
 * @route   GET /api/meals/search
 * @desc    Cerca pasti in base a una query testuale
 * @access  Private
 */
router.get('/search', protect, mealController.searchMeals); 

router.get('/user/all', protect, mealController.getUserMeals);

router.get('/:id', [ protect, check('id', 'ID pasto non valido').isMongoId() ], mealController.getMeal);


// ==================== ROTTE PROTETTE (Aggiornamenti parziali) ====================

router.use(protect);

router.route('/:id')
  .patch(upload.single('coverImage'), updateMeal) // 🔄 PATCH per aggiornamenti parziali/selettivi
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
router.post('/', protect, requireProfileComplete, upload.single('coverImage'), mealController.createMeal);

// Modifica parziale di un pasto esistente (PATCH per aggiornamenti selettivi)
router.patch('/:id', protect, requireProfileComplete, upload.single('coverImage'), mealController.updateMeal);

// Elimina un pasto
router.delete('/:id', [ protect, requireProfileComplete, check('id', 'ID pasto non valido').isMongoId() ], mealController.deleteMeal);

// Gestione partecipanti
router.post('/:id/participants', protect, requireProfileComplete, joinMealLimiter, mealController.joinMeal);

router.delete('/:id/participants', protect, requireProfileComplete, mealController.leaveMeal);



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