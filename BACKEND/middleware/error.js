// File: BACKEND/middleware/error.js (Versione Finale e Corretta)

const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  // Creiamo una copia dell'errore su cui lavorare
  let error = { ...err };
  error.message = err.message;

  // Log per noi sviluppatori
  if (process.env.NODE_ENV === 'development') {
    console.log('--- GESTORE ERRORI ATTIVATO ---');
    console.error(err);
  }

  // === GESTIONE ERRORI SPECIFICI ===

  // 1. Errore di ID non valido (CastError di Mongoose)
  if (err.name === 'CastError') {
    const message = `La risorsa richiesta non è valida.`;
    error = new ErrorResponse(message, 404);
  }

  // 2. Errore di campo duplicato (es. email già esistente)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Un utente con questo ${field} esiste già. Per favore, usane un altro.`;
    error = new ErrorResponse(message, 400);
  }

  // 3. Errore di validazione di Mongoose (es. campo 'required' mancante)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const details = Object.values(err.errors).map(val => ({ path: val.path, msg: val.message }));
    error = new ErrorResponse(messages.join('. '), 400, details);
  }


  // === RISPOSTA FINALE AL FRONTEND ===

  // Prepariamo la risposta JSON.
  // Se l'errore originale (err) aveva una lista di 'details' (dal nostro ErrorResponse),
  // ci assicuriamo di includerla nella risposta finale.
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Errore Interno del Server',
    errors: err.details || [], // Usiamo err.details per preservare l'array originale
  });
};

module.exports = errorHandler;