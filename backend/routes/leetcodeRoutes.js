const express = require('express');
const { getLeetCodeProfile, syncLeetCodeProfileHandler } = require('../controllers/leetcodeController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getLeetCodeProfile);
router.post('/sync', authenticate, syncLeetCodeProfileHandler);

module.exports = router;
