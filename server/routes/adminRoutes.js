const express = require('express');
const router = express.Router();
const { getSystemStats } = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect);
router.use(isAdmin);

router.get('/stats', getSystemStats);

module.exports = router;
