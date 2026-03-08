/**
 * ══════════════════════════════════════════
 * EduPath Backend — controllers/timerController.js
 * Focus session save, history, weekly stats
 * Location: /edupath/controllers/timerController.js
 * ══════════════════════════════════════════
 */

const { TimerSession, User } = require('../db');
const { AppError }           = require('../middleware/errorHandler');

const PRESET_LABELS = {
  pomodoro   : 'Pomodoro — 25 min',
  deep_work  : 'Deep Work — 50 min',
  quick_focus: 'Quick Focus — 15 min',
  short_break: 'Short Break — 5 min',
  long_break : 'Long Break — 10 min',
  custom     : 'Custom',
};

// ── Shared streak updater ─────────────────
const updateStreakIfNeeded = async (userId) => {
  const user  = await User.findById(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = user.streak.lastStudied ? new Date(user.streak.lastStudied) : null;
  if (last) {
    last.setHours(0, 0, 0, 0);
    const diff = Math.round((today - last) / (1000 * 60 * 60 * 24));
    if      (diff === 0) return; // already counted today
    else if (diff === 1) user.streak.current += 1;
    else                 user.streak.current  = 1;
  } else {
    user.streak.current = 1;
  }

  if (user.streak.current > user.streak.longest) {
    user.streak.longest = user.streak.current;
  }
  user.streak.lastStudied = new Date();
  await user.save({ validateBeforeSave: false });
};

// ══════════════════════════════════════════
// saveSession
// POST /api/timer/session
// ══════════════════════════════════════════
exports.saveSession = async (req, res, next) => {
  try {
    const {
      preset          = 'pomodoro',
      durationMinutes,
      minutesActual,
      completedFull,
      topic           = '',
    } = req.body;

    const session = await TimerSession.create({
      userId: req.user.id,
      preset,
      durationMinutes,
      minutesActual,
      completedFull,
      topic,
      date  : new Date(),
    });

    // Update user's total study hours
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.hoursStudied': minutesActual / 60 },
    });

    // Update streak if session fully completed
    if (completedFull) {
      await updateStreakIfNeeded(req.user.id);
    }

    res.status(201).json({
      success    : true,
      session,
      presetLabel: PRESET_LABELS[preset] || preset,
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// getHistory
// GET /api/timer/history
// Paginated session history
// ══════════════════════════════════════════
exports.getHistory = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      TimerSession.find({ userId: req.user.id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      TimerSession.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success   : true,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      sessions,
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// getWeeklyStats
// GET /api/timer/stats
// Minutes per day + weekly totals
// ══════════════════════════════════════════
exports.getWeeklyStats = async (req, res, next) => {
  try {
    const weekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sessions = await TimerSession.find({
      userId: req.user.id,
      date  : { $gte: weekAgo },
    }).sort({ date: 1 });

    const days       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dailyMins  = Array(7).fill(0);
    let totalMinutes = 0;
    let completed    = 0;

    sessions.forEach(s => {
      const day = new Date(s.date).getDay();
      dailyMins[day] += s.minutesActual || 0;
      totalMinutes   += s.minutesActual || 0;
      if (s.completedFull) completed += 1;
    });

    const weekly = days.map((day, i) => ({
      day,
      minutes: dailyMins[i],
      hours  : Math.round((dailyMins[i] / 60) * 10) / 10,
    }));

    res.json({
      success: true,
      stats  : {
        weekly,
        totalMinutesThisWeek : totalMinutes,
        totalHoursThisWeek   : Math.round((totalMinutes / 60) * 10) / 10,
        totalSessionsThisWeek: sessions.length,
        completionRate       : sessions.length > 0
          ? Math.round((completed / sessions.length) * 100)
          : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// getTodayStats
// GET /api/timer/today
// ══════════════════════════════════════════
exports.getTodayStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sessions = await TimerSession.find({
      userId: req.user.id,
      date  : { $gte: todayStart },
    }).sort({ date: -1 });

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutesActual || 0), 0);

    res.json({
      success: true,
      today  : {
        sessionCount  : sessions.length,
        completedCount: sessions.filter(s => s.completedFull).length,
        totalMinutes,
        totalHours    : Math.round((totalMinutes / 60) * 10) / 10,
        sessions,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// clearHistory
// DELETE /api/timer/history
// ══════════════════════════════════════════
exports.clearHistory = async (req, res, next) => {
  try {
    const result = await TimerSession.deleteMany({ userId: req.user.id });
    res.json({
      success: true,
      message: `${result.deletedCount} timer session(s) cleared.`,
    });
  } catch (err) {
    next(err);
  }
};