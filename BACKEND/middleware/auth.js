const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

/**
 * Middleware per proteggere le rotte
 * Verifica che il token JWT sia valido e che l'utente esista
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Verifica se il token è presente nell'header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Controlla se il token esiste
  if (!token) {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa risorsa', 401));
  }

  try {
  // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Aggiungi l'utente alla richiesta
  req.user = await User.findById(decoded.id);

  if (!req.user) {
      return next(new ErrorResponse('Utente non trovato', 404));
  }

  // Verifica se l'utente ha cambiato password dopo l'emissione del token
  if (req.user.passwordChangedAt) {
    const changedTimestamp = parseInt(
      req.user.passwordChangedAt.getTime() / 1000,
      10
    );
    if (decoded.iat < changedTimestamp) {
        return next(
          new ErrorResponse(
            'La password è stata cambiata. Effettua nuovamente l\'accesso',
            401
          )
        );
    }
  }

  // Verifica se l'utente è stato disattivato
  if (!req.user.isActive) {
      return next(
        new ErrorResponse(
          'Il tuo account è stato disattivato. Contatta l\'amministratore',
          401
        )
      );
  }

  req.user.passwordChangedAt = undefined;
  next();
  } catch (err) {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa route', 401));
  }
});

/**
 * Middleware per limitare l'accesso a determinati ruoli
 * @param {...String} roles - Ruoli autorizzati
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Ruolo ${req.user.role} non autorizzato ad accedere a questa risorsa`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Middleware per verificare se il profilo utente è completo
 * Alcune funzionalità richiedono un profilo completo
 */
exports.requireCompleteProfile = asyncHandler(async (req, res, next) => {
  // Verifica i campi obbligatori del profilo
  const requiredFields = ['nickname', 'bio', 'languages', 'interests'];
  const missingFields = requiredFields.filter(field => !req.user[field]);

  if (missingFields.length > 0) {
    return next(
      new ErrorResponse(
        `Per favore completa il tuo profilo. Campi mancanti: ${missingFields.join(', ')}`,
        403
      )
    );
  }

  // Verifica che ci sia almeno una lingua selezionata
  if (!req.user.languages || req.user.languages.length === 0) {
    return next(
      new ErrorResponse('Per favore seleziona almeno una lingua', 403)
    );
  }

  // Verifica che ci sia almeno un interesse
  if (!req.user.interests || req.user.interests.length === 0) {
    return next(
      new ErrorResponse('Per favore seleziona almeno un interesse', 403)
    );
  }

  next();
});

/**
 * Middleware per verificare se l'utente è verificato
 * Alcune funzionalità richiedono un account verificato
 */
exports.requireVerifiedAccount = asyncHandler(async (req, res, next) => {
  if (!req.user.verified) {
    return next(
      new ErrorResponse(
        'Per favore verifica il tuo account prima di accedere a questa funzionalità',
        403
      )
    );
  }
  next();
});

/**
 * Middleware per verificare se l'utente è l'host di una risorsa
 * @param {String} resourceId - ID della risorsa da verificare
 * @param {String} resourceType - Tipo di risorsa (es. 'meal', 'chat')
 */
exports.requireHost = (resourceId, resourceType) => {
  return asyncHandler(async (req, res, next) => {
    const resource = await require(`../models/${resourceType}`).findById(req.params[resourceId]);
    
    if (!resource) {
      return next(
        new ErrorResponse(`${resourceType} non trovato`, 404)
      );
    }

    if (resource.host.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `Non sei autorizzato a modificare questo ${resourceType}`,
          403
        )
      );
    }

    next();
  });
};