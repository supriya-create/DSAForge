/**
 * Centralized, validated environment configuration.
 *
 * Architectural change: all env access flows through this module so the app
 * fails fast at startup when required secrets are missing, instead of silently
 * falling back to insecure defaults. Never add fallback secrets here.
 */
require('dotenv').config();

const REQUIRED_KEYS = ['JWT_SECRET', 'MONGODB_URI'];
const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error(
    `[env] Fatal: missing required environment variables: ${missing.join(', ')}\n` +
      'Add them to backend/.env (see backend/.env.example). Refusing to start.'
  );
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',

  mongodbUri: process.env.MONGODB_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',

  // Frontend origin (used for CORS + secure cookies)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Google OAuth (optional — Google login is disabled with a clear error if absent)
  googleClientId: process.env.GOOGLE_CLIENT_ID || null,

  // Gemini (optional — AI endpoints degrade to local fallbacks if absent)
  geminiApiKey: process.env.GEMINI_API_KEY || null,

  // LeetCode
  leetcodeUserAgent: process.env.LEETCODE_USER_AGENT || 'DSAForge/1.0 (+https://example.com)',
};

module.exports = config;
