/**
 * ══════════════════════════════════════════
 * EduPath Backend — config/jwt.js
 * JWT configuration + token helpers
 * Location: /edupath/config/jwt.js
 * ══════════════════════════════════════════
 */

const jwt = require('jsonwebtoken');

// ── Config values from .env ───────────────
const JWT_CONFIG = {
  secret        : process.env.JWT_SECRET,
  expiresIn     : process.env.JWT_EXPIRES_IN          || '7d',
  refreshSecret : process.env.JWT_REFRESH_SECRET,
  refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN  || '30d',
};

// ── Validate secrets are set ──────────────
if (!JWT_CONFIG.secret || !JWT_CONFIG.refreshSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production!');
  } else {
    console.warn('⚠️  JWT secrets not set — using insecure defaults for development only');
    JWT_CONFIG.secret         = 'dev_secret_change_me';
    JWT_CONFIG.refreshSecret  = 'dev_refresh_secret_change_me';
  }
}

// ══════════════════════════════════════════
// Token generators
// ══════════════════════════════════════════

/**
 * Generate a short-lived access token
 * @param {string} userId - MongoDB ObjectId
 * @returns {string} JWT token
 */
const generateAccessToken = (userId) =>
  jwt.sign(
    { id: userId },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );

/**
 * Generate a long-lived refresh token
 * @param {string} userId - MongoDB ObjectId
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    JWT_CONFIG.refreshSecret,
    { expiresIn: JWT_CONFIG.refreshExpires }
  );

/**
 * Verify an access token
 * @param {string} token
 * @returns {object} decoded payload { id, iat, exp }
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, JWT_CONFIG.secret);

/**
 * Verify a refresh token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, JWT_CONFIG.refreshSecret);

/**
 * Build and send token response to client
 * @param {object} user   - Mongoose user document
 * @param {number} status - HTTP status code
 * @param {object} res    - Express response object
 */
const sendTokenResponse = (user, status, res) => {
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Never send password in response
  user.password = undefined;

  res.status(status).json({
    success     : true,
    accessToken,
    refreshToken,
    expiresIn   : JWT_CONFIG.expiresIn,
    user,
  });
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  sendTokenResponse,
};