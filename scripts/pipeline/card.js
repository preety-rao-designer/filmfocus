// One title → one card in the exact docs/CARD_SCHEMA.md shape.
// Facts come straight from TMDB. Gemini writes only the judgement fields, constrained by a JSON schema to the fixed
// vocabularies. validate() then enforces every rule in CARD_SCHEMA.md and either repairs or rejects.
import { generateJSON, MODELS } from '../../api/_lib/gemini.js'
import { tmdbDetails, tmdbSeason, wikidata, wikipedia, reactions } from './sources.js'

export const TONES = ['warm', 'funny', 'romantic', 'hopeful', 'uplifting', 'nostalgic', 'whimsical', 'thrilling', 'tense', 'scary', 'dark', 'melancholy', 'heartbreaking', 'thought-provoking', 'chaotic']
export const ARCS = ['rise', 'fall', 'fall_rise', 'rise_fall', 'rise_fall_rise', 'fall_rise_fall']
export const ENDINGS = ['uplifting', 'bittersweet', 'devastating', 'open', 'cathartic', 'unsettling']
export const TRUTH = ['true_story', 'inspired_by', 'fiction']
export const FLAGS = ['violence', 'gore', 'sexual_content', 'strong_language', 'substance_use', 'self_harm_themes', 'disturbing_themes']
export const FAMILY = ['family_ok', 'teens_up', 'adults_only']

// ---------- facts (TMDB only) ----------

const ADS_OR_CHANNEL = /with ads|channel|amazon channel/i
const NAME = { 'Amazon Prime Video': 'Prime Video' }

export async function gather({ type, id }) {
  const d = await tmdbDetails(type, id)
  const wd = await wikidata(type, id).catch(() => null)
  const title = d.title || d.name
  const year = Number((d.release_date || d.first_air_date || '').slice(0, 4)) || null
  const wp = await wikipedia(wd?.article, title).catch(() => ({ found: false }))
  const rx = await reactions(type, id, title, year).catch(() => [])
  let episodeMin = null
  if (type === 'tv') {
    const runs = d.episode_run_time?.length ? d.episode_run_time : []
    if (runs.length) episodeMin = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length)
    else {
      const firstSeason = d.seasons?.find((s) => s.season_number === 1)
      if (firstSeason) {
        const s1 = await tmdbSeason(id, 1).catch(() => null)
        const r = (s1?.episodes || []).map((e) => e.runtime).filter(Boolean)
        if (r.length) episodeMin = Math.round(r.reduce((a, b) => a + b, 0) / r.length)
      }
    }
  }
  return { type, id, d, wd, wp, rx, title, year, episodeMin }
}

function certification(src) {
  const { d, type } = src
  if (type === 'movie') {
    const r = d.release_dates?.results || []
    const pick = (cc) => r.find((x) => x.iso_3166_1 === cc)?.release_dates.find((x) => x.certification)?.certification
    return pick('IN') ? `India ${pick('IN')}` : pick('US') ? `US ${pick('US')}` : null
  }
  const r = d.content_ratings?.results || []
  const pick = (cc) => r.find((x) => x.iso_3166_1 === cc)?.rating
  return pick('IN') ? `India ${pick('IN')}` : pick('US') ? `US ${pick('US')}` : null
}

export function facts(src) {
  const { d, type, title, year, episodeMin } = src
  const watch = [...new Set((d['watch/providers']?.results?.IN?.flatrate || []).map((p) => p.provider_name).filter((n) => !ADS_OR_CHANNEL.test(n)).map((n) => NAME[n] || n))]
  return {
    id: `tmdb-${type === 'movie' ? 'movie' : 'tv'}-${d.id}`,
    tmdb_id: d.id,
    type: type === 'movie' ? 'movie' : 'series',
    title,
    original_title: d.original_title || d.original_name || title,
    year,
    runtime_min: type === 'movie' ? d.runtime || null : null,
    series:
      type === 'movie'
        ? null
        : {
            seasons: d.number_of_seasons || null,
            episode_min: episodeMin,
            status: ['Ended', 'Canceled'].includes(d.status) ? 'ended' : 'ongoing',
            style: null,
            gets_good_after: null,
            later_seasons_note: null,
          },
    languages: [d.original_language],
    poster_path: d.poster_path || null,
    rating: d.vote_count >= 10 ? { source: 'tmdb', value: Math.round(d.vote_average * 10) / 10, votes: d.vote_count } : null,
    watch_in: watch,
  }
}

