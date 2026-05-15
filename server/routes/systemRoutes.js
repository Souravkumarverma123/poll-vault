import express from 'express';
import SystemSettings from '../models/SystemSettings.js';

const router = express.Router();

// @desc    Get public system configuration for the client (announcement banner only)
// @route   GET /api/system/config
// @access  Public — no authentication required
//
// FIX #1: Removed `allowRegistrations` from the public response.
// Exposing that field let any anonymous caller detect whether the platform
// is in invite-only mode, which is internal operational state. Only the
// announcement message is legitimately public-facing information.
router.get('/config', async (req, res) => {
  try {
    // Fetch the single settings document; create defaults if it doesn't exist yet
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    // Return only the announcement message — no internal toggle state
    res.json({
      success: true,
      data: {
        announcementMessage: settings.announcementMessage,
      },
    });
  } catch (error) {
    // Avoid leaking error details to unauthenticated callers
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;
