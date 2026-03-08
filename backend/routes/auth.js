/**
 * EduPath — routes/auth.js
 * Register, Login, Logout, Refresh, Change Password
 */

const express      = require('express');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User }     = require('../db');           // ✅ correct path from routes/
const { protect }  = require('../middleware/auth');

const router = express.Router();

// ── Token helpers ────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const sendTokenResponse = (user, statusCode, res) => {
  const token        = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.password      = undefined;
  res.status(statusCode).json({ success: true, token, refreshToken, user });
};

// ── Validation rules ─────────────────────
const registerRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
    .matches(/\d/).withMessage('Password must contain a number'),
];
const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

// ══════════════════════════════════════════
// POST /api/auth/register
// ══════════════════════════════════════════
router.post('/register', registerRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, password, domain } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered.' });

    const salt     = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const hashed   = await bcrypt.hash(password, salt);
    const user     = await User.create({ name, email, password: hashed, domain: domain || '' });

    console.log(`✅ Registered: ${email}`);
    sendTokenResponse(user, 201, res);
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════
router.post('/login', loginRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    console.log(`🔐 Login: ${email}`);
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// POST /api/auth/refresh
// ══════════════════════════════════════════
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, error: 'Refresh token required.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found.' });

    res.json({ success: true, token: signToken(user._id) });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
  }
});

// ══════════════════════════════════════════
// GET /api/auth/me
// ══════════════════════════════════════════
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// POST /api/auth/logout
// ══════════════════════════════════════════
router.post('/logout', protect, (req, res) => {
  console.log(`👋 Logout: ${req.user.email}`);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ══════════════════════════════════════════
// POST /api/auth/change-password
// ══════════════════════════════════════════
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password min 6 chars').matches(/\d/),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, error: 'Current password incorrect.' });
    }

    const salt     = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    user.password  = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;