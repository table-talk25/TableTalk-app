const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Configurazione rate limiter per prevenire abusi
const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 10, // 10 aggiornamenti all'ora
  message: 'Troppi aggiornamenti del profilo. Riprova tra un\'ora.'
});

const imageUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5, // 5 upload all'ora
  message: 'Troppi upload di immagini. Riprova tra un\'ora.'
});

/**
 * @route   GET /api/users/me
 * @desc    Ottieni il profilo dell'utente corrente
 * @access  Private
 */
router.get('/me', protect, userController.getMe);

/**
 * @route   PUT /api/users/profile
 * @desc    Aggiorna il profilo dell'utente
 * @access  Private
 */
router.put('/profile', [
  protect,
  profileUpdateLimiter,
  check('nickname', 'Il nickname è obbligatorio')
    .optional()
    .not()
    .isEmpty()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Il nickname può contenere solo lettere, numeri, trattini e underscore'),
  
  check('email', 'Inserisci un indirizzo email valido')
    .optional()
    .isEmail()
    .normalizeEmail(),
  
  check('age', 'L\'età deve essere un numero tra 18 e 120')
    .optional()
    .isInt({ min: 18, max: 120 }),
  
  check('gender', 'Genere non valido')
    .optional()
    .isIn(['maschio', 'femmina', 'altro', 'preferisco non specificare']),
  
  check('bio', 'La bio non può essere più lunga di 500 caratteri')
    .optional()
    .isLength({ max: 500 })
    .trim(),
  
  check('languages', 'Lingue non valide')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Deve essere specificata almeno una lingua'),
  
  check('languages.*', 'Lingua non valida')
    .isString()
    .isLength({ min: 2, max: 50 }),
  
  check('interests', 'Interessi non validi')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Non possono essere specificati più di 10 interessi'),
  
  check('interests.*', 'Interesse non valido')
    .isString()
    .isLength({ min: 2, max: 50 }),
  
  check('settings.notifications.email', 'Impostazione notifiche email non valida')
    .optional()
    .isBoolean(),
  
  check('settings.notifications.push', 'Impostazione notifiche push non valida')
    .optional()
    .isBoolean(),
  
  check('settings.privacy.showAge', 'Impostazione privacy età non valida')
    .optional()
    .isBoolean(),
  
  check('settings.privacy.showEmail', 'Impostazione privacy email non valida')
    .optional()
    .isBoolean(),
  
  check('settings.language', 'Lingua non valida')
    .optional()
    .isIn(['it', 'en', 'es', 'fr', 'de'])
], userController.updateProfile);

/**
 * @route   POST /api/users/profile/image
 * @desc    Carica immagine del profilo
 * @access  Private
 */
router.post('/profile/image', [
  protect,
  imageUploadLimiter,
  check('image', 'Immagine non valida')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Immagine richiesta');
      }
      if (!req.file.mimetype.startsWith('image/')) {
        throw new Error('Il file deve essere un\'immagine');
      }
      if (req.file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('L\'immagine non può essere più grande di 5MB');
      }
      return true;
    })
], userController.uploadProfileImage);

/**
 * @route   PUT /api/users/password
 * @desc    Cambia la password
 * @access  Private
 */
router.put('/password', [
  protect,
  check('currentPassword', 'La password attuale è obbligatoria')
    .exists(),
  
  check('newPassword', 'La nuova password deve avere almeno 8 caratteri')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('La password deve contenere almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale'),
  
  check('confirmPassword', 'Le password non coincidono')
    .custom((value, { req }) => value === req.body.newPassword)
], userController.changePassword);

/**
 * @route   GET /api/users/:id
 * @desc    Ottieni il profilo di un utente
 * @access  Private
 */
router.get('/:id', [
  protect,
  check('id', 'ID utente non valido').isMongoId()
], userController.getUserById);

/**
 * @route   GET /api/users/search
 * @desc    Cerca utenti
 * @access  Private
 */
router.get('/search', [
  protect,
  check('query', 'Query di ricerca non valida')
    .optional()
    .isString()
    .isLength({ min: 2, max: 50 }),
  
  check('language', 'Lingua non valida')
    .optional()
    .isString(),
  
  check('interest', 'Interesse non valido')
    .optional()
    .isString(),
  
  check('page', 'Numero di pagina non valido')
    .optional()
    .isInt({ min: 1 }),
  
  check('limit', 'Limite non valido')
    .optional()
    .isInt({ min: 1, max: 50 })
], userController.searchUsers);

/**
 * @route   POST /api/users/block/:id
 * @desc    Blocca un utente
 * @access  Private
 */
router.post('/block/:id', [
  protect,
  check('id', 'ID utente non valido').isMongoId()
], userController.blockUser);

/**
 * @route   POST /api/users/unblock/:id
 * @desc    Sblocca un utente
 * @access  Private
 */
router.post('/unblock/:id', [
  protect,
  check('id', 'ID utente non valido').isMongoId()
], userController.unblockUser);

/**
 * @route   GET /api/users/blocked
 * @desc    Ottieni la lista degli utenti bloccati
 * @access  Private
 */
router.get('/blocked', protect, userController.getBlockedUsers);

/**
 * @route   DELETE /api/users/me
 * @desc    Elimina il proprio account
 * @access  Private
 */
router.delete('/me', [
  protect,
  check('password', 'La password è obbligatoria per eliminare l\'account')
    .exists()
], userController.deleteAccount);

module.exports = router;