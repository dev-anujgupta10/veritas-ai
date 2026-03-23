const express = require('express');
const router = express.Router();
const axios = require('axios');

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Robustly extract a JSON object from Gemini output.
 * Strategy:
 *   1. Try JSON.parse directly (works when responseMimeType forces clean JSON)
 *   2. Strip markdown fences and <think> tags, then try again
 *   3. Use brace-counting to find the last candidate block
 */
function extractJSON(raw) {
  // 1. Direct parse — works for clean JSON output (responseMimeType: application/json)
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.verdict) return parsed;
  } catch (_) { /* fall through */ }

  // 2. Strip markdown fences and thinking model tags
  let str = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();

  // 2b. Try direct parse after stripping
  try {
    const parsed = JSON.parse(str);
    if (parsed && parsed.verdict) return parsed;
  } catch (_) { /* fall through */ }

  // 3. Brace-counting: find all top-level {...} blocks
  const candidates = [];
  let depth = 0, start = -1;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (str[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) { candidates.push(str.substring(start, i + 1)); start = -1; }
    }
  }

  // Try candidates last-to-first, must contain "verdict"
  for (let i = candidates.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(candidates[i]);
      if (obj && obj.verdict) return obj;
    } catch (_) { /* try next */ }
  }

  throw new Error('No valid JSON with "verdict" field found in Gemini output');
}

/**
 * Detect if the query is news-related (sports, politics, events, etc.)
 * so we know whether to also hit GNews.
 */
function isNewsQuery(text) {
  const newsKeywords = [
    'win', 'won', 'lost', 'lose', 'beat', 'defeat', 'election', 'vote',
    'president', 'prime minister', 'war', 'attack', 'cup', 'championship',
    'match', 'tournament', 'died', 'arrested', 'launch', 'score', 'final',
    'gold', 'medal', 'world cup', 'olympics', 'ipl', 't20', 'odi', 'cricket',
    'football', 'soccer', 'nba', 'nfl', 'ban', 'treaty', 'summit', 'crash',
    'earthquake', 'flood', 'fire', 'explosion', 'scandal', 'resign', 'resign'
  ];
  const lower = text.toLowerCase();
  return newsKeywords.some(kw => lower.includes(kw));
}

// ═══════════════════════════════════════════════════════════════════
// DATA FETCHERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Serper.dev – primary real-time search data source.
 * Returns an array of { title, snippet, link }.
 */
async function fetchSerper(query) {
  try {
    console.log(`[Serper] Querying: "${query}"`);
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: 8 },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const organic = response.data.organic || [];
    const results = organic.slice(0, 8).map(r => ({
      title: r.title || '',
      snippet: r.snippet || '',
      link: r.link || '',
    }));

    console.log(`[Serper] Got ${results.length} results`);
    return results;
  } catch (err) {
    console.error('[Serper] Error:', err.response?.data || err.message);
    return [];
  }
}

/**
 * GNews API – supplementary news layer for event/news queries.
 * Returns an array of { title, description, sourceName, link }.
 */
