const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Protected AI routes
router.post('/analyze', authenticate, aiController.analyzeProgress);
router.get('/analyze', authenticate, aiController.getLatestAnalysis);

router.post('/doubt-solve', authenticate, aiController.solveDoubt);
router.get('/doubt-history', authenticate, aiController.getDoubtHistory);

router.post('/roadmap', authenticate, aiController.generateRoadmap);
router.get('/roadmap', authenticate, aiController.getLatestRoadmap);

router.post('/mock-oa', authenticate, aiController.generateMockOA);
router.get('/mock-oa', authenticate, aiController.getLatestMockOA);

router.post('/problems', authenticate, aiController.recommendProblems);
router.get('/problems', authenticate, aiController.getLatestRecommendations);

module.exports = router;
