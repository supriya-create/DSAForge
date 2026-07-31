const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Parses the JWT from the httpOnly cookie. The frontend authenticates entirely
 * via cookies (credentials: 'include'); the Authorization header is kept only
 * for tooling/backwards compatibility and is never set by the SPA.
 */
const extractToken = (req) => {
  // 1. httpOnly cookie
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('token='));
    if (match) return match.slice('token='.length);
  }
  // 2. Authorization: Bearer <token> (legacy / non-browser clients)
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
};

const authenticate = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

module.exports = { authenticate, extractToken };
