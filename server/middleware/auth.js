const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Extract JWT from httpOnly cookie first, then Authorization header as fallback.
 */
const extractToken = (req) => {
  if (req.cookies && req.cookies.pollvault_token) {
    return req.cookies.pollvault_token;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

// Protect routes — require valid JWT
const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

// Optional auth — attach user if token present, but don't block
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Token invalid — continue without user
    }
  }

  next();
};

module.exports = { protect, optionalAuth };
