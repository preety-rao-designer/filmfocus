// npm run eval — runs the 30 moods in docs/EVAL_MOODS.md through the real engine and writes docs/eval/<date>.md.
// Rule checks are written per mood here, independently of the engine's own filters, so the engine isn't marking its
// own homework. Fit is scored 1–5 by an LLM judge; the worst five are then read by hand.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { recommend } from '../api/recommend.js'
import { generateJSON, MODELS } from '../api/_lib/gemini.js'

process.loadEnvFile('.env')

const PREFS = { languages: ['hi', 'en'], platforms: ['Netflix', 'Prime Video', 'JioHotstar'] }
const moods = readFileSync('docs/EVAL_MOODS.md', 'utf8')
  .split('## The moods')[1]
  .split('\n')
  .map((l) => l.match(/^(\d+)\.\s+(.*)$/))
  .filter(Boolean)
  .map(([, n, text]) => ({ n: Number(n), text: text.trim() }))

const big = (c, tones) => c.tone_mix.some((t) => tones.includes(t.tone) && t.pct >= 20)
// Mood-specific hard rules: [description, test(card)]. Default prefs apply to every mood except where it says otherwise.
const RULES = {
  3: [['fine with parents', (c) => c.family !== 'adults_only' && !c.content_flags.includes('sexual_content')]],
  10: [['fine to half-watch', (c) => c.bandwidth.attention !== 'full_focus']],
  11: [['nothing tense', (c) => !big(c, ['tense', 'scary', 'thrilling'])]],
  12: [['a series', (c) => c.type === 'series']],
  13: [['movie under 100 min', (c) => c.type === 'movie' && c.runtime_min <= 100]],
  16: [['scary', (c) => c.tone_mix.some((t) => t.tone === 'scary')], ['no gore', (c) => !c.content_flags.includes('gore')]],
  17: [['Tamil or Malayalam', (c) => c.languages.some((l) => ['ta', 'ml'].includes(l))]],
  18: [['fine for a 10-year-old', (c) => c.family === 'family_ok']],
  19: [['true story', (c) => c.truth.status === 'true_story']],
  24: [['no romance', (c) => !big(c, ['romantic'])]],
  26: [['a series with short episodes', (c) => c.type === 'series' && (c.series?.episode_min || 99) <= 35]],
  30: [['no sad ending', (c) => !['devastating', 'bittersweet'].includes(c.ending)], ['light', (c) => c.bandwidth.emotional_weight <= 3]],
}
const defaultRules = (n) => [
  ...(n === 17 ? [] : [['Hindi or English (saved prefs)', (c) => c.languages.some((l) => PREFS.languages.includes(l))]]),
  ['on Netflix, Prime Video or JioHotstar (saved prefs)', (c) => c.watch_in.some((w) => PREFS.platforms.includes(w))],
]

const JUDGE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    fit: { type: 'INTEGER', description: '1–5' },
    reason: { type: 'STRING' },
    why_lines_refer_to_input: { type: 'BOOLEAN', description: 'Does every why-this-fits line refer to something the person actually said (or, for "surprise me", to it being a surprise)?' },
  },
  required: ['fit', 'reason', 'why_lines_refer_to_input'],
}

// EVAL_JUDGE=lite scores with Flash-Lite when the Flash models are out of their 20-a-day free quota. It's a more
// lenient judge, so every row records which model scored it and the summary says when Flash-Lite was used.
const JUDGE_CHAIN = process.env.EVAL_JUDGE === 'lite' ? MODELS.rerank : MODELS.judge

async function judge(m, res) {
  const picks = res.picks.map((p) => `- ${p.card.title} (${p.card.year}, ${p.card.type}, ${p.card.languages[0]}): ${p.card.honest_read.actually_is} | why: ${p.why_this_fits}`).join('\n')
  // Short timeouts: when Gemini is overloaded a hung call otherwise costs 90s × 3 tries × 4 models per mood.
  const { data, model } = await generateJSON({
    chain: JUDGE_CHAIN,
    timeoutMs: 30000,
    system: 'You judge a mood-to-movie app for viewers in India. Use your own knowledge of these titles. Score 1–5: would a thoughtful friend who knows these titles make these three picks for this mood? 5 = all three are spot on; 4 = good, one is a stretch; 3 = mixed; 2 = mostly wrong; 1 = absurd. Be strict. The viewer saved Hindi and English as languages and Netflix, Prime Video and JioHotstar as platforms.',
    prompt: `Mood: "${m.text}"\nPicks:\n${picks}`,
    schema: JUDGE_SCHEMA,
    temperature: 0,
    thinking: 'medium',
    attempts: 4,
  })
  return { ...data, judge: model }
}

