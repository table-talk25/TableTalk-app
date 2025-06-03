const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');

// Configurazione di multer per il caricamento delle immagini
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function(req, file, cb) {
    cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Puoi caricare solo file immagine'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
}).single('profileImage');

/**
 * @desc    Ottieni il profilo dell'utente corrente
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Aggiorna i dettagli del profilo utente
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    nickname: req.body.nickname,
    gender: req.body.gender,
    age: req.body.age,
    interests: req.body.interests,
    languages: req.body.languages,
    bio: req.body.bio,
    profileCompleted: true
  };

  // Rimuovi campi undefined
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Carica l'immagine del profilo
 * @route   POST /api/users/profile/picture
 * @access  Private
 */
exports.uploadProfileImage = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

  if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
  }

    try {
      const user = await User.findById(req.user.id);

      // Elimina la vecchia immagine se non è quella di default
      if (user.profileImage !== 'default-profile.jpg') {
        const oldImagePath = path.join(__dirname, '..', 'uploads', 'profiles', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Aggiorna l'immagine del profilo
      user.profileImage = req.file.filename;
      await user.save();

  res.status(200).json({
    success: true,
        data: {
          profileImage: user.profileImage
        }
  });
    } catch (err) {
      next(err);
    }
});
};

/**
 * @desc    Ottieni tutti gli utenti (solo admin)
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa risorsa', 403));
  }

  const users = await User.find();
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

/**
 * @desc    Ottieni un utente specifico tramite ID
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-email -role');

  if (!user) {
    return next(new ErrorResponse(`Utente non trovato con id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Cambia la password dell'utente
 * @route   PUT /api/users/password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Password attuale non valida', 401));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password aggiornata con successo'
  });
});

// Placeholder per ricerca utenti
exports.searchUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Ricerca utenti non ancora implementata.' });
});

// Placeholder per blocco utente
exports.blockUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Blocco utente non ancora implementato.' });
});

// Placeholder per sblocco utente
exports.unblockUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Sblocco utente non ancora implementato.' });
});

// Placeholder per ottenere la lista degli utenti bloccati
exports.getBlockedUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Lista utenti bloccati non ancora implementata.' });
});

// Placeholder per eliminare l'account
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Eliminazione account non ancora implementata.' });
});