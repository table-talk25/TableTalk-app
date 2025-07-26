const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

// Report abbandono pasto
router.post('/meals/:id/leave-report', protect, reportsController.createMealLeaveReport);

// Report abbandono chat
router.post('/chats/:id/leave-report', protect, reportsController.createChatLeaveReport);

// (Opzionale) Rotta admin per vedere tutti i report
router.get('/leave-reports', protect, adminOnly, reportsController.getAllLeaveReports);

module.exports = router; 