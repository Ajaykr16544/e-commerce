const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../services/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      discountAmount,
      couponCode,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentDetails,
    } = req.body;

    if (!items || items.length === 0) {
      return next(new ErrorHandler('No order items provided', 400));
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return next(new ErrorHandler('Shipping address is required', 400));
    }

    // Verify stock and update product stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(
          new ErrorHandler(`Product with ID ${item.product} not found`, 404)
        );
      }
      if (product.stock < item.quantity) {
        return next(
          new ErrorHandler(
            `Insufficient stock for "${product.name}". Available: ${product.stock}`,
            400
          )
        );
      }
      // Decrement stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Generate unique order ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `SN-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const isPaid = paymentMethod !== 'COD' && paymentDetails?.razorpayPaymentId;

    const order = await Order.create({
      orderId,
      user: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus: isPaid ? 'Paid' : 'Pending',
      paymentDetails: isPaid
        ? {
            ...paymentDetails,
            paidAt: Date.now(),
          }
        : undefined,
      orderStatus: isPaid ? 'Confirmed' : 'Pending',
      statusHistory: [
        {
          status: isPaid ? 'Confirmed' : 'Pending',
          timestamp: Date.now(),
          note: isPaid
            ? 'Payment verified and order confirmed'
            : 'Order placed, awaiting processing',
        },
      ],
      itemsPrice,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || '',
      shippingPrice: shippingPrice || 0,
      taxPrice: taxPrice || 0,
      totalPrice,
    });

    // Clear user cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], coupon: null }
    );

    // Send confirmation email
    try {
      await sendEmail({
        email: req.user.email,
        subject: `Order Confirmed: ${order.orderId} - ShopNest`,
        message: `Hello ${req.user.name},\n\nThank you for shopping with ShopNest!\nYour order #${order.orderId} has been successfully placed.\n\nTotal Amount: ₹${totalPrice}\nPayment Method: ${paymentMethod}\nStatus: ${order.orderStatus}\n\nYou can track your shipment anytime in your ShopNest account.`,
      });
    } catch (e) {
      console.warn('[Order] Confirmation email notice:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      return next(new ErrorHandler('Order not found', 404));
    }

    // Only order owner or admin can view
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorHandler('Not authorized to view this order', 403));
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order (Customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorHandler('Not authorized to cancel this order', 403));
    }

    if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
      return next(
        new ErrorHandler(
          `Cannot cancel order once it is ${order.orderStatus}. Please initiate a return after delivery.`,
          400
        )
      );
    }

    order.orderStatus = 'Cancelled';
    order.cancelledAt = Date.now();
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: Date.now(),
      note: order.cancelReason,
    });

    // Restock products
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// =================== ADMIN CONTROLLERS =================== //

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    if (search) {
      filter.$or = [
        { orderId: new RegExp(search, 'i') },
        { 'shippingAddress.fullName': new RegExp(search, 'i') },
        { 'shippingAddress.phone': new RegExp(search, 'i') },
      ];
    }

    const totalOrders = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Calculate total revenue from paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      totalOrders,
      totalPages: Math.ceil(totalOrders / Number(limit)) || 1,
      page: Number(page),
      totalRevenue,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status / tracking info (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, courierPartner, note, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler('Order not found', 404));
    }

    if (status) {
      order.orderStatus = status;
      order.statusHistory.push({
        status,
        timestamp: Date.now(),
        note: note || `Order updated to ${status}`,
      });

      if (status === 'Delivered') {
        order.deliveredAt = Date.now();
        order.paymentStatus = 'Paid';
      }

      if (status === 'Cancelled' && order.orderStatus !== 'Cancelled') {
        order.cancelledAt = Date.now();
        // Restock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }
    if (courierPartner !== undefined) {
      order.courierPartner = courierPartner;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};
