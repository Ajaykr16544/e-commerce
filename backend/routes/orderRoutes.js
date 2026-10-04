const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderDetails,
  myOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Customer protected routes
router.post('/', isAuthenticatedUser, createOrder);
router.get('/my-orders', isAuthenticatedUser, myOrders);
router.get('/:id', isAuthenticatedUser, getOrderDetails);
router.put('/:id/cancel', isAuthenticatedUser, cancelOrder);

// Admin protected routes
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), getAllOrders);
router.put('/admin/:id/status', isAuthenticatedUser, authorizeRoles('admin'), updateOrderStatus);

module.exports = router;