// What Wikidata firmly says about truth status, if anything. Returns null when it has no decisive statement.
// "Literary work" (Q7725634) is not in the fiction list: Wikidata uses it for non-fiction books too.
const FICTIONAL_WORK = new Set(['Q8261', 'Q49084', 'Q11424', 'Q24856', 'Q1004', 'Q25379', 'Q21198342', 'Q7889', 'Q5398426', 'Q24862', 'Q747381', 'Q1667921', 'Q8274', 'Q14406742'])
// Only verified classes: Q645928 biographical film, Q622370 docudrama. (Q17013749 sits on The Godfather and Titanic.)
const BIOGRAPHICAL_GENRE = new Set(['Q645928', 'Q622370'])
export function wikidataTruth(wd) {
  if (!wd?.item) return null
  // Adapted from fiction (a novel, a film, a play…) settles it: whatever else, it isn't a true story.
  const fictionalSource = wd.based_on.find((b) => FICTIONAL_WORK.has(b.cls))
  if (fictionalSource) return { real: false, why: `based on: ${fictionalSource.label}` }
  const person = wd.main_subject.find((s) => s.cls === 'Q5')
  if (person) return { real: true, why: `main subject: ${person.label}` }
  if (wd.genres.some((g) => BIOGRAPHICAL_GENRE.has(g))) return { real: true, why: 'genre: biographical or docudrama' }
  // A dated event as main subject (a war, a disaster) doesn't settle it: Forrest Gump and Chernobyl both have one.
  // Left to the model, which reads the Wikipedia background.
  return null
}

// ---------- writing (Gemini) ----------

const str = (description) => ({ type: 'STRING', description })
const nstr = (description) => ({ type: 'STRING', nullable: true, description })

function schemaFor(isSeries) {
  const props = {
    looks_like: str('What it looks like from its title, poster, trailer and genre tags: the impression a stranger would get. One sentence, at most 15 words. Be specific to this title; avoid stock openers like "A lighthearted…".'),
    actually_is: str('What it actually is to watch: tone, feel, weight. One sentence, at most 32 words. No plot events, twists, deaths or how it ends.'),
    expectation_traps: { type: 'ARRAY', items: str('A specific way people misjudge it before watching.'), minItems: 1, maxItems: 3 },
    tone_mix: {
      type: 'ARRAY',
      minItems: 3,
      maxItems: 5,
      items: { type: 'OBJECT', properties: { tone: { type: 'STRING', enum: TONES }, pct: { type: 'INTEGER' } }, required: ['tone', 'pct'] },
    },
    arc_shape: { type: 'STRING', enum: ARCS, description: 'How it feels for the viewer from start to end, not the plot.' },
    arc_start: str('One lowercase feeling word for the start.'),
    arc_middle: str('One lowercase feeling word for the middle.'),
    arc_end: str('One lowercase feeling word for the end.'),
    ending: { type: 'STRING', enum: ENDINGS },
    spoiler_ending: str('Plain account of what happens at the end, 2–4 sentences. The only place spoilers are allowed.'),
    pace: { type: 'STRING', enum: ['slow', 'steady', 'fast'] },
    attention: { type: 'STRING', enum: ['background_ok', 'some_focus', 'full_focus'] },
    emotional_weight: { type: 'INTEGER', description: '1 (feather-light) to 5 (crushing).' },
    content_flags: { type: 'ARRAY', items: { type: 'STRING', enum: FLAGS } },
    family: { type: 'STRING', enum: FAMILY },
    good_for: { type: 'ARRAY', items: str('A situation or mood it suits, lowercase, e.g. "watching with parents".'), minItems: 2, maxItems: 3 },
    skip_if: { type: 'ARRAY', items: str('When to avoid it, lowercase, e.g. "you\'re already low tonight".'), minItems: 1, maxItems: 3 },
    vibe: str('2–3 sentences capturing premise and feel for mood search. No spoilers.'),
    truth_status: { type: 'STRING', enum: TRUTH },
    truth_note: nstr('Only when useful, e.g. what it is based on, or a note when it looks true but is not. Null otherwise.'),
    sources_agree: { type: 'STRING', enum: ['strong', 'mixed', 'thin'], description: 'How well the sources agree on what it is like. thin = few or no audience reactions.' },
  }
  if (isSeries) {
    props.style = { type: 'STRING', enum: ['binge', 'episodic'] }
    props.gets_good_after = nstr('Like "episode 3" only if reactions say so. Null otherwise.')
    props.later_seasons_note = nstr('At most 12 words, only if later seasons feel clearly different. Null otherwise or if one season.')
  }
  return { type: 'OBJECT', properties: props, required: Object.keys(props).filter((k) => !['truth_note', 'gets_good_after', 'later_seasons_note'].includes(k)) }
}

