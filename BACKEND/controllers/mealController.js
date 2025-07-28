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
  const statusFilter = req.query.status ? req.query.status.split(',') : ['upcoming'];
  const mealTypeFilter = req.query.mealType; // Nuovo filtro per tipo di pasto
  const nearFilter = req.query.near; // Filtro per posizione geografica
  const page = parseInt(req.query.page, 10) || 1; // Pagina corrente, default 1
  const limit = parseInt(req.query.limit, 10) || 10; // Risultati per pagina, default 10
  const skip = (page - 1) * limit;

  // Costruisci la query base
  let query = { status: { $in: statusFilter } };
  
  // Aggiungi filtro per tipo di pasto se specificato
  if (mealTypeFilter) {
    query.mealType = mealTypeFilter;
  }

  // Aggiungi filtro per posizione geografica se specificato
  if (nearFilter) {
    try {
      const [lat, lng] = nearFilter.split(',').map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Formato coordinate non valido. Usa: lat,lng'
        });
      }

      // Filtra solo pasti fisici con location valida
      query.mealType = 'physical';
      query.location = { $exists: true, $ne: null };
      
      // Aggiungi filtro per coordinate (se il campo location ha coordinate)
      // Nota: Questo assume che il campo location sia una stringa con l'indirizzo
      // Se hai coordinate separate, dovresti aggiungere un filtro più specifico
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Formato coordinate non valido'
      });
    }
  }

  // Ottieni gli ID degli utenti da escludere (blocchi bidirezionali)
  const currentUser = await require('../models/User').findById(req.user.id);
  const usersWhoBlockedMe = await require('../models/User').find({ blockedUsers: req.user.id }).select('_id');
  const usersWhoBlockedMeIds = usersWhoBlockedMe.map(user => user._id);
  const excludedIds = [...currentUser.blockedUsers, ...usersWhoBlockedMeIds, req.user.id];

  // Aggiungi filtro per escludere pasti di utenti bloccati
  query.host = { $nin: excludedIds };

  const mealsQuery = Meal.find(query)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit)
    .populate('host', 'nickname profileImage');

  const [meals, total] = await Promise.all([
    mealsQuery,
    Meal.countDocuments(query)
  ]);

  // Se è richiesto un filtro geografico, filtra i risultati per distanza
  let filteredMeals = meals;
  if (nearFilter) {
    try {
      const [lat, lng] = nearFilter.split(',').map(coord => parseFloat(coord.trim()));
      
      // Filtra i pasti che hanno coordinate valide
      filteredMeals = meals.filter(meal => {
        if (!meal.location || typeof meal.location !== 'object' || !meal.location.coordinates) {
          return false;
        }
        
        // Calcola la distanza usando la formula di Haversine
        const R = 6371; // Raggio della Terra in km
        const dLat = (meal.location.coordinates[1] - lat) * Math.PI / 180;
        const dLng = (meal.location.coordinates[0] - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(meal.location.coordinates[1] * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Filtra per pasti entro 20km (come specificato nel frontend)
        return distance <= 20;
      });
    } catch (error) {
      console.error('Errore nel calcolo della distanza:', error);
      filteredMeals = [];
    }
  }

  res.status(200).json({
    success: true,
    count: filteredMeals.length,
    total: filteredMeals.length, // Per i filtri geografici, total = count
    page,
    pages: Math.ceil(filteredMeals.length / limit),
    data: filteredMeals
  });
});

