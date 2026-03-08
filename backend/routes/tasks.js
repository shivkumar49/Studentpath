/**
 * EduPath — routes/tasks.js
 * Full CRUD + filters + auto-overdue + bulk clear
 */

const express    = require('express');
const { body, validationResult } = require('express-validator');
const { Task, User } = require('../db');    // ✅ correct
const { protect }    = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── Shared: auto-mark overdue ─────────────
const markOverdue = (userId) =>
  Task.updateMany(
    { userId, status: { $in: ['pending', 'in_progress'] }, dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );

// ══════════════════════════════════════════
// DELETE /api/tasks/completed/all
// MUST be BEFORE /:id to avoid conflict
// ══════════════════════════════════════════
router.delete('/completed/all', async (req, res, next) => {
  try {
    const result = await Task.deleteMany({ userId: req.user.id, status: 'completed' });
    res.json({ success: true, message: `${result.deletedCount} completed task(s) cleared.` });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// GET /api/tasks
// ══════════════════════════════════════════
router.get('/', async (req, res, next) => {
  try {
    await markOverdue(req.user.id);

    const { status, priority, category, sort } = req.query;
    const filter = { userId: req.user.id };
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const sortMap = {
      newest:   { createdAt: -1 },
      oldest:   { createdAt:  1 },
      due:      { dueDate:    1 },
      priority: { priority:  -1 },
    };

    const tasks = await Task.find(filter).sort(sortMap[sort] || { createdAt: -1 });

    const [pending, overdue, completed] = await Promise.all([
      Task.countDocuments({ userId: req.user.id, status: 'pending' }),
      Task.countDocuments({ userId: req.user.id, status: 'overdue' }),
      Task.countDocuments({ userId: req.user.id, status: 'completed' }),
    ]);

    res.json({ success: true, count: tasks.length, summary: { pending, overdue, completed }, tasks });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// GET /api/tasks/:id
// ══════════════════════════════════════════
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// POST /api/tasks
// ══════════════════════════════════════════
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('category').optional().isIn(['study', 'practice', 'project', 'revision', 'other']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { title, description, priority, category, dueDate, tags } = req.body;

    const task = await Task.create({
      userId:      req.user.id,
      title,
      description: description || '',
      priority:    priority    || 'medium',
      category:    category    || 'study',
      dueDate:     dueDate     ? new Date(dueDate) : null,
      tags:        tags        || [],
    });

    res.status(201).json({ success: true, task });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// PUT /api/tasks/:id
// ══════════════════════════════════════════
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue']),
  body('category').optional().isIn(['study', 'practice', 'project', 'revision', 'other']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const allowed = ['title', 'description', 'priority', 'status', 'category', 'dueDate', 'tags'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.status === 'completed') updates.completedAt = new Date();

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    if (updates.status === 'completed') {
      await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.tasksCompleted': 1 } });
    }

    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// PATCH /api/tasks/:id/complete
// ══════════════════════════════════════════
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.tasksCompleted': 1 } });
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════
// DELETE /api/tasks/:id
// ══════════════════════════════════════════
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;