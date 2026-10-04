const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  toggleBlockUser,
} = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Customer address routes
router.get('/addresses', isAuthenticatedUser, getAddresses);
router.post('/addresses', isAuthenticatedUser, addAddress);
router.put('/addresses/:id', isAuthenticatedUser, updateAddress);
router.delete('/addresses/:id', isAuthenticatedUser, deleteAddress);
router.put('/addresses/:id/default', isAuthenticatedUser, setDefaultAddress);

// Admin dashboard & user management routes
router.get('/admin/dashboard-stats', isAuthenticatedUser, authorizeRoles('admin'), getDashboardStats);
router.get('/admin/users', isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.get('/admin/users/:id', isAuthenticatedUser, authorizeRoles('admin'), getUserDetails);
router.put('/admin/users/:id/role', isAuthenticatedUser, authorizeRoles('admin'), updateUserRole);
router.put('/admin/users/:id/block', isAuthenticatedUser, authorizeRoles('admin'), toggleBlockUser);

module.exports = router;
