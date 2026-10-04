const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true,
      maxLength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Please enter product description'],
    },
    shortDescription: {
      type: String,
      default: '',
      maxLength: [300, 'Short description cannot exceed 300 characters'],
    },
    brand: {
      type: String,
      required: [true, 'Please enter product brand'],
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select category for this product'],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please enter original product price'],
      min: [0, 'Price must be positive'],
      index: true,
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price must be positive'],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be less than 0'],
      max: [100, 'Discount percentage cannot exceed 100'],
    },
    stock: {
      type: Number,
      required: [true, 'Please enter product stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 10,
    },
    sku: {
      type: String,
      required: [true, 'Please enter product SKU'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    images: [
      {
        public_id: {
          type: String,
          default: '',
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    specifications: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    variants: {
      sizes: [
        {
          type: String,
          trim: true,
        },
      ],
      colors: [
        {
          name: { type: String, trim: true },
          hex: { type: String, trim: true },
          inStock: { type: Boolean, default: true },
        },
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound Text Index for fast full-text searching across name, brand, description, tags, sku
productSchema.index(
  {
    name: 'text',
    brand: 'text',
    description: 'text',
    tags: 'text',
    sku: 'text',
  },
  {
    weights: {
      name: 10,
      brand: 5,
      sku: 5,
      tags: 3,
      description: 1,
    },
    name: 'ProductTextIndex',
  }
);

// Pre-save hook: auto slug & discount percentage
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Math.floor(1000 + Math.random() * 9000);
  }
  if (this.price && this.discountPrice && this.discountPrice < this.price) {
    this.discountPercentage = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  } else if (!this.discountPrice || this.discountPrice >= this.price) {
    this.discountPrice = this.price;
    this.discountPercentage = 0;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
