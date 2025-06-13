const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { protect } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

// Inizializza il client Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// @desc    Genera un token per la videochiamata
// @route   POST /api/video/token
// @access  Private
router.post('/token', protect, async (req, res, next) => {
  try {
    const { identity, room } = req.body;

    if (!identity || !room) {
      return next(new ErrorResponse('Identità e stanza sono richiesti', 400));
    }
    
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const accessToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET
    );

    accessToken.identity = identity;

    const videoGrant = new VideoGrant({
      room: room
    });

    accessToken.addGrant(videoGrant);

    res.status(200).json({
      success: true,
      data: {
        token: accessToken.toJwt(),
        identity,
        room
      }
    });
  } catch (err) {
    next(new ErrorResponse('Errore nella generazione del token', 500));
  }
});

// @desc    Ottieni la configurazione della videochiamata
// @route   GET /api/video/config
// @access  Private
router.get('/config', protect, async (req, res, next) => {
  try {
    // Qui andrebbe la logica per ottenere la configurazione da Twilio
    // Per ora restituiamo una configurazione di esempio
    const config = {
      apiKey: process.env.TWILIO_API_KEY,
      apiSecret: process.env.TWILIO_API_SECRET,
      accountSid: process.env.TWILIO_ACCOUNT_SID
    };

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    next(new ErrorResponse('Errore nel recupero della configurazione', 500));
  }
});

// @desc    Termina una videochiamata
// @route   POST /api/video/end
// @access  Private
router.post('/end', protect, async (req, res, next) => {
  try {
    const { room } = req.body;

    if (!room) {
      return next(new ErrorResponse('ID della stanza richiesto', 400));
    }

    // Qui andrebbe la logica per terminare la chiamata con Twilio
    // Per ora restituiamo un successo
    res.status(200).json({
      success: true,
      message: 'Videochiamata terminata con successo'
    });
  } catch (err) {
    next(new ErrorResponse('Errore nella terminazione della videochiamata', 500));
  }
});

// Crea una nuova stanza
router.post('/rooms', protect, async (req, res) => {
  try {
    const { roomName } = req.body;
    
    const room = await twilioClient.video.rooms.create({
      uniqueName: roomName,
      type: 'group',
      recordParticipantsOnConnect: true
    });

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Errore nella creazione della stanza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della stanza'
    });
  }
});

// Ottieni informazioni sulla stanza
router.get('/rooms/:roomName', protect, async (req, res) => {
  try {
    const { roomName } = req.params;
    
    const room = await twilioClient.video.rooms(roomName).fetch();
    const participants = await twilioClient.video.rooms(roomName).participants.list();

    res.json({
      success: true,
      room,
      participants
    });
  } catch (error) {
    console.error('Errore nel recupero delle informazioni della stanza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle informazioni della stanza'
    });
  }
});

// Termina una stanza
router.post('/rooms/:roomName/end', protect, async (req, res) => {
  try {
    const { roomName } = req.params;
    
    await twilioClient.video.rooms(roomName).update({ status: 'completed' });

    res.json({
      success: true,
      message: 'Stanza terminata con successo'
    });
  } catch (error) {
    console.error('Errore nella terminazione della stanza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella terminazione della stanza'
    });
  }
});

module.exports = router; 