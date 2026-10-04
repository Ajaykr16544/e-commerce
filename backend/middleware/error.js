const ErrorHandler = require('../utils/errorHandler');

/**
 * Centralized Error Handling Middleware
 */
module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || 'Internal Server Error';
  error.statusCode = err.statusCode || 500;

  // Wrong Mongoose Object ID Error (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ErrorHandler(message, 404);
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ErrorHandler(message, 400);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new ErrorHandler(message, 400);
  }

  // Wrong JWT Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid JSON Web Token. Please log in again.';
    error = new ErrorHandler(message, 401);
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    const message = 'JSON Web Token has expired. Please log in again.';
    error = new ErrorHandler(message, 401);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
