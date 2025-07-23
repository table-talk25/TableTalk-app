const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const LeaveReport = require('../models/LeaveReport');

// Report abbandono pasto
router.post('/meals/:id/leave-report', protect, async (req, res) => {
  const { reason, customReason } = req.body;
  await LeaveReport.create({
    type: 'meal',
    meal: req.params.id,
    user: req.user.id,
    reason,
    customReason
  });
  res.status(201).json({ success: true, message: 'Motivo di abbandono pasto registrato.' });
});

// Report abbandono chat
router.post('/chats/:id/leave-report', protect, async (req, res) => {
  const { reason, customReason } = req.body;
  await LeaveReport.create({
    type: 'chat',
    chat: req.params.id,
    user: req.user.id,
    reason,
    customReason
  });
  res.status(201).json({ success: true, message: 'Motivo di abbandono chat registrato.' });
});

// (Opzionale) Rotta admin per vedere tutti i report
router.get('/leave-reports', protect, adminOnly, async (req, res) => {
  // Qui puoi aggiungere un controllo isAdmin se vuoi
  const reports = await LeaveReport.find()
    .populate('user', 'nickname email')
    .populate('meal', 'title')
    .populate('chat', 'name');
  res.json({ success: true, data: reports });
});

module.exports = router; 