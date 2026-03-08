/**
 * EduPath — routes/users.js
 * Profile, Preferences, Stats, Streak, Delete Account
 */

const express    = require('express');
const { body, validationResult } = require('express-validator');
const { User, Task, Progress, TimerSession } = require('../db');  // ✅ correct
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ══════════════════════════════════════════
// GET /api/users/profile
// ══════════════════════════════════════════
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// PUT /api/users/profile
// ══════════════════════════════════════════
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('domain').optional().isIn(['Web Dev','AI / ML','DSA','Data Science','DevOps','Android','']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const allowed = ['name', 'domain', 'avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// PUT /api/users/preferences
// ══════════════════════════════════════════
router.put('/preferences', async (req, res, next) => {
  try {
    const { darkMode, notifications, timerPreset } = req.body;
    const updates = {};
    if (darkMode      !== undefined) updates['preferences.darkMode']      = darkMode;
    if (notifications !== undefined) updates['preferences.notifications'] = notifications;
    if (timerPreset   !== undefined) updates['preferences.timerPreset']   = timerPreset;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
    res.json({ success: true, preferences: user.preferences });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// GET /api/users/stats
// ══════════════════════════════════════════
router.get('/stats', async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [pending, overdue, completed, user, sessions] = await Promise.all([
      Task.countDocuments({ userId, status: 'pending' }),
      Task.countDocuments({ userId, status: 'overdue' }),
      Task.countDocuments({ userId, status: 'completed' }),
      User.findById(userId),
      TimerSession.find({ userId, date: { $gte: weekAgo } }),
    ]);

    const hoursThisWeek = sessions.reduce((sum, s) => sum + (s.minutesActual / 60), 0);

    res.json({
      success: true,
      stats: {
        pendingTasks:   pending,
        overdueTasks:   overdue,
        completedTasks: completed,
        streak:         user.streak.current,
        longestStreak:  user.streak.longest,
        hoursThisWeek:  Math.round(hoursThisWeek * 10) / 10,
        totalHours:     Math.round((user.stats.hoursStudied || 0) * 10) / 10,
      },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// POST /api/users/streak/update
// ══════════════════════════════════════════
router.post('/streak/update', async (req, res, next) => {
  try {
    const user  = await User.findById(req.user.id);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last  = user.streak.lastStudied ? new Date(user.streak.lastStudied) : null;

    if (last) {
      last.setHours(0, 0, 0, 0);
      const diff = Math.round((today - last) / (1000 * 60 * 60 * 24));
      if (diff === 0) return res.json({ success: true, streak: user.streak, message: 'Already counted today.' });
      user.streak.current = diff === 1 ? user.streak.current + 1 : 1;
    } else {
      user.streak.current = 1;
    }

    if (user.streak.current > user.streak.longest) user.streak.longest = user.streak.current;
    user.streak.lastStudied = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, streak: user.streak });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// DELETE /api/users/account
// ══════════════════════════════════════════
router.delete('/account', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await Promise.all([
      Task.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      TimerSession.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);
    res.json({ success: true, message: 'Account and all data permanently deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;