const SYSTEM = `You write honest film and series cards for FilmFocus, a mood-to-movie app for India.
Voice: plain, warm, a little dry, like a friend at the ticket counter who has seen everything. Normal capitalisation: names and titles keep their capitals.
The card's job is to stop people starting a "light comedy" that turns out to be a slow tragedy. Be specific and honest, even when the title is acclaimed.
Rules:
- Use only the sources given. If they don't support something, say less (or null where allowed); never guess facts.
- Write everything in your own words. Never copy or closely paraphrase a sentence from the sources or reviews; no quotes.
- Spoilers only in spoiler_ending. Every other field must be safe to read before watching: no twists, deaths, reveals, or who ends up with whom.
- tone_mix: 3 to 5 tones from the list, percentages are whole numbers that add up to 100, biggest first. Horror and ghost stories made to frighten always include "scary" (with a real share); "tense" alone undersells them.
- emotional_weight is 1 to 5. family: family_ok = fine with parents and kids; teens_up; adults_only.
- content_flags: include every one that genuinely applies, none that don't.
- truth_status: true_story = it tells what really happened to real people; inspired_by = its central characters or central events are real but it takes big liberties; fiction = invented, including adaptations of novels, plays, comics or other films (say what it's adapted from in truth_note), and invented stories set against real history (a war, an era, a real backdrop), crime sagas, and alternate history.
- arc_shape is how the viewer feels across the story, and it must agree with the ending: an uplifting or cathartic ending can't sit on a shape that ends going down (fall, rise_fall, fall_rise_fall); a devastating ending can't sit on one that ends going up.`

// `trim` drops source text when Gemini blocks the prompt: 1 = no audience reactions, 2 = no plot either.
function sourceText(src, trim = 0) {
  const { d, wd, wp } = src
  const rx = trim >= 1 ? [] : src.rx
  const wt = wikidataTruth(wd)
  const parts = [
    `TITLE: ${src.title} (${src.year}), ${src.type === 'movie' ? 'movie' : 'series'}, original language ${d.original_language}`,
    `TMDB genres: ${(d.genres || []).map((g) => g.name).join(', ')}`,
    `TMDB keywords: ${((d.keywords?.keywords || d.keywords?.results) || []).map((k) => k.name).slice(0, 25).join(', ')}`,
    `TMDB tagline: ${d.tagline || '-'}`,
    `TMDB overview: ${d.overview || '-'}`,
    `Certification: ${certification(src) || 'unknown'}`,
    src.type === 'movie' ? `Runtime: ${d.runtime} min` : `Seasons: ${d.number_of_seasons}, episodes: ${d.number_of_episodes}, status: ${d.status}`,
    `Wikidata: based on ${wd?.based_on?.map((b) => b.label).join('; ') || 'none'}; main subject ${wd?.main_subject?.map((s) => s.label).join('; ') || 'none'}${wt ? `; reading: ${wt.real ? 'about real people or events' : 'adapted from fiction'} (${wt.why})` : ''}`,
  ]
  if (wp?.found) {
    parts.push(`WIKIPEDIA LEAD:\n${wp.lead}`)
    if (wp.plot && trim < 2) parts.push(`WIKIPEDIA PLOT (contains spoilers; use for spoiler_ending and to understand the arc):\n${wp.plot}`)
    if (wp.basis) parts.push(`WIKIPEDIA BACKGROUND:\n${wp.basis}`)
    if (wp.reception) parts.push(`WIKIPEDIA RECEPTION:\n${wp.reception}`)
  }
  rx.forEach((r, i) => parts.push(`AUDIENCE REACTION ${i + 1} (${new URL(r.url).hostname}):\n${r.content}`))
  return parts.join('\n\n')
}

export async function write(src, feedback = null) {
  const isSeries = src.type !== 'movie'
  for (let trim = src.trim || 0; ; trim++) {
    const prompt = `${sourceText(src, trim)}\n\nWrite the card for ${src.title}.${feedback ? `\n\nYour previous attempt had problems. Fix them:\n${feedback}` : ''}`
    try {
      const { data, model } = await generateJSON({ chain: MODELS.write, system: SYSTEM, prompt, schema: schemaFor(isSeries), temperature: 0.5, thinking: 'medium', timeoutMs: 120000, attempts: 5 })
      src.trim = trim
      return { out: data, model }
    } catch (e) {
      if (!e.finish || trim >= 2) throw e
    }
  }
}

