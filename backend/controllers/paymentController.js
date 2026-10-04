const paymentService = require('../services/paymentService');
const Order = require('../models/Order');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Get Razorpay Public Key
// @route   GET /api/payments/key
// @access  Private
exports.getPaymentKey = (req, res) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
  });
};

// @desc    Create Razorpay Payment Order
// @route   POST /api/payments/create
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || amount <= 0) {
      return next(new ErrorHandler('Invalid payment amount', 400));
    }

    const paymentOrder = await paymentService.createPaymentOrder(
      amount,
      receipt || `receipt_${Date.now()}`
    );

    res.status(200).json({
      success: true,
      order: paymentOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId, // our DB order ID or SN-XXXX
    } = req.body;

    const isValid = paymentService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return next(new ErrorHandler('Payment verification failed. Invalid signature.', 400));
    }

    // If orderId is provided, update DB Order
    let updatedOrder = null;
    if (orderId) {
      updatedOrder = await Order.findOneAndUpdate(
        { $or: [{ _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }, { orderId }] },
        {
          paymentStatus: 'Paid',
          orderStatus: 'Confirmed',
          'paymentDetails.razorpayOrderId': razorpayOrderId,
          'paymentDetails.razorpayPaymentId': razorpayPaymentId,
          'paymentDetails.razorpaySignature': razorpaySignature,
          'paymentDetails.paidAt': Date.now(),
          $push: {
            statusHistory: {
              status: 'Confirmed',
              timestamp: Date.now(),
              note: 'Payment verified successfully via Razorpay',
            },
          },
        },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
