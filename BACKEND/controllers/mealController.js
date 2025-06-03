const Meal = require('../models/Meal');
const User = require('../models/User');
const Chat = require('../models/Chat');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const { generateMeetingLink } = require('../utils/videoCallUtils');
const { validationResult } = require('express-validator');

/**
 * @desc    Crea un nuovo pasto virtuale
 * @route   POST /api/meals
 * @access  Private
 */
exports.createMeal = asyncHandler(async (req, res, next) => {
  // Validazione dei dati
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Backend Validation Errors:', errors.array()); 
    return next(new ErrorResponse('Dati non validi', 400, 'INVALID_DATA'));
  }

  // Verifica campi obbligatori
  const requiredFields = ['title', 'type', 'date', 'maxParticipants', 'description', 'language', 'topics'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return next(new ErrorResponse(
      `Campi obbligatori mancanti: ${missingFields.join(', ')}`,
      400,
      'MISSING_FIELDS'
    ));
  }

  // Verifica il formato dei dati
  if (typeof req.body.title !== 'string' || req.body.title.trim().length === 0) {
    return next(new ErrorResponse('Il titolo non è valido', 400, 'INVALID_TITLE'));
  }

  if (typeof req.body.description !== 'string' || req.body.description.trim().length < 10) {
    return next(new ErrorResponse('La descrizione deve essere di almeno 10 caratteri', 400, 'INVALID_DESCRIPTION'));
  }

  if (!['colazione', 'pranzo', 'cena', 'aperitivo'].includes(req.body.type)) {
    return next(new ErrorResponse('Tipo di pasto non valido', 400, 'INVALID_TYPE'));
  }

  if (!Array.isArray(req.body.topics) || req.body.topics.length === 0) {
    return next(new ErrorResponse('Devi selezionare almeno un argomento', 400, 'INVALID_TOPICS'));
  }

  if (typeof req.body.maxParticipants !== 'number' || req.body.maxParticipants < 2 || req.body.maxParticipants > 10) {
    return next(new ErrorResponse('Il numero di partecipanti deve essere tra 2 e 10', 400, 'INVALID_PARTICIPANTS'));
  }

  // Verifica che la data sia valida e futura
  const mealDate = new Date(req.body.date);
  if (isNaN(mealDate.getTime())) {
    return next(new ErrorResponse('Data non valida', 400, 'INVALID_DATE'));
  }
  
  if (mealDate <= new Date()) {
    return next(new ErrorResponse('La data del pasto deve essere futura', 400, 'PAST_DATE'));
  }
  
  // Aggiungi l'host come primo partecipante
  req.body.host = req.user.id;
  req.body.participants = [req.user.id];
  
  // Imposta valori di default per le impostazioni
  req.body.settings = {
    allowLateJoin: req.body.settings?.allowLateJoin ?? true,
    requireApproval: req.body.settings?.requireApproval ?? false,
    videoQuality: req.body.settings?.videoQuality ?? 'HD',
    backgroundBlur: req.body.settings?.backgroundBlur ?? true
  };
  
  // Genera un link per la videochiamata
  const videoCallLink = await generateMeetingLink(req.body.videoCallProvider || 'jitsi');
  req.body.videoCallLink = videoCallLink;
  
  // Crea una chat per il pasto
  const chat = await Chat.create({
    name: `Chat per ${req.body.title}`,
    participants: [req.user.id],
    messages: []
  });
  
  req.body.chatId = chat._id;
  
  // Crea il pasto
  const meal = await Meal.create(req.body);
  
  // Aggiorna l'utente
  await User.findByIdAndUpdate(req.user.id, {
    $push: { createdMeals: meal._id, joinedMeals: meal._id }
  });
  
  // Popola i dati
  const populatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');
  
  res.status(201).json({
    success: true,
    data: populatedMeal
  });
});

/**
 * @desc    Ottieni tutti i pasti virtuali con filtri avanzati
 * @route   GET /api/meals
 * @access  Public
 */
