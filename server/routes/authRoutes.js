const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);
router.delete('/me', protect, deleteAccount);

module.exports = router;
