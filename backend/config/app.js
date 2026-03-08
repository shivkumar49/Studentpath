/**
 * EduPath — config/app.js
 * All Express middleware + route registration
 */

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');

const { corsOptions }                           = require('./cors');
const { globalLimiter, authLimiter, aiLimiter } = require('../middleware/rateLimiter');
const { errorHandler, notFound }                = require('../middleware/errorHandler');

// Routes
const authRoutes     = require('../routes/auth');
const userRoutes     = require('../routes/users');
const progressRoutes = require('../routes/progress');
const taskRoutes     = require('../routes/tasks');
const aiRoutes       = require('../routes/ai');
const timerRoutes    = require('../routes/timer');
const pdfRoutes      = require('../routes/pdfs');

const configureApp = (app) => {

  // ── Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));

  // ── CORS — ✅ FIX: use corsOptions for BOTH middleware AND preflight
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));   // was: cors() with no options = allows all origins

  // ── Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ── Logging
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── Rate limiters
  app.use('/api/',      globalLimiter);
  app.use('/api/auth/', authLimiter);
  app.use('/api/ai/',   aiLimiter);

  // ── Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status : 'ok',
      env    : process.env.NODE_ENV || 'development',
      uptime : `${Math.floor(process.uptime())}s`,
      memory : `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      time   : new Date().toISOString(),
    });
  });

  // ── API routes
  app.use('/api/auth',     authRoutes);
  app.use('/api/users',    userRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/tasks',    taskRoutes);
  app.use('/api/ai',       aiRoutes);
  app.use('/api/timer',    timerRoutes);
  app.use('/api/pdfs',     pdfRoutes);

  // ── ✅ FIX: notFound for unknown API routes — BEFORE static wildcard
  app.use('/api/*', notFound);

  // ── Serve React frontend (after npm run build)
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // ── Global error handler (MUST be last)
  app.use(errorHandler);

  return app;
};

module.exports = configureApp;