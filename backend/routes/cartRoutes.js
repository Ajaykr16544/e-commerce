const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} = require('../controllers/cartController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.use(isAuthenticatedUser);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/item/:itemId', updateCartItem);
router.delete('/item/:itemId', removeCartItem);
router.delete('/', clearCart);
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);

module.exports = router;
