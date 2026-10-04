const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updatePassword,
  updateProfile,
} = require('../controllers/authController');
const { isAuthenticatedUser } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/password/forgot', authLimiter, forgotPassword);
router.put('/password/reset/:token', authLimiter, resetPassword);

router.get('/me', isAuthenticatedUser, getUserProfile);
router.put('/me/update', isAuthenticatedUser, updateProfile);
router.put('/password/update', isAuthenticatedUser, updatePassword);

module.exports = router;
