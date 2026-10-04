const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please enter coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Please specify discount type (percentage or fixed)'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Please enter discount value'],
      min: [0, 'Discount value cannot be negative'],
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
    },
    maximumDiscount: {
      type: Number,
      default: 10000,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please specify coupon expiry date'],
    },
    usageLimit: {
      type: Number,
      default: 100,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check validity
couponSchema.methods.isValid = function (orderAmount = 0) {
  const now = new Date();
  if (!this.isActive) {
    return { valid: false, message: 'This coupon is no longer active.' };
  }
  if (now > this.expiryDate) {
    return { valid: false, message: 'This coupon has expired.' };
  }
  if (now < this.startDate) {
    return { valid: false, message: 'This coupon is not active yet.' };
  }
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit has been reached.' };
  }
  if (this.minimumOrderAmount && orderAmount < this.minimumOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount to apply this coupon is ₹${this.minimumOrderAmount}.`,
    };
  }
  return { valid: true };
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maximumDiscount && discount > this.maximumDiscount) {
      discount = this.maximumDiscount;
    }
  } else if (this.discountType === 'fixed') {
    discount = Math.min(this.discountValue, orderAmount);
  }
  return Math.round(discount);
};

module.exports = mongoose.model('Coupon', couponSchema);
