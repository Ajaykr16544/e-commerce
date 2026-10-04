const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
} = require('../controllers/wishlistController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.use(isAuthenticatedUser);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.post('/:productId/move-to-cart', moveToCart);

module.exports = router;
