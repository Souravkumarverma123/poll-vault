const User = require('../models/User');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    setTokenCookie(res, token); // httpOnly cookie — JS cannot access this

    res.status(201).json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, email: user.email },
        // token intentionally NOT returned in body — use httpOnly cookie only.
        // Socket.IO reads the cookie from the handshake headers automatically.
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

    const token = generateToken(user._id);
    setTokenCookie(res, token); // httpOnly cookie — JS cannot access this

    res.json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, email: user.email },
        // token intentionally NOT returned in body — use httpOnly cookie only.
        // Socket.IO reads the cookie from the handshake headers automatically.
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user — clear httpOnly cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: { _id: req.user._id, name: req.user.name, email: req.user.email },
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
      data: { user: { _id: user._id, name: user.name, email: user.email } },
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
    const Poll = require('../models/Poll');
    const Response = require('../models/Response');
    const polls = await Poll.find({ creator: user._id });
    const pollIds = polls.map(p => p._id);
    await Response.deleteMany({ poll: { $in: pollIds } });
    await Poll.deleteMany({ creator: user._id });
    await User.findByIdAndDelete(user._id);

    clearTokenCookie(res);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, updateProfile, deleteAccount };
