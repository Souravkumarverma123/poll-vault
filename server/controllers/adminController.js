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

    // 2. Poll statistics (total, active, closed)
    const polls = await Poll.find({}, 'isPublished isClosed expiresAt').lean();
    
    let totalPolls = polls.length;
    let publishedPolls = 0;
    let closedPolls = 0;
    let activePolls = 0;

    const now = new Date();

    polls.forEach((poll) => {
      let status = 'draft';
      if (poll.isPublished) {
        if (poll.isClosed || (poll.expiresAt && new Date(poll.expiresAt) < now)) {
          status = 'closed';
        } else {
          status = 'active';
        }
      } else if (poll.isClosed) {
        status = 'closed';
      }

      if (status === 'active') activePolls++;
      if (status === 'closed') closedPolls++;
      if (poll.isPublished) publishedPolls++;
    });

    // 3. Total responses recorded
    const totalResponses = await Response.countDocuments();

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

module.exports = { getSystemStats };
