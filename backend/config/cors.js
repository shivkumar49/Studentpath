/**
 * ══════════════════════════════════════════
 * EduPath Backend — config/cors.js
 * CORS allowed origins & options config
 * Location: /edupath/config/cors.js
 * ══════════════════════════════════════════
 */

// ── Allowed origins list ──────────────────
const ALLOWED_ORIGINS = [
  // Local development
  'http://localhost:3000',    // React CRA
  'http://localhost:5173',    // Vite
  'http://localhost:5500',    // VSCode Live Server
  'http://127.0.0.1:5500',
  'http://localhost:8080',    // Webpack

  // Add your production domain here:
  // 'https://edupath.yourdomain.com',
  process.env.CLIENT_ORIGIN,
].filter(Boolean); // remove undefined entries

// ── CORS options object ───────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from: ${origin}`);
      callback(new Error(`CORS policy: origin "${origin}" is not allowed.`));
    }
  },
  credentials  : true,   // allow cookies & Authorization header
  methods      : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge        : 86400, // preflight cache: 24 hours
};

module.exports = { corsOptions, ALLOWED_ORIGINS };