// File: /BACKEND/middleware/auth.js (Versione Definitiva e Pulita)

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

/**
 * @desc    Middleware per proteggere le rotte. Verifica il token e attacca l'utente a req.user
 */
exports.protect = asyncHandler(async (req, res, next) => {
  console.log(`\n--- [PROTECT] Eseguo il middleware per la rotta: ${req.method} ${req.path} ---`);
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('[PROTECT] ✅ Token trovato nell\'header.');
  }

  if (!token) {
    console.log('[PROTECT] ❌ ERRORE: Token NON trovato.');
    return next(new ErrorResponse('Non autorizzato. Token mancante.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[PROTECT] ✅ Token decodificato. ID Utente:', decoded.id);

    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log(`[PROTECT] ❌ ERRORE: Utente non trovato nel DB con l'ID: ${decoded.id}`);
      return next(new ErrorResponse('Utente associato a questo token non più esistente.', 401));
    }

    console.log(`[PROTECT] ✅ Utente trovato: ${req.user.email}. Passo al controller.`);
    next();

  } catch (err) {
    console.error('[PROTECT] ❌ ERRORE: Token non valido o scaduto.', err.message);
    return next(new ErrorResponse('Token non valido o scaduto.', 401));
  }
});

/**
 * @desc    Middleware per autorizzare solo specifici ruoli
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) { // Aggiunto controllo di sicurezza
        return next(new ErrorResponse('Utente non trovato, impossibile verificare il ruolo.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Ruolo '${req.user.role}' non autorizzato ad accedere a questa risorsa`, 403));
    }
    next();
  };
};

/**
 * @desc    Middleware per autorizzare solo gli admin. 
 * È una scorciatoia per authorize('admin').
 */
exports.admin = exports.authorize('admin');


// NOTA: Le altre funzioni middleware (requireCompleteProfile, etc.) sono corrette
// ma assicurati che non siano duplicate e che usino `req.user` in modo sicuro.