// File: BACKEND/controllers/videoCallController.js

const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const Meal = require('../models/Meal');
const twilio = require('twilio');
const VIDEO_CALL_CONFIG = require('../config/videoCallConfig');

// Inizializza il client Twilio
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * @desc    Genera un token di accesso per una videochiamata Twilio
 * @route   POST /api/video/meals/:mealId/token
 * @access  Private
 */
exports.generateVideoToken = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;
  const userId = req.user.id;
  const identity = req.user.nickname || req.user.id; 
  
  if (VIDEO_CALL_CONFIG.LOGGING.ENABLED) {
      console.log(`${VIDEO_CALL_CONFIG.LOGGING.LEVELS.INFO} ${VIDEO_CALL_CONFIG.LOGGING.PREFIX} Ricevuta richiesta per pasto ${mealId} da utente ${identity}`);
  }

  const meal = await Meal.findById(mealId);
  if (!meal) {
      return next(new ErrorResponse(
          VIDEO_CALL_CONFIG.MESSAGES.MEAL_NOT_FOUND.replace('{{mealId}}', mealId), 
          404
      ));
  }

  // 1. Controllo tipo pasto: deve essere virtuale
  if (meal.mealType !== 'virtual') {
      return next(new ErrorResponse(VIDEO_CALL_CONFIG.MESSAGES.NOT_VIRTUAL_MEAL, 400));
  }

  // 2. Controllo di autorizzazione: l'utente è un partecipante?
  if (!meal.participants.some(p => p.equals(req.user._id))) {
    return next(new ErrorResponse(VIDEO_CALL_CONFIG.MESSAGES.NOT_AUTHORIZED, 403));
  }

  // 3. Controllo stato: la videochiamata è attiva?
  if (meal.videoCallStatus !== 'active') {
    const message = meal.videoCallStatus === 'ended' 
        ? VIDEO_CALL_CONFIG.MESSAGES.CALL_ENDED
        : VIDEO_CALL_CONFIG.MESSAGES.CALL_NOT_AVAILABLE;
    return next(new ErrorResponse(message, 403));
  }

  // --- NUOVA LOGICA DI CONTROLLO TEMPORALE ---
  const now = new Date();
  const mealStartTime = new Date(meal.startTime);
  const minutesBefore = VIDEO_CALL_CONFIG.TIMING.MINUTES_BEFORE_START;
  const timeBeforeStart = new Date(mealStartTime.getTime() - minutesBefore * 60 * 1000);

  if (now < timeBeforeStart) {
      return next(
          new ErrorResponse(
              VIDEO_CALL_CONFIG.MESSAGES.TOO_EARLY.replace('{{minutes}}', minutesBefore), 
              403
          )
      );
  }
  // --- FINE NUOVA LOGICA ---
  
  // 4. Generazione del token se tutti i controlli passano
  const roomName = meal._id.toString(); // Usiamo l'ID del pasto come nome della stanza

  // Crea un token di accesso
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity: identity }
  );

  // Concedi l'accesso alla stanza video
  const videoGrant = new VideoGrant({
    room: roomName,
  });
  token.addGrant(videoGrant);

  // Log del token generato con successo
  if (VIDEO_CALL_CONFIG.LOGGING.ENABLED) {
      const logMessage = VIDEO_CALL_CONFIG.MESSAGES.TOKEN_GENERATED
          .replace('{{user}}', identity)
          .replace('{{mealId}}', mealId);
      console.log(`${VIDEO_CALL_CONFIG.LOGGING.LEVELS.SUCCESS} ${VIDEO_CALL_CONFIG.LOGGING.PREFIX} ${logMessage} - Orario: ${now.toISOString()}`);
  }

  // Invia il token al client
  res.status(200).json({
    success: true,
    token: token.toJwt(),
  });
});

/**
 * @desc    L'host termina una videochiamata
 * @route   POST /api/video/meals/:mealId/end
 * @access  Private (Host Only)
 */
exports.endVideoCall = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;
  const meal = await Meal.findById(mealId);

  if (!meal) {
    return next(new ErrorResponse(VIDEO_CALL_CONFIG.MESSAGES.MEAL_NOT_FOUND_END, 404));
  }

  // Controlla che chi fa la richiesta sia l'host del pasto
  if (!meal.host.equals(req.user._id)) {
    return next(new ErrorResponse(VIDEO_CALL_CONFIG.MESSAGES.HOST_ONLY_END, 403));
  }

  // Imposta lo stato della chiamata a 'ended'
  meal.videoCallStatus = 'ended';
  await meal.save();

  // Invia una richiesta a Twilio per chiudere la stanza
  try {
    const roomName = meal._id.toString();
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.video.rooms(roomName).update({ status: 'completed' });
    if (VIDEO_CALL_CONFIG.LOGGING.ENABLED) {
        console.log(`${VIDEO_CALL_CONFIG.LOGGING.LEVELS.SUCCESS} ${VIDEO_CALL_CONFIG.LOGGING.PREFIX} Stanza Twilio ${roomName} terminata con successo.`);
    }
  } catch (error) {
    if (VIDEO_CALL_CONFIG.LOGGING.ENABLED) {
        console.error(`${VIDEO_CALL_CONFIG.LOGGING.LEVELS.ERROR} ${VIDEO_CALL_CONFIG.LOGGING.PREFIX} Errore nel terminare la stanza ${meal._id.toString()}:`, error.message);
    }
  }

  res.status(200).json({ success: true, message: VIDEO_CALL_CONFIG.MESSAGES.CALL_ENDED_SUCCESS });
});