exports.getMeals = asyncHandler(async (req, res, next) => {
  // Costruisci la query
  let query = {};
  
  // Filtra per tipo di pasto
  if (req.query.type) {
    query.type = req.query.type;
  }
  
  // Filtra per data
  if (req.query.date) {
    const date = new Date(req.query.date);
    query.date = {
      $gte: new Date(date.setHours(0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59))
    };
  } else if (req.query.upcoming === 'true') {
    query.date = { $gte: new Date() };
  }
  
  // Filtra per stato
  if (req.query.status) {
    query.status = req.query.status;
  } else {
    query.status = { $in: ['pianificato', 'in corso'] };
  }
  
  // Cerca pasti disponibili
  if (req.query.available === 'true') {
    query.$expr = { $lt: [{ $size: '$participants' }, '$maxParticipants'] };
  }
  
  // Ricerca testuale
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { topics: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  // Altri filtri
  if (req.query.language) query.language = req.query.language;
  if (req.query.host) query.host = req.query.host;
  if (req.query.participant) query.participants = req.query.participant;
  
  // Configurazione ordinamento
  let sortOptions = {};
  if (req.query.sortBy) {
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    switch (req.query.sortBy) {
      case 'date':
        sortOptions.date = sortOrder;
        break;
      case 'title':
        sortOptions.title = sortOrder;
        break;
      case 'participants':
        sortOptions.participantsCount = sortOrder;
        break;
      case 'createdAt':
        sortOptions.createdAt = sortOrder;
        break;
      default:
        sortOptions.date = 1; // Default: ordina per data crescente
    }
  } else {
    sortOptions.date = 1; // Default
  }

  // Paginazione
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Esegui la query
  const meals = await Meal.find(query)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage')
    .sort(sortOptions)
    .skip(startIndex)
    .limit(limit);
  
  // Conta risultati
  const total = await Meal.countDocuments(query);
  
  res.status(200).json({
    success: true,
    pagination: {
      currentPage: page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    },
    count: meals.length,
    data: meals
  });
});

/**
 * @desc    Ottieni un singolo pasto virtuale
 * @route   GET /api/meals/:id
 * @access  Public
 */
exports.getMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: meal
  });
});

/**
 * @desc    Aggiorna un pasto virtuale
 * @route   PUT /api/meals/:id
 * @access  Private (solo host)
 */
exports.updateMeal = asyncHandler(async (req, res, next) => {
  let meal = await Meal.findById(req.params.id);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia l'host del pasto
  if (meal.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Utente ${req.user.id} non autorizzato a modificare questo pasto`, 403));
  }
  
  // Assicurati che questi campi non possano essere modificati
  delete req.body.host;
  delete req.body.participants;
  delete req.body.chatId;
  delete req.body.videoCallLink;
  
  // Aggiorna il pasto
  meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');
  
  res.status(200).json({
    success: true,
    data: meal
  });
});

/**
 * @desc    Ottieni i pasti dell'utente (hosted, joined o tutti)
 * @route   GET /api/meals/user/:type
 * @access  Private
 */
exports.getUserMeals = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  let query = {};

  // Costruisci la query in base al tipo
  switch (type) {
    case 'hosted':
      query.host = req.user.id;
      break;
    case 'joined':
      query.participants = req.user.id;
      break;
    case 'all':
      query.$or = [
        { host: req.user.id },
        { participants: req.user.id }
      ];
      break;
    default:
      return next(new ErrorResponse('Tipo non valido', 400));
  }

  // Filtra per stato se specificato
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Esegui la query
  const meals = await Meal.find(query)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: meals.length,
    data: meals
  });
});

/**
 * @desc    Aggiorna lo stato di un pasto virtuale
 * @route   PUT /api/meals/:id/status
 * @access  Private (solo host)
 */
exports.updateMealStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['pianificato', 'in corso', 'completato', 'cancellato'].includes(status)) {
    return next(new ErrorResponse('Per favore fornisci uno stato valido', 400));
  }
  
  let meal = await Meal.findById(req.params.id);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia l'host del pasto
  if (meal.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Utente ${req.user.id} non autorizzato a modificare questo pasto`, 403));
  }
  
  meal.status = status;
  await meal.save();
  
  // Popola i dati prima di inviare la risposta
  meal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');
  
  res.status(200).json({
    success: true,
    data: meal
  });
});

/**
 * @desc    Elimina un pasto virtuale
 * @route   DELETE /api/meals/:id
 * @access  Private (solo host)
 */
