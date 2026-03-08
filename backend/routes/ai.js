/**
 * EduPath — routes/ai.js
 * Claude AI proxy — chat, explain, hint, code review
 * Uses built-in fetch (Node.js 18+)
 */

const express    = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── Per-user in-memory rate limiter ───────
const aiMessageCounts = new Map();
const checkAIRateLimit = (req, res, next) => {
  const userId = req.user.id.toString();
  const now    = Date.now();
  const window = 10 * 60 * 1000; // 10 min
  const max    = 30;
  const entry  = aiMessageCounts.get(userId);

  if (!entry || now > entry.resetAt) {
    aiMessageCounts.set(userId, { count: 1, resetAt: now + window });
    return next();
  }
  if (entry.count >= max) {
    return res.status(429).json({
      success: false,
      error: `AI rate limit reached. Wait ${Math.ceil((entry.resetAt - now) / 1000)}s.`,
    });
  }
  entry.count += 1;
  next();
};

// ── System prompt ─────────────────────────
const SYSTEM_PROMPT = `You are EduPath's friendly AI Tutor — an encouraging coding mentor for students.

Expertise: Web Dev (HTML/CSS/JS/React/Node), DSA, Machine Learning, System Design, Python/Java/C++.

Personality: Patient, encouraging, use real-world analogies, celebrate progress.

Format:
- Responses under 200 words unless code is needed
- Use code blocks with language tag for all code
- Bold key terms with **term**
- Use emojis sparingly (1–2 max)
- Numbered steps for processes

Always end with a follow-up question OR a "💡 Try this:" challenge.`;

// ── Shared Claude API caller ──────────────
const callClaude = async (messages, maxTokens = 1000) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':       'application/json',
      'x-api-key':          process.env.ANTHROPIC_API_KEY,
      'anthropic-version':  '2023-06-01',
    },
    body: JSON.stringify({
      model:      process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system:     SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('Claude API error:', response.status, err);
    throw { status: 502, message: 'AI service temporarily unavailable. Please try again.' };
  }

  const data  = await response.json();
  const reply = (data.content || []).map(b => b.text || '').join('');
  if (!reply) throw { status: 502, message: 'Empty response from AI.' };
  return { reply, usage: data.usage };
};

// ══════════════════════════════════════════
// POST /api/ai/chat
// ══════════════════════════════════════════
router.post('/chat', checkAIRateLimit, [
  body('message').trim().notEmpty().withMessage('Message required').isLength({ max: 2000 }),
  body('history').optional().isArray({ max: 20 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { message, history = [] } = req.body;

    const messages = [
      ...history.slice(-10).map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content).slice(0, 2000),
      })),
      { role: 'user', content: message },
    ];

    const { reply, usage } = await callClaude(messages, 1000);
    res.json({ success: true, reply, usage });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
});

// ══════════════════════════════════════════
// POST /api/ai/explain
// ══════════════════════════════════════════
router.post('/explain', checkAIRateLimit, [
  body('topic').trim().notEmpty().isLength({ max: 200 }),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { topic, level = 'beginner' } = req.body;
    const prompt = `Explain "${topic}" for a ${level} programmer.\n1) Simple definition\n2) Real-world analogy\n3) Short code example\n4) When to use it\nMax 250 words.`;

    const { reply } = await callClaude([{ role: 'user', content: prompt }], 600);
    res.json({ success: true, topic, level, explanation: reply });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
});

// ══════════════════════════════════════════
// POST /api/ai/hint
// ══════════════════════════════════════════
router.post('/hint', checkAIRateLimit, [
  body('problem').trim().notEmpty().isLength({ max: 1000 }),
  body('currentCode').optional().isLength({ max: 2000 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { problem, currentCode = '' } = req.body;
    const prompt = `Student stuck on: "${problem}"\n${currentCode ? `Their code:\n\`\`\`\n${currentCode}\n\`\`\`` : ''}\nGive ONE helpful hint — not the full solution. Be encouraging. Max 100 words.`;

    const { reply: hint } = await callClaude([{ role: 'user', content: prompt }], 300);
    res.json({ success: true, hint });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
});

// ══════════════════════════════════════════
// POST /api/ai/review
// ══════════════════════════════════════════
router.post('/review', checkAIRateLimit, [
  body('code').notEmpty().withMessage('Code required').isLength({ max: 5000 }),
  body('language').optional().isLength({ max: 50 }),
  body('goal').optional().isLength({ max: 200 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { code, language = 'javascript', goal = '' } = req.body;
    const prompt = `Review this ${language} code${goal ? ` (Goal: ${goal})` : ''}:\n\`\`\`${language}\n${code}\n\`\`\`\n\n1) ✅ What's working\n2) 🔧 One key improvement\n3) 💡 Best practice tip\n\nBe encouraging! Max 200 words.`;

    const { reply } = await callClaude([{ role: 'user', content: prompt }], 600);
    res.json({ success: true, review: reply });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
});

module.exports = router;