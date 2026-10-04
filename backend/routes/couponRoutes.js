const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.get('/active', getActiveCoupons);
router.post('/validate', isAuthenticatedUser, validateCoupon);

// Admin routes
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), getAllCoupons);
router.post('/', isAuthenticatedUser, authorizeRoles('admin'), createCoupon);
router.put('/:id', isAuthenticatedUser, authorizeRoles('admin'), updateCoupon);
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteCoupon);

module.exports = router;
