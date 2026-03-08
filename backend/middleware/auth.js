/**
 * EduPath — middleware/auth.js
 * JWT protect middleware — guards all private routes
 */

const jwt      = require('jsonwebtoken');
const { User } = require('../db');

const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists.',
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();

  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    }
    next(err);
  }
};

module.exports = { protect };
