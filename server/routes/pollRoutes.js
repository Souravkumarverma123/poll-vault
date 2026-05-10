const express = require('express');
const router = express.Router();
const {
  createPoll,
  getMyPolls,
  getPollById,
  deletePoll,
  publishPoll,
  getPublicPoll,
  submitResponse,
  getAnalytics,
} = require('../controllers/pollController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validatePoll, validateResponse } = require('../middleware/validate');

// Public routes (must be above parameterized routes to avoid conflicts)
router.get('/public/:shareId', getPublicPoll);

// Protected routes
router.post('/', protect, validatePoll, createPoll);
router.get('/', protect, getMyPolls);
router.get('/:id', protect, getPollById);
router.delete('/:id', protect, deletePoll);
router.patch('/:id/publish', protect, publishPoll);
router.get('/:id/analytics', protect, getAnalytics);

// Response submission — uses optionalAuth (attaches user if token present)
router.post('/:pollId/responses', optionalAuth, validateResponse, submitResponse);

module.exports = router;
