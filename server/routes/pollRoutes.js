import express from 'express';

// Import all poll controller functions
import {
  createPoll, getMyPolls, getPollById, editPoll, deletePoll,
  closePoll, publishPoll, unpublishPoll, getPublicPoll,
  submitResponse, getAnalytics,
} from '../controllers/pollController.js';

// `protect` requires a valid JWT — blocks unauthenticated users with 401
// `optionalAuth` attaches user if token present, but never blocks
import { protect, optionalAuth } from '../middleware/auth.js';

// Input validation middleware chains built with express-validator
import { validatePoll, validateResponse } from '../middleware/validate.js';

// Tighter rate limiter dedicated to response submissions (10 req/min in prod)
import { responseLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
// Must be declared BEFORE `/:id` routes — otherwise Express treats "public"
// as a MongoDB ObjectId and throws a CastError on every public poll request.
router.get('/public/:shareId', getPublicPoll);

// ── Protected poll management routes ─────────────────────────────────────────
router.post('/',        protect, validatePoll, createPoll);   // Create a new poll
router.get('/',         protect, getMyPolls);                  // List user's polls (paginated)
router.get('/:id',      protect, getPollById);                 // Get single poll by ID
router.patch('/:id',    protect, editPoll);                    // Update poll (pre-publish only)
router.delete('/:id',   protect, deletePoll);                  // Delete poll + all responses
router.patch('/:id/close',     protect, closePoll);            // Manually stop accepting responses
router.patch('/:id/publish',   protect, publishPoll);          // Make results public
router.patch('/:id/unpublish', protect, unpublishPoll);        // Retract published results
router.get('/:id/analytics',   protect, getAnalytics);         // Fetch per-question stats

// ── Response submission ───────────────────────────────────────────────────────
// FIX #2: `optionalAuth` → `protect`.
// All polls require a logged-in user. Previously the route used `optionalAuth`
// while the controller immediately rejected unauthenticated users — creating a
// misleading contract. `protect` is the single, honest source of truth here.
router.post('/:pollId/responses', protect, responseLimiter, validateResponse, submitResponse);

export default router;
