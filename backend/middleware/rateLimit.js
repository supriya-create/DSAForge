/**
 * Rate limiting middleware.
 *
 * Security: throttles brute-force attempts on auth endpoints and caps AI usage
 * to prevent unbounded Gemini API spend. Limits are per-IP.
 */
const rateLimit = require('express-rate-limit');

const standardHeaders = true;
const legacyHeaders = false;

/** Login / password reset — tight window to stop credential stuffing. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  standardHeaders,
  legacyHeaders,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

/** Registration — prevents mass signup abuse. */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 signups per IP
  standardHeaders,
  legacyHeaders,
  message: { success: false, message: 'Too many signup attempts. Please try again later.' },
});

/** Google OAuth — independent budget so attackers can't exhaust the login limiter. */
const googleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders,
  legacyHeaders,
  message: { success: false, message: 'Too many Google sign-in attempts. Please try again later.' },
});

/** AI endpoints — caps Gemini cost per IP. */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders,
  legacyHeaders,
  message: { success: false, message: 'Too many AI requests. Please wait a moment and retry.' },
});

module.exports = { loginLimiter, registerLimiter, googleLimiter, aiLimiter };
