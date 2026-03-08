/**
 * EduPath — middleware/rateLimiter.js
 * All rate limiters
 */

const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Too many auth attempts. Wait 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.user?.id?.toString() || req.ip,
  message: { success: false, error: 'AI message limit reached. Wait 10 minutes.' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { success: false, error: 'Too many reset attempts. Try in 1 hour.' },
});

module.exports = { globalLimiter, authLimiter, aiLimiter, passwordResetLimiter };