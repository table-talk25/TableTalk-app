// File: BACKEND/server.js (Versione Finale Stabile)

const path = require('path');
const fs = require('fs');
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
const mealStatusService = require('./services/mealStatusService');
const dailyReportSummaryJob = require('./jobs/dailyReportSummary');
const twilio = require('twilio');


// --- INIZIALIZZAZIONE FIREBASE ADMIN ---
const admin = require('firebase-admin');

try {
  // Prova a caricare il file di configurazione Firebase
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require('./firebase-service-account.json'); 
    
    // Controlla se è il file temporaneo
    if (serviceAccount.private_key_id === 'TEMP_KEY_ID_FOR_DEPLOY') {
      console.log('⚠️  File Firebase temporaneo rilevato');
      console.log('⚠️  Firebase Admin SDK non configurato. Le notifiche push non funzioneranno.');
      console.log('💡 Per abilitare le notifiche push, sostituisci con il file reale da Firebase Console');
      
      // Inizializza Firebase con configurazione vuota per evitare crash
      admin.initializeApp({
        projectId: 'tabletalk-social'
      });
      console.log('✅ Firebase Admin SDK inizializzato in modalità limitata (temporaneo)');
    } else {
      // File reale trovato
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK inizializzato correttamente');
    }
  } else {
    console.log('⚠️  File firebase-service-account.json non trovato');
    console.log('⚠️  Firebase Admin SDK non configurato. Le notifiche push non funzioneranno.');
    console.log('💡 Per abilitare le notifiche push, aggiungi il file firebase-service-account.json nella cartella BACKEND');
    
    // Inizializza Firebase con configurazione vuota per evitare crash
    admin.initializeApp({
      projectId: 'tabletalk-social'
    });
    console.log('✅ Firebase Admin SDK inizializzato in modalità limitata');
  }
} catch (error) {
  console.error('❌ Errore nell\'inizializzazione di Firebase Admin SDK:', error.message);
  console.log('⚠️  Firebase Admin SDK non configurato. Le notifiche push non funzioneranno.');
  console.log('💡 Per abilitare le notifiche push, aggiungi il file firebase-service-account.json nella cartella BACKEND');
  
  // Inizializza Firebase con configurazione vuota per evitare crash
  try {
    admin.initializeApp({
      projectId: 'tabletalk-social'
    });
    console.log('✅ Firebase Admin SDK inizializzato in modalità limitata (fallback)');
  } catch (fallbackError) {
    console.error('❌ Anche il fallback Firebase è fallito:', fallbackError.message);
    console.log('⚠️  L\'app continuerà a funzionare senza notifiche push');
  }
}

// Inizializza l'app Express e il server HTTP
const app = express();
const server = http.createServer(app);

// Connetti al DB
connectDB();

// Legge le origini permesse dalla variabile d'ambiente e le divide in un array
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

// Origini di default per app mobile (Capacitor) e sviluppo locale
const defaultMobileOrigins = [
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:3000'
];

// Costruisci la lista effettiva includendo sempre le origini mobile
const effectiveAllowedOrigins = Array.from(new Set([...(allowedOrigins || []), ...defaultMobileOrigins]));

