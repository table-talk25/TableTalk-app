const mongoose = require('mongoose');

const LeaveReportSchema = new mongoose.Schema({
  type: { type: String, enum: ['meal', 'chat'], required: true }, // 'meal' o 'chat'
  meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal' },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  customReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LeaveReport', LeaveReportSchema); 