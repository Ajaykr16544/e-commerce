const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please enter recipient name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please enter contact phone number'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please enter street address / house / building'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please enter city'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'Please enter state'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Please enter postal / pincode'],
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    addressType: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// If this address is set as default, unset other default addresses for this user
addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema);