// GET /api/meals/history
exports.getMealHistory = asyncHandler(async (req, res) => {
  // Ottieni gli ID degli utenti da escludere (blocchi bidirezionali)
  const currentUser = await require('../models/User').findById(req.user.id);
  const usersWhoBlockedMe = await require('../models/User').find({ blockedUsers: req.user.id }).select('_id');
  const usersWhoBlockedMeIds = usersWhoBlockedMe.map(user => user._id);
  const excludedIds = [...currentUser.blockedUsers, ...usersWhoBlockedMeIds];

  const meals = await Meal.find({ 
      participants: req.user.id,
      status: { $in: ['completed', 'cancelled'] },
      host: { $nin: excludedIds } // Escludi pasti di utenti bloccati
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
  
  // Gestione del campo location dal FormData
  if (req.body.location) {
    try {
      mealData.location = JSON.parse(req.body.location);
    } catch (error) {
      // Se non è JSON valido, usa il valore come stringa
      mealData.location = req.body.location;
    }
  }
  
  let meal, chat;
  try {
      meal = await Meal.create(mealData);
      chat = await Chat.create({
          name: `Chat per: ${meal.title}`,
          mealId: meal._id,
          participants: [req.user.id]
      });
      meal.chatId = chat._id;

      // Logica Twilio - solo per pasti virtuali
      if (meal.mealType === 'virtual') {
        const room = await twilioClient.video.v1.rooms.create({
            uniqueName: meal._id.toString(),
            type: 'group'
        });
        meal.twilioRoomSid = room.sid;
      }

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
  
  // BLOCCO: Se il pasto è terminato o cancellato, non si può modificare
  const mealEndTime = new Date(meal.date.getTime() + (meal.duration || 0) * 60000);
  if (meal.status === 'completed' || meal.status === 'cancelled' || new Date() > mealEndTime) {
    return next(new ErrorResponse('Non puoi modificare un pasto già terminato o cancellato.', 403));
  }

  // Gestione del campo location dal FormData
  if (req.body.location) {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch (error) {
      // Se non è JSON valido, usa il valore come stringa
      req.body.location = req.body.location;
    }
  }

  // Se il pasto diventa fisico da virtuale, rimuovi i dati Twilio
  if (req.body.mealType === 'physical' && meal.mealType === 'virtual') {
    req.body.twilioRoomSid = undefined;
    req.body.videoCallStatus = undefined;
  }

  // Se il pasto diventa virtuale da fisico, crea stanza Twilio
  if (req.body.mealType === 'virtual' && meal.mealType === 'physical') {
    try {
      const room = await twilioClient.video.v1.rooms.create({
        uniqueName: meal._id.toString(),
        type: 'group'
      });
      req.body.twilioRoomSid = room.sid;
      req.body.videoCallStatus = 'pending';
    } catch (error) {
      console.error("Errore nella creazione della stanza Twilio:", error);
      return next(new ErrorResponse('Errore nella creazione della stanza video.', 500));
    }
  }

  if (req.file) req.body.coverImage = req.file.path;

  const updatedMeal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('host', 'nickname profileImage');

  res.status(200).json({ success: true, data: updatedMeal });
});

// DELETE /api/meals/:id (Cancella pasto)
exports.deleteMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) return next(new ErrorResponse(`Pasto non trovato`, 404));
  if (meal.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorizzato`, 403));
  
  // BLOCCO: Se il pasto è terminato o cancellato, non si può eliminare
  const mealEndTime = new Date(meal.date.getTime() + (meal.duration || 0) * 60000);
  if (meal.status === 'completed' || meal.status === 'cancelled' || new Date() > mealEndTime) {
    return next(new ErrorResponse('Non puoi eliminare un pasto già terminato o cancellato.', 403));
  }

  // Rimuovi la stanza Twilio se esiste (solo per pasti virtuali)
  if (meal.mealType === 'virtual' && meal.twilioRoomSid) {
    try {
      await twilioClient.video.v1.rooms(meal.twilioRoomSid).update({ status: 'completed' });
    } catch (error) {
      console.error("Errore nella rimozione della stanza Twilio:", error);
    }
  }

  await meal.remove();
  res.status(200).json({ success: true, data: {} });
});

/**
 * @desc    Unisciti a un pasto
 * @route   POST /api/meals/:id/participants
 */
exports.joinMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id).populate('host', 'nickname');
  if (!meal) { return next(new ErrorResponse(`Pasto non trovato`, 404)); }
  // Nuovi controlli di sicurezza e coerenza
  if (meal.status !== 'upcoming') {
    return next(new ErrorResponse('Non è più possibile iscriversi a questo pasto', 400));
  }
  if (meal.participantsCount >= meal.maxParticipants) {
    return next(new ErrorResponse('Questo pasto è al completo', 400));
  }
  if (meal.host.toString() === req.user.id) {
    return next(new ErrorResponse('Sei l\'host di questo pasto', 400));
  }
  if (meal.participants.some(p => p.toString() === req.user.id)) {
    return next(new ErrorResponse('Sei già iscritto a questo pasto', 400));
  }
  
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
  
  // Impedisci di abbandonare pasti terminati o annullati
  if (meal.status === 'completed' || meal.status === 'cancelled') {
    return next(new ErrorResponse('Non puoi abbandonare un TableTalk® che si è già concluso o è stato annullato', 400));
  }
  
  // Impedisci che l'host lasci il proprio pasto
  if (meal.host.toString() === req.user.id) {
    return next(new ErrorResponse('L\'host non può lasciare il proprio pasto', 400));
  }

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