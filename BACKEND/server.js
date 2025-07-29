// File: BACKEND/server.js (Versione Finale Stabile)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const auth = require('./middleware/auth'); 
const cron = require('node-cron');
const Meal = require('./models/Meal');
const notificationService = require('./services/notificationService');
const pushNotificationService = require('./services/pushNotificationService');
const startMealStatusUpdater = require('./jobs/mealStatusUpdater');
const twilio = require('twilio');


// --- INIZIALIZZAZIONE FIREBASE ADMIN ---
const admin = require('firebase-admin');

try {
  // Assicurati che il percorso del file json sia corretto
  const serviceAccount = require('./firebase-service-account.json'); 
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin SDK inizializzato correttamente');
} catch (error) {
  console.error('❌ Errore nell\'inizializzazione di Firebase Admin SDK:', error.message);
  console.log('⚠️  Firebase Admin SDK non configurato. Le notifiche push non funzioneranno.');
  console.log('Per abilitare le notifiche push, aggiungi il file firebase-service-account.json nella cartella BACKEND');
}

// Inizializza l'app Express e il server HTTP
const app = express();
const server = http.createServer(app);

// Connetti al DB
connectDB();

// Legge le origini permesse dalla variabile d'ambiente e le divide in un array
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

// Debug delle variabili d'ambiente
console.log('[ENV] CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('[ENV] FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);

// Aggiungiamo un log per vedere quali origini vengono caricate all'avvio
console.log('[CORS] Origini permesse caricate:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Permetti richieste senza origin (Postman, mobile apps, ecc.)
    if (!origin) {
      console.log('[CORS] Richiesta senza origin permessa');
      return callback(null, true);
    }
    
    // Controlla se l'origin è nella lista permessa
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`[CORS] Origin permesso: ${origin}`);
      callback(null, true);
    } else {
      console.error(`[CORS] ERRORE: Origine Rifiutata -> ${origin}`);
      console.error(`[CORS] Origini permesse:`, allowedOrigins);
      callback(new Error('Origine non permessa dalla policy CORS'));
    }
  },
  // Opzioni essenziali per gestire il preflight
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware essenziali
app.use(cors(corsOptions));

// Gestione esplicita delle richieste OPTIONS per il preflight
app.options('*', cors(corsOptions));

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  console.log(`Richiesta ricevuta: ${req.method} ${req.originalUrl}`);
  next();
});

// Rotte per i file statici
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotte API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/meals', require('./routes/meal'));
app.use('/api/chats', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/join-requests', require('./routes/joinRequests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/video', require('./routes/videoCall'));

// Importa Twilio per la generazione del token video
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// Endpoint per ottenere il token Twilio Video
app.get('/api/video/token', auth.protect, (req, res) => { 
    const { room } = req.query;
  // Puoi usare l'utente loggato, oppure un nome generico
  const identity = req.user ? req.user.nickname : 'ospite';

  // Crea il token
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  );
  token.identity = identity;

  // Aggiungi il permesso per la stanza video
  const videoGrant = new VideoGrant({ room });
  token.addGrant(videoGrant);

  // Restituisci il token al frontend
  res.json({ token: token.toJwt() });
});

// --- CRON JOB CON LE TUE REGOLE SEMPLICI ---
cron.schedule('* * * * *', async () => {
  const now = new Date();
  console.log(`[Cron Job] Esecuzione alle: ${now.toISOString()}`);
  try {
    // Regola 1: Attiva videochiamate 10 minuti prima dell'evento
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    
        // Trova i pasti che devono essere attivati
        const mealsToActivate = await Meal.find({
          date: { $lte: tenMinutesFromNow },
          status: 'upcoming',
          videoCallStatus: 'pending'
        }).populate('participants', 'fcmTokens');

        if (mealsToActivate.length > 0) {
          console.log(`[Cron Job] Attivazione di ${mealsToActivate.length} videochiamate.`);
          
          for (const meal of mealsToActivate) {
            meal.videoCallStatus = 'active';
            await meal.save();
    
            // Invia notifica a tutti i partecipanti
        const allParticipantTokens = meal.participants
        .flatMap(p => p.fcmTokens)
        .filter(token => token);
    
        const uniqueTokens = [...new Set(allParticipantTokens)];

            if (uniqueTokens.length > 0) {
              console.log(`[Cron Job] Invio notifiche a ${uniqueTokens.length} token per il pasto "${meal.title}"`);


          pushNotificationService.sendPushNotification(
            uniqueTokens,
            'La videochiamata sta per iniziare!',
            `Unisciti ora al pasto "${meal.title}".`,
            { mealId: meal._id.toString() } 
              );
            }
          }
        }

    // Regola 2: Concludi pasti "vuoti" dopo 4 ore dall'inizio
    const fourHoursAgoHourAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    await Meal.updateMany(
      { date: { $lt: fourHoursAgoHourAgo }, status: 'upcoming', participantsCount: { $lte: 1 } },
      { $set: { status: 'completed' } } // Imposta a 'completed'
    );

  } catch (error) {
    console.error('[Cron Job] ❌ Errore:', error);
  }
});

// Gestore errori (deve essere l'ultimo middleware)
app.use(errorHandler);

startMealStatusUpdater();

// Avvio del server
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0'; // Ascolta su tutte le interfacce per la compatibilità mobile

// Inizializza Socket.IO e il notificationService
const { initializeSocket, connectedUsers } = require('./socket');
initializeSocket(server);

// Inizializza il notificationService dopo che il server è stato creato
notificationService.initialize(connectedUsers);

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server TableTalk in esecuzione su http://localhost:${PORT}`);
});