import Poll from '../models/Poll.js';
import Response from '../models/Response.js';
import { nanoid } from 'nanoid';
import { getIO } from '../socket/socketHandler.js';
import { computeStatus } from '../utils/helpers.js';



// ── Helper: aggregate analytics for a poll ───────────────────────────────────
const aggregateAnalytics = async (pollId) => {
  const poll = await Poll.findById(pollId).lean();
  if (!poll) return { totalResponses: 0, questionStats: [] };

  const totalResponses = await Response.countDocuments({ poll: poll._id });
  if (totalResponses === 0) {
    return {
      totalResponses: 0,
      questionStats: poll.questions.map(q => ({
        questionId: q._id,
        questionType: q.questionType,
        options: q.questionType !== 'text' ? q.options.map(opt => ({ optionText: opt, count: 0, percentage: 0 })) : undefined,
        answers: q.questionType === 'text' ? [] : undefined,
        totalForQuestion: 0
      }))
    };
  }

  const stats = await Response.aggregate([
    { $match: { poll: poll._id } },
    { $unwind: '$answers' },
    {
      $facet: {
        questionCounts: [
          { $group: { _id: '$answers.questionId', count: { $sum: 1 } } }
        ],
        textAnswers: [
          { $match: { 'answers.textAnswer': { $exists: true, $ne: '' } } },
          { $group: { _id: '$answers.questionId', answers: { $push: '$answers.textAnswer' } } }
        ],
        singleChoice: [
          { $match: { 'answers.selectedOption': { $exists: true, $ne: null } } },
          { $group: { _id: { questionId: '$answers.questionId', option: '$answers.selectedOption' }, count: { $sum: 1 } } }
        ],
        multipleChoice: [
          { $match: { 'answers.selectedOptions': { $exists: true, $not: { $size: 0 } } } },
          { $unwind: '$answers.selectedOptions' },
          { $group: { _id: { questionId: '$answers.questionId', option: '$answers.selectedOptions' }, count: { $sum: 1 } } }
        ]
      }
    }
  ]);

  const { questionCounts, textAnswers, singleChoice, multipleChoice } = stats[0];

  const questionStats = poll.questions.map((q) => {
    const qIdStr = q._id.toString();
    const qCountObj = questionCounts.find(qc => qc._id.toString() === qIdStr);
    const totalForQuestion = qCountObj ? qCountObj.count : 0;

    if (q.questionType === 'text') {
      const textData = textAnswers.find(t => t._id.toString() === qIdStr) || { answers: [] };
      return {
        questionId: q._id,
        questionType: 'text',
        answers: textData.answers,
        totalForQuestion,
      };
    }

    const choiceData = q.questionType === 'multiple' ? multipleChoice : singleChoice;
    
    const countsMap = {};
    choiceData.forEach(d => {
      if (d._id.questionId.toString() === qIdStr) {
        countsMap[d._id.option] = d.count;
      }
    });

    let totalVotes = 0;
    q.options.forEach(opt => { totalVotes += countsMap[opt] || 0; });

    const options = q.options.map(opt => ({
      optionText: opt,
      count: countsMap[opt] || 0,
      percentage: totalVotes > 0 ? Math.round(((countsMap[opt] || 0) / totalVotes) * 100) : 0,
    }));

    return { questionId: q._id, questionType: q.questionType || 'single', options, totalForQuestion };
  });

  return { totalResponses, questionStats };
};

// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private
const createPoll = async (req, res, next) => {
  try {
    const { title, description, questions, responseMode, expiresAt } = req.body;

    // Normalise in case client sends a legacy value (defensive)
    const mode = responseMode || 'anonymous';

    const poll = await Poll.create({
      creator: req.user._id,
      shareId: nanoid(10),
      title,
      description: description || '',
      questions,
      responseMode: mode,
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
    
    const now = new Date();
    let statusQuery = {};
    if (statusFilter === 'published') {
      statusQuery = { isPublished: true };
    } else if (statusFilter === 'closed') {
      statusQuery = { isPublished: false, $or: [{ isClosed: true }, { expiresAt: { $lte: now } }] };
    } else if (statusFilter === 'active') {
      statusQuery = { isPublished: false, isClosed: false, expiresAt: { $gt: now } };
    }

    const searchQuery = search
      ? {
          ...baseQuery,
          ...statusQuery,
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : { ...baseQuery, ...statusQuery };

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

    // Attach status
    let pollsWithStats = polls.map(poll => ({
      ...poll,
      responseCount: countMap[poll._id.toString()] || 0,
      status: computeStatus(poll),
    }));

    // ── Summary stats: efficient aggregation — no full-table scan ──────────
    const [totalPolls, activePolls, totalResponsesResult] = await Promise.all([
      Poll.countDocuments(baseQuery),
      Poll.countDocuments({ ...baseQuery, isPublished: false, isClosed: false, expiresAt: { $gt: now } }),
      Response.aggregate([
        { $lookup: { from: 'polls', localField: 'poll', foreignField: '_id', as: 'pollDoc' } },
        { $unwind: '$pollDoc' },
        { $match: { 'pollDoc.creator': req.user._id } },
        { $count: 'total' }
      ])
    ]);
    const totalResponses = totalResponsesResult[0]?.total || 0;

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
    // ── Duplicate check ──────────────────────────────────────────────────────
    // Auth is enforced at the route level via `protect` middleware.
    // Deduplication is handled by the unique { poll, user } DB index as a safety net.
    const existingResponse = await Response.findOne({ poll: poll._id, user: req.user._id });
    if (existingResponse) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a response to this poll.',
      });
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
        if (question.questionType === 'text') {
          if (!answer.textAnswer?.trim()) {
            return res.status(400).json({ success: false, message: `Question "${question.questionText}" requires a text answer.` });
          }
          // Basic HTML sanitization to prevent XSS
          answer.textAnswer = answer.textAnswer.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
      user: req.user._id,
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

      // Also emit to the creator's personal room so the main dashboard can update its stats
      io.to(`user_${poll.creator.toString()}`).emit('dashboard:update', {
        pollId: poll._id,
        totalResponses: analytics.totalResponses,
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

    const mode = poll.responseMode;
    const analytics = await aggregateAnalytics(poll._id);

    // For named polls: build a respondent map so we can show who voted for what
    let respondentMap = {}; // { questionId: { optionText: [{_id, name}] } }
    if (mode === 'named') {
      const responses = await Response.find({ poll: poll._id })
        .populate('user', 'name')
        .lean();

      responses.forEach((response) => {
        if (!response.user) return;
        response.answers.forEach((answer) => {
          const qId = answer.questionId.toString();
          if (!respondentMap[qId]) respondentMap[qId] = {};

          const addRespondent = (optionText) => {
            if (!respondentMap[qId][optionText]) respondentMap[qId][optionText] = [];
            respondentMap[qId][optionText].push({
              _id: response.user._id,
              name: response.user.name,
            });
          };

          if (answer.selectedOption) addRespondent(answer.selectedOption);
          if (answer.selectedOptions?.length) answer.selectedOptions.forEach(addRespondent);
        });
      });
    }

    const questionsWithStats = poll.questions.map((q) => {
      const qIdStr = q._id.toString();
      const stats = analytics.questionStats.find((s) => s.questionId.toString() === qIdStr);

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
        isRequired: q.isRequired,
        options: q.options.map((optText) => {
          const optStat = stats ? stats.options.find((o) => o.optionText === optText) : null;
          return {
            optionText: optText,
            count: optStat ? optStat.count : 0,
            percentage: optStat ? optStat.percentage : 0,
            // Only included for named polls — undefined for anonymous
            respondents: mode === 'named'
              ? (respondentMap[qIdStr]?.[optText] || [])
              : undefined,
          };
        }),
      };
    });

    res.json({
      success: true,
      data: {
        totalResponses: analytics.totalResponses,
        responseMode: mode,
        questions: questionsWithStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createPoll, getMyPolls, getPollById, editPoll, deletePoll,
  closePoll, publishPoll, unpublishPoll, getPublicPoll,
  submitResponse, getAnalytics,
};
