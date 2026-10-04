const Coupon = require('../models/Coupon');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;

    if (!code) {
      return next(new ErrorHandler('Please provide coupon code', 400));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return next(new ErrorHandler('Invalid coupon code', 404));
    }

    const check = coupon.isValid(amount || 0);
    if (!check.valid) {
      return next(new ErrorHandler(check.message, 400));
    }

    const discountAmount = coupon.calculateDiscount(amount || 0);

    res.status(200).json({
      success: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active public coupons
// @route   GET /api/coupons/active
// @access  Public
exports.getActiveCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
    }).select('code discountType discountValue minimumOrderAmount maximumDiscount expiryDate');

    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// =================== ADMIN CONTROLLERS =================== //

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons/admin/all
// @access  Private/Admin
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return next(new ErrorHandler('Coupon code already exists', 400));
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minimumOrderAmount: minimumOrderAmount || 0,
      maximumDiscount: maximumDiscount || 10000,
      expiryDate,
      usageLimit: usageLimit || 100,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res, next) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase().trim();
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return next(new ErrorHandler('Coupon not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return next(new ErrorHandler('Coupon not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