async function fetchGNews(query) {
  try {
    console.log(`[GNews] Querying: "${query}"`);
    const q = encodeURIComponent(query.split(' ').slice(0, 6).join(' '));
    const url = `https://gnews.io/api/v4/search?q=${q}&token=${process.env.GNEWS_API_KEY}&max=5&lang=en`;
    const response = await axios.get(url, { timeout: 10000 });

    const articles = (response.data.articles || []).filter(a => a.title && a.description);
    const results = articles.slice(0, 5).map(a => ({
      title: a.title,
      description: a.description,
      sourceName: a.source?.name || 'Unknown',
      link: a.url || '',
    }));

    console.log(`[GNews] Got ${results.length} articles`);
    return results;
  } catch (err) {
    console.error('[GNews] Error:', err.response?.data || err.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// DATA FORMATTER
// ═══════════════════════════════════════════════════════════════════

/**
 * Merge Serper and GNews results, remove exact-title duplicates,
 * and format into a clean readable string for the Gemini prompt.
 */
function formatContext(serperResults, gnewsResults) {
  const lines = [];
  const seenTitles = new Set();
  let counter = 1;

  serperResults.forEach((r) => {
    const key = r.title.toLowerCase().slice(0, 60);
    if (seenTitles.has(key)) return;
    seenTitles.add(key);
    lines.push(`${counter}. Title: ${r.title}\n   Snippet: ${r.snippet}\n   Source: ${r.link}`);
    counter++;
  });

  gnewsResults.forEach((a) => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seenTitles.has(key)) return;
    seenTitles.add(key);
    lines.push(`${counter}. Title: ${a.title}\n   Snippet: ${a.description}\n   Source: ${a.sourceName} (${a.link})`);
    counter++;
  });

  return lines.join('\n\n');
}

// ═══════════════════════════════════════════════════════════════════
// GEMINI CALLER (WITH MODEL FALLBACK)
// ═══════════════════════════════════════════════════════════════════

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

async function callGemini(prompt) {
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      console.log(`[Gemini] Trying model: ${model}`);
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      const candidate = res.data.candidates[0];
      if (candidate.finishReason === 'SAFETY' || !candidate.content) {
        console.warn(`[Gemini] Model ${model} blocked by safety filters.`);
        return JSON.stringify({
          verdict: 'MISLEADING',
          confidence: 50,
          summary: null,
          reasoning: 'The AI could not analyze this query due to safety constraints or controversial subject matter.',
          sources: []
        });
      }

      const raw = candidate.content.parts[0].text;
      console.log(`[Gemini] Success with model: ${model}`);
      return raw;
    } catch (err) {
      const status = err.response?.status;
      console.warn(`[Gemini] ${model} failed (${status}):`, err.response?.data?.error?.message || err.message);
      if (status === 429) await new Promise(r => setTimeout(r, 1200));
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) throw err;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION ROUTE
// ═══════════════════════════════════════════════════════════════════

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // ── STEP 1: Gather real-time data ────────────────────────────
    const [serperResults, gnewsResults] = await Promise.all([
      fetchSerper(text),
      isNewsQuery(text) ? fetchGNews(text) : Promise.resolve([]),
    ]);

    const allSources = [
      ...serperResults.map(r => ({ title: r.title, link: r.link })),
      ...gnewsResults.map(a => ({ title: a.title, link: a.link })),
    ].filter(s => s.title);

    const contextStr = formatContext(serperResults, gnewsResults);
    const hasContext = contextStr.trim().length > 0;

    console.log('[Verify] Context built. Has data:', hasContext);
    console.log('[Verify] Formatted context:\n', contextStr || '(none)');

    // ── STEP 2: Build Gemini prompt ─────────────────────────────
    const dataSection = hasContext
      ? `Here is real-time search data gathered for this claim:\n\n${contextStr}\n\nUse this data to cross-reference the claim. If multiple independent sources agree, increase confidence. If they conflict, note that. If sources are unrelated, fall back on your general knowledge.`
      : `No real-time search data was available for this claim. You MUST still analyze it thoroughly using your general knowledge. Do NOT refuse to answer.`;

    const prompt = `You are Veritas AI — an expert fact-checking system. Verify the following claim and return a structured JSON verdict.

CRITICAL INSTRUCTION:
You MUST base your answer ONLY on the provided search results.
Do NOT use your own knowledge.
Do NOT guess.
If sources confirm something, treat it as fact.

INPUT FORMAT:

Query:
"${text}"

Search Results:

${dataSection}

LOGIC:
- If multiple sources agree → TRUE
- If multiple sources deny → FALSE
- If mixed → MISLEADING

IMPORTANT RULES:
- Do NOT ignore search results
- Do NOT rely on training knowledge
- Treat search data as ground truth
- NEVER output "cannot verify", "unclear", or any unstructured response.
- verdict MUST be exactly "TRUE", "FALSE", or "MISLEADING".
- confidence MUST be a number between 0 and 100.
- summary is ONLY included when verdict is "TRUE" (otherwise set to null).
- sources MUST be an array of objects containing 'title' and 'url'.

RESPOND WITH ONLY THIS EXACT JSON FORMAT — no markdown, no preamble:
{
  "verdict": "TRUE",
  "confidence": 95,
  "summary": "Short explanation of the event (only if TRUE, else null)",
  "reasoning": "Why this verdict was reached based on sources",
  "sources": [
    { "title": "Source title", "url": "https://..." }
  ]
}`;

    // ── STEP 3: Call Gemini ─────────────────────────────────────
    const aiRaw = await callGemini(prompt);
    require('fs').writeFileSync('last_raw.json', aiRaw, 'utf8');

    // ── STEP 4: Parse + validate ────────────────────────────────
    let result;
    try {
      result = extractJSON(aiRaw);
    } catch (parseErr) {
      console.error('[Verify] JSON parse failed. Raw:\n', aiRaw);
      result = {
        verdict: 'MISLEADING',
        confidence: 60,
        reasoning: 'The AI returned an unstructured response. The claim could not be definitively verified at this time.',
        summary: null,
        sources: allSources.slice(0, 3),
      };
    }

    // Enforce valid verdict
    if (!['TRUE', 'FALSE', 'MISLEADING'].includes(result.verdict)) {
      result.verdict = 'MISLEADING';
    }

    // Enforce numeric confidence in range
    if (typeof result.confidence === 'string') {
      result.confidence = parseInt(result.confidence.replace(/[^0-9]/g, ''), 10) || 65;
    }
    result.confidence = Math.max(0, Math.min(100, Math.round(result.confidence)));

    // summary only for TRUE
    if (result.verdict !== 'TRUE') result.summary = null;

    // fallback sources
    if (!result.sources || result.sources.length === 0) {
      result.sources = allSources.slice(0, 5);
    }

    console.log('[Verify] Final result:', JSON.stringify({ verdict: result.verdict, confidence: result.confidence }));

    // ── STEP 5: Respond ────────────────────────────────────────
    res.json({
      verdict: result.verdict,
      confidence: result.confidence,
      explanation: result.reasoning || result.explanation || 'No reasoning available.',
      summary: result.summary || null,
      sources: result.sources || result.sources_used || [],
    });

  } catch (err) {
    console.error('[Verify] Unhandled error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Verification service temporarily unavailable. Please try again.' });
  }
});

module.exports = router;
