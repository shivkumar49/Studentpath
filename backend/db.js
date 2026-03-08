/**
 * EduPath — db.js
 * MongoDB connection + all Mongoose models
 * Location: /edupath/db.js  (root level)
 */

const mongoose = require('mongoose');

// ══════════════════════════════════════════
// CONNECTION
// ══════════════════════════════════════════
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
    mongoose.connection.on('reconnected',  () => console.log('🔄 MongoDB reconnected'));
    mongoose.connection.on('error', (err)  => console.error('❌ MongoDB error:', err.message));

    process.on('SIGINT',  async () => { await mongoose.connection.close(); process.exit(0); });
    process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });

  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// ══════════════════════════════════════════
// MODEL 1 — USER
// ══════════════════════════════════════════
const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'],
    trim: true, minlength: 2, maxlength: 50,
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: 6, select: false,
  },
  avatar:  { type: String, default: '' },
  domain:  { type: String, enum: ['Web Dev','AI / ML','DSA','Data Science','DevOps','Android',''], default: '' },
  streak: {
    current:     { type: Number, default: 0 },
    longest:     { type: Number, default: 0 },
    lastStudied: { type: Date,   default: null },
  },
  stats: {
    tasksCompleted:  { type: Number, default: 0 },
    hoursStudied:    { type: Number, default: 0 },
    coursesEnrolled: { type: Number, default: 0 },
  },
  preferences: {
    darkMode:      { type: Boolean, default: false },
    notifications: { type: Boolean, default: true  },
    timerPreset:   { type: Number,  default: 25    },
  },
  isPremium:  { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  lastLogin:  { type: Date,    default: Date.now },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ══════════════════════════════════════════
// MODEL 2 — PROGRESS
// ══════════════════════════════════════════
const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true, index: true,
  },
  course:  { type: String, required: true, trim: true },
  domain:  { type: String, default: 'Web Dev' },
  percent: { type: Number, default: 0, min: 0, max: 100 },
  chaptersTotal:     { type: Number, default: 0 },
  chaptersCompleted: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
  lastActivity: { type: Date, default: Date.now },
  history: [{
    date:    { type: Date,   default: Date.now },
    percent: { type: Number },
    note:    { type: String, default: '' },
  }],
}, { timestamps: true });

progressSchema.index({ userId: 1, course: 1 }, { unique: true });

const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);

// ══════════════════════════════════════════
// MODEL 3 — TASK
// ══════════════════════════════════════════
const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true, index: true,
  },
  title: {
    type: String, required: [true, 'Task title is required'],
    trim: true, maxlength: 200,
  },
  description: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  category: {
    type: String,
    enum: ['study', 'practice', 'project', 'revision', 'other'],
    default: 'study',
  },
  dueDate:     { type: Date,    default: null },
  completedAt: { type: Date,    default: null },
  tags:        [{ type: String, trim: true }],
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// ══════════════════════════════════════════
// MODEL 4 — TIMER SESSION
// ══════════════════════════════════════════
const timerSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true, index: true,
  },
  preset: {
    type: String,
    enum: ['pomodoro', 'deep_work', 'quick_focus', 'short_break', 'long_break', 'custom'],
    default: 'pomodoro',
  },
  durationMinutes: { type: Number, required: true, min: 1, max: 180 },
  completedFull:   { type: Boolean, default: false },
  minutesActual:   { type: Number,  default: 0 },
  topic:           { type: String,  default: '', trim: true },
  date:            { type: Date,    default: Date.now },
}, { timestamps: true });

timerSessionSchema.index({ userId: 1, date: -1 });

const TimerSession = mongoose.models.TimerSession || mongoose.model('TimerSession', timerSessionSchema);

// ══════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════
module.exports = { connectDB, User, Progress, Task, TimerSession };