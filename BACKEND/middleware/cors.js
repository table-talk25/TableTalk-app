const cors = require('cors');

// Lista degli origini permesse
const allowedOrigins = [
  'http://localhost:3000',    // Frontend sviluppo
  'http://localhost:3001',    // Frontend sviluppo alternativo
  'http://127.0.0.1:3000',   // Frontend sviluppo (IP)
  'http://127.0.0.1:3001'    // Frontend sviluppo alternativo (IP)
];

// Configurazione CORS
const corsOptions = {
  origin: function (origin, callback) {
    // In produzione, verifica l'origine
    if (process.env.NODE_ENV === 'production') {
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In sviluppo, permette tutte le origini locali
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true, // Permette l'invio di cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  maxAge: 86400, // Cache delle opzioni preflight per 24 ore
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware CORS
const corsMiddleware = cors(corsOptions);

// Logging per debug
if (process.env.NODE_ENV !== 'production') {
  console.log('CORS configurato per gli ambienti di sviluppo:', allowedOrigins);
}

module.exports = corsMiddleware; 