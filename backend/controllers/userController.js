/**
 * ══════════════════════════════════════════
 * EduPath Backend — controllers/userController.js
 * Profile, streak, stats, preferences logic
 * Location: /edupath/controllers/userController.js
 * ══════════════════════════════════════════
 */

const { User, Task, Progress, TimerSession } = require('../db');
const { AppError } = require('../middleware/errorHandler');

// ══════════════════════════════════════════
// getProfile
// GET /api/users/profile
// ══════════════════════════════════════════
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('User not found.', 404));

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// updateProfile
// PUT /api/users/profile
// ══════════════════════════════════════════
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'domain', 'avatar'];
    const updates = {};
    allowed.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// updatePreferences
// PUT /api/users/preferences
// ══════════════════════════════════════════
exports.updatePreferences = async (req, res, next) => {
  try {
    const { darkMode, notifications, timerPreset } = req.body;
    const updates = {};

    if (darkMode      !== undefined) updates['preferences.darkMode']      = darkMode;
    if (notifications !== undefined) updates['preferences.notifications'] = notifications;
    if (timerPreset   !== undefined) updates['preferences.timerPreset']   = timerPreset;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    );

    res.json({ success: true, preferences: user.preferences });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// getStats
// GET /api/users/stats
// Dashboard stat cards data
// ══════════════════════════════════════════
exports.getStats = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for speed
    const [pending, overdue, completed, user, sessions] = await Promise.all([
      Task.countDocuments({ userId, status: 'pending' }),
      Task.countDocuments({ userId, status: 'overdue' }),
      Task.countDocuments({ userId, status: 'completed' }),
      User.findById(userId),
      TimerSession.find({ userId, date: { $gte: weekAgo } }),
    ]);

    const hoursThisWeek = sessions.reduce(
      (sum, s) => sum + (s.minutesActual / 60), 0
    );

    res.json({
      success: true,
      stats  : {
        pendingTasks  : pending,
        overdueTasks  : overdue,
        completedTasks: completed,
        streak        : user.streak.current,
        longestStreak : user.streak.longest,
        hoursThisWeek : Math.round(hoursThisWeek * 10) / 10,
        totalHours    : Math.round((user.stats.hoursStudied || 0) * 10) / 10,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// updateStreak
// POST /api/users/streak/update
// ══════════════════════════════════════════
exports.updateStreak = async (req, res, next) => {
  try {
    const user  = await User.findById(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last = user.streak.lastStudied
      ? new Date(user.streak.lastStudied)
      : null;

    if (last) {
      last.setHours(0, 0, 0, 0);
      const diff = Math.round((today - last) / (1000 * 60 * 60 * 24));

      if (diff === 0) {
        return res.json({
          success: true,
          message: 'Already counted today.',
          streak : user.streak,
        });
      } else if (diff === 1) {
        user.streak.current += 1;
      } else {
        user.streak.current = 1; // streak broken
      }
    } else {
      user.streak.current = 1; // first ever session
    }

    if (user.streak.current > user.streak.longest) {
      user.streak.longest = user.streak.current;
    }

    user.streak.lastStudied = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, streak: user.streak });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// deleteAccount
// DELETE /api/users/account
// Permanently deletes user + all their data
// ══════════════════════════════════════════
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      Task.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      TimerSession.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({
      success: true,
      message: 'Account and all associated data permanently deleted.',
    });
  } catch (err) {
    next(err);
  }
};