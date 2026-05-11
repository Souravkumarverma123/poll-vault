const express = require('express');
const router = express.Router();
const { 
  getSystemStats,
  getAllPolls,
  adminClosePoll,
  adminDeletePoll,
  getAllUsers,
  updateUserRole,
  adminDeleteUser,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect);
router.use(isAdmin);

router.get('/stats', getSystemStats);

router.get('/settings', getSystemSettings);
router.patch('/settings', updateSystemSettings);

router.get('/polls', getAllPolls);
router.patch('/polls/:id/close', adminClosePoll);
router.delete('/polls/:id', adminDeletePoll);

router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', adminDeleteUser);

module.exports = router;
