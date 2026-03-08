/**
 * ══════════════════════════════════════════
 * EduPath Backend — controllers/progressController.js
 * Course progress CRUD + weekly activity logic
 * Location: /edupath/controllers/progressController.js
 * ══════════════════════════════════════════
 */

const { Progress, User } = require('../db');
const { AppError }       = require('../middleware/errorHandler');

// ══════════════════════════════════════════
// getAllProgress
// GET /api/progress
// ══════════════════════════════════════════
exports.getAllProgress = async (req, res, next) => {
  try {
    const progress = await Progress
      .find({ userId: req.user.id })
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: progress.length, progress });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// getCourseProgress
// GET /api/progress/:course
// ══════════════════════════════════════════
exports.getCourseProgress = async (req, res, next) => {
  try {
    const course   = decodeURIComponent(req.params.course);
    const progress = await Progress.findOne({ userId: req.user.id, course });

    if (!progress) {
      return next(new AppError(`No progress found for course: "${course}"`, 404));
    }

    res.json({ success: true, progress });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// upsertProgress
// POST /api/progress
// Create or update — safe to call repeatedly
// ══════════════════════════════════════════
exports.upsertProgress = async (req, res, next) => {
  try {
    const {
      course,
      domain            = 'Web Dev',
      percent,
      chaptersTotal,
      chaptersCompleted,
      note              = '',
    } = req.body;

    // Derive status
    let status = 'not_started';
    if (percent > 0 && percent < 100) status = 'in_progress';
    if (percent === 100)              status = 'completed';

    const setFields = {
      domain,
      percent,
      status,
      lastActivity: new Date(),
    };
    if (chaptersTotal     !== undefined) setFields.chaptersTotal     = chaptersTotal;
    if (chaptersCompleted !== undefined) setFields.chaptersCompleted = chaptersCompleted;

    const progress = await Progress.findOneAndUpdate(
      { userId: req.user.id, course },
      {
        $set : setFields,
        $push: { history: { date: new Date(), percent, note } },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Keep user enrolled-courses count accurate
    const totalCourses = await Progress.countDocuments({ userId: req.user.id });
    await User.findByIdAndUpdate(req.user.id, {
      'stats.coursesEnrolled': totalCourses,
    });

    res.json({ success: true, progress });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// completeChapter
// PATCH /api/progress/:course/chapter
// Increments completed chapters + recalculates %
// ══════════════════════════════════════════
exports.completeChapter = async (req, res, next) => {
  try {
    const course   = decodeURIComponent(req.params.course);
    const progress = await Progress.findOne({ userId: req.user.id, course });

    if (!progress) {
      return next(new AppError(`Course "${course}" not found in your progress.`, 404));
    }

    if (progress.chaptersCompleted >= progress.chaptersTotal) {
      return res.json({
        success: true,
        message: 'All chapters already completed! 🎉',
        progress,
      });
    }

    progress.chaptersCompleted += 1;
    progress.percent = progress.chaptersTotal > 0
      ? Math.round((progress.chaptersCompleted / progress.chaptersTotal) * 100)
      : 0;

    progress.status      = progress.percent === 100 ? 'completed' : 'in_progress';
    progress.lastActivity = new Date();
    progress.history.push({
      date   : new Date(),
      percent: progress.percent,
      note   : `Chapter ${progress.chaptersCompleted} completed`,
    });

    await progress.save();
    res.json({ success: true, progress });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// getWeeklySummary
// GET /api/progress/summary/weekly
// Returns 7-day activity for chart
// ══════════════════════════════════════════
exports.getWeeklySummary = async (req, res, next) => {
  try {
    const weekAgo      = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allProgress  = await Progress.find({ userId: req.user.id });
    const days         = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const activity     = Array(7).fill(0);

    allProgress.forEach(p => {
      p.history.forEach(h => {
        if (new Date(h.date) >= weekAgo) {
          activity[new Date(h.date).getDay()] += 1;
        }
      });
    });

    const weekly = days.map((day, i) => ({ day, sessions: activity[i] }));
    res.json({ success: true, weekly });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// resetCourseProgress
// DELETE /api/progress/:course
// ══════════════════════════════════════════
exports.resetCourseProgress = async (req, res, next) => {
  try {
    const course = decodeURIComponent(req.params.course);
    await Progress.findOneAndDelete({ userId: req.user.id, course });

    res.json({
      success: true,
      message: `Progress for "${course}" has been reset.`,
    });
  } catch (err) {
    next(err);
  }
};