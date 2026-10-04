const User = require('../models/User');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/sendToken');
const sendEmail = require('../services/emailService');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return next(new ErrorHandler('Please provide name, email, and password', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler('An account with this email already exists', 400));
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
    });

    sendToken(user, 201, res, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler('Please enter email and password', 400));
    }

    // Finding user in database with password field included
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    if (user.isBlocked) {
      return next(
        new ErrorHandler('Your account has been deactivated. Please contact support.', 403)
      );
    }

    // Check if password matches
    const isPasswordMatched = await user.matchPassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    sendToken(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logoutUser = async (req, res, next) => {
  try {
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user details
// @route   GET /api/auth/me
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('recentlyViewed');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (name, phone, avatar)
// @route   PUT /api/auth/me/update
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const newUserData = {
      name: req.body.name || req.user.name,
      phone: req.body.phone !== undefined ? req.body.phone : req.user.phone,
    };

    if (req.body.avatarUrl) {
      newUserData.avatar = {
        public_id: 'custom_avatar',
        url: req.body.avatarUrl,
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password/update
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new ErrorHandler('Please provide both current and new password', 400)
      );
    }

    if (newPassword.length < 6) {
      return next(
        new ErrorHandler('New password must be at least 6 characters long', 400)
      );
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatched = await user.matchPassword(currentPassword);
    if (!isMatched) {
      return next(new ErrorHandler('Current password is incorrect', 400));
    }

    user.password = newPassword;
    await user.save();

    sendToken(user, 200, res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - send reset token email
// @route   POST /api/auth/password/forgot
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorHandler('Please provide your email address', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler('User not found with this email', 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `You requested a password reset for your ShopNest account.\n\nPlease navigate to the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email. This link is valid for 30 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ShopNest - Password Recovery Request',
        message,
      });

      res.status(200).json({
        success: true,
        message: `Password reset link sent to: ${user.email}`,
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorHandler('Email could not be sent. Please try again later.', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password using token
// @route   PUT /api/auth/password/reset/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorHandler('Password reset token is invalid or has expired', 400)
      );
    }

    if (!req.body.password || req.body.password.length < 6) {
      return next(
        new ErrorHandler('Password must be at least 6 characters long', 400)
      );
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res, 'Password reset successful. You are now logged in.');
  } catch (error) {
    next(error);
  }
};
