const express = require('express');
const router = express.Router();
const {
  getPaymentKey,
  createPayment,
  verifyPayment,
} = require('../controllers/paymentController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.get('/key', isAuthenticatedUser, getPaymentKey);
router.post('/create', isAuthenticatedUser, createPayment);
router.post('/verify', isAuthenticatedUser, verifyPayment);

module.exports = router;
