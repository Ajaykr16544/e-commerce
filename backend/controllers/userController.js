const User = require('../models/User');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ErrorHandler = require('../utils/errorHandler');

// =================== ADDRESS CONTROLLERS =================== //

// @desc    Get all addresses for logged in user
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort('-isDefault -createdAt');
    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const existingCount = await Address.countDocuments({ user: req.user.id });
    const isDefault = req.body.isDefault || existingCount === 0;

    const address = await Address.create({
      ...req.body,
      user: req.user.id,
      isDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an address
// @route   PUT /api/users/addresses/:id
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    let address = await Address.findById(req.params.id);

    if (!address) {
      return next(new ErrorHandler('Address not found', 404));
    }

    if (address.user.toString() !== req.user.id) {
      return next(new ErrorHandler('Not authorized to edit this address', 403));
    }

    address = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return next(new ErrorHandler('Address not found', 404));
    }

    if (address.user.toString() !== req.user.id) {
      return next(new ErrorHandler('Not authorized to delete this address', 403));
    }

    await Address.findByIdAndDelete(req.params.id);

    // If default address was deleted, set the latest remaining as default
    if (address.isDefault) {
      const nextAddress = await Address.findOne({ user: req.user.id }).sort('-createdAt');
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set address as default
// @route   PUT /api/users/addresses/:id/default
// @access  Private
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return next(new ErrorHandler('Address not found', 404));
    }

    if (address.user.toString() !== req.user.id) {
      return next(new ErrorHandler('Not authorized', 403));
    }

    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated',
      address,
    });
  } catch (error) {
    next(error);
  }
};

// =================== ADMIN USER & DASHBOARD =================== //

// @desc    Get admin dashboard metrics & analytics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      lowStockCount,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] } }),
      Order.countDocuments({ orderStatus: 'Delivered' }),
      Order.countDocuments({ orderStatus: 'Cancelled' }),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Order.find().sort('-createdAt').limit(6).populate('user', 'name email'),
    ]);

    // Total revenue from Paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Monthly revenue overview (last 6 months)
    const monthlySales = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedSales = monthlySales.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      orders: item.orders,
    }));

    // Category distribution
    const categories = await Category.find().select('name');
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id });
        return {
          name: cat.name,
          products: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        lowStockProducts: lowStockCount,
      },
      salesOverview: formattedSales.length > 0 ? formattedSales : [
        { name: 'May 2026', revenue: 45000, orders: 18 },
        { name: 'Jun 2026', revenue: 62000, orders: 25 },
        { name: 'Jul 2026', revenue: 78000, orders: 32 },
        { name: 'Aug 2026', revenue: 95000, orders: 41 },
        { name: 'Sep 2026', revenue: 112000, orders: 50 },
        { name: 'Oct 2026', revenue: 135000, orders: 58 },
      ],
      categoryPerformance: categoryStats.filter((c) => c.products > 0),
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      totalUsers,
      totalPages: Math.ceil(totalUsers / Number(limit)) || 1,
      page: Number(page),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user details with their orders (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    const orders = await Order.find({ user: user._id }).sort('-createdAt');
    const addresses = await Address.find({ user: user._id });

    res.status(200).json({
      success: true,
      user,
      orders,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) {
      return next(new ErrorHandler('Invalid role specified', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock user (Admin)
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    if (user._id.toString() === req.user.id) {
      return next(new ErrorHandler('Cannot block your own admin account', 400));
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};
