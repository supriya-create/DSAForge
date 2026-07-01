const express = require('express');
const trackerController = require('../controllers/trackerController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Protected tracker routes
router.get('/', authenticate, trackerController.getTrackerData);
router.post('/progress', authenticate, trackerController.addTopicProgress);
router.put('/progress/:topic', authenticate, trackerController.updateTopicProgress);
router.put('/streak', authenticate, trackerController.updateStreak);
router.get('/leetcode', authenticate, trackerController.getLeetCodeData);
router.post('/leetcode/sync', authenticate, trackerController.syncLeetCodeData);
router.get('/activity', authenticate, trackerController.getWeeklyActivity);

module.exports = router;
