const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId, version = 0) => {
  return jwt.sign({ id: userId, version }, process.env.JWT_SECRET, {
    expiresIn: '2d',
  });
};

/**
 * Set both Access and Refresh JWTs as httpOnly cookies on the response.
 */
const setCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  };

  res.cookie('pollvault_access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('pollvault_refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
  });
};

const clearCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    expires: new Date(0),
  };
  
  res.cookie('pollvault_access_token', '', cookieOptions);
  res.cookie('pollvault_refresh_token', '', cookieOptions);
};

module.exports = { generateAccessToken, generateRefreshToken, setCookies, clearCookies };
