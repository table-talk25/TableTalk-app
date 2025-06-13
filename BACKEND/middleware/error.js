// File: BACKEND/middleware/error.js (Versione Finale con Gestione Duplicati)

const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (process.env.NODE_ENV === 'development') {
    console.log('--- GESTORE ERRORI ATTIVATO ---');
    console.error(err);
  }

  // --- GESTIONE ERRORI SPECIFICI ---

  // Errore Mongoose - ID non valido (es. /api/meals/123)
  if (err.name === 'CastError') {
    error.message = `La risorsa richiesta non è valida.`;
    error.statusCode = 404;
  }

  // --- LA NUOVA REGOLA FONDAMENTALE ---
  // Errore di campo duplicato (es. email o nickname già esistente)
  if (err.code === 11000) {
    // Prende il nome del campo che ha causato l'errore (es. 'email')
    const field = Object.keys(err.keyValue)[0]; 
    const message = `Un account con questo ${field} esiste già. Prova ad accedere.`;
    error = new ErrorResponse(message, 400); // Crea un errore 400 con il messaggio specifico
  }

  // Errore di validazione (es. campo 'required' mancante o password non valida)
  if (err.name === 'ValidationError' || (err.details && err.details.length > 0)) {
    // Unisce i messaggi di errore specifici dei campi
    const messages = err.details ? err.details.map(e => e.msg) : Object.values(err.errors).map(e => e.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // Risposta finale standardizzata al frontend
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Errore Interno del Server',
    errors: err.details || [],
  });
};

module.exports = errorHandler;