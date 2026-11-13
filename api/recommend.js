// POST /api/recommend — mood in, three picks from the card store out.
// Body: { text, chips: { company, time, stay_or_shift }, exclude: [card ids], prefs: { languages, platforms, subtitles_ok },
//         answer: { slot, value }, loosen: [constraint keys] }
// Response (docs/CARD_SCHEMA.md "The engine's response shape"): { followup, picks: [{ card, why_this_fits }], understood }
// plus `no_match` when hard constraints leave nothing (3.7), and `missing_title`: a title they named that the store
// lacks, so the app can offer to make its card (L4).
//
// Parse (Flash-Lite) → maybe one follow-up → filter on hard constraints → embed the mood, cosine top 30 →
// rerank to 3 (Flash) with ratings as a quality floor → "why this fits" in the person's own terms.
// Picks only ever come from the store: the reranker chooses among ids we give it, and anything else is dropped.
import { generateJSON, embed, MODELS } from './_lib/gemini.js'
import { loadStore, dot } from './_lib/store.js'

const TONES = ['warm', 'funny', 'romantic', 'hopeful', 'uplifting', 'nostalgic', 'whimsical', 'thrilling', 'tense', 'scary', 'dark', 'melancholy', 'heartbreaking', 'thought-provoking', 'chaotic']
const ENDINGS = ['uplifting', 'bittersweet', 'devastating', 'open', 'cathartic', 'unsettling']
const FLAGS = ['violence', 'gore', 'sexual_content', 'strong_language', 'substance_use', 'self_harm_themes', 'disturbing_themes']
const SHIFT = ['comfort', 'cheer', 'feel', 'distract', 'thrill']
const LANG_NAMES = { hi: 'Hindi', en: 'English', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', ko: 'Korean', ja: 'Japanese', es: 'Spanish', fr: 'French' }
const LANGS = Object.keys(LANG_NAMES)
const list = (xs, joiner = 'or') => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${joiner} ${xs.at(-1)}` : xs[0])

const FOLLOWUP = {
  question: 'Stay in this mood or get out of it?',
  options: ['Comfort me', 'Cheer me up', 'Let me feel it', 'Distract me'],
  slot: 'stay_or_shift',
}
const FOLLOWUP_VALUES = { 'Comfort me': 'comfort', 'Cheer me up': 'cheer', 'Let me feel it': 'feel', 'Distract me': 'distract' }

const arr = (items) => ({ type: 'ARRAY', items })
const en = (values, nullable = false) => ({ type: 'STRING', enum: values, nullable })
const PARSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    mood: { type: 'STRING', description: 'Their mood and want in a few plain words.' },
    stay_or_shift: en(SHIFT, true),
    needs_followup: { type: 'BOOLEAN', description: 'True only if they describe a feeling but give no hint of what they want the watch to do with it, and the two readings would need very different picks (e.g. just "I am sad").' },
    company: en(['alone', 'partner', 'friends', 'family', 'kids'], true),
    format: en(['movie', 'series', 'episode'], true),
    max_runtime_min: { type: 'INTEGER', nullable: true, description: 'Only if they give a time limit for a movie.' },
    max_episode_min: { type: 'INTEGER', nullable: true, description: 'Only if they give a time limit for an episode.' },
    attention: en(['background_ok', 'some_focus', 'full_focus'], true),
    languages: arr(en(LANGS)),
    dubbed_in: arr(en(LANGS)),
    hard_nos: arr(en(FLAGS)),
    avoid_tones: arr(en(TONES)),
    avoid_endings: arr(en(ENDINGS)),
    true_story_only: { type: 'BOOLEAN' },
    max_weight: { type: 'INTEGER', nullable: true, description: 'Only if they explicitly ask for something light, easy or not heavy: 2 (or 3 for "not too heavy"). Wanting to laugh or be cheered up is not a weight limit. Else null.' },
    from_year: { type: 'INTEGER', nullable: true, description: 'Only if they name a decade or years for when it came out: "90s" → 1990, "from the 2000s" → 2000, "after 2015" → 2015. Feeling nostalgic or wanting a classic is not a year. Else null.' },
    to_year: { type: 'INTEGER', nullable: true, description: 'Only with a decade or an upper year: "90s" → 1999, "before 2000" → 1999. Else null.' },
    ideal: { type: 'STRING', description: 'Describe the ideal title for them as a short film-card vibe: tone, feel, arc, setting cues. Do not name titles.' },
    named_titles: arr({ type: 'STRING' }),
  },
  required: ['mood', 'needs_followup', 'languages', 'hard_nos', 'avoid_tones', 'avoid_endings', 'true_story_only', 'ideal'],
}

const PARSE_SYSTEM = `You read what someone types into a mood-to-movie app in India and turn it into search constraints. Input may be English, Hindi, or Hinglish.
Only set a constraint when they actually asked for it. "languages" only if they name languages. "hard_nos" only for content they reject (e.g. "not gory" → gore; "no violence"). "avoid_tones"/"avoid_endings" for feelings they reject (e.g. "nothing tense" → tense, thrilling, scary; "no sad ending" → devastating, bittersweet; "no romance" → romantic; "not scary" → scary).
format: "episode" when they want one episode of a series; "series" for a show or binge; "movie" for a film.
languages is the original language of the title they want. A language they want to hear it dubbed in goes in dubbed_in, not languages: "a Korean show dubbed in Hindi" → languages ["ko"], dubbed_in ["hi"]; "Hindi dubbed anime" → languages ["ja"] if they name Japanese, else languages [], dubbed_in ["hi"].
named_titles: any specific movie or show they mention by name ("something like Andhadhun", "is Laapataa Ladies good tonight?"), spelled as its usual title. Empty if none.`

// When the parse model is unavailable (daily free quota, overload), read the obvious hard constraints from keywords
// so search still works, matching on the embedding of their own words. No follow-up in this mode.
const KEYWORDS = [
  [/\b(no|not|without|zero)\b[^.]*\bgor(e|y)\b/i, (p) => p.hard_nos.push('gore')],
  [/\b(no|not|nothing)\b[^.]*\b(scary|horror)\b/i, (p) => p.avoid_tones.push('scary')],
  [/\b(no|not|nothing)\b[^.]*\btense\b/i, (p) => p.avoid_tones.push('tense', 'thrilling', 'scary')],
  [/\b(no|not|nothing)\b[^.]*\bromance\b/i, (p) => p.avoid_tones.push('romantic')],
  [/(no|not|mat)\b[^.]*\bsad ending|sad ending mat/i, (p) => p.avoid_endings.push('devastating', 'bittersweet')],
  [/\btrue story\b/i, (p) => (p.true_story_only = true)],
  [/\b(series|show|binge|episodes?)\b/i, (p) => (p.format = p.format || 'series')],
  [/\b(movie|film)\b/i, (p) => (p.format = p.format || 'movie')],
  [/\b(kids?|children|\d+-year-old)\b/i, (p) => (p.company = 'kids')],
  [/\b(parents|family)\b/i, (p) => (p.company = p.company || 'family')],
]
const LANG_WORDS = { hindi: 'hi', english: 'en', tamil: 'ta', telugu: 'te', malayalam: 'ml', kannada: 'kn', bengali: 'bn', marathi: 'mr', korean: 'ko', japanese: 'ja', spanish: 'es' }
function fallbackParse(text) {
  const p = { mood: text.trim().slice(0, 80), needs_followup: false, languages: [], hard_nos: [], avoid_tones: [], avoid_endings: [], true_story_only: false, ideal: text, fallback: true }
  for (const [re, apply] of KEYWORDS) if (re.test(text)) apply(p)
  const dubbed = Object.entries(LANG_WORDS).filter(([w]) => new RegExp(`\\b(dubbed (in|into) ${w}|${w} dub(bed)?)\\b`, 'i').test(text)).map(([, code]) => code)
  p.dubbed_in = dubbed
  for (const [w, code] of Object.entries(LANG_WORDS)) if (new RegExp(`\\b${w}\\b`, 'i').test(text) && !dubbed.includes(code)) p.languages.push(code)
  const decade = text.match(/\b(?:19)?([5-9]0)['’]?s\b|\b(20[0-2]0)['’]?s\b/i)
  if (decade) {
    p.from_year = decade[1] ? 1900 + Number(decade[1]) : Number(decade[2])
    p.to_year = p.from_year + 9
  }
  const mins = text.match(/under (\d{2,3}) ?min/i)
  if (mins) p[p.format === 'series' ? 'max_episode_min' : 'max_runtime_min'] = Number(mins[1])
  return p
}

async function parse(text, chips) {
  if (!text.trim()) return { mood: null, needs_followup: false, languages: [], hard_nos: [], avoid_tones: [], avoid_endings: [], true_story_only: false, ideal: '' }
  try {
    return await parseWithModel(text)
  } catch (e) {
    // Quota, overload, or a prompt the model refuses to read (e.g. "my 10-year-old" can trip its filters).
    if (e.status === 429 || e.status === 503 || e.name === 'TimeoutError' || e.finish) return fallbackParse(text)
    throw e
  }
}

// Only what they typed: chips can be left over from an earlier search, so they're applied in constraints(), where
// the typed words win when the two disagree.
async function parseWithModel(text) {
  const { data } = await generateJSON({
    chain: MODELS.parse,
    system: PARSE_SYSTEM,
    prompt: `They typed: "${text.slice(0, 600)}"`,
    schema: PARSE_SCHEMA,
    temperature: 0,
    thinking: 'minimal',
    // Flash-Lite answers in 1–5s or throws "503 high demand" and answers the next try. One try of 20s used to send
    // about a third of searches to the keyword fallback, which ignores what they want to avoid and stay or shift.
    timeoutMs: 9000,
    deadlineMs: 18000,
    wait: false,
  })
  return data
}

// What they typed wins when it disagrees with a chip (chips stay set from an earlier search): "a show" with
// "One movie" still tapped means a show, "with friends" with "With kids" still tapped means friends.
function resolve(p, chips) {
  const chipFormat = chips.time === 'movie' ? 'movie' : chips.time === 'few_episodes' || chips.time === 'binge' ? 'series' : null
  return { company: p.company || chips.company || null, format: p.format || chipFormat || null }
}

// Hard constraints, each with the words we'd use to say "loosen this". Their services aren't one of them: see
// onTheirServices below.
function constraints(p, chips, prefs) {
  const out = []
  const { company, format } = resolve(p, chips)
  if (format === 'movie') out.push({ key: 'format', label: 'movies only', test: (c) => c.type === 'movie' })
  if (format === 'series' || format === 'episode') out.push({ key: 'format', label: 'series only', test: (c) => c.type === 'series' })
  if (p.max_runtime_min) out.push({ key: 'runtime', label: `under ${p.max_runtime_min} minutes`, test: (c) => (c.type === 'movie' ? c.runtime_min && c.runtime_min <= p.max_runtime_min : (c.series?.episode_min || 99) <= p.max_runtime_min) })
  if (p.max_episode_min) out.push({ key: 'runtime', label: `episodes under ${p.max_episode_min} minutes`, test: (c) => c.type === 'series' && (c.series?.episode_min || 99) <= p.max_episode_min + 5 })
  const langs = p.languages?.length ? p.languages : prefs.subtitles_ok ? [] : prefs.languages || []
  if (langs.length) out.push({ key: 'languages', label: `in ${list(langs.map((l) => LANG_NAMES[l] || l))}`, test: (c) => c.languages.some((l) => langs.includes(l)) })
  if (p.hard_nos?.length) out.push({ key: 'hard_nos', label: `no ${list(p.hard_nos.map((f) => f.replace(/_/g, ' ')), 'and')}`, test: (c) => !c.content_flags.some((f) => p.hard_nos.includes(f)) })
  if (p.avoid_tones?.length) out.push({ key: 'avoid_tones', label: `nothing ${p.avoid_tones.join(' or ')}`, test: (c) => !c.tone_mix.some((t) => p.avoid_tones.includes(t.tone) && t.pct >= 20) })
  if (p.avoid_endings?.length) out.push({ key: 'avoid_endings', label: `no ${p.avoid_endings.join(' or ')} endings`, test: (c) => !p.avoid_endings.includes(c.ending) })
  if (p.from_year || p.to_year) {
    const from = p.from_year || 1900
    const to = p.to_year || 2100
    const label = p.from_year && p.to_year && to - from === 9 && from % 10 === 0 ? `from the ${from}s` : p.from_year && p.to_year ? `from ${from} to ${to}` : p.from_year ? `from ${from} on` : `from before ${to + 1}`
    out.push({ key: 'era', label, test: (c) => c.year >= from && c.year <= to })
  }
  if (p.true_story_only) out.push({ key: 'true_story', label: 'true stories only', test: (c) => c.truth.status === 'true_story' })
  // Soft: dropped below if it alone would leave fewer than three picks.
  if (p.max_weight) out.push({ key: 'weight', label: 'something light', soft: true, test: (c) => c.bandwidth.emotional_weight <= Math.max(2, p.max_weight) })
  if (company === 'kids') out.push({ key: 'family', label: 'fine for kids', test: (c) => c.family === 'family_ok' })
  if (company === 'family') out.push({ key: 'family', label: 'fine with family', test: (c) => c.family !== 'adults_only' && !c.content_flags.includes('sexual_content') })
  return out
}

const RERANK_SCHEMA = {
  type: 'OBJECT',
  properties: {
    picks: arr({
      type: 'OBJECT',
      properties: { id: { type: 'STRING' }, why_this_fits: { type: 'STRING', description: 'One line, at most 25 words, addressed to them ("you"), tied to what they actually said. No spoilers.' } },
      required: ['id', 'why_this_fits'],
    }),
  },
  required: ['picks'],
}

const brief = (c, platforms) => ({
  id: c.id,
  ...(platforms.length ? { on_their_services: c.watch_in.some((w) => platforms.includes(w)) } : {}),
  title: `${c.title} (${c.year})`,
  type: c.type === 'series' ? `series, ${c.series?.seasons} seasons, ${c.series?.episode_min} min episodes` : `movie, ${c.runtime_min} min`,
  language: c.languages[0],
  is: c.honest_read.actually_is,
  vibe: c.vibe,
  traps: c.expectation_traps,
  tones: c.tone_mix.map((t) => `${t.tone} ${t.pct}%`).join(', '),
  feels: `${c.arc.start} → ${c.arc.middle} → ${c.arc.end}, ending ${c.ending}`,
  weight: c.bandwidth.emotional_weight,
  pace: c.bandwidth.pace,
  attention: c.bandwidth.attention,
  family: c.family,
  truth: c.truth.status,
  good_for: c.good_for,
  skip_if: c.skip_if,
  rating: c.rating?.value ?? null,
})

// `want` is what we settled on (typed words over leftover chips), so the reranker never sees a chip that was overruled.
async function rerank(text, want, platforms, candidates) {
  const asked = text.trim() && `They typed: "${text.trim().slice(0, 600)}"`
  const { data } = await generateJSON({
    chain: MODELS.rerank,
    system: `You are FilmFocus, a friend at the ticket counter who has seen everything. Pick the 3 titles from the list that best fit this person right now. Fit to their mood beats acclaim: a great film that clashes with the mood is a wrong answer. Respect what they asked to avoid, including subplots (read each vibe: \"no romance\" rules out a film with a love story at its heart). Prefer variety across the three (not three near-identical picks). Ratings are only a quality floor. When "on_their_services" is given, at least two of the three must be on their services, unless fewer than two of those fit what they asked for at all; the third can be a clearly better fit elsewhere. Choose only ids from the list. Write each "why this fits" in plain, warm words that refer to what they said; no spoilers.`,
    prompt: `${asked || (want.mood || want.company || want.format || want.stay_or_shift ? 'They only tapped chips.' : 'They asked to be surprised: pick three good, different titles.')}\nWhat we understood: ${JSON.stringify(want)}\n\nCandidates:\n${candidates.map((c) => JSON.stringify(brief(c, platforms))).join('\n')}`,
    schema: RERANK_SCHEMA,
    temperature: 0.3,
    thinking: 'minimal',
    timeoutMs: 12000,
    deadlineMs: 24000,
    wait: false,
  })
  return data.picks
}

