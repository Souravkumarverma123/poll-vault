import express from 'express';
import { 
  getSystemStats,
  getAllPolls,
  adminClosePoll,
  adminDeletePoll,
  getAllUsers,
  updateUserRole,
  adminDeleteUser,
  getSystemSettings,
  updateSystemSettings
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

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

export default router;
