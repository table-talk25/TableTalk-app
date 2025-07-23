// File: BACKEND/controllers/notificationsController.js

const asyncHandler = require('express-async-handler');
const Meal = require('../models/Meal');

/**
 * @desc    Ottenere le notifiche per l'utente loggato
 * @route   GET /api/notifications
 */
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  // Troviamo tutti i pasti dove l'utente loggato è il destinatario di una notifica
  const mealsWithNotifications = await Meal.find({ 
    'notifications.recipient': req.user.id 
  }).select('notifications title _id');

  // Estraiamo e filtriamo solo le notifiche per l'utente corrente
  const userNotifications = mealsWithNotifications.flatMap(meal => 
    meal.notifications
      .filter(notif => notif.recipient.toString() === req.user.id)
      .map(notif => ({
        ...notif.toObject(),
        mealId: meal._id, // Aggiungiamo l'ID del pasto per creare un link
        mealTitle: meal.title, // E il titolo
      }))
  ).sort((a, b) => b.createdAt - a.createdAt); // Ordiniamo dalla più recente

  res.status(200).json({
    success: true,
    count: userNotifications.length,
    data: userNotifications,
  });
});

/**
 * @desc    Segnare le notifiche come lette
 * @route   POST /api/notifications/read
 */
exports.markNotificationsAsRead = asyncHandler(async (req, res, next) => {
    await Meal.updateMany(
        { 'notifications.recipient': req.user.id, 'notifications.read': false },
        { $set: { 'notifications.$[].read': true } }
    );

    res.status(200).json({ success: true, message: 'Notifiche segnate come lette' });
});