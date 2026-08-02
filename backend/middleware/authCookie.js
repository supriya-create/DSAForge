const config = require('../config/env');

const COOKIE_NAME = 'token';

/** Default cookie options shared by all auth flows. */
const baseOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax', // 'strict' blocks the cookie on legitimate cross-origin fetches; lax keeps CSRF-safe cookie auth working
  path: '/',
};

/** Sets the httpOnly session cookie. */
const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/** Clears the httpOnly session cookie on logout. */
const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, baseOptions);
};

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };
