/**
 * EduPath — routes/timer.js
 * Focus sessions: save, history, stats, today
 */

const express    = require('express');
const { body, validationResult } = require('express-validator');
const { TimerSession, User } = require('../db');  // ✅ correct
const { protect }            = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const PRESET_LABELS = {
  pomodoro:    'Pomodoro',    deep_work:   'Deep Work',
  quick_focus: 'Quick Focus', short_break: 'Short Break',
  long_break:  'Long Break',  custom:      'Custom',
};

// ── Shared streak updater ─────────────────
const updateStreak = async (userId) => {
  const user  = await User.findById(userId);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last  = user.streak.lastStudied ? new Date(user.streak.lastStudied) : null;

  if (last) {
    last.setHours(0, 0, 0, 0);
    const diff = Math.round((today - last) / (1000 * 60 * 60 * 24));
    if (diff === 0) return; // already counted today
    user.streak.current = diff === 1 ? user.streak.current + 1 : 1;
  } else {
    user.streak.current = 1;
  }

  if (user.streak.current > user.streak.longest) user.streak.longest = user.streak.current;
  user.streak.lastStudied = new Date();
  await user.save({ validateBeforeSave: false });
};

// ══════════════════════════════════════════
// GET /api/timer/history
// ══════════════════════════════════════════
router.get('/history', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      TimerSession.find({ userId: req.user.id }).sort({ date: -1 }).skip(skip).limit(limit),
      TimerSession.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ success: true, page, totalPages: Math.ceil(total / limit), total, sessions });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// GET /api/timer/stats
// ══════════════════════════════════════════
router.get('/stats', async (req, res, next) => {
  try {
    const weekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sessions = await TimerSession.find({ userId: req.user.id, date: { $gte: weekAgo } }).sort({ date: 1 });

    const days      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dailyMins = Array(7).fill(0);
    let totalMinutes = 0, totalSessions = 0, completedSessions = 0;

    sessions.forEach(s => {
      dailyMins[new Date(s.date).getDay()] += s.minutesActual || 0;
      totalMinutes    += s.minutesActual || 0;
      totalSessions   += 1;
      if (s.completedFull) completedSessions += 1;
    });

    const todayStart    = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter(s => new Date(s.date) >= todayStart);
    const todayMinutes  = todaySessions.reduce((sum, s) => sum + (s.minutesActual || 0), 0);

    res.json({
      success: true,
      stats: {
        weekly:                 days.map((day, i) => ({ day, minutes: dailyMins[i], hours: Math.round((dailyMins[i] / 60) * 10) / 10 })),
        totalMinutesThisWeek:   totalMinutes,
        totalHoursThisWeek:     Math.round((totalMinutes / 60) * 10) / 10,
        totalSessionsThisWeek:  totalSessions,
        completionRate:         totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        todayMinutes,
        todaySessionCount:      todaySessions.length,
      },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// GET /api/timer/today
// ══════════════════════════════════════════
router.get('/today', async (req, res, next) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const sessions   = await TimerSession.find({ userId: req.user.id, date: { $gte: todayStart } }).sort({ date: -1 });
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutesActual || 0), 0);

    res.json({
      success: true,
      today: {
        sessionCount:   sessions.length,                                          // FIX: was duplicate key
        completedCount: sessions.filter(s => s.completedFull).length,
        totalMinutes,
        totalHours:     Math.round((totalMinutes / 60) * 10) / 10,
        sessions,                                                                 // FIX: removed duplicate key
      },
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// POST /api/timer/session
// ══════════════════════════════════════════
router.post('/session', [
  body('preset').optional().isIn(['pomodoro','deep_work','quick_focus','short_break','long_break','custom']),
  body('durationMinutes').isInt({ min: 1, max: 180 }).withMessage('Duration must be 1–180 mins'),
  body('minutesActual').isInt({ min: 0, max: 180 }).withMessage('Actual minutes must be 0–180'),
  body('completedFull').isBoolean().withMessage('completedFull must be boolean'),
  body('topic').optional().trim().isLength({ max: 100 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { preset = 'pomodoro', durationMinutes, minutesActual, completedFull, topic = '' } = req.body;

    const session = await TimerSession.create({
      userId: req.user.id, preset, durationMinutes,
      minutesActual, completedFull, topic, date: new Date(),
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.hoursStudied': minutesActual / 60 } });
    if (completedFull) await updateStreak(req.user.id);

    res.status(201).json({ success: true, session, presetLabel: PRESET_LABELS[preset] || preset });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// DELETE /api/timer/history
// ══════════════════════════════════════════
router.delete('/history', async (req, res, next) => {
  try {
    const result = await TimerSession.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: `${result.deletedCount} session(s) cleared.` });
  } catch (err) { next(err); }
});

module.exports = router;