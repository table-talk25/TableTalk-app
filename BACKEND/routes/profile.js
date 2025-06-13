// File: /BACKEND/routes/profile.js (Versione Corretta e Sicura)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Il nostro guardiano
const { upload, handleUploadError } = require('../middleware/upload'); // Importa il nuovo middleware
const {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
  uploadProfileImage,
  deleteProfileImage,
  updateAvatar
} = require('../controllers/profileController');

/**
 * @route   GET /api/profile/me
 * @desc    Ottieni il profilo dell'utente corrente
 * @access  Private
 */
router.get('/me', protect, getProfile); // <-- CORRETTO: Aggiunto 'protect'

/**
 * @route   PUT /api/profile/me
 * @desc    Aggiorna il profilo dell'utente corrente
 * @access  Private
 */
router.put('/me', protect, updateProfile); // <-- CORRETTO: Aggiunto 'protect'

/**
 * @route   PUT /api/profile/me/password
 * @desc    Aggiorna la password dell'utente corrente
 * @access  Private
 */
// CORRETTO: Percorso corretto e aggiunto 'protect'
router.put('/me/password', protect, updatePassword); 

/**
 * @route   POST /api/profile/me/image
 * @desc    Aggiorna l'immagine del profilo dell'utente corrente
 * @access  Private
 */
router.post(
  '/me/image',
  protect,
  upload.single('profileImage'),
  handleUploadError,
  uploadProfileImage
);

router.put(
  '/me/avatar',
  protect,
  upload.single('avatar'),
  handleUploadError,
  updateAvatar
);

/**
 * @route   DELETE /api/profile/me/image
 * @desc    Elimina l'immagine del profilo dell'utente corrente
 * @access  Private
 */
router.delete('/me/image', protect, deleteProfileImage);

/**
 * @route   DELETE /api/profile/me
 * @desc    Elimina l'account dell'utente corrente
 * @access  Private
 */
router.delete('/me', protect, deleteAccount);

module.exports = router;