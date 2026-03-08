/**
 * EduPath — routes/progress.js
 * Course progress CRUD + weekly summary
 */

const express    = require('express');
const { body, validationResult } = require('express-validator');
const { Progress, User } = require('../db');   // ✅ correct
const { protect }        = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ══════════════════════════════════════════
// GET /api/progress
// ══════════════════════════════════════════
router.get('/', async (req, res, next) => {
  try {
    const progress = await Progress.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: progress.length, progress });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// GET /api/progress/summary/weekly
// MUST be before /:course to avoid route conflict
// ══════════════════════════════════════════
router.get('/summary/weekly', async (req, res, next) => {
  try {
    const weekAgo    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allProgress = await Progress.find({ userId: req.user.id });
    const days       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const activity   = Array(7).fill(0);

    allProgress.forEach(p => {
      p.history.forEach(h => {
        if (new Date(h.date) >= weekAgo) activity[new Date(h.date).getDay()] += 1;
      });
    });

    res.json({ success: true, weekly: days.map((day, i) => ({ day, sessions: activity[i] })) });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// GET /api/progress/:course
// ══════════════════════════════════════════
router.get('/:course', async (req, res, next) => {
  try {
    const course   = decodeURIComponent(req.params.course);
    const progress = await Progress.findOne({ userId: req.user.id, course });
    if (!progress) return res.status(404).json({ success: false, error: `No progress found for: ${course}` });
    res.json({ success: true, progress });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// POST /api/progress — upsert
// ══════════════════════════════════════════
router.post('/', [
  body('course').trim().notEmpty().withMessage('Course name required'),
  body('percent').isInt({ min: 0, max: 100 }).withMessage('Percent must be 0–100'),
  body('chaptersTotal').optional().isInt({ min: 0 }),
  body('chaptersCompleted').optional().isInt({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { course, domain, percent, chaptersTotal, chaptersCompleted, note } = req.body;

    let status = 'not_started';
    if (percent > 0 && percent < 100) status = 'in_progress';
    if (percent === 100)              status = 'completed';

    const setFields = { domain: domain || 'Web Dev', percent, status, lastActivity: new Date() };
    if (chaptersTotal     !== undefined) setFields.chaptersTotal     = chaptersTotal;
    if (chaptersCompleted !== undefined) setFields.chaptersCompleted = chaptersCompleted;

    const progress = await Progress.findOneAndUpdate(
      { userId: req.user.id, course },
      { $set: setFields, $push: { history: { date: new Date(), percent, note: note || '' } } },
      { new: true, upsert: true, runValidators: true }
    );

    const totalCourses = await Progress.countDocuments({ userId: req.user.id });
    await User.findByIdAndUpdate(req.user.id, { 'stats.coursesEnrolled': totalCourses });

    res.json({ success: true, progress });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// PATCH /api/progress/:course/chapter
// ══════════════════════════════════════════
router.patch('/:course/chapter', async (req, res, next) => {
  try {
    const course   = decodeURIComponent(req.params.course);
    const progress = await Progress.findOne({ userId: req.user.id, course });
    if (!progress) return res.status(404).json({ success: false, error: 'Course not found.' });

    if (progress.chaptersCompleted >= progress.chaptersTotal) {
      return res.json({ success: true, message: 'All chapters completed! 🎉', progress });
    }

    progress.chaptersCompleted += 1;
    progress.percent     = progress.chaptersTotal > 0
      ? Math.round((progress.chaptersCompleted / progress.chaptersTotal) * 100) : 0;
    progress.status      = progress.percent === 100 ? 'completed' : 'in_progress';
    progress.lastActivity = new Date();
    progress.history.push({ date: new Date(), percent: progress.percent, note: 'Chapter completed' });
    await progress.save();

    res.json({ success: true, progress });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// DELETE /api/progress/:course
// ══════════════════════════════════════════
router.delete('/:course', async (req, res, next) => {
  try {
    const course = decodeURIComponent(req.params.course);
    await Progress.findOneAndDelete({ userId: req.user.id, course });
    res.json({ success: true, message: `Progress for "${course}" reset.` });
  } catch (err) { next(err); }
});

module.exports = router;