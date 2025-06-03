/**
 * Middleware per la gestione centralizzata degli errori
 * @param {Object} err - Oggetto errore
 * @param {Object} req - Richiesta Express
 * @param {Object} res - Risposta Express
 * @param {Function} next - Funzione next di Express
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log dell'errore per il debug
  console.error('Errore:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : 'non autenticato'
  });

  // Errore di dati duplicati in MongoDB (codice 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" è già registrato. Scegli un altro valore.`;
    error = new Error(message);
    error.statusCode = 400;
  }

  // Errori di validazione Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // Errori di cast Mongoose (ad es. ObjectID non valido)
  if (err.name === 'CastError') {
    const message = `Risorsa ${err.path} non valida: ${err.value}`;
    error = new Error(message);
    error.statusCode = 400;
  }

  // Errori JWT
  if (err.name === 'JsonWebTokenError') {
    error = new Error('Token non valido. Effettua il login.');
    error.statusCode = 401;
  }

  // Token JWT scaduto
  if (err.name === 'TokenExpiredError') {
    error = new Error('Sessione scaduta. Effettua nuovamente il login.');
    error.statusCode = 401;
  }

  // Errore di limite di dimensione del file
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new Error('Il file caricato supera la dimensione massima consentita');
      error.statusCode = 400;
    } else {
      error = new Error('Errore durante il caricamento del file');
      error.statusCode = 400;
    }
  }

  // Errore di tipo di file non supportato
  if (err.name === 'UnsupportedMediaTypeError') {
    error = new Error('Tipo di file non supportato');
    error.statusCode = 415;
  }

  // Errore di rate limiting
  if (err.name === 'RateLimitExceeded') {
    error = new Error('Troppe richieste. Riprova più tardi.');
    error.statusCode = 429;
  }

  // Errore di timeout
  if (err.name === 'TimeoutError') {
    error = new Error('La richiesta ha impiegato troppo tempo. Riprova.');
    error.statusCode = 408;
  }

  // Errore di connessione al database
  if (err.name === 'MongoServerError') {
    error = new Error('Errore di connessione al database. Riprova più tardi.');
    error.statusCode = 503;
  }

  // Errore di validazione dei dati
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = new Error(messages.join(', '));
    error.statusCode = 400;
  }

  // Errore di autorizzazione
  if (err.name === 'AuthorizationError') {
    error = new Error('Non hai i permessi necessari per questa azione');
    error.statusCode = 403;
  }

  // Errore di risorsa non trovata
  if (err.name === 'NotFoundError') {
    error = new Error('La risorsa richiesta non è stata trovata');
    error.statusCode = 404;
  }

  // Errore di conflitto
  if (err.name === 'ConflictError') {
    error = new Error('Si è verificato un conflitto con lo stato attuale della risorsa');
    error.statusCode = 409;
  }

  // Errore di validazione dei parametri
  if (err.name === 'ParameterValidationError') {
    error = new Error('Parametri non validi: ' + err.message);
    error.statusCode = 400;
  }

  // Restituisci la risposta di errore
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
    message: error.message || 'Errore interno del server',
      code: error.statusCode || 500,
      type: err.name || 'ServerError',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    },
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;