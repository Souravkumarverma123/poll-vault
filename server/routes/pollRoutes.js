const express = require('express');
const router = express.Router();
const {
  createPoll, getMyPolls, getPollById, editPoll, deletePoll,
  closePoll, publishPoll, unpublishPoll, getPublicPoll,
  submitResponse, getAnalytics,
} = require('../controllers/pollController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validatePoll, validateResponse } = require('../middleware/validate');

// Public routes (must be above parameterized routes)
router.get('/public/:shareId', getPublicPoll);

// Protected routes
router.post('/', protect, validatePoll, createPoll);
router.get('/', protect, getMyPolls);
router.get('/:id', protect, getPollById);
router.patch('/:id', protect, editPoll);
router.delete('/:id', protect, deletePoll);
router.patch('/:id/close', protect, closePoll);
router.patch('/:id/publish', protect, publishPoll);
router.patch('/:id/unpublish', protect, unpublishPoll);
router.get('/:id/analytics', protect, getAnalytics);

// Response submission — optionalAuth (attaches user if token present)
router.post('/:pollId/responses', optionalAuth, validateResponse, submitResponse);

module.exports = router;
