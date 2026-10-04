const express = require('express');
const router = express.Router();
const {
  createProductReview,
  getProductReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.get('/:productId', getProductReviews);
router.post('/', isAuthenticatedUser, createProductReview);
router.delete('/:id', isAuthenticatedUser, deleteReview);

module.exports = router;
