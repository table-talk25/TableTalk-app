const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  getLanguageStats, 
  getLanguageDetails, 
  getTranslationPriority 
} = require('../controllers/analyticsController');

// Tutte le routes richiedono autenticazione e ruolo admin
router.use(protect);
router.use(authorize('admin'));

// Statistiche generali delle lingue
router.get('/languages', getLanguageStats);

// Statistiche dettagliate per una lingua specifica
router.get('/languages/:languageCode', getLanguageDetails);

// Report di priorità traduzioni
router.get('/translation-priority', getTranslationPriority);

module.exports = router; 