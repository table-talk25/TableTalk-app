// File: BACKEND/routes/videoCall.js (Versione Semplificata e Sicura)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Assumendo che questo sia il percorso corretto
const { generateVideoToken, endVideoCall } = require('../controllers/videoCallController');

/**
 * @desc    Genera un token per entrare nella videochiamata di un pasto specifico.
 * @route   POST /api/video/meals/:mealId/token
 * @access  Private
 */
router.route('/meals/:mealId/token').post(protect, generateVideoToken);

/**
 * @desc    Permette all'host di terminare la videochiamata per un pasto specifico.
 * @route   POST /api/video/meals/:mealId/end
 * @access  Private (Solo Host)
 */
router.route('/meals/:mealId/end').post(protect, endVideoCall);

module.exports = router;