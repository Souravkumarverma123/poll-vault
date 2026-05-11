const User = require('../models/User');
const Poll = require('../models/Poll');
const Response = require('../models/Response');

// @desc    Get global system statistics for admin dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res, next) => {
  try {
    // 1. Total registered users
    const totalUsers = await User.countDocuments();

    const now = new Date();
    const [totalPolls, publishedPolls, closedPolls, activePolls, totalResponses] = await Promise.all([
      Poll.countDocuments(),
      Poll.countDocuments({ isPublished: true }),
      Poll.countDocuments({ isPublished: false, $or: [{ isClosed: true }, { expiresAt: { $lte: now } }] }),
      Poll.countDocuments({ isPublished: false, isClosed: false, expiresAt: { $gt: now } }),
      Response.countDocuments(),
    ]);

    // 3. Total responses recorded (already fetched via Promise.all)

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPolls,
        publishedPolls,
        activePolls,
        closedPolls,
        totalResponses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls across the platform (Admin)
// @route   GET /api/admin/polls
// @access  Private/Admin
const getAllPolls = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const [total, polls] = await Promise.all([
      Poll.countDocuments(),
      Poll.find()
        .populate('creator', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    // Attach response counts
    const pollIds = polls.map((p) => p._id);
    const responseCounts = await Response.aggregate([
      { $match: { poll: { $in: pollIds } } },
      { $group: { _id: '$poll', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    responseCounts.forEach((r) => { countMap[r._id.toString()] = r.count; });

    // We can't import computeStatus here due to circular dependency issues, so we replicate the simple logic
    const pollsWithStats = polls.map((poll) => {
      let status = 'active';
      if (poll.isPublished) status = 'published';
      else if (poll.isClosed || new Date(poll.expiresAt) <= new Date()) status = 'closed';

      return {
        ...poll,
        responseCount: countMap[poll._id.toString()] || 0,
        status,
      };
    });

    res.json({
      success: true,
      data: {
        polls: pollsWithStats,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin force close poll
// @route   PATCH /api/admin/polls/:id/close
// @access  Private/Admin
const adminClosePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    
    poll.isClosed = true;
    await poll.save();

    res.json({ success: true, message: 'Poll force-closed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin delete poll
// @route   DELETE /api/admin/polls/:id
// @access  Private/Admin
const adminDeletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

    await Response.deleteMany({ poll: poll._id });
    await Poll.findByIdAndDelete(poll._id);

    res.json({ success: true, message: 'Poll deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select('-password -refreshTokenVersion')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent removing your own admin status accidentally
    if (user._id.toString() === req.user._id.toString() && role === 'user') {
      return res.status(400).json({ success: false, message: 'Cannot demote yourself' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: `User role updated to ${role}`, data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const adminDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account from dashboard' });
    }

    // Cascade delete polls and responses
    const userPolls = await Poll.find({ creator: user._id }).select('_id');
    const userPollIds = userPolls.map(p => p._id);

    await Response.deleteMany({ poll: { $in: userPollIds } }); // Delete responses to their polls
    await Response.deleteMany({ user: user._id }); // Delete their responses to other polls
    await Poll.deleteMany({ creator: user._id }); // Delete their polls
    await User.findByIdAndDelete(user._id); // Delete the user

    res.json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getSystemStats, 
  getAllPolls, 
  adminClosePoll, 
  adminDeletePoll, 
  getAllUsers, 
  updateUserRole, 
  adminDeleteUser 
};
