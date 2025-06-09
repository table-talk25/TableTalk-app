const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { registerValidation, loginValidation } = require('../controllers/authController'); 

// Configurazione di multer per il caricamento delle immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo le immagini sono permesse!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Route pubbliche
router.post('/register', registerValidation, authController.register); 
router.post('/login', loginValidation, authController.login); 
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Route protette
router.get('/me', protect, authController.getMe);
router.put('/update-password', protect, authController.updatePassword);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/profile/image', protect, upload.single('profileImage'), authController.updateProfileImage);
router.delete('/delete-account', protect, authController.deleteAccount);

module.exports = router;