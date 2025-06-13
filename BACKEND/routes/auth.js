const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Configurazione rate limiter per prevenire abusi
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 tentativi
  message: 'Troppi tentativi di login. Riprova tra 15 minuti.'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3, // 3 registrazioni all'ora
  message: 'Troppe registrazioni. Riprova tra un\'ora.'
});

/**
 * @route   POST /api/auth/register
 * @desc    Registra un nuovo utente
 * @access  Public
 */
router.post('/register', [
  registerLimiter,
  check('name', 'Nome obbligatorio').not().isEmpty(),
  check('email', 'Email non valida').isEmail(),
  check('password', 'Password obbligatoria')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale'),
  check('confirmPassword', 'Le password non coincidono')
    .custom((value, { req }) => value === req.body.password)
], authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login utente
 * @access  Public
 */
router.post('/login', [
  loginLimiter,
  check('email', 'Email non valida').isEmail(),
  check('password', 'Password obbligatoria').exists()
], authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout utente
 * @access  Private
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Richiedi reset password
 * @access  Public
 */
router.post('/forgot-password', [
  check('email', 'Email non valida').isEmail()
], authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password/:token', [
  check('password', 'Password obbligatoria')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale'),
  check('confirmPassword', 'Le password non coincidono')
    .custom((value, { req }) => value === req.body.password)
], authController.resetPassword);

/**
 * @route   POST /api/auth/verify-email/:token
 * @desc    Verifica email
 * @access  Public
 */
router.post('/verify-email/:token', authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Reinvia email di verifica
 * @access  Public
 */
router.post('/resend-verification', [
  check('email', 'Email non valida').isEmail()
], authController.resendVerification);

module.exports = router;