const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const User = require('../models/User');
const ErrorHandler = require('../utils/errorHandler');
const ApiFeatures = require('../utils/apiFeatures');
const mongoose = require('mongoose');

// @desc    Get all products with filtering, search, sorting & pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const resPerPage = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;
    const queryParams = { ...req.query };

    if (queryParams.category) {
      const categoryValues = String(queryParams.category)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const categoryIds = categoryValues.filter((value) => /^[0-9a-fA-F]{24}$/.test(value));
      const categorySlugs = categoryValues.filter((value) => !/^[0-9a-fA-F]{24}$/.test(value));
      const categoryConditions = [];

      if (categoryIds.length) categoryConditions.push({ _id: { $in: categoryIds } });
      if (categorySlugs.length) categoryConditions.push({ slug: { $in: categorySlugs } });

      const categories = categoryConditions.length
        ? await Category.find({ $or: categoryConditions }).select('_id')
        : [];
      queryParams.category = categories.map((category) => category._id.toString()).join(',');

      if (!categories.length) {
        return res.status(200).json({
          success: true,
          page,
          limit: resPerPage,
          totalProducts: 0,
          totalPages: 1,
          products: [],
        });
      }
    }

    // First count total matching documents before pagination
    const countFeatures = new ApiFeatures(Product.find(), queryParams)
      .search()
      .filter();

    const totalProducts = await countFeatures.query.countDocuments();

    // Query with pagination & sorting
    const apiFeatures = new ApiFeatures(Product.find(), queryParams)
      .search()
      .filter()
      .sort()
      .pagination(resPerPage);

    const products = await apiFeatures.query.populate('category', 'name slug');

    const totalPages = Math.ceil(totalProducts / resPerPage) || 1;

    res.status(200).json({
      success: true,
      page,
      limit: resPerPage,
      totalProducts,
      totalPages,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product filter options from the full catalog
// @route   GET /api/products/filters
// @access  Public
exports.getProductFilters = async (req, res, next) => {
  try {
    const [brands, sizes, colors] = await Promise.all([
      Product.distinct('brand'),
      Product.distinct('variants.sizes'),
      Product.distinct('variants.colors.name'),
    ]);

    res.status(200).json({
      success: true,
      filters: {
        brands: brands.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        sizes: sizes.filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        colors: colors.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details by ID or Slug
// @route   GET /api/products/:identifier
// @access  Public
exports.getProductDetails = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let query;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { _id: identifier };
    } else {
      query = { slug: identifier };
    }

    const product = await Product.findOne(query).populate('category', 'name slug');

    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    // Get product reviews
    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate('user', 'name avatar')
      .sort('-createdAt');

    // If user is authenticated, add to recently viewed
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { recentlyViewed: product._id },
      });
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          recentlyViewed: {
            $each: [product._id],
            $position: 0,
            $slice: 10,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      product,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live search suggestions
// @route   GET /api/products/search/suggestions
// @access  Public
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const products = await Product.find({
      $or: [{ name: regex }, { brand: regex }, { tags: regex }],
    })
      .select('name slug brand price discountPrice images')
      .limit(6);

    const categories = await Category.find({ name: regex })
      .select('name slug')
      .limit(3);

    res.status(200).json({
      success: true,
      suggestions: {
        products,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .limit(8);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bestsellers
// @route   GET /api/products/bestsellers
// @access  Public
exports.getBestsellers = async (req, res, next) => {
  try {
    const products = await Product.find({ isBestseller: true })
      .populate('category', 'name slug')
      .limit(8);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = async (req, res, next) => {
  try {
    const products = await Product.find({ isNewArrival: true })
      .sort('-createdAt')
      .populate('category', 'name slug')
      .limit(8);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products by category
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .populate('category', 'name slug')
      .limit(4);

    res.status(200).json({
      success: true,
      products: related,
    });
  } catch (error) {
    next(error);
  }
};

// =================== ADMIN CONTROLLERS =================== //

// @desc    Create a new product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    // Handle uploaded images if any
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map((file) => ({
        public_id: file.filename,
        url: `/uploads/${file.filename}`,
      }));
      req.body.images = uploadedImages;
    } else if (typeof req.body.images === 'string') {
      try {
        req.body.images = JSON.parse(req.body.images);
      } catch (e) {
        req.body.images = [{ url: req.body.images }];
      }
    }

    // Parse specifications & variants if sent as JSON string in form data
    if (typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
      } catch (e) {}
    }

    if (typeof req.body.variants === 'string') {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {}
    }

    if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map((t) => t.trim());
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    // Handle new uploaded images if provided
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        public_id: file.filename,
        url: `/uploads/${file.filename}`,
      }));
      req.body.images = [...(product.images || []), ...newImages];
    }

    if (typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
      } catch (e) {}
    }

    if (typeof req.body.variants === 'string') {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {}
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    await Product.findByIdAndDelete(req.params.id);

    // Also remove associated reviews
    await Review.deleteMany({ product: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for Admin
// @route   GET /api/products/admin/all
// @access  Private/Admin
exports.getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};
