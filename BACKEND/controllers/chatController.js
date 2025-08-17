// File: BACKEND/controllers/chatController.js (Versione Finale Completa)

const Chat = require('../models/Chat');
const Meal = require('../models/Meal');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

/**
 * @desc    Ottieni una chat specifica e la sua cronologia
 * @route   GET /api/chats/:chatId
 * @access  Private
 */
exports.getChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return next(new ErrorResponse('ID della chat non valido', 400));
  }

  const chat = await Chat.findById(chatId)
    .populate({ path: 'mealId', select: 'host title date duration' })
    .populate({ path: 'participants', select: 'nickname profileImage' })
    .populate({ path: 'messages.sender', select: 'nickname profileImage' });

  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (chat.isExpired || chat.isClosed) {
    return next(new ErrorResponse('Questa chat è terminata o chiusa.', 403));
  }
  if (!chat.participants.some(p => p.equals(req.user._id))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa chat', 403));
  }

  res.status(200).json({ success: true, data: chat });
});

/**
 * @desc    Invia un nuovo messaggio in una chat
 * @route   POST /api/chats/:chatId/messages
 * @access  Private
 */
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const senderId = req.user._id;

  // Controllo per messaggi vuoti
  if (!content || content.trim() === '') {
    return next(new ErrorResponse('Il contenuto del messaggio non può essere vuoto', 400));
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (!chat.participants.some(p => p.equals(senderId))) {
    return next(new ErrorResponse('Non sei autorizzato a inviare messaggi in questa chat', 403));
  }

  const message = {
    sender: senderId,
    text: content,
    read: [senderId] // Il mittente ha già "letto" il messaggio
  };

  chat.messages.push(message);
  await chat.save();

  // NOTA: In futuro, qui emetteremo un evento con Socket.io per inviare
  // il messaggio in tempo reale a tutti gli altri partecipanti.

  // Per ora, restituiamo la chat aggiornata con il nuovo messaggio.
  const populatedChat = await Chat.findById(chatId)
    .populate({ path: 'messages.sender', select: 'nickname profileImage' });

  res.status(201).json({
    success: true,
    data: populatedChat.messages[populatedChat.messages.length - 1] // Restituisce solo il nuovo messaggio creato
  });
});

/**
 * @desc    Inizia a scrivere (typing indicator)
 * @route   POST /api/chats/:chatId/typing/start
 * @access  Private
 */
exports.startTyping = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return next(new ErrorResponse('ID della chat non valido', 400));
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (!chat.participants.some(p => p.equals(userId))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa chat', 403));
  }

  await chat.startTyping(userId);
  
  res.status(200).json({ 
    success: true, 
    message: 'Typing indicator attivato',
    typingUsers: chat.typingUsers
  });
});

/**
 * @desc    Smetti di scrivere (typing indicator)
 * @route   POST /api/chats/:chatId/typing/stop
 * @access  Private
 */
exports.stopTyping = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return next(new ErrorResponse('ID della chat non valido', 400));
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (!chat.participants.some(p => p.equals(userId))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa chat', 403));
  }

  await chat.stopTyping(userId);
  
  res.status(200).json({ 
    success: true, 
    message: 'Typing indicator disattivato',
    typingUsers: chat.typingUsers
  });
});

/**
 * @desc    Marca i messaggi come letti
 * @route   POST /api/chats/:chatId/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return next(new ErrorResponse('ID della chat non valido', 400));
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (!chat.participants.some(p => p.equals(userId))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa chat', 403));
  }

  await chat.markAsRead(userId);
  
  res.status(200).json({ 
    success: true, 
    message: 'Messaggi marcati come letti',
    readBy: chat.messages.map(msg => ({
      messageId: msg._id,
      readBy: msg.readBy
    }))
  });
});

/**
 * @desc    Ottieni lo stato di typing e lettura della chat
 * @route   GET /api/chats/:chatId/status
 * @access  Private
 */
exports.getChatStatus = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return next(new ErrorResponse('ID della chat non valido', 400));
  }

  const chat = await Chat.findById(chatId)
    .populate({ path: 'typingUsers.user', select: 'nickname profileImage' })
    .populate({ path: 'messages.readBy.user', select: 'nickname profileImage' });

  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (!chat.participants.some(p => p.equals(userId))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa chat', 403));
  }

  // Filtra gli utenti che scrivono (escludi l'utente corrente)
  const otherTypingUsers = chat.typingUsers.filter(tu => !tu.user.equals(userId));
  
  // Ottieni le conferme di lettura per i messaggi dell'utente corrente
  const userMessages = chat.messages.filter(msg => msg.sender.equals(userId));
  const readStatus = userMessages.map(msg => ({
    messageId: msg._id,
    readBy: msg.readBy.filter(rb => !rb.user.equals(userId)) // Escludi l'utente corrente
  }));

  res.status(200).json({ 
    success: true, 
    data: {
      typingUsers: otherTypingUsers,
      readStatus,
      lastActivity: chat.lastActivity
    }
  });
});

