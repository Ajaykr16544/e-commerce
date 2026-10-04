const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Create or update product review
// @route   POST /api/reviews
// @access  Private
exports.createProductReview = async (req, res, next) => {
  try {
    const { rating, title, comment, productId } = req.body;

    if (!rating || !comment || !productId) {
      return next(new ErrorHandler('Rating, comment, and productId are required', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    // Check if user purchased the product
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'items.product': productId,
      orderStatus: { $in: ['Delivered', 'Confirmed', 'Processing', 'Shipped'] },
    });

    const isVerifiedPurchase = !!hasPurchased;

    // Check if user already reviewed
    let review = await Review.findOne({
      product: productId,
      user: req.user.id,
    });

    if (review) {
      review.rating = Number(rating);
      review.title = title || review.title;
      review.comment = comment;
      review.isVerifiedPurchase = isVerifiedPurchase;
      await review.save();
    } else {
      review = await Review.create({
        user: req.user.id,
        product: productId,
        rating: Number(rating),
        title: title || '',
        comment,
        isVerifiedPurchase,
      });
    }

    // Recalculate average
    await Review.calcAverageRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a product with breakdown
// @route   GET /api/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort('-createdAt');

    // Rating breakdown calculation
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((rev) => {
      const rounded = Math.round(rev.rating);
      if (breakdown[rounded] !== undefined) {
        breakdown[rounded] += 1;
      }
    });

    const total = reviews.length;
    const distribution = Object.keys(breakdown).map((star) => ({
      star: Number(star),
      count: breakdown[star],
      percentage: total > 0 ? Math.round((breakdown[star] / total) * 100) : 0,
    }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      distribution,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorHandler('Review not found', 404));
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorHandler('Not authorized to delete this review', 403));
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    await Review.calcAverageRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