// Debug delle variabili d'ambiente
console.log('🔧 [ENV] CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('🔧 [ENV] FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('🔧 [ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 [ENV] PORT:', process.env.PORT);

// Aggiungiamo un log per vedere quali origini vengono caricate all'avvio
console.log('🛡️ [CORS] Origini permesse caricate (ENV):', allowedOrigins);
console.log('🛡️ [CORS] Origini permesse effettive (ENV + default mobile):', effectiveAllowedOrigins);
console.log('🛡️ [CORS] Numero di origini effettive:', effectiveAllowedOrigins.length);

const corsOptions = {
  origin: (origin, callback) => {
    console.log('🌐 [CORS] Richiesta ricevuta da origin:', origin);
    console.log('🌐 [CORS] Tipo origin:', typeof origin);
    console.log('🌐 [CORS] Origin è undefined?', origin === undefined);
    console.log('🌐 [CORS] Origin è null?', origin === null);
    
    // Permetti richieste senza origin (Postman, mobile apps, ecc.)
    if (!origin) {
      console.log('✅ [CORS] Richiesta senza origin permessa');
      return callback(null, true);
    }
    
    // Controlla se l'origin è nella lista permessa (inclusi i default mobile)
    console.log('🔍 [CORS] Controllo origin nella lista...');
    console.log('🔍 [CORS] effectiveAllowedOrigins:', effectiveAllowedOrigins);
    console.log('🔍 [CORS] indexOf result:', effectiveAllowedOrigins.indexOf(origin));
    
    if (effectiveAllowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ [CORS] Origin permesso: ${origin}`);
      callback(null, true);
    } else {
      console.error(`❌ [CORS] ERRORE: Origine Rifiutata -> ${origin}`);
      console.error(`❌ [CORS] Origini permesse effettive:`, effectiveAllowedOrigins);
      console.error(`❌ [CORS] Lunghezza effectiveAllowedOrigins:`, effectiveAllowedOrigins.length);
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
console.log('🚀 [SERVER] Applicando middleware CORS...');
app.use(cors(corsOptions));

// Gestione esplicita delle richieste OPTIONS per il preflight
console.log('🚀 [SERVER] Configurando gestione OPTIONS...');
app.options('*', cors(corsOptions));

// Middleware per loggare tutte le richieste
app.use((req, res, next) => {
  console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
  console.log(`📥 [REQUEST] Origin: ${req.get('Origin')}`);
  console.log(`📥 [REQUEST] User-Agent: ${req.get('User-Agent')}`);
  console.log(`📥 [REQUEST] Headers:`, Object.keys(req.headers));
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Aumentiamo i limiti del body parser per supportare payload JSON più grandi (es. base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
app.use('/api/geolocation', require('./routes/geolocation'));
app.use('/api/notification-preferences', require('./routes/notificationPreferences'));
app.use('/api/interactive-notifications', require('./routes/interactiveNotifications'));
app.use('/api/summary-emails', require('./routes/summaryEmails'));

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

// 🕐 INIZIALIZZAZIONE SERVIZIO STATUS PASTI
mealStatusService.initializeStatusService()
  .then(result => {
    if (result.success) {
      console.log('✅ [SERVER] Servizio status pasti inizializzato:', result.message);
    } else {
      console.log('⚠️ [SERVER] Servizio status pasti inizializzato con errori:', result.error);
    }
  })
  .catch(error => {
    console.error('❌ [SERVER] Errore inizializzazione servizio status pasti:', error);
  });

// 📧 INIZIALIZZAZIONE JOB RIEPILOGO GIORNALIERO SEGNALAZIONI
dailyReportSummaryJob.start();
console.log('✅ [SERVER] Job riepilogo giornaliero segnalazioni avviato');

// 📍 INIZIALIZZAZIONE JOB NOTIFICHE GEOLOCALIZZATE
geolocationNotificationJob.start();
console.log('✅ [SERVER] Job notifiche geolocalizzate avviato');

// 🧹 INIZIALIZZAZIONE JOB PULIZIA TOKEN VERIFICA EMAIL
emailVerificationCleanupJob.start();
console.log('✅ [SERVER] Job pulizia token verifica email avviato');

// 📧 INIZIALIZZAZIONE JOB EMAIL DI RIEPILOGO
const summaryEmailJobs = require('./jobs/summaryEmailJobs');
summaryEmailJobs.start();
console.log('✅ [SERVER] Job email di riepilogo avviati');

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
  console.log(`🌍 [SERVER] HOST: ${HOST}`);
  console.log(`🔌 [SERVER] PORT: ${PORT}`);
  console.log(`🛡️ [SERVER] CORS configurato per:`, allowedOrigins);
  console.log(`📡 [SERVER] Server pronto per ricevere richieste!`);
});