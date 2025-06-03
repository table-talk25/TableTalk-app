const Chat = require('../models/Chat');
const Meal = require('../models/Meal');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * // @desc    Invia un messaggio in una chat di un pasto
// @route   POST /api/meals/:mealId/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { mealId } = req.params;
    const { text } = req.body;

    // Verifica che il pasto esista
    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({ success: false, error: 'Pasto non trovato' });
    }

    // Verifica che l'utente sia un partecipante
    if (!meal.participants.includes(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo i partecipanti possono inviare messaggi in questa chat' 
      });
    }

    
 * @desc    Crea una nuova chat per un pasto
 * @route   POST /api/chats/meal/:mealId
 * @access  Private
 */
exports.createMealChat = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.mealId);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato con id ${req.params.mealId}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante del pasto
  if (!meal.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato a creare una chat per questo pasto', 403));
  }
  
  // Verifica se esiste già una chat per questo pasto
  let chat = await Chat.findOne({ mealId: meal._id });
  
  if (chat) {
    return next(new ErrorResponse('Esiste già una chat per questo pasto', 400));
  }
  
  // Crea la nuova chat
  chat = await Chat.create({
    name: `Chat - ${meal.title}`,
    mealId: meal._id,
    participants: meal.participants,
    messages: []
  });
  
  // Aggiorna il riferimento alla chat nel pasto
  meal.chatId = chat._id;
  await meal.save();
  
  res.status(201).json({
    success: true,
    data: chat
  });
});

/**
 * @desc    Ottieni una chat specifica
 * @route   GET /api/chats/:id
 * @access  Private
 */
exports.getChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id)
    .populate('participants', 'nickname profileImage')
    .populate('messages.sender', 'nickname profileImage');
  
  if (!chat) {
    return next(new ErrorResponse(`Chat non trovata con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa chat', 403));
  }
  
  res.status(200).json({
    success: true,
    data: chat
  });
});

/**
 * @desc    Ottieni la chat di un pasto specifico
 * @route   GET /api/chats/meal/:mealId
 * @access  Private
 */
exports.getMealChat = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.mealId);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato con id ${req.params.mealId}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante del pasto
  if (!meal.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa chat', 403));
  }
  
  const chat = await Chat.findById(meal.chatId)
    .populate('participants', 'nickname profileImage')
    .populate('messages.sender', 'nickname profileImage');
  
  if (!chat) {
    return next(new ErrorResponse('Chat non trovata per questo pasto', 404));
  }
  
  res.status(200).json({
    success: true,
    data: chat
  });
});

/**
 * @desc    Invia un messaggio in una chat
 * @route   POST /api/chats/:id/messages
 * @access  Private
 */
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    return next(new ErrorResponse('Il contenuto del messaggio è obbligatorio', 400));
  }
  
  const chat = await Chat.findById(req.params.id);
  
  if (!chat) {
    return next(new ErrorResponse(`Chat non trovata con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad inviare messaggi in questa chat', 403));
  }
  
  // Crea il nuovo messaggio
  const message = {
    sender: req.user.id,
    content: content.trim(),
    read: [req.user.id], // Il mittente ha già letto il messaggio
    timestamp: new Date()
  };
  
  // Aggiungi il messaggio alla chat
  chat.messages.push(message);
  chat.updatedAt = new Date(); // Aggiorna la data di modifica
  await chat.save();
  
  // Restituisci il messaggio popolato
  const updatedChat = await Chat.findById(req.params.id)
    .populate('messages.sender', 'nickname profileImage');
  const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
  
  res.status(201).json({
    success: true,
    data: newMessage
  });
});

/**
 * @desc    Segna i messaggi come letti
 * @route   PUT /api/chats/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  
  if (!chat) {
    return next(new ErrorResponse(`Chat non trovata con id ${req.params.id}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad accedere a questa chat', 403));
  }
  
  // Aggiorna tutti i messaggi non letti
  chat.messages.forEach(message => {
    if (!message.read.includes(req.user.id)) {
      message.read.push(req.user.id);
    }
  });
  
  await chat.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Ottieni tutti i messaggi non letti di tutte le chat dell'utente
 * @route   GET /api/chats/unread
 * @access  Private
 */
exports.getUnreadMessages = asyncHandler(async (req, res, next) => {
  // Trova tutte le chat a cui l'utente partecipa
  const chats = await Chat.find({ participants: req.user.id })
    .populate('participants', 'nickname profileImage')
    .populate('messages.sender', 'nickname profileImage');
  
  // Calcola i messaggi non letti per ogni chat
  const unreadMessages = {};
  
  chats.forEach(chat => {
    const unread = chat.messages.filter(message => 
      !message.read.includes(req.user.id) && 
      message.sender._id.toString() !== req.user.id
    );
    
    if (unread.length > 0) {
      unreadMessages[chat._id] = {
        chatId: chat._id,
        chatName: chat.name,
        mealId: chat.mealId,
        unreadCount: unread.length,
        lastMessage: unread[unread.length - 1],
        participants: chat.participants
      };
    }
  });
  
  res.status(200).json({
    success: true,
    count: Object.keys(unreadMessages).length,
    data: Object.values(unreadMessages)
  });
});

