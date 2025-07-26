const LeaveReport = require('../models/LeaveReport');
const Meal = require('../models/Meal');
const Chat = require('../models/Chat');

// Report abbandono pasto
exports.createMealLeaveReport = async (req, res, next) => {
  try {
    const { reason, customReason } = req.body;
    if (!reason && !customReason) {
      return res.status(400).json({ success: false, message: 'Devi specificare un motivo.' });
    }
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ success: false, message: 'Pasto non trovato.' });
    }
    // Controllo autorizzazione: solo partecipanti o host
    if (!meal.participants.map(id => id.toString()).includes(req.user.id) && meal.host.toString() !== req.user.id) {
      return next(new ErrorResponse('Puoi segnalare solo i pasti a cui hai partecipato.', 403));
    }
    const report = await LeaveReport.create({
      type: 'meal',
      meal: req.params.id,
      user: req.user.id,
      reason,
      customReason
    });
    res.status(201).json({ success: true, message: 'Motivo di abbandono pasto registrato.', data: report });
  } catch (error) {
    next(error);
  }
};

// Report abbandono chat
exports.createChatLeaveReport = async (req, res, next) => {
  try {
    const { reason, customReason } = req.body;
    if (!reason && !customReason) {
      return res.status(400).json({ success: false, message: 'Devi specificare un motivo.' });
    }
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat non trovata.' });
    }
    // Controllo autorizzazione: solo partecipanti
    if (!chat.participants.map(id => id.toString()).includes(req.user.id)) {
      return next(new ErrorResponse('Puoi segnalare solo le chat a cui hai partecipato.', 403));
    }
    const report = await LeaveReport.create({
      type: 'chat',
      chat: req.params.id,
      user: req.user.id,
      reason,
      customReason
    });
    res.status(201).json({ success: true, message: 'Motivo di abbandono chat registrato.', data: report });
  } catch (error) {
    next(error);
  }
};

// Rotta admin per vedere tutti i report
exports.getAllLeaveReports = async (req, res, next) => {
  try {
    const reports = await LeaveReport.find()
      .populate('user', 'nickname email')
      .populate('meal', 'title')
      .populate('chat', 'name');
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
}; 