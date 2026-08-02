const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Protected AI routes — rate-limited to cap Gemini API spend per IP.
router.post('/analyze', aiLimiter, authenticate, aiController.analyzeProgress);
router.get('/analyze', authenticate, aiController.getLatestAnalysis);

router.post('/doubt-solve', aiLimiter, authenticate, aiController.solveDoubt);
router.get('/doubt-history', authenticate, aiController.getDoubtHistory);

router.post('/roadmap', aiLimiter, authenticate, aiController.generateRoadmap);
router.get('/roadmap', authenticate, aiController.getLatestRoadmap);

router.post('/mock-oa', aiLimiter, authenticate, aiController.generateMockOA);
router.get('/mock-oa', authenticate, aiController.getLatestMockOA);

router.post('/problems', aiLimiter, authenticate, aiController.recommendProblems);
router.get('/problems', authenticate, aiController.getLatestRecommendations);

module.exports = router;
