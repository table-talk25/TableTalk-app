const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const Meal = require('../models/Meal');
const User = require('../models/User');

exports.getMeals = asyncHandler(async (req, res, next) => {
  let queryBase;

  if (req.query.user) {
    const userId = req.query.user;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorResponse('ID utente non valido', 400));
    }
    queryBase = { $or: [{ host: userId }, { participants: userId }] };
  } else {
    queryBase = { status: { $in: ['upcoming', 'ongoing'] } };
  }

  const page = parseInt(req.query.page, 10) || 2;
  const limit = parseInt(req.query.limit, 10) || 6;
  const startIndex = (page - 1) * limit;
  const total = await Meal.countDocuments(queryBase);

  const meals = await Meal.find(queryBase)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage')
    .sort({ date: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {};
  if ((startIndex + meals.length) < total) {
    pagination.next = { page: page + 1, limit };
  }

  res.status(200).json({
    success: true,
    count: meals.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalResults: total,
    pagination,
    data: meals,
  });
});

/**
 * @desc    Ottieni un singolo pasto
 * @route   GET /api/meals/:id
 */
exports.getMeal = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse(`ID del pasto non valido`, 400));
  }
  const meal = await Meal.findById(req.params.id).populate('host', 'nickname profileImage').populate('participants', 'nickname profileImage');
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato con id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: meal });
});

/**
 * @desc    Crea un nuovo pasto
 * @route   POST /api/meals
 */
exports.createMeal = asyncHandler(async (req, res, next) => {
  req.body.host = req.user.id;
  const meal = await Meal.create(req.body);
  await User.findByIdAndUpdate(req.user.id, { $push: { createdMeals: meal._id } });
  const populatedMeal = await Meal.findById(meal._id).populate('host', 'nickname profileImage');
  res.status(201).json({ success: true, data: populatedMeal });
});

/**
 * @desc    Aggiorna un pasto
 * @route   PUT /api/meals/:id
 */
exports.updateMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato`, 404));
  }
  if (meal.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Non autorizzato a modificare questo pasto`, 403));
  }
  Object.assign(meal, req.body);
  await meal.save();
  res.status(200).json({ success: true, data: meal });
});

/**
 * @desc    Cancella un pasto (imposta stato a 'cancelled')
 * @route   DELETE /api/meals/:id
 */
exports.deleteMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) {
    return next(new ErrorResponse(`Pasto non trovato`, 404));
  }
  if (meal.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Non autorizzato a cancellare questo pasto`, 403));
  }
  meal.status = 'cancelled';
  await meal.save();
  res.status(200).json({ success: true, message: 'Pasto cancellato con successo' });
});

/**
 * @desc    Unisciti a un pasto
 * @route   POST /api/meals/:id/join
 */
exports.joinMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) { return next(new ErrorResponse(`Pasto non trovato`, 404)); }
  if (meal.participants.includes(req.user.id)) { return next(new ErrorResponse('Sei già un partecipante.', 400)); }
  if (meal.participants.length >= meal.maxParticipants) { return next(new ErrorResponse('Questo pasto è al completo.', 400)); }
  
  meal.participants.push(req.user.id);
  await meal.save();
  await User.findByIdAndUpdate(req.user.id, { $push: { joinedMeals: meal._id } });
  
  res.status(200).json({ success: true, message: 'Ti sei unito al pasto con successo' });
});

/**
 * @desc    Lascia un pasto
 * @route   DELETE /api/meals/:id/leave
 */
exports.leaveMeal = asyncHandler(async (req, res, next) => {
    const meal = await Meal.findById(req.params.id);
    if (!meal) { return next(new ErrorResponse(`Pasto non trovato`, 404)); }

    const initialCount = meal.participants.length;
    meal.participants = meal.participants.filter(id => id.toString() !== req.user.id);

    if (meal.participants.length < initialCount) {
        await meal.save();
        await User.findByIdAndUpdate(req.user.id, { $pull: { joinedMeals: meal._id } });
        res.status(200).json({ success: true, message: 'Hai lasciato il pasto con successo' });
    } else {
        return next(new ErrorResponse('Non sei un partecipante di questo pasto.', 400));
    }
});