// ---------- checks ----------

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9ऀ-෿ ]+/g, ' ').replace(/\s+/g, ' ').trim()

// Any run of 10+ words shared with a source counts as copied.
function copiedRun(text, sourceSet, n = 10) {
  const w = norm(text).split(' ')
  for (let i = 0; i + n <= w.length; i++) {
    const gram = w.slice(i, i + n).join(' ')
    if (sourceSet.has(gram)) return gram
  }
  return null
}
function sourceGrams(src, n = 10) {
  const all = [src.d.overview, src.d.tagline, src.wp?.lead, src.wp?.plot, src.wp?.reception, src.wp?.basis, ...src.rx.map((r) => r.content)].filter(Boolean).join(' ')
  const w = norm(all).split(' ')
  const set = new Set()
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(' '))
  return set
}

const SPOILER_CHECK = {
  type: 'OBJECT',
  properties: { spoils: { type: 'BOOLEAN' }, field: { type: 'STRING', nullable: true }, what: { type: 'STRING', nullable: true } },
  required: ['spoils'],
}
async function spoilerCheck(src, out) {
  const text = { actually_is: out.actually_is, vibe: out.vibe, expectation_traps: out.expectation_traps, good_for: out.good_for, skip_if: out.skip_if, truth_note: out.truth_note, later_seasons_note: out.later_seasons_note }
  const { data } = await generateJSON({
    chain: MODELS.parse,
    system: 'You check film cards for spoilers. A spoiler is a specific plot event a first-time viewer would not know from the trailer: a twist, a death, a reveal, who ends up with whom, how it ends. Describing tone, premise or the general feel of an ending ("ends on a warm note") is not a spoiler.',
    prompt: `Film: ${src.title} (${src.year}).\nPlot for reference:\n${(src.wp?.plot || src.d.overview || '').slice(0, 3000)}\n\nCard text that must be spoiler-free:\n${JSON.stringify(text, null, 1)}\n\nDoes any of it spoil the film?`,
    schema: SPOILER_CHECK,
    temperature: 0,
    thinking: 'low',
  })
  return data
}

const LEVELS = ['limited', 'medium', 'high']

