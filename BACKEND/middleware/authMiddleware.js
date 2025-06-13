const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Middleware per proteggere le route che richiedono autenticazione
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
    
    if (!token) {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa risorsa', 401));
    }
    
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return next(new ErrorResponse('Utente non trovato', 401));
    }
    
    // Verifica se l'utente è attivo
    if (!req.user.isActive) {
      return next(new ErrorResponse('Account disattivato', 401));
    }
    
    next();
  } catch (err) {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa risorsa', 401));
  }
};

/**
 * Middleware per verificare i ruoli dell'utente
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse('Non autorizzato ad accedere a questa risorsa', 403));
    }
    next();
  };
};

/**
 * Middleware per verificare se l'utente è il proprietario della risorsa
 */
exports.isOwner = (model) => async (req, res, next) => {
  try {
    const resource = await model.findById(req.params.id);
    
    if (!resource) {
      return next(new ErrorResponse('Risorsa non trovata', 404));
    }
    
    if (resource.user.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Non hai i permessi necessari per questa operazione', 403));
    }
    
    req.resource = resource;
    next();
  } catch (error) {
    console.error('Errore durante la verifica del proprietario:', error);
    next(new ErrorResponse('Errore durante la verifica dei permessi', 500));
  }
};

exports.requireCompleteProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('Utente non trovato', 404));
    }

    if (!user.isProfileComplete) {
      return next(new ErrorResponse('Profilo incompleto', 403));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Errore del server', 500));
  }
};

exports.requireVerifiedAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('Utente non trovato', 404));
    }

    if (!user.isEmailVerified) {
      return next(new ErrorResponse('Account non verificato', 403));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Errore del server', 500));
  }
};

exports.requireHost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('Utente non trovato', 404));
    }

    if (!user.isHost) {
      return next(new ErrorResponse('Non sei un host', 403));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Errore del server', 500));
  }
}; 