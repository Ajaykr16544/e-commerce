const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ErrorHandler = require('../utils/errorHandler');

// Helper to compute cart totals
const computeCartTotals = async (cart) => {
  let subtotal = 0;
  let items = [];

  for (const item of cart.items) {
    if (item.product) {
      const price = item.product.discountPrice || item.product.price;
      subtotal += price * item.quantity;
      items.push({
        _id: item._id,
        product: item.product,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price,
        itemTotal: price * item.quantity,
      });
    }
  }

  // Shipping calculation: Free if subtotal > 999, else 99
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;

  // Tax calculation: standard 5% GST
  const tax = Math.round(subtotal * 0.05);

  let discount = 0;
  let couponInfo = null;

  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);
    if (coupon) {
      const validity = coupon.isValid(subtotal);
      if (validity.valid) {
        discount = coupon.calculateDiscount(subtotal);
        couponInfo = {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: discount,
        };
      } else {
        // Expired or invalid coupon - clear it
        cart.coupon = null;
        await cart.save();
      }
    }
  }

  const grandTotal = Math.max(0, subtotal - discount + shipping + tax);

  return {
    items,
    itemCount: items.reduce((acc, curr) => acc + curr.quantity, 0),
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    shipping,
    tax,
    grandTotal: Math.round(grandTotal),
    coupon: couponInfo,
  };
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name slug price discountPrice discountPercentage images stock brand',
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const calculatedCart = await computeCartTotals(cart);

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        user: cart.user,
        ...calculatedCart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size = '', color = '' } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    if (product.stock < quantity) {
      return next(
        new ErrorHandler(`Only ${product.stock} items available in stock`, 400)
      );
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item with identical product, size, and color already exists in cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.size || '') === (size || '') &&
        (item.color || '') === (color || '')
    );

    const price = product.discountPrice || product.price;

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > product.stock) {
        return next(
          new ErrorHandler(`Cannot add more. Total in cart exceeds available stock (${product.stock})`, 400)
        );
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        size,
        color,
        price,
      });
    }

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name slug price discountPrice discountPercentage images stock brand',
    });

    const calculatedCart = await computeCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: {
        _id: cart._id,
        ...calculatedCart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/item/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return next(new ErrorHandler('Quantity must be at least 1', 400));
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorHandler('Cart not found', 404));
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return next(new ErrorHandler('Cart item not found', 404));
    }

    const product = await Product.findById(item.product);
    if (product && product.stock < quantity) {
      return next(
        new ErrorHandler(`Only ${product.stock} items available in stock`, 400)
      );
    }

    item.quantity = quantity;
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name slug price discountPrice discountPercentage images stock brand',
    });

    const calculatedCart = await computeCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: {
        _id: cart._id,
        ...calculatedCart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:itemId
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorHandler('Cart not found', 404));
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name slug price discountPrice discountPercentage images stock brand',
    });

    const calculatedCart = await computeCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        _id: cart._id,
        ...calculatedCart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.coupon = null;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: {
        items: [],
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        grandTotal: 0,
        coupon: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/cart/coupon
// @access  Private
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return next(new ErrorHandler('Please enter coupon code', 400));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return next(new ErrorHandler('Invalid coupon code', 404));
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return next(new ErrorHandler('Cannot apply coupon to an empty cart', 400));
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    const check = coupon.isValid(subtotal);
    if (!check.valid) {
      return next(new ErrorHandler(check.message, 400));
    }

    cart.coupon = coupon._id;
    await cart.save();

    const calculatedCart = await computeCartTotals(cart);

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      cart: {
        _id: cart._id,
        ...calculatedCart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/coupon
// @access  Private
exports.removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (cart) {
      cart.coupon = null;
      await cart.save();
    }

    const calculatedCart = await computeCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Coupon removed',
      cart: {
        _id: cart._id,
        ...calculatedCart,
      },
    });
  } catch (error) {
    next(error);
  }
};
