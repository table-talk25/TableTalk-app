// File: BACKEND/controllers/videoCallController.js

const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const Meal = require('../models/Meal');
const twilio = require('twilio');

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
  const identity = req.user.nickname || req.user.id; 
  console.log(`[Token Gen] Ricevuta richiesta per pasto ${mealId} da utente ${identity}`);

  const meal = await Meal.findById(mealId);
  if (!meal) {
      return next(new ErrorResponse(`Pasto non trovato con id ${mealId}`, 404));
  }

  // 1. Controllo di autorizzazione: l'utente è un partecipante?
  if (!meal.participants.some(p => p.equals(req.user._id))) {
    return next(new ErrorResponse('Non sei autorizzato a partecipare a questa videochiamata', 403));
  }

      // 1. Controllo autorizzazione: l'utente è un partecipante?
      if (!meal.participants.some(p => p.equals(req.user._id))) {
        return next(new ErrorResponse('Non sei autorizzato a partecipare a questa videochiamata', 403));
    }
  
    // 2. Controllo stato: la videochiamata è attiva?
    if (meal.videoCallStatus !== 'active') {
      const message = meal.videoCallStatus === 'ended' 
          ? 'Questa videochiamata è terminata.'
          : 'La videochiamata non è ancora disponibile.';
      return next(new ErrorResponse(message, 403));
  }
  
  // 3. Generazione del token se tutti i controlli passano
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
    return next(new ErrorResponse(`Pasto non trovato`, 404));
  }

  // Controlla che chi fa la richiesta sia l'host del pasto
  if (!meal.host.equals(req.user._id)) {
    return next(new ErrorResponse('Solo l\'host può terminare la chiamata.', 403));
  }

  // Imposta lo stato della chiamata a 'ended'
  meal.videoCallStatus = 'ended';
  await meal.save();

  // Invia una richiesta a Twilio per chiudere la stanza
  try {
    const roomName = meal._id.toString();
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.video.rooms(roomName).update({ status: 'completed' });
    console.log(`[Twilio] Stanza ${roomName} terminata con successo.`);
  } catch (error) {
    console.error(`[Twilio] Errore nel terminare la stanza ${meal._id.toString()}:`, error.message);
  }

  res.status(200).json({ success: true, message: 'Videochiamata terminata con successo.' });
});