// Repairs what can be repaired; returns { card, problems } where problems need a rewrite.
export async function assemble(src, out) {
  const f = facts(src)
  const problems = []

  // tone_mix: vocabulary only, no repeats, 3–5 entries, whole numbers adding to 100.
  let tones = []
  for (const t of out.tone_mix || []) if (TONES.includes(t.tone) && !tones.some((x) => x.tone === t.tone) && t.pct > 0) tones.push({ tone: t.tone, pct: t.pct })
  tones = tones.sort((a, b) => b.pct - a.pct).slice(0, 5)
  if (tones.length < 3) problems.push('tone_mix needs 3 to 5 different tones from the list.')
  else {
    const sum = tones.reduce((a, t) => a + t.pct, 0)
    tones = tones.map((t) => ({ tone: t.tone, pct: Math.max(1, Math.round((t.pct * 100) / sum)) }))
    tones[0].pct += 100 - tones.reduce((a, t) => a + t.pct, 0)
  }

  const word = (w) => (w || '').toLowerCase().trim().split(/\s+/).slice(0, 2).join(' ')
  const weight = Math.min(5, Math.max(1, Math.round(out.emotional_weight || 3)))

  // Truth: Wikidata wins; disagreement drops confidence a level.
  let truthStatus = out.truth_status
  let truthNote = out.truth_note ? out.truth_note.trim().replace(/^./, (ch) => ch.toUpperCase()) : null
  let wikidataOverrode = false
  const wt = wikidataTruth(src.wd)
  if (wt?.real && truthStatus === 'fiction') {
    truthStatus = 'inspired_by'
    truthNote = null
    wikidataOverrode = true
  } else if (wt && !wt.real && truthStatus === 'true_story') {
    truthStatus = 'fiction'
    truthNote = null
    wikidataOverrode = true
  }

  const card = {
    ...f,
    series: f.series && {
      ...f.series,
      style: out.style || 'binge',
      gets_good_after: /^episode \d+$/i.test(out.gets_good_after || '') ? out.gets_good_after.toLowerCase() : null,
      later_seasons_note: f.series.seasons > 1 ? out.later_seasons_note || null : null,
    },
    truth: { status: truthStatus, note: truthNote },
    honest_read: { looks_like: out.looks_like?.trim(), actually_is: out.actually_is?.trim() },
    expectation_traps: (out.expectation_traps || []).map((s) => s.trim()).filter(Boolean),
    tone_mix: tones,
    arc: { shape: out.arc_shape, start: word(out.arc_start), middle: word(out.arc_middle), end: word(out.arc_end) },
    ending: out.ending,
    spoiler_ending: out.spoiler_ending?.trim(),
    bandwidth: { pace: out.pace, attention: out.attention, emotional_weight: weight },
    content_flags: [...new Set((out.content_flags || []).filter((x) => FLAGS.includes(x)))],
    family: out.family,
    good_for: (out.good_for || []).map((s) => s.trim()).filter(Boolean),
    skip_if: (out.skip_if || []).map((s) => s.trim()).filter(Boolean),
    vibe: out.vibe?.trim(),
    confidence: null,
  }

  // Enum and presence checks (the response schema should already guarantee these).
  if (!ARCS.includes(card.arc.shape)) problems.push('arc_shape must be one of the six shapes.')
  if (!ENDINGS.includes(card.ending)) problems.push('ending must be from the list.')
  if (!FAMILY.includes(card.family)) problems.push('family must be from the list.')
  if (!TRUTH.includes(card.truth.status)) problems.push('truth_status must be from the list.')
  for (const k of ['looks_like', 'actually_is']) if (!card.honest_read[k]) problems.push(`${k} is empty.`)
  if (!card.vibe || !card.spoiler_ending) problems.push('vibe and spoiler_ending must not be empty.')
  const endsDown = ['fall', 'rise_fall', 'fall_rise_fall'].includes(card.arc.shape)
  if ((endsDown && ['uplifting', 'cathartic'].includes(card.ending)) || (!endsDown && card.ending === 'devastating'))
    problems.push(`arc_shape ${card.arc.shape} contradicts a ${card.ending} ending; pick the shape that matches how it feels at the end.`)
  if (card.honest_read.actually_is && card.honest_read.actually_is.split(/\s+/).length > 40) problems.push('actually_is is too long; keep it to one sentence of about 30 words.')

  // Own words: no 10-word run shared with any source.
  const grams = sourceGrams(src)
  const written = { looks_like: card.honest_read.looks_like, actually_is: card.honest_read.actually_is, vibe: card.vibe, spoiler_ending: card.spoiler_ending, truth_note: card.truth.note, traps: card.expectation_traps.join(' | ') }
  for (const [k, v] of Object.entries(written)) {
    const hit = v && copiedRun(v, grams)
    if (hit) problems.push(`${k} copies source wording ("${hit}"). Rewrite it in your own words.`)
  }

  // Spoilers outside spoiler_ending.
  if (!problems.length) {
    const sp = await spoilerCheck(src, out).catch(() => null)
    if (sp?.spoils) problems.push(`${sp.field || 'a spoiler-free field'} gives away: ${sp.what || 'a plot event'}. Keep that only in spoiler_ending.`)
  }

  // Confidence: how much we read and whether it agreed.
  const reactionsRead = (src.trim || 0) >= 1 ? 0 : src.rx.length
  const sourcesRead = 1 + (src.wd?.item ? 1 : 0) + (src.wp?.plot && (src.trim || 0) < 2 ? 1 : 0) + (src.wp?.reception ? 1 : 0) + reactionsRead
  let level = out.sources_agree === 'thin' || (reactionsRead < 2 && !src.wp?.reception) ? 0 : out.sources_agree === 'strong' && reactionsRead >= 3 && src.wp?.found ? 2 : 1
  if (wikidataOverrode) level = Math.max(0, level - 1)
  card.confidence = {
    level: LEVELS[level],
    sources_read: sourcesRead,
    agreement: out.sources_agree,
    generated_at: new Date().toISOString().slice(0, 10),
    refresh_after: f.year >= new Date().getFullYear() ? new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10) : null,
  }
  return { card, problems, wikidataOverrode }
}

// Full card for one seed entry: write, check, one rewrite with feedback if needed, else reject.
export async function makeCard(seed) {
  const src = await gather(seed)
  let { out, model } = await write(src)
  let res = await assemble(src, out)
  if (res.problems.length) {
    ;({ out, model } = await write(src, res.problems.join('\n')))
    res = await assemble(src, out)
  }
  return { ...res, model, src }
}
