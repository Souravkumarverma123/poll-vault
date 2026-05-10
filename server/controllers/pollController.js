const crypto = require('crypto');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const { nanoid } = require('nanoid');
const { getIO } = require('../socket/socketHandler');
const { generateFingerprint, computeStatus } = require('../utils/helpers');

// ── Helper: aggregate analytics for a poll ───────────────────────────────────
const aggregateAnalytics = async (pollId) => {
  const responses = await Response.find({ poll: pollId }).lean();
  const totalResponses = responses.length;

  const poll = await Poll.findById(pollId).lean();
  if (!poll) return { totalResponses: 0, questionStats: [] };

  const questionStats = poll.questions.map((q) => {
    const qIdStr = q._id.toString();
    const allAnswers = responses.map(r => r.answers.find(a => a.questionId.toString() === qIdStr)).filter(Boolean);

    if (q.questionType === 'text') {
      return {
        questionId: q._id,
        questionType: 'text',
        answers: allAnswers.map(a => a.textAnswer).filter(Boolean),
        totalForQuestion: allAnswers.length,
      };
    }

    // single or multiple
    const optionCounts = {};
    q.options.forEach(opt => { optionCounts[opt] = 0; });

    allAnswers.forEach(a => {
      const selections = q.questionType === 'multiple' ? (a.selectedOptions || []) : (a.selectedOption ? [a.selectedOption] : []);
      selections.forEach(sel => {
        if (optionCounts[sel] !== undefined) optionCounts[sel]++;
      });
    });

    const totalVotes = Object.values(optionCounts).reduce((s, c) => s + c, 0);
    const options = q.options.map(opt => ({
      optionText: opt,
      count: optionCounts[opt],
      percentage: totalVotes > 0 ? Math.round((optionCounts[opt] / totalVotes) * 100) : 0,
    }));

    return { questionId: q._id, questionType: q.questionType || 'single', options, totalForQuestion: allAnswers.length };
  });

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

    res.status(201).json({ success: true, data: { poll } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls for logged-in user (with pagination + search + sort)
// @route   GET /api/polls?page=1&limit=20&search=foo&sort=newest&status=active
// @access  Private
const getMyPolls = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search?.trim() || '';
    const sort = req.query.sort || 'newest';
    const statusFilter = req.query.status || '';

    const baseQuery = { creator: req.user._id };
    const searchQuery = search
      ? {
          ...baseQuery,
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : baseQuery;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      expiring: { expiresAt: 1 },
      title: { title: 1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    // ── Paginated polls ──────────────────────────────────────────────────────
    const [total, polls] = await Promise.all([
      Poll.countDocuments(searchQuery),
      Poll.find(searchQuery).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
    ]);

    // ── Response counts for this page only (single aggregation) ─────────────
    const pollIds = polls.map(p => p._id);
    const responseCounts = await Response.aggregate([
      { $match: { poll: { $in: pollIds } } },
      { $group: { _id: '$poll', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    responseCounts.forEach(r => { countMap[r._id.toString()] = r.count; });

    // Attach status (uses pure computeStatus — no require() inside loop)
    let pollsWithStats = polls.map(poll => ({
      ...poll,
      responseCount: countMap[poll._id.toString()] || 0,
      status: computeStatus(poll),
    }));

    // Status filter applied after in-memory status computation
    if (statusFilter && ['active', 'closed', 'published'].includes(statusFilter)) {
      pollsWithStats = pollsWithStats.filter(p => p.status === statusFilter);
    }

    // ── Summary stats: 3 targeted O(1) indexed queries — no full-table scan ──
    // activePolls = isPublished:false, isClosed:false, expiresAt > now
    const now = new Date();
    const [totalPolls, activePolls, totalResponses] = await Promise.all([
      Poll.countDocuments(baseQuery),
      Poll.countDocuments({ ...baseQuery, isPublished: false, isClosed: false, expiresAt: { $gt: now } }),
      Response.aggregate([
        { $lookup: { from: 'polls', localField: 'poll', foreignField: '_id', as: 'pollDoc' } },
        { $match: { 'pollDoc.creator': req.user._id } },
        { $count: 'total' },
      ]).then(r => (r[0]?.total ?? 0)),
    ]);

    res.json({
      success: true,
      data: {
        polls: pollsWithStats,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summaryStats: { totalPolls, activePolls, totalResponses },
      },
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
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const responseCount = await Response.countDocuments({ poll: poll._id });
    const status = computeStatus(poll); // uses top-level pure helper

    res.json({ success: true, data: { poll: { ...poll, responseCount, status } } });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a poll (title, description, questions, expiresAt, responseMode)
// @route   PATCH /api/polls/:id
// @access  Private
const editPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (poll.isPublished) {
      return res.status(400).json({ success: false, message: 'Cannot edit a published poll' });
    }

    const { title, description, questions, expiresAt, responseMode } = req.body;
    if (title !== undefined) poll.title = title;
    if (description !== undefined) poll.description = description;
    if (questions !== undefined) poll.questions = questions;
    if (expiresAt !== undefined) {
      if (new Date(expiresAt) <= new Date()) {
        return res.status(400).json({ success: false, message: 'Expiry date must be in the future' });
      }
      poll.expiresAt = new Date(expiresAt);
      poll.isClosed = false; // re-open if manually extending
    }
    if (responseMode !== undefined) poll.responseMode = responseMode;

    await poll.save();
    res.json({ success: true, data: { poll } });
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
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Response.deleteMany({ poll: poll._id });
    await Poll.findByIdAndDelete(poll._id);

    res.json({ success: true, message: 'Poll deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually close a poll early
// @route   PATCH /api/polls/:id/close
// @access  Private
const closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (poll.isPublished) {
      return res.status(400).json({ success: false, message: 'Poll is already published' });
    }

    poll.isClosed = true;
    await poll.save();

    res.json({ success: true, data: { poll }, message: 'Poll closed successfully' });
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
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (poll.isPublished) {
      return res.status(400).json({ success: false, message: 'Poll is already published' });
    }

    poll.isPublished = true;
    poll.isClosed = true; // Published polls stop accepting responses
    await poll.save();

    res.json({ success: true, data: { poll } });
  } catch (error) {
    next(error);
  }
};

// @desc    Unpublish poll results
// @route   PATCH /api/polls/:id/unpublish
// @access  Private
const unpublishPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!poll.isPublished) {
      return res.status(400).json({ success: false, message: 'Poll is not published' });
    }

    poll.isPublished = false;
    poll.isClosed = false; // Re-open for responses unless expired
    await poll.save();

    res.json({ success: true, data: { poll }, message: 'Poll unpublished successfully' });
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
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

    const status = computeStatus(poll); // uses top-level pure helper
    const totalResponses = await Response.countDocuments({ poll: poll._id });

    const responseData = {
      _id: poll._id,
      title: poll.title,
      description: poll.description,
      questions: poll.questions,
      responseMode: poll.responseMode,
      expiresAt: poll.expiresAt,
      isPublished: poll.isPublished,
      status,
      totalResponses, // visible to respondents
    };

    if (poll.isPublished) {
      const analytics = await aggregateAnalytics(poll._id);
      responseData.analytics = analytics;
    }

    res.json({ success: true, data: { poll: responseData } });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a response to a poll
// @route   POST /api/polls/:pollId/responses
// @access  Public or Private
const submitResponse = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

    if (poll.isPublished) {
      return res.status(403).json({ success: false, message: 'Poll results have been published. No more responses accepted.' });
    }
    if (poll.isClosed || poll.expiresAt <= new Date()) {
      return res.status(410).json({ success: false, message: 'This poll is no longer accepting responses.' });
    }
    if (poll.responseMode === 'authenticated' && !req.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to respond to this poll.' });
    }

    // Duplicate check for authenticated
    if (poll.responseMode === 'authenticated' && req.user) {
      const existingResponse = await Response.findOne({ poll: poll._id, user: req.user._id });
      if (existingResponse) {
        return res.status(409).json({ success: false, message: 'You have already submitted a response to this poll.' });
      }
    }

    // Server-generated fingerprint for anonymous spam prevention
    const serverFingerprint = !req.user ? generateFingerprint(req) : null;

    // Duplicate check for anonymous via fingerprint
    if (serverFingerprint) {
      const existingAnon = await Response.findOne({ poll: poll._id, clientFingerprint: serverFingerprint });
      if (existingAnon) {
        return res.status(409).json({ success: false, message: 'You have already submitted a response to this poll.' });
      }
    }

    const { answers } = req.body;

    // Build question map
    const questionMap = {};
    poll.questions.forEach(q => { questionMap[q._id.toString()] = q; });

    // Validate required questions answered
    for (const question of poll.questions) {
      if (question.isRequired) {
        const answer = answers.find(a => a.questionId === question._id.toString());
        if (!answer) {
          return res.status(400).json({ success: false, message: `Question "${question.questionText}" is required.` });
        }
        if (question.questionType === 'text' && !answer.textAnswer?.trim()) {
          return res.status(400).json({ success: false, message: `Question "${question.questionText}" requires a text answer.` });
        }
        if (question.questionType === 'multiple' && (!answer.selectedOptions || answer.selectedOptions.length === 0)) {
          return res.status(400).json({ success: false, message: `Question "${question.questionText}" requires at least one selection.` });
        }
        if (question.questionType === 'single' && !answer.selectedOption) {
          return res.status(400).json({ success: false, message: `Question "${question.questionText}" requires a selection.` });
        }
      }
    }

    // Validate option values
    for (const answer of answers) {
      const question = questionMap[answer.questionId];
      if (!question) {
        return res.status(400).json({ success: false, message: `Invalid question ID: ${answer.questionId}` });
      }
      if (question.questionType === 'single' && answer.selectedOption && !question.options.includes(answer.selectedOption)) {
        return res.status(400).json({ success: false, message: `Invalid option for question "${question.questionText}"` });
      }
      if (question.questionType === 'multiple' && answer.selectedOptions) {
        const invalid = answer.selectedOptions.filter(o => !question.options.includes(o));
        if (invalid.length > 0) {
          return res.status(400).json({ success: false, message: `Invalid option(s) for question "${question.questionText}"` });
        }
      }
    }

    await Response.create({
      poll: poll._id,
      user: req.user ? req.user._id : null,
      clientFingerprint: serverFingerprint,
      answers,
    });

    const analytics = await aggregateAnalytics(poll._id);

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
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already submitted a response to this poll.' });
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
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const analytics = await aggregateAnalytics(poll._id);

    const questionsWithStats = poll.questions.map(q => {
      const stats = analytics.questionStats.find(s => s.questionId.toString() === q._id.toString());
      if (q.questionType === 'text') {
        return {
          _id: q._id,
          questionText: q.questionText,
          questionType: 'text',
          isRequired: q.isRequired,
          answers: stats ? stats.answers : [],
          totalForQuestion: stats ? stats.totalForQuestion : 0,
        };
      }
      return {
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType || 'single',
        options: q.options.map(optText => {
          const optStat = stats ? stats.options.find(o => o.optionText === optText) : null;
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
      data: { totalResponses: analytics.totalResponses, questions: questionsWithStats },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPoll, getMyPolls, getPollById, editPoll, deletePoll,
  closePoll, publishPoll, unpublishPoll, getPublicPoll,
  submitResponse, getAnalytics,
};
