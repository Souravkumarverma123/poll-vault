const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// In development, use lightweight limits to catch edge cases early
// In production, enforce strict limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 20,    // 100 in dev, 20 in prod
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const responseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 50 : 10, // 50 in dev, 10 in prod
  message: { success: false, message: 'Too many submissions. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 500 : 120,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, responseLimiter, generalLimiter };
