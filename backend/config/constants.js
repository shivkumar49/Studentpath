/**
 * EduPath — config/constants.js
 * All app-wide constants
 */

const USER = {
  DOMAINS: ['Web Dev', 'AI / ML', 'DSA', 'Data Science', 'DevOps', 'Android'],
  MIN_NAME_LENGTH: 2, MAX_NAME_LENGTH: 50, MIN_PASSWORD_LENGTH: 6,
};

const TASK = {
  STATUSES:   ['pending', 'in_progress', 'completed', 'overdue'],
  PRIORITIES: ['low', 'medium', 'high'],
  CATEGORIES: ['study', 'practice', 'project', 'revision', 'other'],
  MAX_TITLE_LENGTH: 200,
};

const TIMER = {
  PRESETS: {
    pomodoro:    { label: 'Pomodoro',    minutes: 25 },
    deep_work:   { label: 'Deep Work',   minutes: 50 },
    quick_focus: { label: 'Quick Focus', minutes: 15 },
    short_break: { label: 'Short Break', minutes: 5  },
    long_break:  { label: 'Long Break',  minutes: 10 },
    custom:      { label: 'Custom',      minutes: null },
  },
  MIN_DURATION: 1,
  MAX_DURATION: 180,
};

const PROGRESS = {
  STATUSES: ['not_started', 'in_progress', 'completed'],
  COURSES: ['Web Development', 'Data Structures', 'Machine Learning', 'System Design', 'Python', 'DevOps'],
};

const AI = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_HISTORY_MESSAGES: 20,
  KEEP_HISTORY_CONTEXT: 10,
  LEVELS: ['beginner', 'intermediate', 'advanced'],
};

const HTTP = {
  OK: 200, CREATED: 201, NO_CONTENT: 204,
  BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
  NOT_FOUND: 404, CONFLICT: 409, SERVER_ERROR: 500, BAD_GATEWAY: 502,
};

const PAGINATION = {
  DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100,
};

module.exports = { USER, TASK, TIMER, PROGRESS, AI, HTTP, PAGINATION };