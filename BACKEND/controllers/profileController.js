// File: /BACKEND/controllers/profileController.js

const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

/**
 * @desc    Ottieni il profilo dell'utente corrente
 * @route   GET /api/profile/me
 * @access  Private
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('Utente non trovato nel DB', 404));
  }
  
  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Aggiorna il profilo dell'utente corrente
 * @route   PUT /api/profile/me
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('Utente non trovato.', 404));
  }

  // Deleghiamo tutta la logica di aggiornamento al metodo del modello User
  const updatedUser = await user.updateProfile(req.body);

  // Il metodo del modello ha già salvato, quindi restituiamo la risposta
  res.status(200).json({
    success: true,
    message: 'Profilo aggiornato con successo',
    data: updatedUser, // Invia l'utente aggiornato dentro la chiave 'data'
  });
});

/**
 * @desc    Aggiorna la password dell'utente corrente
 * @route   PUT /api/profile/me/password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Errore di validazione', 400, errors.array()));
  }

  const { currentPassword, newPassword } = req.body;

  // Dobbiamo selezionare esplicitamente la password perché nello schema è 'select: false'
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

  // DELEGA il confronto della password al metodo del modello
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('La password attuale non è corretta', 401));
  }

  // Assegna la nuova password. Il middleware pre('save') nel modello si occuperà dell'hashing.
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password aggiornata con successo',
  });
});

/**
 * @desc    Aggiorna l'avatar dell'utente corrente
 * @route   PUT /api/profile/me/avatar
 * @access  Private
 */
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Per favore, carica un file immagine.', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id, 
    { profileImage: req.file.filename },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Immagine del profilo aggiornata con successo.',
    data: user, // <-- L'utente aggiornato è qui
  });
});

/**
 * @desc    Elimina l'account dell'utente corrente
 * @route   DELETE /api/profile/me
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Errore di validazione', 400, errors.array()));
  }
  
  const { password } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

  // DELEGA il confronto della password per la conferma
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Password non corretta. Impossibile eliminare l\'account.', 401));
  }

  // Elimina l'immagine del profilo se esiste
  if (user.profileImage && user.profileImage !== 'default.jpg') {
    const imagePath = path.join(__dirname, '../uploads', user.profileImage);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error('Errore nell\'eliminazione dell\'immagine:', err);
    }
  }

  // Qui potresti aggiungere logica aggiuntiva, es. cancellare i pasti creati dall'utente, etc.
  
  await user.deleteOne(); // Metodo corretto per eliminare un'istanza di documento

  res.status(200).json({
    success: true,
    message: 'Il tuo account è stato eliminato con successo.',
  });
});

// @desc    Carica l'immagine del profilo
// @route   POST /api/profile/me/image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file caricato'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Se esiste già un'immagine, eliminala
    if (user.profileImage && user.profileImage !== 'default.jpg') {
      const oldImagePath = path.join(__dirname, '../uploads', user.profileImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Errore nell\'eliminazione della vecchia immagine:', err);
      }
    }

    // Aggiorna il percorso dell'immagine nel database
    user.profileImage = req.file.filename;
    await user.save();

    res.json({
      success: true,
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Elimina l'immagine del profilo
// @route   DELETE /api/profile/me/image
// @access  Private
exports.deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.profileImage && user.profileImage !== 'default.jpg') {
      const imagePath = path.join(__dirname, '../uploads', user.profileImage);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Errore nell\'eliminazione dell\'immagine:', err);
      }
    }

    user.profileImage = 'default.jpg';
    await user.save();

    res.json({
      success: true,
      message: 'Immagine del profilo eliminata'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};