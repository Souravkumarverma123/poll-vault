const Poll = require('../models/Poll');
const Response = require('../models/Response');
const { nanoid } = require('nanoid');
const { getIO } = require('../socket/socketHandler');

// Helper: aggregate analytics for a poll
const aggregateAnalytics = async (pollId) => {
  const results = await Response.aggregate([
    { $match: { poll: pollId } },
    { $unwind: '$answers' },
    {
      $group: {
        _id: {
          questionId: '$answers.questionId',
          selectedOption: '$answers.selectedOption',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.questionId',
        options: {
          $push: {
            optionText: '$_id.selectedOption',
            count: '$count',
          },
        },
        totalForQuestion: { $sum: '$count' },
      },
    },
  ]);

  const totalResponses = await Response.countDocuments({ poll: pollId });

  // Format the results to include percentages
  const questionStats = results.map(q => ({
    questionId: q._id,
    options: q.options.map(opt => ({
      optionText: opt.optionText,
      count: opt.count,
      percentage: q.totalForQuestion > 0
        ? Math.round((opt.count / q.totalForQuestion) * 100)
        : 0,
    })),
  }));

  return { totalResponses, questionStats };
};

// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private
const createPoll = async (req, res, next) => {
  try {
    const { title, description, questions, responseMode, expiresAt } = req.body;

    const poll = await Poll.create({
      creator: req.user._id,
      shareId: nanoid(10),
      title,
      description: description || '',
      questions,
      responseMode: responseMode || 'anonymous',
      expiresAt: new Date(expiresAt),
    });

    res.status(201).json({
      success: true,
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls for logged-in user
// @route   GET /api/polls
// @access  Private
const getMyPolls = async (req, res, next) => {
  try {
    const polls = await Poll.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Attach response counts
    const pollIds = polls.map(p => p._id);
    const responseCounts = await Response.aggregate([
      { $match: { poll: { $in: pollIds } } },
      { $group: { _id: '$poll', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    responseCounts.forEach(r => {
      countMap[r._id.toString()] = r.count;
    });

    const pollsWithStats = polls.map(poll => {
      const now = new Date();
      let status = 'active';
      if (poll.isPublished) status = 'published';
      else if (poll.expiresAt <= now) status = 'closed';

      return {
        ...poll,
        responseCount: countMap[poll._id.toString()] || 0,
        status,
      };
    });

    res.json({
      success: true,
      data: { polls: pollsWithStats },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get poll by ID (creator only)
// @route   GET /api/polls/:id
// @access  Private
const getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const responseCount = await Response.countDocuments({ poll: poll._id });
    const now = new Date();
    let status = 'active';
    if (poll.isPublished) status = 'published';
    else if (poll.expiresAt <= now) status = 'closed';

    res.json({
      success: true,
      data: { poll: { ...poll, responseCount, status } },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a poll
// @route   DELETE /api/polls/:id
// @access  Private
const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete poll and all associated responses
    await Response.deleteMany({ poll: poll._id });
    await Poll.findByIdAndDelete(poll._id);

    res.json({
      success: true,
      message: 'Poll deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish poll results
// @route   PATCH /api/polls/:id/publish
// @access  Private
const publishPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (poll.isPublished) {
      return res.status(400).json({ success: false, message: 'Poll is already published' });
    }

    poll.isPublished = true;
    await poll.save();

    res.json({
      success: true,
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public poll (form or published results)
// @route   GET /api/polls/public/:shareId
// @access  Public
const getPublicPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ shareId: req.params.shareId }).lean();

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    const now = new Date();
    let status = 'active';
    if (poll.isPublished) status = 'published';
    else if (poll.expiresAt <= now) status = 'closed';

    const responseData = {
      _id: poll._id,
      title: poll.title,
      description: poll.description,
      questions: poll.questions,
      responseMode: poll.responseMode,
      expiresAt: poll.expiresAt,
      isPublished: poll.isPublished,
      status,
    };

    // If published, include analytics
    if (poll.isPublished) {
      const analytics = await aggregateAnalytics(poll._id);
      responseData.analytics = analytics;
    }

    res.json({
      success: true,
      data: { poll: responseData },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a response to a poll
// @route   POST /api/polls/:pollId/responses
// @access  Public or Private (depends on poll.responseMode)
const submitResponse = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.pollId);

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    // Check if poll is published
    if (poll.isPublished) {
      return res.status(403).json({ success: false, message: 'Poll results have been published. No more responses accepted.' });
    }

    // Check if poll has expired
    if (poll.expiresAt <= new Date()) {
      return res.status(410).json({ success: false, message: 'This poll has expired and is no longer accepting responses.' });
    }

    // Check authentication for authenticated polls
    if (poll.responseMode === 'authenticated' && !req.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to respond to this poll.' });
    }

    // Check for duplicate authenticated response
    if (poll.responseMode === 'authenticated' && req.user) {
      const existingResponse = await Response.findOne({
        poll: poll._id,
        user: req.user._id,
      });
      if (existingResponse) {
        return res.status(409).json({ success: false, message: 'You have already submitted a response to this poll.' });
      }
    }

    const { answers } = req.body;

    // Validate answers against poll questions
    const questionMap = {};
    poll.questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    // Check all required questions are answered
    for (const question of poll.questions) {
      if (question.isRequired) {
        const answer = answers.find(a => a.questionId === question._id.toString());
        if (!answer) {
          return res.status(400).json({
            success: false,
            message: `Question "${question.questionText}" is required.`,
          });
        }
      }
    }

    // Validate each answer's option exists
    for (const answer of answers) {
      const question = questionMap[answer.questionId];
      if (!question) {
        return res.status(400).json({
          success: false,
          message: `Invalid question ID: ${answer.questionId}`,
        });
      }
      if (!question.options.includes(answer.selectedOption)) {
        return res.status(400).json({
          success: false,
          message: `Invalid option "${answer.selectedOption}" for question "${question.questionText}"`,
        });
      }
    }

    // Create response
    const responseDoc = await Response.create({
      poll: poll._id,
      user: req.user ? req.user._id : null,
      clientFingerprint: req.body.clientFingerprint || null,
      answers,
    });

    // Aggregate updated stats
    const analytics = await aggregateAnalytics(poll._id);

    // Emit real-time update to creator's dashboard
    try {
      const io = getIO();
      io.to(`poll_${poll._id}`).emit('response:new', {
        pollId: poll._id,
        totalResponses: analytics.totalResponses,
        questionStats: analytics.questionStats,
      });
    } catch (socketError) {
      console.error('Socket emit error:', socketError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      data: { totalResponses: analytics.totalResponses },
    });
  } catch (error) {
    // Handle duplicate key error for authenticated users
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a response to this poll.',
      });
    }
    next(error);
  }
};

// @desc    Get analytics for a poll (creator only)
// @route   GET /api/polls/:id/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const analytics = await aggregateAnalytics(poll._id);

    // Merge analytics with question data for context
    const questionsWithStats = poll.questions.map(q => {
      const stats = analytics.questionStats.find(
        s => s.questionId.toString() === q._id.toString()
      );
      return {
        _id: q._id,
        questionText: q.questionText,
        options: q.options.map(optText => {
          const optStat = stats
            ? stats.options.find(o => o.optionText === optText)
            : null;
          return {
            optionText: optText,
            count: optStat ? optStat.count : 0,
            percentage: optStat ? optStat.percentage : 0,
          };
        }),
        isRequired: q.isRequired,
      };
    });

    res.json({
      success: true,
      data: {
        totalResponses: analytics.totalResponses,
        questions: questionsWithStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPoll,
  getMyPolls,
  getPollById,
  deletePoll,
  publishPoll,
  getPublicPoll,
  submitResponse,
  getAnalytics,
};
