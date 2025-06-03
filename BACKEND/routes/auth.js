const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// Route pubbliche
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Route protette
router.get('/me', protect, authController.getMe);
router.put('/update-password', protect, authController.updatePassword);
router.put('/update-profile', protect, authController.updateProfile);
router.delete('/delete-account', protect, authController.deleteAccount);

module.exports = router;