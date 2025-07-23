const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const Meal = require('../models/Meal');
const User = require('../models/User');
const Chat = require('../models/Chat');
const twilio = require('twilio');
const notificationService = require('../services/notificationService');
const sendEmail = require('../utils/sendEmail');

const twilioClient = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

// GET /api/meals (Mostra solo pasti futuri)
exports.getMeals = asyncHandler(async (req, res) => {
  // Permetti filtro multiplo per stato tramite query string
  // Esempio: /api/meals?status=upcoming,ongoing
  const statusFilter = req.query.status ? req.query.status.split(',') : ['upcoming'];
  const meals = await Meal.find({ status: { $in: statusFilter } })
      .sort({ date: 1 })
      .populate('host', 'nickname profileImage');
  res.status(200).json({ success: true, count: meals.length, data: meals });
});

// GET /api/meals/history
exports.getMealHistory = asyncHandler(async (req, res) => {
  const meals = await Meal.find({ 
      participants: req.user.id,
      status: { $in: ['completed', 'cancelled'] }
  })
  .sort({ date: -1 })
  .populate('host', 'nickname profileImage');
  res.status(200).json({ success: true, data: meals });
});

// GET /api/meals/:id
exports.getMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id).populate('host participants', 'nickname profileImage');
  if (!meal) return next(new ErrorResponse(`Pasto non trovato`, 404));
  res.status(200).json({ success: true, data: meal });
});

// POST /api/meals (Crea pasto, chat E stanza video)
exports.createMeal = asyncHandler(async (req, res, next) => {
  const mealData = { ...req.body, host: req.user.id };
  if (req.file) mealData.coverImage = req.file.path;
  
  let meal, chat;
  try {
      meal = await Meal.create(mealData);
      chat = await Chat.create({
          name: `Chat per: ${meal.title}`,
          mealId: meal._id,
          participants: [req.user.id]
      });
      meal.chatId = chat._id;

      // Logica Twilio
      const room = await twilioClient.video.v1.rooms.create({
          uniqueName: meal._id.toString(),
          type: 'group'
      });
      meal.twilioRoomSid = room.sid;

      await meal.save();
      
      await User.findByIdAndUpdate(req.user.id, { $push: { createdMeals: meal._id } });
      const populatedMeal = await Meal.findById(meal._id).populate('host', 'nickname profileImage');
      res.status(201).json({ success: true, data: populatedMeal });
  } catch (error) {
      if (meal) await Meal.findByIdAndDelete(meal._id);
      if (chat) await Chat.findByIdAndDelete(chat._id);
      console.error("ERRORE DURANTE LA CREAZIONE DEL PASTO:", error);
      return next(new ErrorResponse('Errore nella creazione del pasto o dei servizi associati.', 500));
  }
});

// PUT /api/meals/:id (Modifica pasto)
exports.updateMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) return next(new ErrorResponse(`Pasto non trovato`, 404));
  if (meal.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorizzato`, 403));

  const oneHourBefore = new Date(meal.date.getTime() - 60 * 60 * 1000);
  if (new Date() > oneHourBefore) {
      return next(new ErrorResponse('Non puoi modificare un pasto a meno di un\'ora dal suo inizio.', 403));
  }

  const updatedMeal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');

  // Notifica ai partecipanti
  const participantsToNotifyUpdate = meal.participants.filter(p => p._id.toString() !== req.user.id);
  if (participantsToNotifyUpdate.length > 0) {
    notificationService.sendNotification(
      participantsToNotifyUpdate.map(p => p._id),
      'meal_updated',
      `Il pasto "${meal.title}" è stato modificato dall'organizzatore.`,
      { mealId: meal._id }
    );
  }

  res.status(200).json({ success: true, data: updatedMeal });
});

