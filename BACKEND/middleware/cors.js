const cors = require('cors');

// Lista degli origini permesse
const allowedOrigins = [
  'http://localhost:3000',    // Frontend sviluppo
  'http://localhost:3001',    // Frontend sviluppo alternativo
  'http://127.0.0.1:3000',   // Frontend sviluppo (IP)
  'http://127.0.0.1:3001'    // Frontend sviluppo alternativo (IP)
];

// Per quando andrai in produzione
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Configurazione CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Se l'origine della richiesta è nella nostra lista, permetti l'accesso.
    // '!origin' permette l'accesso da strumenti come Postman che non hanno un'origine.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Se non è nella lista, blocca la richiesta con un errore.
      callback(new Error('Questa origine non è permessa dalla policy CORS'));
    }
  },
  
  // Permette l'invio di cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  maxAge: 86400, // Cache delle opzioni preflight per 24 ore
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions)); // <-- Usa la nuova configurazione

// Logging per debug
if (process.env.NODE_ENV !== 'production') {
  console.log('CORS configurato per gli ambienti di sviluppo:', allowedOrigins);
}

module.exports = corsMiddleware; 