exports.deleteMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia l'host del pasto
  if (meal.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Utente ${req.user.id} non autorizzato a eliminare questo pasto`, 403));
  }
  
  // Imposta lo stato del pasto come cancellato invece di eliminarlo
  meal.status = 'cancellato';
  await meal.save();
  
  // Rimuovi il pasto dai pasti degli utenti
  await User.updateMany(
    { $or: [{ createdMeals: meal._id }, { joinedMeals: meal._id }] },
    { 
      $pull: { 
        createdMeals: meal._id,
        joinedMeals: meal._id
      } 
    }
  );
  
  // Elimina la chat associata
  if (meal.chatId) {
    await Chat.findByIdAndDelete(meal.chatId);
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Cancella un pasto virtuale (POST method)
 * @route   POST /api/meals/:id/cancel
 * @access  Private (solo host)
 */
exports.cancelMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia l'host del pasto
  if (meal.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Utente ${req.user.id} non autorizzato a cancellare questo pasto`, 403));
  }
  
  // Imposta lo stato del pasto come cancellato
  meal.status = 'cancellato';
  await meal.save();
  
  // Popola i dati prima di inviare la risposta
  const updatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');
  
  res.status(200).json({
    success: true,
    message: 'Pasto cancellato con successo',
    data: updatedMeal
  });
});

/**
 * @desc    Unisciti a un pasto virtuale
 * @route   POST /api/meals/:id/join
 * @access  Private
 */
exports.joinMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  // Verifica che il pasto non sia pieno
  if (meal.participants.length >= meal.maxParticipants) {
    return next(new ErrorResponse('Il pasto ha raggiunto il numero massimo di partecipanti', 400));
  }
  
  // Verifica che l'utente non sia già partecipante
  if (meal.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Sei già un partecipante di questo pasto', 400));
  }
  
  // Verifica che il pasto non sia già iniziato o completato
  if (meal.status !== 'pianificato') {
    return next(new ErrorResponse('Non è possibile unirsi a un pasto già iniziato o completato', 400));
  }
  
  // Aggiungi l'utente ai partecipanti
  meal.participants.push(req.user.id);
  await meal.save();
  
  // Aggiorna l'utente
  await User.findByIdAndUpdate(req.user.id, {
    $push: { joinedMeals: meal._id }
  });
  
  // Aggiungi l'utente alla chat
  if (meal.chatId) {
    await Chat.findByIdAndUpdate(meal.chatId, {
      $push: { participants: req.user.id }
    });
  }
  
  // Popola i dati prima di inviare la risposta
  const updatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');
  
  res.status(200).json({
    success: true,
    data: updatedMeal
  });
});

/**
 * @desc    Lascia un pasto virtuale
 * @route   POST /api/meals/:id/leave
 * @access  Private
 */
exports.leaveMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!meal.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Non sei un partecipante di questo pasto', 400));
  }
  
  // Verifica che l'utente non sia l'host
  if (meal.host.toString() === req.user.id) {
    return next(new ErrorResponse('L\'host non può lasciare il pasto', 400));
  }
  
  // Rimuovi l'utente dai partecipanti
  meal.participants = meal.participants.filter(
    participant => participant.toString() !== req.user.id
  );
  await meal.save();
  
  // Aggiorna l'utente
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { joinedMeals: meal._id }
  });
  
  // Rimuovi l'utente dalla chat
  if (meal.chatId) {
    await Chat.findByIdAndUpdate(meal.chatId, {
      $pull: { participants: req.user.id }
    });
  }
  
  // Popola i dati prima di inviare la risposta
  const updatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');
  
  res.status(200).json({
    success: true,
    data: updatedMeal
  });
});

/**
 * @desc    Ottieni l'URL della videochiamata
 * @route   GET /api/meals/:id/video-call
 * @access  Private
 */
exports.getVideoCallUrl = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto virtuale non trovato con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!meal.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Non sei un partecipante di questo pasto', 403));
  }
  
  // Verifica che il pasto sia in corso
  if (meal.status !== 'in corso') {
    return next(new ErrorResponse('La videochiamata è disponibile solo durante il pasto', 400));
  }
  
  res.status(200).json({
    success: true,
    data: {
      videoCallUrl: meal.videoCallLink
    }
  });
});

// Placeholder per approvazione partecipante
exports.approveParticipant = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Approvazione partecipante non ancora implementata.' });
});

// Placeholder per rifiuto partecipante
exports.rejectParticipant = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Rifiuto partecipante non ancora implementato.' });
});

// Placeholder per segnalazione pasto
exports.reportMeal = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Segnalazione pasto non ancora implementata.' });
});
