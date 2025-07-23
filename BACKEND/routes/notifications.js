// File: BACKEND/routes/notifications.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyNotifications, markNotificationsAsRead } = require('../controllers/notificationsController');

// Tutte le rotte qui sono protette
router.use(protect);

router.route('/').get(protect, getMyNotifications);

router.route('/')
  .get(getMyNotifications);

router.route('/read')
  .post(markNotificationsAsRead);

module.exports = router;