/**
 * @desc    Ottieni le chat dell'utente corrente
 * @route   GET /api/chats
 * @access  Private
 */
exports.getMyChats = asyncHandler(async (req, res, next) => {
  const chats = await Chat.find({ participants: req.user.id })
    .populate('participants', 'nickname profileImage')
    .populate('messages.sender', 'nickname profileImage')
    .sort({ updatedAt: -1 });
  
  // Per ogni chat, calcola i messaggi non letti
  const chatsWithUnread = chats.map(chat => {
    const unreadCount = chat.messages.filter(message => 
      !message.read.includes(req.user.id) && 
      message.sender._id.toString() !== req.user.id
    ).length;
    
    return {
      _id: chat._id,
      name: chat.name,
      mealId: chat.mealId,
      participants: chat.participants,
      updatedAt: chat.updatedAt,
      unreadCount,
      lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null
    };
  });
  
  res.status(200).json({
    success: true,
    count: chatsWithUnread.length,
    data: chatsWithUnread
  });
});

/**
 * @desc    Avvia una videochiamata per un pasto
 * @route   POST /api/chats/meals/:mealId/video
 * @access  Private
 */
exports.startVideoCall = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.mealId);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato con id ${req.params.mealId}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante del pasto
  if (!meal.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad avviare una videochiamata per questo pasto', 403));
  }
  
  // Qui puoi aggiungere la logica per avviare la videochiamata
  // Per esempio, generare un token per Twilio o un altro servizio
  
  res.status(200).json({
    success: true,
    message: 'Videochiamata avviata con successo'
  });
});

/**
 * @desc    Ottieni informazioni sulla videochiamata attiva
 * @route   GET /api/chats/meals/:mealId/video
 * @access  Private
 */
exports.getVideoCall = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.mealId);
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato con id ${req.params.mealId}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante del pasto
  if (!meal.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad accedere alle informazioni della videochiamata', 403));
  }
  
  // Qui puoi aggiungere la logica per ottenere le informazioni sulla videochiamata
  // Per esempio, lo stato della stanza Twilio
  
  res.status(200).json({
    success: true,
    data: {
      // Informazioni sulla videochiamata
    }
  });
});

/**
 * @desc    Aggiungi una reazione a un messaggio
 * @route   POST /api/chats/:mealId/reactions
 * @access  Private
 */
exports.addReaction = asyncHandler(async (req, res, next) => {
  const { messageId, reaction } = req.body;
  
  const chat = await Chat.findById(req.params.mealId);
  
  if (!chat) {
    return next(new ErrorResponse(`Chat non trovata con id ${req.params.mealId}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad aggiungere reazioni in questa chat', 403));
  }
  
  const message = chat.messages.id(messageId);
  
  if (!message) {
    return next(new ErrorResponse(`Messaggio non trovato con id ${messageId}`, 404));
  }
  
  // Aggiungi la reazione
  if (!message.reactions) {
    message.reactions = [];
  }
  
  message.reactions.push({
    user: req.user.id,
    type: reaction
  });
  
  await chat.save();
  
  res.status(200).json({
    success: true,
    data: message.reactions
  });
});

/**
 * @desc    Rimuovi una reazione da un messaggio
 * @route   DELETE /api/chats/:mealId/reactions/:reactionId
 * @access  Private
 */
exports.removeReaction = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.mealId);
  
  if (!chat) {
    return next(new ErrorResponse(`Chat non trovata con id ${req.params.mealId}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato a rimuovere reazioni in questa chat', 403));
  }
  
  const message = chat.messages.find(m => 
    m.reactions && m.reactions.some(r => r._id.toString() === req.params.reactionId)
  );
  
  if (!message) {
    return next(new ErrorResponse(`Reazione non trovata con id ${req.params.reactionId}`, 404));
  }
  
  // Rimuovi la reazione
  message.reactions = message.reactions.filter(r => 
    r._id.toString() !== req.params.reactionId
  );
  
  await chat.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Aggiorna lo stato di digitazione dell'utente
 * @route   POST /api/chats/:mealId/typing
 * @access  Private
 */
exports.updateTypingStatus = asyncHandler(async (req, res, next) => {
  const { isTyping } = req.body;
  
  const chat = await Chat.findById(req.params.mealId);
  
  if (!chat) {
    return next(new ErrorResponse(`Chat non trovata con id ${req.params.mealId}`, 404));
  }
  
  // Verifica che l'utente sia un partecipante
  if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Non autorizzato ad aggiornare lo stato di digitazione in questa chat', 403));
  }
  
  // Aggiorna lo stato di digitazione
  if (!chat.typingUsers) {
    chat.typingUsers = [];
  }
  
  if (isTyping) {
    if (!chat.typingUsers.includes(req.user.id)) {
      chat.typingUsers.push(req.user.id);
    }
  } else {
    chat.typingUsers = chat.typingUsers.filter(id => id !== req.user.id);
  }
  
  await chat.save();
  
  res.status(200).json({
    success: true,
    data: {
      isTyping
    }
  });
});