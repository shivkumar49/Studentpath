/**
 * ══════════════════════════════════════════
 * EduPath Backend — controllers/aiController.js
 * Claude API proxy — chat, explain, hint
 * Location: /edupath/controllers/aiController.js
 * ══════════════════════════════════════════
 */

const { AppError } = require('../middleware/errorHandler');

// ── EduPath AI Tutor system prompt ────────
const SYSTEM_PROMPT = `You are EduPath's friendly AI Tutor — a helpful, encouraging coding mentor.

Your expertise covers:
- Web Development (HTML, CSS, JavaScript, React, Node.js, REST APIs)
- Data Structures & Algorithms (arrays, trees, graphs, DP, sorting, searching)
- Machine Learning & AI basics (regression, classification, neural networks)
- System Design fundamentals (scalability, databases, caching, microservices)
- Python, Java, C++, JavaScript programming languages

Your personality:
- Encouraging and patient — students may be complete beginners
- Explain things step-by-step with simple, clear language
- Use real-world analogies to explain abstract concepts
- Celebrate small wins and progress 🎉
- Never make students feel bad for not knowing something

Formatting rules:
- Keep responses under 200 words unless a code example is needed
- Always wrap code in proper code blocks with language tag
- Use **bold** for key terms only
- Use emojis sparingly but warmly (1–2 per response max)
- Give numbered steps for multi-step processes

Always end with one of:
- A follow-up question to check understanding
- A "💡 Try this:" practice challenge
- A "📖 Next step:" learning suggestion`;

// ── Shared Anthropic fetch helper ─────────
const callClaude = async ({ messages, maxTokens = 1000 }) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method : 'POST',
    headers: {
      'Content-Type'     : 'application/json',
      'x-api-key'        : process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model     : process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system    : SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    console.error('Claude API error:', response.status, errBody);
    throw new AppError('AI service temporarily unavailable. Please try again.', 502);
  }

  const data  = await response.json();
  const reply = data.content?.map(b => b.text || '').join('') || '';

  if (!reply) throw new AppError('Empty response from AI.', 502);

  return { reply, usage: data.usage };
};

// ══════════════════════════════════════════
// chat
// POST /api/ai/chat
// Full multi-turn conversation
// ══════════════════════════════════════════
exports.chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    const messages = [
      // Include last 10 messages for context window efficiency
      ...history.slice(-10).map(m => ({
        role   : m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content).slice(0, 2000),
      })),
      { role: 'user', content: message },
    ];

    const { reply, usage } = await callClaude({ messages, maxTokens: 1000 });

    res.json({ success: true, reply, usage });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// explain
// POST /api/ai/explain
// Explain a concept at a given level
// ══════════════════════════════════════════
exports.explain = async (req, res, next) => {
  try {
    const { topic, level = 'beginner' } = req.body;

    const prompt = `Explain "${topic}" clearly for a ${level} programmer.
Structure your response as:
1. **Simple Definition** (1 sentence)
2. **Real-World Analogy** (1–2 sentences)
3. **Code Example** (short, clear snippet)
4. **When to use it** (1–2 sentences)

Keep it under 250 words total.`;

    const { reply } = await callClaude({
      messages  : [{ role: 'user', content: prompt }],
      maxTokens : 600,
    });

    res.json({ success: true, topic, level, explanation: reply });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// hint
// POST /api/ai/hint
// Give a nudge — not the full solution
// ══════════════════════════════════════════
exports.hint = async (req, res, next) => {
  try {
    const { problem, currentCode = '' } = req.body;

    const prompt = `A student is stuck on: "${problem}"
${currentCode ? `Their current attempt:\n\`\`\`\n${currentCode}\n\`\`\`` : ''}

Give exactly ONE helpful hint to push them in the right direction.
Rules:
- Do NOT give the full solution
- Ask a guiding question that makes them think
- Keep it under 80 words
- Be warm and encouraging`;

    const { reply: hint } = await callClaude({
      messages  : [{ role: 'user', content: prompt }],
      maxTokens : 250,
    });

    res.json({ success: true, hint });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════
// reviewCode
// POST /api/ai/review
// Review student's code and give feedback
// ══════════════════════════════════════════
exports.reviewCode = async (req, res, next) => {
  try {
    const { code, language = 'javascript', goal = '' } = req.body;

    const prompt = `Review this ${language} code written by a student${goal ? ` (Goal: ${goal})` : ''}.

\`\`\`${language}
${code}
\`\`\`

Provide feedback on:
1. **What's working well** ✅
2. **One improvement** (most important one only)
3. **Best practice tip** 

Be encouraging! Keep total response under 200 words.`;

    const { reply } = await callClaude({
      messages  : [{ role: 'user', content: prompt }],
      maxTokens : 600,
    });

    res.json({ success: true, review: reply });
  } catch (err) {
    next(err);
  }
};