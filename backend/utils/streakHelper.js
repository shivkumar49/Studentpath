/**
 * EduPath Backend — utils/streakHelper.js
 * Reusable streak calculation utility
 */

// ✅ FIX: was require('./db') — wrong path from utils/ folder
const { User } = require('../db');

const updateStreak = async (userId) => {
  const user  = await User.findById(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = user.streak.lastStudied
    ? new Date(user.streak.lastStudied)
    : null;

  if (last) {
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
    if      (diffDays === 0) return user.streak;   // already counted today
    else if (diffDays === 1) user.streak.current += 1;
    else                     user.streak.current  = 1;  // streak broken
  } else {
    user.streak.current = 1;
  }

  if (user.streak.current > user.streak.longest) {
    user.streak.longest = user.streak.current;
  }

  user.streak.lastStudied = new Date();
  await user.save({ validateBeforeSave: false });
  return user.streak;
};

const studiedToday = (streak) => {
  if (!streak.lastStudied) return false;
  const last  = new Date(streak.lastStudied);
  const today = new Date();
  return (
    last.getFullYear() === today.getFullYear() &&
    last.getMonth()    === today.getMonth()    &&
    last.getDate()     === today.getDate()
  );
};

const streakMessage = (current) => {
  if (current === 0)  return '🌱 Start your streak today!';
  if (current === 1)  return '🔥 Day 1 — great start!';
  if (current < 5)    return `🔥 ${current} days! Keep it going!`;
  if (current < 10)   return `⚡ ${current} day streak! You're on fire!`;
  if (current < 30)   return `🏆 ${current} days! Incredible consistency!`;
  return `👑 ${current} days! You're a legend!`;
};

module.exports = { updateStreak, studiedToday, streakMessage };
