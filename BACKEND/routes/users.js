const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');
const { check } = require('express-validator');
const { upload, handleUploadError } = require('../middleware/upload');

/**
 * @route   GET /api/users
 * @desc    Ottieni tutti gli utenti (solo admin)
 * @access  Private/Admin
 */
router.get('/', [
  protect,
  admin,
  check('page', 'Numero pagina non valido').optional().isInt({ min: 1 }),
  check('limit', 'Limite non valido').optional().isInt({ min: 1, max: 50 }),
  check('search', 'Termine di ricerca non valido').optional().isString().isLength({ max: 100 }),
  check('role', 'Ruolo non valido').optional().isIn(['user', 'admin']),
  check('status', 'Stato non valido').optional().isIn(['active', 'blocked', 'inactive']),
  check('sortBy', 'Campo di ordinamento non valido').optional().isIn(['name', 'email', 'createdAt', 'lastLogin']),
  check('sortOrder', 'Ordine non valido').optional().isIn(['asc', 'desc'])
], userController.getUsers);

/**
 * @route   GET /api/users/me
 * @desc    Ottieni il profilo dell'utente corrente
 * @access  Private
 */
router.get('/me', protect, userController.getMe);



/**
 * @route   PUT /api/users/me/password
 * @desc    Aggiorna la password dell'utente corrente
 * @access  Private
 */
router.put('/me/password', [
  protect,
  check('currentPassword', 'Password attuale obbligatoria').not().isEmpty(),
  check('newPassword', 'Nuova password obbligatoria')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale')
], userController.changePassword);

/**
 * @route   PUT /api/users/me/avatar
 * @desc    Aggiorna l'avatar dell'utente corrente
 * @access  Private
 */
router.put('/me/avatar', [
  protect,
  upload.single('avatar'),
  handleUploadError
], userController.uploadProfileImage);

/**
 * @route   DELETE /api/users/me
 * @desc    Elimina l'account dell'utente corrente
 * @access  Private
 */
router.delete('/me', [
  protect,
  check('password', 'Password obbligatoria per eliminare l\'account').not().isEmpty()
], userController.deleteAccount);

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
 * @route   POST /api/users/:id/block
 * @desc    Blocca un utente
 * @access  Private
 */
router.post('/:id/block', [
  protect,
  check('id', 'ID utente non valido').isMongoId(),
  check('reason', 'Motivo del blocco obbligatorio').not().isEmpty()
], userController.blockUser);

/**
 * @route   DELETE /api/users/:id/block
 * @desc    Sblocca un utente
 * @access  Private
 */
router.delete('/:id/block', [
  protect,
  check('id', 'ID utente non valido').isMongoId()
], userController.unblockUser);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Cambia il ruolo di un utente (solo admin)
 * @access  Private/Admin
 */
router.put('/:id/role', [
  protect,
  admin,
  check('id', 'ID utente non valido').isMongoId(),
  check('role', 'Ruolo non valido').isIn(['user', 'admin'])
], userController.changeUserRole);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Cambia lo stato di un utente (solo admin)
 * @access  Private/Admin
 */
router.put('/:id/status', [
  protect,
  admin,
  check('id', 'ID utente non valido').isMongoId(),
  check('status', 'Stato non valido').isIn(['active', 'blocked', 'inactive']),
  check('reason', 'Motivo del cambio stato obbligatorio').not().isEmpty()
], userController.changeUserStatus);

module.exports = router;