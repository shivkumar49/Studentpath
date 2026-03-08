/**
 * EduPath — middleware/errorHandler.js
 * Global error handler + AppError class
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode    = statusCode;
    this.status        = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError      = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateKey   = (err) => new AppError(`${Object.keys(err.keyValue || {})[0] || 'Field'} already exists.`, 409);
const handleValidationError = (err) => new AppError(`Validation: ${Object.values(err.errors).map(e => e.message).join('. ')}`, 400);
const handleJWTError       = ()    => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpired     = ()    => new AppError('Token expired. Please log in again.', 401);

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    return res.status(err.statusCode).json({
      success: false,
      error:   err.message,
      stack:   err.stack,
    });
  }

  // Production — transform known errors
  let error = { ...err, message: err.message };
  if (err.name === 'CastError')         error = handleCastError(err);
  if (err.code  === 11000)              error = handleDuplicateKey(err);
  if (err.name === 'ValidationError')   error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpired();

  if (error.isOperational) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  console.error('💥 UNEXPECTED:', err);
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
};

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { AppError, errorHandler, notFound };