/**
 * ══════════════════════════════════════════
 * EduPath Backend — controllers/authController.js
 * All auth business logic separated from routes
 * Location: /edupath/controllers/authController.js
 * ══════════════════════════════════════════
 */

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { User } = require('../db');
const { AppError } = require('../middleware/errorHandler');

// ── Token generators ──────────────────────
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

const sendTokens = (user, statusCode, res) => {
  const token        = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.password      = undefined; // never send password

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user,
  });
};

// ══════════════════════════════════════════
// register
// POST /api/auth/register
// ══════════════════════════════════════════
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, domain } = req.body;

    // Check duplicate
    const exists = await User.findOne({ email });
    if (exists) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    // Hash password
    const salt   = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashed,
      domain  : domain || '',
    });

    console.log(`✅ Registered: ${email}`);
    sendTokens(user, 201, res);

  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// login
// POST /api/auth/login
// ══════════════════════════════════════════
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    console.log(`🔐 Login: ${email}`);
    sendTokens(user, 200, res);

  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// refreshToken
// POST /api/auth/refresh
// ══════════════════════════════════════════
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required.', 401));

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user) return next(new AppError('User no longer exists.', 401));

    res.json({ success: true, token: signAccessToken(user._id) });

  } catch (err) {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }
};

// ══════════════════════════════════════════
// getMe
// GET /api/auth/me
// ══════════════════════════════════════════
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// logout
// POST /api/auth/logout
// ══════════════════════════════════════════
exports.logout = (req, res) => {
  console.log(`👋 Logout: ${req.user?.email}`);
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ══════════════════════════════════════════
// changePassword
// POST /api/auth/change-password
// ══════════════════════════════════════════
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return next(new AppError('Current password is incorrect.', 401));

    const salt   = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Password changed successfully.' });

  } catch (err) {
    next(err);
  }
};