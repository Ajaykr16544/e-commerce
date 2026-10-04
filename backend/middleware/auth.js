const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorHandler = require('../utils/errorHandler');

/**
 * Middleware to verify JWT token and authenticate user
 */
exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(
        new ErrorHandler('Login required to access this resource', 401)
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'shopnest_default_jwt_secret_key_32chars'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorHandler('User no longer exists', 401));
    }

    if (user.isBlocked) {
      return next(
        new ErrorHandler('Your account has been deactivated. Please contact support.', 403)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler('Invalid or expired authentication token', 401));
  }
};

/**
 * Middleware to restrict access based on user role
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role (${req.user ? req.user.role : 'Guest'}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
