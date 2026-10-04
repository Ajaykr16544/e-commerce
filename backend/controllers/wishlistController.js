const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Get logged in user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name slug' },
    });

    res.status(200).json({
      success: true,
      count: user.wishlist.length,
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    const user = await User.findById(req.user.id);

    if (user.wishlist.includes(productId)) {
      return res.status(200).json({
        success: true,
        message: 'Product already in wishlist',
        wishlist: user.wishlist,
      });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: productId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move item from wishlist to cart
// @route   POST /api/wishlist/:productId/move-to-cart
// @access  Private
exports.moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const price = product.discountPrice || product.price;
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += 1;
    } else {
      cart.items.push({
        product: productId,
        quantity: 1,
        price,
      });
    }

    await cart.save();

    // Remove from wishlist
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { wishlist: productId },
    });

    res.status(200).json({
      success: true,
      message: 'Moved item to cart',
    });
  } catch (error) {
    next(error);
  }
};
