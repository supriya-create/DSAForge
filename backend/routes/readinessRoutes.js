const express = require('express');
const readinessController = require('../controllers/readinessController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Real readiness assessment computed server-side from stored data.
router.post('/', aiLimiter, authenticate, readinessController.calculateReadiness);

module.exports = router;
