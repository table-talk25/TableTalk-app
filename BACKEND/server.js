const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketService = require('./socket');
const path = require('path');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const winston = require('winston');
const twilio = require('twilio');
const corsMiddleware = require('./middleware/cors');

// Carica variabili d'ambiente
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Se non trova il file .env nella directory corrente, prova nella directory parent
if (!process.env.MONGO_URI) {
  const parentEnvPath = path.resolve(__dirname, '../.env');
  dotenv.config({ path: parentEnvPath });
}

// Log dettagliato delle variabili d'ambiente
console.log('Variabili d\'ambiente caricate:');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Configurazione logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Log delle variabili d'ambiente
logger.info('Variabili d\'ambiente caricate:', {
  mongoUri: process.env.MONGO_URI ? 'Presente' : 'Non presente',
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV
});

// Inizializza l'app Express
const app = express();

// Imposta la porta
const PORT = process.env.PORT || 5001;

// Configurazione Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? 
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : 
  null;

// Middleware di sicurezza
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Configurazione CORS
app.use(corsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100 // limite di 100 richieste per finestra
});
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Servi i file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Carica le rotte API
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const mealRoutes = require('./routes/meal');
const chatRoutes = require('./routes/chat');
const videoCallRoutes = require('./routes/videoCall');

// Monta le rotte
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/video', videoCallRoutes);

// Endpoint di health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Servi i file statici del frontend in produzione
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../FRONTEND/client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/client/build', 'index.html'));
  });
}

// Middleware per la gestione degli errori
app.use(errorHandler);

// Gestione degli errori 404
app.use((req, res, next) => {
  logger.warn(`404 - Endpoint non trovato: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint non trovato'
  });
});

// Gestione globale degli errori
app.use((err, req, res, next) => {
  logger.error('Errore del server:', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Errore interno del server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Creazione del server HTTP
const server = http.createServer(app);

// Integrazione Socket.io
socketService(server);

// Configurazione del debug di Mongoose
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

// Connessione al database e avvio del server
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('🔌 Connessione al database MongoDB stabilita');
    console.log('MongoDB connesso a:', process.env.MONGO_URI);
    
    // Avvia il server
    server.listen(PORT, () => {
      logger.info(`🚀 Server avviato in modalità ${process.env.NODE_ENV} sulla porta ${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Errore di connessione al database:', err);
    console.error('Dettagli errore MongoDB:', {
      name: err.name,
      code: err.code,
      message: err.message,
      uri: process.env.MONGO_URI
    });
    process.exit(1);
  }
};

connectDB();

// Gestione della chiusura
process.on('unhandledRejection', (err) => {
  logger.error('Errore non gestito:', err);
  console.error('Errore non gestito:', err);
  server.close(() => process.exit(1));
});

// Gestione SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM ricevuto. Chiusura graceful...');
  server.close(() => {
    logger.info('Processo terminato');
  });
});