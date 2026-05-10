const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Set JWT as an httpOnly cookie on the response.
 * Falls back gracefully in non-HTTPS environments.
 */
const setTokenCookie = (res, token) => {
  res.cookie('pollvault_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

const clearTokenCookie = (res) => {
  res.cookie('pollvault_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    expires: new Date(0),
  });
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie };
