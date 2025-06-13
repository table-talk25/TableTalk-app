// File: BACKEND/middleware/error.js (Versione Finale)
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Errore Interno del Server',
    errors: err.details || []
  };

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  if (err.name === 'CastError') {
    error.message = `ID risorsa non valido.`;
    error.statusCode = 404;
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `Un account con questo ${field} esiste già. Prova ad accedere.`;
    error.statusCode = 400;
    error.errors = [];
  }

  if (err.name === 'ValidationError') {
    error.message = 'Uno o più campi non sono validi.';
    error.statusCode = 400;
    error.errors = Object.values(err.errors).map(e => ({ path: e.path, msg: e.message }));
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors
  });
};

module.exports = errorHandler;