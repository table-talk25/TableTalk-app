// File: /BACKEND/controllers/profileController.js (Versione Definitiva Completa)

const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises; 
const Meal = require('../models/Meal');


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
 * @desc    Ottenere il profilo pubblico di un utente tramite ID
 * @route   GET /api/profile/public/:userId
 * @access  Public
 */
exports.getPublicProfile = asyncHandler(async (req, res, next) => {
  const publicFields = 'nickname profileImage bio gender interests languages preferredCuisine location createdMeals age mealsCount createdAt settings';

  const userDoc = await User.findById(req.params.userId)
    .select(publicFields)
    .populate({ path: 'createdMeals', select: 'title date' })
    .populate({ path: 'joinedMeals', select: 'title date' })
    .lean();

  if (!userDoc) {
    console.log('[getPublicProfile] ❌ ERRORE: Utente non trovato nel DB.');
    return next(new ErrorResponse(`Utente non trovato`, 404));
  }
  console.log('[getPublicProfile] ✅ Utente trovato. Inizio a processare i suoi dati...');

  // Pulizia dei pasti "fantasma" (cancellati)
  if (userDoc.createdMeals) {
    userDoc.createdMeals = userDoc.createdMeals.filter(meal => meal !== null && meal.date);
  }
  if (userDoc.joinedMeals) {
    userDoc.joinedMeals = userDoc.joinedMeals.filter(meal => meal !== null && meal.date);
  }

  const user = userDoc;

  // Logica della privacy
  if (user.settings?.privacy && !user.settings.privacy.showAge) user.age = null;
  if (user.settings?.privacy && !user.settings.privacy.showLocation) user.location = '';
  delete user.settings;

  console.log('[getPublicProfile] ✅ Dati pronti per essere inviati al frontend.');
  res.status(200).json({ success: true, data: user });
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

  const updatedUser = await user.updateProfile(req.body);

  res.status(200).json({
    success: true,
    message: 'Profilo aggiornato con successo',
    data: updatedUser,
  });
});

/**
 * @desc    Aggiorna la password dell'utente corrente
 * @route   PUT /api/profile/me/password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('La password attuale non è corretta', 401));
  }

  user.password = req.body.newPassword;
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

 const user = await User.findById(req.user.id);
 if (!user) {
   return next(new ErrorResponse('Utente non trovato.', 404));
 }

 const defaultImagePath = 'uploads/profile-images/default-avatar.jpg';
 if (user.profileImage && user.profileImage !== defaultImagePath) {
   try {
     await fs.unlink(path.resolve(user.profileImage));
   } catch (err) {
     console.error(`Errore nell'eliminazione del vecchio file ${user.profileImage}:`, err.message);
   }
 }

 user.profileImage = req.file.path;
 await user.save();

 res.status(200).json({
   success: true,
   message: 'Immagine del profilo aggiornata con successo.',
   data: user, 
 });
});

/**
 * @desc    Elimina l'immagine del profilo
 * @route   DELETE /api/profile/me/avatar
 * @access  Private
 */
exports.deleteProfileImage = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) { 
    return next(new ErrorResponse('Utente non trovato', 404)); 
  }
  
  if (user.profileImage && user.profileImage !== 'uploads/profile-images/default-avatar.jpg') {
    try {
      await fs.unlink(path.resolve(user.profileImage));
    } catch (err) {
      console.error("Errore durante l'eliminazione del file fisico, potrebbe non esistere:", err);
    }
  }

  user.profileImage = 'uploads/profile-images/default-avatar.jpg';
  await user.save();
  
  res.status(200).json({ 
    success: true, 
    message: 'Immagine del profilo eliminata', 
    data: user 
  });
});

/**
 * @desc    Elimina l'account dell'utente corrente
 * @route   DELETE /api/profile/me
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Password non corretta. Impossibile eliminare l\'account.', 401));
  }
  
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Il tuo account è stato eliminato con successo.',
  });
});

/**
 * @desc    Aggiunge un token FCM al profilo dell'utente
 * @route   POST /api/profile/me/fcm-token
 * @access  Private
 */
exports.addFcmToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new ErrorResponse('Token non fornito.', 400));
  }

  // Usiamo $addToSet per evitare di aggiungere token duplicati
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { fcmTokens: token }
  });

  res.status(200).json({
    success: true,
    message: 'Token per le notifiche salvato con successo.'
  });
});