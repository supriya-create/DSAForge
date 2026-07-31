const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter, googleLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Password strength policy (min 8, upper, lower, number, special char).
// Factory returns a fresh validator chain for a given field name.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const strengthFor = (field) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(PASSWORD_PATTERN)
    .withMessage('Password must include uppercase, lowercase, a number, and a special character');

// Validation middleware
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  strengthFor('password')
];

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  strengthFor('newPassword')
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes — rate-limited to prevent brute-force and mass-signup abuse.
router.post('/register', registerLimiter, validateRegister, authController.register);
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/google', googleLimiter, authController.googleLogin);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', loginLimiter, authenticate, validateChangePassword, authController.changePassword);
router.post('/verify-token', authenticate, authController.verifyToken);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
