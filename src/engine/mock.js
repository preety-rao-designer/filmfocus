// The mock engine. Same call and the exact response shape as the real engine in docs/CARD_SCHEMA.md, so Phase 3
// swaps the insides (a fetch to /api/recommend) without touching the UI. Picks come only from the mock card store.
//
// recommend({ text, chips, exclude }) → { followup, picks: [{ card, why_this_fits }], understood }
// `exclude` is the ids already shown; once fewer than three unseen cards are left, the cycle starts again.

import { catalogue } from '../mocks/catalogue.js'

// Plain words → the tones they point at. Deliberately small; the real engine understands language properly.
const WORDS = {
  warm: ['warm', 'cosy', 'cozy', 'comfort', 'gentle', 'soft', 'sweet', 'kind', 'wholesome'],
  funny: ['funny', 'laugh', 'comedy', 'light', 'silly', 'fun'],
  romantic: ['romantic', 'romance', 'love', 'date', 'crush'],
  hopeful: ['hopeful', 'hope', 'better'],
  uplifting: ['uplifting', 'happy', 'cheer', 'lift', 'feel-good', 'feel good'],
  nostalgic: ['nostalgic', 'nostalgia', 'old', 'school', 'miss', 'missing'],
  whimsical: ['whimsical', 'cute', 'quirky', 'magical'],
  thrilling: ['thrilling', 'thriller', 'gripping', 'twist', 'edge', 'excit'],
  tense: ['tense', 'suspense', 'nervous', 'intense'],
  dark: ['dark', 'grim', 'bleak', 'heavy'],
  melancholy: ['sad', 'low', 'melancholy', 'blue', 'lonely'],
  heartbreaking: ['cry', 'tears', 'heartbreak', 'emotional', 'weep'],
  'thought-provoking': ['think', 'smart', 'clever', 'not dumb', 'thought', 'serious', 'deep', 'real'],
  chaotic: ['chaotic', 'chaos', 'wild', 'mad'],
}

// What each "stay or shift" answer wants from a title.
const SHIFT = {
  comfort: { tones: ['warm', 'hopeful', 'funny'], endings: ['uplifting', 'cathartic'], phrase: 'some comfort' },
  cheer: { tones: ['funny', 'uplifting', 'warm'], endings: ['uplifting'], phrase: 'cheering up' },
  feel: { tones: ['melancholy', 'heartbreaking', 'romantic'], endings: ['bittersweet', 'cathartic', 'devastating'], phrase: 'to feel it' },
  distract: { tones: ['thrilling', 'funny', 'chaotic'], endings: [], phrase: 'a distraction' },
  thrill: { tones: ['thrilling', 'tense'], endings: [], phrase: 'a thrill' },
}

const COMPANY_WORDS = { family: 'family', parents: 'family', kids: 'kids', children: 'kids', partner: 'partner', friends: 'friends', alone: 'alone' }

// A small stable hash so ties break differently for different moods, but the same mood always gives the same order.
function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function understand(text, chips) {
  const t = text.toLowerCase()
  const tones = Object.keys(WORDS).filter((tone) => WORDS[tone].some((w) => t.includes(w)))
  const company = chips.company || Object.entries(COMPANY_WORDS).find(([w]) => t.includes(w))?.[1] || null
  const time = chips.time === 'movie' ? 'movie' : chips.time ? 'series' : null
  return {
    tones,
    understood: {
      mood: text.trim() || null,
      stay_or_shift: chips.stay_or_shift || null,
      company,
      time,
      attention: null,
      languages: [],
      platforms: [],
      hard_nos: company === 'kids' || company === 'family' ? ['sexual_content'] : [],
    },
  }
}

function score(card, tones, u, seed) {
  let s = 0
  for (const { tone, pct } of card.tone_mix) {
    if (tones.includes(tone)) s += pct
    if (u.stay_or_shift && SHIFT[u.stay_or_shift].tones.includes(tone)) s += pct
  }
  if (u.stay_or_shift && SHIFT[u.stay_or_shift].endings.includes(card.ending)) s += 20
  if (u.time === 'movie' && card.type !== 'movie') s -= 60
  if (u.time === 'series' && card.type !== 'series') s -= 60
  if ((u.company === 'kids' && card.family !== 'family_ok') || (u.company === 'family' && card.family === 'adults_only')) s -= 80
  if (u.hard_nos.some((f) => card.content_flags.includes(f))) s -= 80
  return s + (hash(seed + card.id) % 1000) / 1000 // tie-break below one point
}

const ENDING_WORDS = {
  uplifting: 'leaves you lifted',
  bittersweet: 'ends bittersweet',
  devastating: 'ends hard',
  open: 'leaves things open',
  cathartic: 'lets it all out at the end',
  unsettling: 'leaves you uneasy',
}

// A plain "why this fits" line from the person's words and the card's own fields. The real engine writes this.
function whyThisFits(card, u, tones) {
  const [a, b] = card.tone_mix.map((t) => t.tone)
  const wanted = u.stay_or_shift ? SHIFT[u.stay_or_shift].phrase : tones.length ? `something ${tones.slice(0, 2).join(' and ')}` : null
  const lead = wanted ? `You wanted ${wanted}; ` : 'A surprise for you: '
  const who = u.company === 'family' || u.company === 'kids' ? (card.family === 'family_ok' ? ' Fine for the whole family.' : '') : ''
  const goodFor = card.good_for[0] ? ` Good for ${card.good_for[0]}.` : ''
  return `${lead}this one is mostly ${a} and ${b}, and it ${ENDING_WORDS[card.ending]}.${goodFor}${who}`
}

export async function recommend({ text = '', chips = {}, exclude = [] }) {
  const { tones, understood } = understand(text, chips)
  // Nothing asked for (Surprise me): a fresh order each time. Otherwise the same mood gives the same order.
  const asked = text.trim() || Object.values(chips).some(Boolean)
  const seed = asked ? `${text}|${chips.company}|${chips.time}|${chips.stay_or_shift}` : String(Math.random())
  let pool = catalogue.filter((c) => !exclude.includes(c.id))
  if (pool.length < 3) pool = catalogue // cycled through all twelve; start again
  const picks = pool
    .map((card) => ({ card, s: score(card, tones, understood, seed) }))
    .sort((x, y) => y.s - x.s)
    .slice(0, 3)
    .map(({ card }) => ({ card, why_this_fits: whyThisFits(card, understood, tones) }))
  return { followup: null, picks, understood }
}