/**
 * @desc    Ottieni la chat associata a un pasto (creandola se non esiste)
 * @route   GET /api/chats/meal/:mealId
 * @access  Private
 */
exports.getMealChat = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.mealId).populate('participants', '_id');
  
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato con id ${req.params.mealId}`, 404));
  }
  if (!meal.participants.some(p => p._id.equals(req.user._id))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa chat', 403));
  }
  
  let chat = await Chat.findOne({ mealId: meal._id });
  
  if (!chat) {
    // Se la chat non esiste, la creiamo al volo
    chat = await Chat.create({
      name: `Chat per: ${meal.title}`,
      mealId: meal._id,
      participants: meal.participants.map(p => p._id),
    });
    meal.chatId = chat._id;
    await meal.save();
  }
  
  // Popoliamo la chat (trovata o appena creata) per la risposta
  const populatedChat = await Chat.findById(chat._id);

  res.status(200).json({ success: true, data: populatedChat });
});

/**
 * @desc    Ottieni le chat dell'utente corrente
 * @route   GET /api/chats
 * @access  Private
 */
exports.getMyChats = asyncHandler(async (req, res, next) => {
  const chats = await Chat.find({ participants: req.user.id })
    .sort({ updatedAt: -1 });
  
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
 * @desc    Ottieni un riepilogo dei messaggi non letti per l'utente
 * @route   GET /api/chats/unread
 * @access  Private
 */
exports.getUnreadMessages = asyncHandler(async (req, res, next) => {
  const chats = await Chat.find({ participants: req.user.id });
  
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
        unreadCount: unread.length,
        lastMessage: unread[unread.length - 1]
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
 * @desc    Segna i messaggi di una chat come letti
 * @route   PUT /api/chats/:chatId/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.chatId);
  
  if (!chat) {
    return next(new ErrorResponse(`Chat non trovata`, 404));
  }
  if (!chat.participants.some(p => p._id.equals(req.user.id))) {
    return next(new ErrorResponse('Non autorizzato', 403));
  }
  
  await chat.markAsRead(req.user.id);
  
  res.status(200).json({ success: true, data: {} });
});

/**
 * @desc    Permette a un utente di lasciare una chat (ma non il pasto)
 * @route   DELETE /api/chats/:chatId/participants
 * @access  Private
 */
exports.leaveChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const chat = await Chat.findById(chatId).populate('mealId', 'title host addNotification');
  
  if (!chat || !chat.mealId) {
    return next(new ErrorResponse('Chat o pasto associato non trovato', 404));
  }
  if (chat.mealId.host.toString() === userId) {
    return next(new ErrorResponse('L\'organizzatore non può lasciare la chat.', 403));
  }

  await chat.removeParticipant(userId);
  
  const notificationMessage = `${req.user.nickname} ha lasciato la chat per il tuo pasto "${chat.mealId.title}". La sua partecipazione è ancora confermata.`;
  await chat.mealId.addNotification('system', notificationMessage, chat.mealId.host);
  
  res.status(200).json({
    success: true,
    message: 'Hai lasciato la chat con successo.'
  });
});

/**
 * @desc    Chiudi una chat (solo organizzatore del pasto)
 * @route   PUT /api/chats/:chatId/close
 * @access  Private
 */
exports.closeChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const chat = await Chat.findById(chatId).populate('mealId', 'host title');
  if (!chat || !chat.mealId) {
    return next(new ErrorResponse('Chat o pasto associato non trovato', 404));
  }
  if (chat.mealId.host.toString() !== userId) {
    return next(new ErrorResponse('Solo l’organizzatore può chiudere la chat', 403));
  }
  if (chat.isClosed) {
    return res.status(200).json({ success: true, message: 'Chat già chiusa' });
  }
  chat.isClosed = true;
  await chat.save();

  return res.status(200).json({ success: true, message: 'Chat chiusa con successo' });
});

// GET /api/chats/:chatId/messages?page=1&limit=20
exports.getChatMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Trova la chat e verifica che l'utente sia un partecipante
  const chat = await Chat.findById(chatId)
    .populate({ path: 'participants', select: 'nickname profileImage' });

  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (!chat.participants.some(p => p._id.equals(req.user._id))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa chat', 403));
  }

  // Paginazione dei messaggi (dal più recente al più vecchio)
  const totalMessages = chat.messages.length;
  const messages = chat.messages
    .slice()
    .reverse()
    .slice(skip, skip + limit)
    .reverse(); // Riordina dal più vecchio al più recente

  res.status(200).json({
    success: true,
    data: messages,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages
    }
  });
});