const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');

// @desc    Get public system config (announcement, etc.)
// @route   GET /api/system/config
// @access  Public
router.get('/config', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.json({
      success: true,
      data: {
        announcementMessage: settings.announcementMessage,
        allowRegistrations: settings.allowRegistrations
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
