/**
 * ══════════════════════════════════════════
 * EduPath Backend — controllers/taskController.js
 * Full CRUD + auto-overdue + bulk operations
 * Location: /edupath/controllers/taskController.js
 * ══════════════════════════════════════════
 */

const { Task, User } = require('../db');
const { AppError }   = require('../middleware/errorHandler');

// ── Shared: auto-mark overdue tasks ───────
const markOverdue = async (userId) => {
  await Task.updateMany(
    {
      userId,
      status : { $in: ['pending', 'in_progress'] },
      dueDate: { $lt: new Date() },
    },
    { $set: { status: 'overdue' } }
  );
};

// ══════════════════════════════════════════
// getAllTasks
// GET /api/tasks
// ══════════════════════════════════════════
exports.getAllTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Auto-mark overdue before returning
    await markOverdue(userId);

    const { status, priority, category, sort } = req.query;

    const filter = { userId };
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const sortMap = {
      newest  : { createdAt: -1 },
      oldest  : { createdAt:  1 },
      due     : { dueDate:    1 },
      priority: { priority:  -1 },
    };

    const tasks = await Task
      .find(filter)
      .sort(sortMap[sort] || { createdAt: -1 });

    // Summary for dashboard stat cards
    const [pending, overdue, completed] = await Promise.all([
      Task.countDocuments({ userId, status: 'pending' }),
      Task.countDocuments({ userId, status: 'overdue' }),
      Task.countDocuments({ userId, status: 'completed' }),
    ]);

    res.json({
      success : true,
      count   : tasks.length,
      summary : { pending, overdue, completed },
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// getTask
// GET /api/tasks/:id
// ══════════════════════════════════════════
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id   : req.params.id,
      userId: req.user.id,
    });

    if (!task) return next(new AppError('Task not found.', 404));
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// createTask
// POST /api/tasks
// ══════════════════════════════════════════
exports.createTask = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      priority    = 'medium',
      category    = 'study',
      dueDate,
      tags        = [],
    } = req.body;

    const task = await Task.create({
      userId     : req.user.id,
      title,
      description,
      priority,
      category,
      dueDate    : dueDate ? new Date(dueDate) : null,
      tags,
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// updateTask
// PUT /api/tasks/:id
// ══════════════════════════════════════════
exports.updateTask = async (req, res, next) => {
  try {
    const allowed = ['title','description','priority','status','category','dueDate','tags'];
    const updates = {};
    allowed.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Set completedAt timestamp if marking done
    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) return next(new AppError('Task not found.', 404));

    // Increment user's completed count
    if (updates.status === 'completed') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.tasksCompleted': 1 },
      });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// completeTask
// PATCH /api/tasks/:id/complete
// Quick-complete shortcut
// ══════════════════════════════════════════
exports.completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );

    if (!task) return next(new AppError('Task not found.', 404));

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.tasksCompleted': 1 },
    });

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// deleteTask
// DELETE /api/tasks/:id
// ══════════════════════════════════════════
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id   : req.params.id,
      userId: req.user.id,
    });

    if (!task) return next(new AppError('Task not found.', 404));
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// clearCompleted
// DELETE /api/tasks/completed/all
// ══════════════════════════════════════════
exports.clearCompleted = async (req, res, next) => {
  try {
    const result = await Task.deleteMany({
      userId: req.user.id,
      status: 'completed',
    });

    res.json({
      success: true,
      message: `${result.deletedCount} completed task(s) cleared.`,
    });
  } catch (err) {
    next(err);
  }
};