const Category = require('../models/Category');
const Product = require('../models/Product');
const ErrorHandler = require('../utils/errorHandler');
const slugify = require('slugify');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');

    // Also attach product counts for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id });
        return {
          ...cat.toObject(),
          productCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by Slug or ID
// @route   GET /api/categories/:identifier
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const category = await Category.findOne(
      isId ? { _id: identifier } : { slug: identifier }
    );

    if (!category) {
      return next(new ErrorHandler('Category not found', 404));
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, subcategories, isFeatured } = req.body;

    if (!name) {
      return next(new ErrorHandler('Category name is required', 400));
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return next(new ErrorHandler('Category with this name already exists', 400));
    }

    let image = { url: req.body.imageUrl || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=500&q=80' };
    if (req.file) {
      image = {
        public_id: req.file.filename,
        url: `/uploads/${req.file.filename}`,
      };
    }

    const category = await Category.create({
      name,
      description,
      image,
      icon: icon || 'Folder',
      subcategories: subcategories || [],
      isFeatured: isFeatured || false,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler('Category not found', 404));
    }

    if (req.body.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    if (req.file) {
      req.body.image = {
        public_id: req.file.filename,
        url: `/uploads/${req.file.filename}`,
      };
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler('Category not found', 404));
    }

    // Check if category has associated products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return next(
        new ErrorHandler(
          `Cannot delete category. There are ${productCount} products assigned to it.`,
          400
        )
      );
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