const store = new Set(JSON.parse(readFileSync('data/cards.json', 'utf8')).map((c) => c.id))
// Saved after every mood, so a run stopped part-way (quota waits, time limits) picks up where it left off.
// EVAL_FRESH=1 starts the round over.
const round = process.env.EVAL_ROUND || '1'
const partial = `data/eval-partial-${round}.json`
let results = []
try {
  if (!process.env.EVAL_FRESH) results = JSON.parse(readFileSync(partial, 'utf8'))
} catch {}
if (results.length) console.log(`Resuming round ${round}: ${results.length} moods already done.`)
for (const m of moods) {
  if (results.some((r) => r.n === m.n)) continue
  const text = m.n === 29 ? '' : m.text
  const t = Date.now()
  let res
  try {
    res = await recommend({ text, chips: {}, prefs: PREFS })
    // The one follow-up: answer it the way the mood implies, as a person would, and run again.
    if (res.followup) res = { ...(await recommend({ text, chips: {}, prefs: PREFS, answer: { slot: res.followup.slot, value: res.followup.options[0] } })), askedFollowup: true }
  } catch (e) {
    results.push({ ...m, error: e.message, pass: false, fit: 0 })
    writeFileSync(partial, JSON.stringify(results))
    console.log(`${m.n}. ERROR ${e.message}`)
    continue
  }
  const ms = Date.now() - t
  const fails = []
  if (res.picks.length !== 3) fails.push(`${res.picks.length} picks`)
  if (new Set(res.picks.map((p) => p.card.id)).size !== res.picks.length) fails.push('duplicate titles')
  if (res.picks.some((p) => !store.has(p.card.id))) fails.push('a pick not in the store')
  for (const [label, test] of [...defaultRules(m.n), ...(RULES[m.n] || [])]) {
    const bad = res.picks.filter((p) => !test(p.card)).map((p) => p.card.title)
    if (bad.length) fails.push(`${label}: ${bad.join(', ')}`)
  }
  let j = { fit: 0, reason: 'no picks', why_lines_refer_to_input: false }
  if (res.picks.length) j = await judge(m, res)
  if (!j.why_lines_refer_to_input) fails.push('why lines miss what they said')
  const row = { ...m, picks: res.picks.map((p) => ({ title: p.card.title, year: p.card.year, lang: p.card.languages[0], why: p.why_this_fits })), fails, pass: fails.length === 0, fit: j.fit, reason: j.reason, judge: j.judge, followup: Boolean(res.askedFollowup), no_match: res.no_match || null, ms }
  results.push(row)
  writeFileSync(partial, JSON.stringify(results))
  console.log(`${m.n}. ${row.pass ? 'PASS' : 'FAIL'} fit ${j.fit} · ${row.picks.map((p) => p.title).join(' | ')}${fails.length ? ` · ${fails.join('; ')}` : ''} · ${Math.round(ms / 1000)}s`)
}

const passed = results.filter((r) => r.pass).length
const avg = results.reduce((a, r) => a + r.fit, 0) / results.length
const below3 = results.filter((r) => r.fit < 3)
const meets = passed >= 28 && avg >= 4 && below3.length === 0
results.sort((a, b) => a.n - b.n)
const date = new Date().toISOString().slice(0, 10)
const sorted = [...results].sort((a, b) => b.fit - a.fit)
const md = [
  `# Engine eval, ${date}, round ${round}`,
  '',
  `Store: ${store.size} cards. Saved prefs: Hindi, English; Netflix, Prime Video, JioHotstar.`,
  '',
  `- **Rule checks passed:** ${passed}/30 (bar: 28)`,
  `- **Average fit:** ${avg.toFixed(2)} (bar: 4.0)`,
  `- **Moods below 3:** ${below3.length ? below3.map((r) => r.n).join(', ') : 'none'} (bar: none)`,
  `- **Meets the pass bar:** ${meets ? 'yes' : 'no'}`,
  `- **Fit scored by:** ${Object.entries(results.reduce((a, r) => ((a[r.judge || 'n/a'] = (a[r.judge || 'n/a'] || 0) + 1), a), {})).map(([k, v]) => `${k} (${v})`).join(', ')}${results.some((r) => /lite/.test(r.judge || '')) ? '. Flash-Lite judged some moods because the Flash models were out of free quota; it is a more lenient judge than Flash.' : ''}`,
  '',
  '## Best three',
  ...sorted.slice(0, 3).map((r) => `- **${r.n}. ${r.text}** (fit ${r.fit}): ${r.picks.map((p) => p.title).join(', ')}`),
  '',
  '## Worst three',
  ...sorted.slice(-3).reverse().map((r) => `- **${r.n}. ${r.text}** (fit ${r.fit}): ${r.picks?.map((p) => p.title).join(', ') || r.error}. ${r.reason}`),
  '',
  '## Every mood',
  '',
  '| # | Mood | Picks | Rules | Fit | Judge |',
  '|---|---|---|---|---|---|',
  ...results.map((r) => `| ${r.n} | ${r.text} | ${r.picks?.map((p) => `${p.title} (${p.lang})`).join('; ') || r.error}${r.followup ? ' *(after the follow-up)*' : ''} | ${r.pass ? 'pass' : r.fails?.join('; ') || 'error'} | ${r.fit} | ${(r.reason || '').replace(/\|/g, '/')} |`),
  '',
  '## Why lines',
  '',
  ...results.flatMap((r) => [`**${r.n}. ${r.text}**`, ...(r.picks || []).map((p) => `- ${p.title}: ${p.why}`), '']),
].join('\n')
mkdirSync('docs/eval', { recursive: true })
writeFileSync(`docs/eval/${date}-round-${round}.md`, md)
writeFileSync(`docs/eval/${date}-round-${round}.json`, JSON.stringify(results, null, 1))
console.log(`\npassed ${passed}/30 · avg fit ${avg.toFixed(2)} · below 3: ${below3.length} · meets bar: ${meets} → docs/eval/${date}-round-${round}.md`)
