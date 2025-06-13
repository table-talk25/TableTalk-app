require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const ErrorResponse = require('./utils/errorResponse'); 
const { serveStaticFiles, ensureUploadsDirectory } = require('./middleware/staticFilesMiddleware'); // <-- 1. IMPORTA IL MIDDLEWARE

// Inizializza l'app Express
const app = express();

// Connetti al database
connectDB();

// Creiamo una "lista degli invitati" per lo sviluppo
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', // A volte Create React App usa questa porta
  'http://localhost:5001', // La porta del backend
  'http://localhost:5002', // La porta che stai usando ora
  'http://localhost:5003', // Aggiungiamone un'altra per sicurezza
  process.env.FRONTEND_URL // Questa servirà per la produzione
];

const corsOptions = {
  origin: function (origin, callback) {
    // Se l'origine della richiesta è nella nostra lista (o se la richiesta non ha un'origine, es. Postman), permetti l'accesso.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Questa origine non è permessa dalla policy CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },

    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "blob:", ...allowedOrigins], 
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
if (process.env.NODE_ENV === 'development') {
  app.use(require('morgan')('dev')); // Logger solo in sviluppo
}

// 2. Middleware per File Statici
app.use(ensureUploadsDirectory); // Crea la cartella uploads se non esiste
app.use('/uploads', serveStaticFiles);


// --- SEZIONE ROTTE API ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/users', require('./routes/users'));
app.use('/api/meals', require('./routes/meal'));
app.use('/api/chat', require('./routes/chat'));

// Gestione route non trovate
app.use((req, res, next) => {
  next(new ErrorResponse('Route non trovata', 404));
});

// Gestione errori
app.use(errorHandler);

// Avvio del server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server in esecuzione in modalità ${process.env.NODE_ENV} sulla porta ${PORT}`);
});

// Gestione degli errori di promise non gestite (es. fallimento connessione DB)
process.on('unhandledRejection', (err, promise) => {
  console.error(`Errore non gestito: ${err.message}`);
  server.close(() => process.exit(1));
});