// Their services are a preference, not a wall: a 3-service list would otherwise hide the best fits (Inception and
// Interstellar aren't on Netflix) and leave the three least-bad. Two thirds of the shortlist comes from their
// services, the rest is the best of everything else, each in fit order; the reranker prefers theirs when it's close
// and the card says where each one streams.
function blend(ranked, platforms, n) {
  if (!platforms.length) return ranked.slice(0, n)
  const on = (c) => c.watch_in.some((w) => platforms.includes(w))
  const theirs = ranked.filter(on).slice(0, Math.round((n * 2) / 3))
  const rest = ranked.filter((c) => !on(c)).slice(0, n - theirs.length)
  return ranked.filter((c) => theirs.includes(c) || rest.includes(c))
}

const pickRandom = (xs, n) => [...xs].sort(() => Math.random() - 0.5).slice(0, n)

export async function recommend({ text = '', chips = {}, exclude = [], prefs = {}, answer = null, loosen = [] }) {
  chips = { company: chips.company || null, time: chips.time || null, stay_or_shift: chips.stay_or_shift || null }
  if (answer?.slot === 'stay_or_shift' && FOLLOWUP_VALUES[answer.value]) chips.stay_or_shift = FOLLOWUP_VALUES[answer.value]

  const p = await parse(text, chips)
  // A follow-up answer is the newest thing they said; then their typed words; then a chip.
  const stay = (answer && chips.stay_or_shift) || p.stay_or_shift || chips.stay_or_shift || null
  const { company, format } = resolve(p, chips)
  const platforms = prefs.platforms || []
  const understood = {
    mood: p.mood,
    stay_or_shift: stay,
    company,
    time: format === 'episode' ? 'series' : format,
    attention: p.attention || null,
    languages: p.languages?.length ? p.languages : prefs.languages || [],
    platforms: prefs.platforms || [],
    hard_nos: p.hard_nos || [],
  }

  // The one follow-up: only when the gap really changes the picks, and only once.
  if (p.needs_followup && !stay && !answer) return { followup: FOLLOWUP, picks: [], understood }

  const { cards, vectors, aliases } = await loadStore()
  const rules = constraints(p, chips, prefs).filter((r) => !loosen.includes(r.key))
  // "Something like Zindagi Na Milegi Dobara" wants others like it, not the film itself.
  const named = new Set((p.named_titles || []).map(norm).filter(Boolean))
  const seen = new Set([...exclude, ...cards.filter((c) => named.has(norm(c.title)) || named.has(norm(c.original_title || ''))).map((c) => c.id)])
  let pool = cards.filter((c) => rules.every((r) => r.test(c)))
  if (pool.length < 3 && rules.some((r) => r.soft)) {
    const hard = rules.filter((r) => !r.soft)
    const wider = cards.filter((c) => hard.every((r) => r.test(c)))
    if (wider.length > pool.length) pool = wider
  }
  if (!pool.length) {
    // Say which constraint to loosen: the one whose removal brings back the most titles. If no single one brings
    // anything back, the one that on its own rules out the most of the store.
    let best = rules
      .map((r) => ({ r, n: cards.filter((c) => rules.every((x) => x === r || x.test(c))).length }))
      .sort((a, b) => b.n - a.n)[0]
    if (best && best.n === 0) best = rules.map((r) => ({ r, n: cards.filter((c) => r.test(c)).length })).sort((a, b) => a.n - b.n)[0]
    return { followup: null, picks: [], understood, no_match: best ? { constraint: best.r.key, label: best.r.label } : null }
  }
  let fresh = pool.filter((c) => !seen.has(c.id))
  if (fresh.length < 3) fresh = pool // cycled through everything that fits; start again

  // Not streaming anywhere in India: only if nothing streaming is left (the reranker didn't reliably skip them).
  const streaming = fresh.filter((c) => c.watch_in.length)
  if (streaming.length >= 3) fresh = streaming

  // Quality floor: below 6.0 only if nothing else is left.
  const floor = fresh.filter((c) => !c.rating || c.rating.value >= 6.0)
  if (floor.length >= 3) fresh = floor

  let candidates
  if (!text.trim() && !Object.values(chips).some(Boolean)) {
    // A surprise has no mood a better fit elsewhere could serve, so it stays on their services when it can.
    const theirs = fresh.filter((c) => !platforms.length || c.watch_in.some((w) => platforms.includes(w)))
    const from = theirs.length >= 3 ? theirs : fresh
    const good = from.filter((c) => !c.rating || c.rating.value >= 7)
    candidates = pickRandom(good.length >= 3 ? good : from, 30)
  } else {
    const query = [p.ideal, p.mood, stay && `They want: ${stay}.`, text].filter(Boolean).join(' ')
    let score
    try {
      const [q] = await embed([query], 'RETRIEVAL_QUERY', { patient: false })
      score = (c) => dot(q, vectors[c.id])
    } catch {
      // Embeddings unavailable too: rank by how much of each card's tone matches the words they used, then rating.
      const words = query.toLowerCase()
      score = (c) => c.tone_mix.reduce((a, t) => a + (words.includes(t.tone.replace('-', ' ')) || words.includes(t.tone) ? t.pct : 0), 0) + (c.rating?.value || 0)
    }
    const ranked = fresh.map((c) => ({ c, s: score(c) })).sort((a, b) => b.s - a.s).map((x) => x.c)
    candidates = blend(ranked, platforms, 30)
  }

  let chosen = []
  let reranked = true
  try {
    const ranked = await rerank(text, { mood: p.mood, stay_or_shift: stay, company, format }, platforms, candidates)
    const byId = new Map(candidates.map((c) => [c.id, c]))
    for (const r of ranked) {
      const card = byId.get(r.id)
      if (card && !chosen.some((x) => x.card.id === card.id)) chosen.push({ card, why_this_fits: r.why_this_fits })
      if (chosen.length === 3) break
    }
  } catch {
    // Reranker unavailable: fall back to retrieval order with a plain line. Still only store cards.
    reranked = false
  }
  for (const card of candidates) {
    if (chosen.length >= 3) break
    if (!chosen.some((x) => x.card.id === card.id)) chosen.push({ card, why_this_fits: `Close to what you described: ${card.tone_mix.slice(0, 2).map((t) => t.tone).join(' and ')}, ending ${card.ending}.` })
  }
  // We hold no dubbing data, so a dub request can't filter; the app says so instead of pretending.
  const dubbed = (p.dubbed_in || []).filter((l) => !p.languages?.includes(l)).map((l) => LANG_NAMES[l] || l)
  // degraded: which model steps fell back (Gemini busy), so the eval and logs can see it; the app ignores it.
  const degraded = [p.fallback && 'parse', reranked === false && 'rerank'].filter(Boolean)
  if (degraded.length) console.warn(`[recommend] degraded: ${degraded.join(', ')}`)
  return { followup: null, picks: chosen, understood, missing_title: missingTitle(p.named_titles, cards, aliases), dubbed_in: dubbed.length ? dubbed : null, ...(degraded.length && { degraded }) }
}

// A title they named that the store doesn't have yet: the app offers to make its card (api/card.js, Launch L4).
// Any script, as in api/search.js: Latin-only made every Hindi-script name "", which counted as "we have it".
const norm = (t = '') => t.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
function missingTitle(named = [], cards, aliases = []) {
  const have = new Set([...cards.flatMap((c) => [norm(c.title), norm(c.original_title || '')]), ...aliases.map((a) => norm(a.name))])
  return named.map((t) => t.trim()).find((t) => t.length > 1 && !have.has(norm(t))) || null
}

// A small per-visitor limit so one tab can't burn the free model quota: 12 requests a minute (RATE_LIMIT_PER_MIN).
const hits = new Map()
function limited(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'local'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > Number(process.env.RATE_LIMIT_PER_MIN || 12)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })
  if (limited(req)) return res.status(429).json({ error: 'busy' })
  try {
    const body = req.body || {}
    if (typeof body.text === 'string' && body.text.length > 2000) return res.status(400).json({ error: 'That mood is a bit long. Try a line or two.' })
    return res.status(200).json(await recommend(body))
  } catch (e) {
    const busy = e.status === 429 || e.status === 503
    return res.status(busy ? 503 : 500).json({ error: busy ? 'busy' : 'failed' })
  }
}
