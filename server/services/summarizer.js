// Summarizes notes with Claude when ANTHROPIC_API_KEY is set, otherwise with a
// built-in extractive summarizer (word-frequency sentence scoring).
const MODES = ['short', 'bullets', 'quiz'];

const STOP_WORDS = new Set(
  ('a an the and or but if then else of to in on at by for with about against between into through during before after above below from up down out over under again further once here there when where why how all any both each few more most other some such no nor not only own same so than too very can will just should now is are was were be been being have has had having do does did doing i me my we our you your he him his she her it its they them their what which who whom this that these those am also as may might must shall would could one two use used using')
    .split(' ')
);

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.split(' ').length >= 5);
}

const words = (s) => s.toLowerCase().match(/[a-z][a-z'-]+/g) || [];

function rankSentences(text) {
  const sentences = splitSentences(text);
  const freq = {};
  for (const w of words(text)) if (!STOP_WORDS.has(w) && w.length > 2) freq[w] = (freq[w] || 0) + 1;
  const max = Math.max(1, ...Object.values(freq));
  const ranked = sentences.map((s, i) => {
    const ws = words(s).filter((w) => freq[w]);
    const score = ws.reduce((sum, w) => sum + freq[w] / max, 0) / Math.max(1, Math.sqrt(words(s).length));
    return { s, i, score };
  });
  return { ranked: ranked.sort((a, b) => b.score - a.score), freq };
}

function builtIn(text, mode) {
  const { ranked, freq } = rankSentences(text);
  if (!ranked.length) return mode === 'short' ? text.slice(0, 300) : [];
  const top = (n) => ranked.slice(0, n).sort((a, b) => a.i - b.i).map((r) => r.s);
  const count = Math.min(Math.max(3, Math.round(ranked.length * 0.25)), 8);

  if (mode === 'short') return top(Math.min(count, 4)).join(' ');
  if (mode === 'bullets') return top(count);

  // quiz: blank out the most important not-yet-used keyword of each top sentence
  const used = new Set();
  return top(6)
    .map((s) => {
      const key = words(s)
        .filter((w) => freq[w] && w.length > 3 && !used.has(w))
        .sort((a, b) => freq[b] - freq[a])[0];
      used.add(key);
      if (!key) return null;
      const blanked = s.replace(new RegExp(`\\b${key}\\b`, 'i'), '_____');
      return { question: `Fill in the blank: ${blanked}`, answer: key };
    })
    .filter(Boolean);
}

const PROMPTS = {
  short: 'Summarize these student notes in one clear paragraph (max 120 words). Return only the summary text.',
  bullets: 'Extract the 5-8 most important key points from these student notes. Return ONLY a JSON array of strings.',
  quiz: 'Write 5 revision questions with short answers based on these student notes. Return ONLY a JSON array of objects with "question" and "answer" keys.',
};

async function withClaude(text, mode) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-5-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `${PROMPTS[mode]}\n\n<notes>\n${text.slice(0, 50000)}\n</notes>` }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}`);
  const out = (await res.json()).content.map((b) => b.text || '').join('').trim();
  if (mode === 'short') return out;
  return JSON.parse(out.slice(out.indexOf('['), out.lastIndexOf(']') + 1));
}

async function summarize(text, mode) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await withClaude(text, mode);
    } catch (err) {
      console.warn('Claude failed, using built-in summarizer:', err.message);
    }
  }
  return builtIn(text, mode);
}

module.exports = { summarize, MODES };
