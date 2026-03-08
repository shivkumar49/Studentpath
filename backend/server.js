/**
 * EduPath Backend — server.js
 * Entry point: loads env, connects DB, starts server
 */

require('dotenv').config();

const express       = require('express');
const { connectDB } = require('./db');
const configureApp  = require('./config/app');

const app  = express();
const PORT = process.env.PORT || 5000;

configureApp(app);

// ✅ FIX: async/await instead of .then() — proper error handling
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`
  ╔══════════════════════════════════════╗
  ║   🎓  EduPath Server Running         ║
  ║   http://localhost:${PORT}              ║
  ║   ENV: ${(process.env.NODE_ENV || 'development').padEnd(26)}║
  ╚══════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
