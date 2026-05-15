import User from '../models/User.js';
import Poll from '../models/Poll.js';
import Response from '../models/Response.js';
import SystemSettings from '../models/SystemSettings.js';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, setCookies, clearCookies } from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (settings && settings.allowRegistrations === false) {
      return res.status(403).json({
        success: false,
        message: 'Sign-ups are currently closed. Please try again later.',
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({ name, email, password });
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, user.refreshTokenVersion);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, user.refreshTokenVersion);
    setCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user — clear httpOnly cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshTokenVersion += 1;
      await user.save();
    }
    clearCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
  const token = req.cookies.pollvault_refresh_token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no refresh token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('refreshTokenVersion role name email');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (decoded.version !== user.refreshTokenVersion) {
      user.refreshTokenVersion += 1;
      await user.save();
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const newVersion = user.refreshTokenVersion + 1;
    user.refreshTokenVersion = newVersion;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, newVersion);
    setCookies(res, accessToken, refreshToken);

    res.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, refresh token invalid or expired' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
    },
  });
};

// @desc    Update profile (name, email, password)
// @route   PATCH /api/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Update name / email
    if (name) user.name = name;
    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) return res.status(409).json({ success: false, message: 'Email is already in use' });
      user.email = email;
    }

    // Change password (requires currentPassword)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/me
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Cascade delete polls and responses
    const polls = await Poll.find({ creator: user._id });
    const pollIds = polls.map(p => p._id);
    await Response.deleteMany({ poll: { $in: pollIds } });
    await Poll.deleteMany({ creator: user._id });
    await User.findByIdAndDelete(user._id);

    clearCookies(res);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export { register, login, logout, refresh, getMe, updateProfile, deleteAccount };
