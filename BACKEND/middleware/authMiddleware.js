const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware per proteggere le route che richiedono autenticazione
 */
exports.protect = async (req, res, next) => {
  try {
    // Ottieni il token dall'header Authorization
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Non autorizzato, token non fornito' 
      });
    }
    
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ottieni i dati dell'utente dal database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Non autorizzato, utente non trovato' 
      });
    }
    
    // Verifica se l'utente è attivo
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Account disattivato' 
      });
    }
    
    // Aggiungi l'utente alla richiesta
    req.user = user;
    next();
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token scaduto' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token non valido' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Non autorizzato, token non valido' 
    });
  }
};

/**
 * Middleware per verificare i ruoli dell'utente
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Non hai i permessi necessari per questa operazione' 
      });
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
      return res.status(404).json({ 
        success: false,
        message: 'Risorsa non trovata' 
      });
    }
    
    if (resource.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Non hai i permessi necessari per questa operazione' 
      });
    }
    
    req.resource = resource;
    next();
  } catch (error) {
    console.error('Errore durante la verifica del proprietario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Errore durante la verifica dei permessi' 
    });
  }
}; 