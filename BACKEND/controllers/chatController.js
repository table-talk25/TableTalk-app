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
    .populate({ path: 'mealId', select: 'date duration' })
    .populate({ path: 'participants', select: 'nickname profileImage' })
    .populate({ path: 'messages.sender', select: 'nickname profileImage' });

  if (!chat) {
    return next(new ErrorResponse('Chat non trovata', 404));
  }
  if (chat.isExpired) {
    return next(new ErrorResponse('Questa chat è terminata.', 403));
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
  const { text } = req.body;
  const senderId = req.user._id;

  if (!text || text.trim() === '') {
    return next(new ErrorResponse('Il messaggio non può essere vuoto', 400));
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
    text: text,
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