// DELETE /api/meals/:id (Cancella pasto)
exports.deleteMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) return next(new ErrorResponse(`Pasto non trovato`, 404));
  if (meal.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorizzato`, 403));
  
  const oneHourBefore = new Date(meal.date.getTime() - 60 * 60 * 1000);
  if (new Date() > oneHourBefore) {
      return next(new ErrorResponse('Non puoi cancellare un pasto a meno di un\'ora dal suo inizio.', 403));
  }

  meal.status = 'cancelled';
  await meal.save();

  // NOTIFICA: Invia notifica a tutti i partecipanti (tranne l'host)
  const participantsToNotifyCancel = meal.participants.filter(p => p._id.toString() !== req.user.id);
  if (participantsToNotifyCancel.length > 0) {
    notificationService.sendNotification(
      participantsToNotifyCancel.map(p => p._id),
      'meal_cancelled',
      `Il pasto "${meal.title}" a cui partecipavi è stato cancellato.`,
      { mealId: meal._id }
    );
  }

  res.status(200).json({ success: true, message: 'Pasto cancellato' });
});

/**
 * @desc    Unisciti a un pasto
 * @route   POST /api/meals/:id/participants
 */
exports.joinMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id).populate('host', 'nickname');
  if (!meal) { return next(new ErrorResponse(`Pasto non trovato`, 404)); }
  // Permetti l'accesso se il pasto è upcoming o ongoing
  if (meal.status !== 'upcoming' && meal.status !== 'ongoing') {
    return next(new ErrorResponse('Non puoi più unirti a questo pasto.', 400));
  }
  if (meal.isParticipant(req.user.id)) { return next(new ErrorResponse('Sei già un partecipante.', 400)); }
  if (meal.isFull) { return next(new ErrorResponse('Questo pasto è al completo.', 400)); }
  
  await meal.addParticipant(req.user.id);
  await User.findByIdAndUpdate(req.user.id, { $push: { joinedMeals: meal._id } });
  
  const chat = await Chat.findById(meal.chatId);
  if (chat) {
    await chat.addParticipant(req.user.id);
    console.log(`[Sync] Utente ${req.user.nickname} aggiunto alla chat del pasto "${meal.title}".`);
  }
    // NOTIFICHE
    // 1. All'host
    notificationService.sendNotification(meal.host, 'participant_joined', `${req.user.nickname} si è unito al tuo pasto "${meal.title}".`, { mealId: meal._id });
    // 2. Agli altri partecipanti
    const otherParticipantsJoin = meal.participants.filter(p => p._id.toString() !== req.user.id);
    if (otherParticipantsJoin.length > 0) {
      notificationService.sendNotification(otherParticipantsJoin.map(p => p._id), 'participant_joined', `${req.user.nickname} si è unito al pasto "${meal.title}".`, { mealId: meal._id });
    }
    // Creiamo una notifica per l'organizzatore del pasto
    const notificationMessage = `L'utente ${req.user.nickname} si è unito al tuo pasto "${meal.title}"`;  
  meal.notifications.push({
    type: 'join',
    message: notificationMessage,
    recipient: meal.host,
  });

  await meal.save();

  // Invia email di conferma iscrizione se l'utente ha attivato le notifiche email
  const participant = await User.findById(req.user.id);
  if (participant && participant.settings?.notifications?.email) {
    try {
      await sendEmail.sendMealRegistrationEmail(
        participant.email,
        participant.nickname || participant.name,
        {
          title: meal.title,
          date: meal.date,
          hostName: meal.host.nickname || 'Host'
        }
      );
    } catch (err) {
      console.error('Errore invio email conferma iscrizione:', err.message);
    }
  }
  
  const updatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');

  res.status(200).json({ 
    success: true, 
    message: 'Ti sei unito al pasto con successo',
    data: updatedMeal
  });
});

/**
 * @desc    Lascia un pasto
 * @route   DELETE /api/meals/:id/participants
 */
exports.leaveMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) { return next(new ErrorResponse(`Pasto non trovato`, 404)); }

  await meal.removeParticipant(req.user.id);
  await User.findByIdAndUpdate(req.user.id, { $pull: { joinedMeals: meal._id } });
  
  const chat = await Chat.findById(meal.chatId);
  if (chat) {
    await chat.removeParticipant(req.user.id);
    console.log(`[Sync] Utente ${req.user.nickname} rimosso dalla chat del pasto "${meal.title}".`);
  }

  // Notifica all'host
  notificationService.sendNotification(
    meal.host, 
    'participant_left', 
    `${req.user.nickname} ha lasciato il tuo pasto "${meal.title}".`, 
    { mealId: meal._id }
  );
  
  const updatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');

  res.status(200).json({ 
      success: true, 
      message: 'Hai lasciato il pasto con successo',
      data: updatedMeal
  });
});

/**
 * @desc    Cerca pasti tramite una stringa di ricerca
 * @route   GET /api/meals/search?q=parolachiave
 * @access  Public
 */
exports.searchMeals = asyncHandler(async (req, res, next) => {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const query = {
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { language: { $regex: searchTerm, $options: 'i' } },
      { topics: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  const meals = await Meal.find(query)
    .populate('host', 'nickname profileImage')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: meals.length,
    data: meals,
  });
});

const { v4: uuidv4 } = require('uuid'); // Importa in cima al file per generare ID unici

// GET /api/meals/user/all?status=upcoming,ongoing,completed,cancelled
exports.getUserMeals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const statusFilter = req.query.status ? req.query.status.split(',') : ['upcoming', 'ongoing', 'completed', 'cancelled'];
  const meals = await Meal.find({
    status: { $in: statusFilter },
    $or: [
      { host: userId },
      { participants: userId }
    ]
  })
  .sort({ date: -1 })
  .populate('host', 'nickname profileImage')
  .populate('participants', 'nickname profileImage');
  res.status(200).json({ success: true, count: meals.length, data: meals });
});

/**
 * @desc    Ottiene o crea il link per la videochiamata di un pasto
 * @route   GET /api/meals/:id/stream
 * @access  Private (solo per i partecipanti)
 */
exports.getVideoCallUrl = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);

  if (!meal) {
    return next(new ErrorResponse('Pasto non trovato', 404));
  }
  // Controlla se l'utente è un partecipante o l'host
  if (!meal.participants.some(p => p.equals(req.user._id))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa videochiamata', 403));
  }

  // Se il link non è mai stato creato, lo generiamo ora
  if (!meal.videoCallLink) {
    // Creiamo un nome di stanza unico e difficile da indovinare
    const roomName = `TableTalk-${meal._id}-${uuidv4()}`;
    meal.videoCallLink = `https://meet.jit.si/${roomName}`;
    await meal.save();
  }

  res.status(200).json({
    success: true,
    data: {
      videoCallLink: meal.videoCallLink
    }
  });
});