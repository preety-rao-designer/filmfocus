// POST /api/card — Launch L4: a card on demand for a title the store doesn't have yet.
// Body: { title }. Finds the title on TMDB, and if it's already a card (seed or made earlier) returns that. Otherwise
// runs the same pipeline as the seed cards (sources → Gemini → validator → one rewrite), embeds it, saves it to
// Firestore `cards/{id}` for everyone, and returns it. A card that still fails validation is never saved.
// Response: { card } or { error: 'not_found' | 'busy' | 'limit' | 'failed' }.
import { tmdb } from '../scripts/pipeline/sources.js'
import { makeCard } from '../scripts/pipeline/card.js'
import { embed } from './_lib/gemini.js'
import { embedText } from './_lib/cardtext.js'
import { loadStore, addCard } from './_lib/store.js'
import { db, ipOf } from './_lib/firebase.js'

// Gemini's free quota is shared with search, so on-demand cards are capped per day (ONDEMAND_PER_DAY) and per
// visitor (3 every 10 minutes). Titles TMDB barely knows (under MIN_VOTES votes) have too little to write from.
const PER_DAY = Number(process.env.ONDEMAND_PER_DAY || 40)
const MIN_VOTES = 25
const recent = new Map()

function visitorLimited(req) {
  const ip = ipOf(req)
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter((t) => now - t < 10 * 60000)
  if (hits.length >= 3) return true
  recent.set(ip, [...hits, now])
  return false
}

// TMDB search is fuzzy ("Piku" also returns "Twin Peaks"), so only names that match count: an exact title (or
// original title) first, most-voted among those ("Queen" → the 2014 film people mean); else a title that contains
// what they typed. Anything else is "not found" rather than a card for the wrong film.
// Letters and digits in any script, as in api/search.js. Latin-only once turned "शोले" into "", which matched the
// first card with a Hindi-script original title (Sholay came back as Panchayat).
const norm = (t = '') => t.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
async function findOnTmdb(asked) {
  // "Queen 2014" or "Queen (2014)": search with the year, since short titles have hundreds of loose matches.
  const m = asked.match(/^(.*?)[\s(]+((?:19|20)\d{2})\)?$/)
  const title = m ? m[1].trim() : asked
  const year = m ? m[2] : null
  const [movies, shows] = await Promise.all([
    tmdb('/search/movie', { query: title, ...(year && { primary_release_year: year }) }),
    tmdb('/search/tv', { query: title, ...(year && { first_air_date_year: year }) }),
  ])
  const all = [
    ...(movies.results || []).map((r) => ({ type: 'movie', id: r.id, title: r.title, names: [r.title, r.original_title], votes: r.vote_count })),
    ...(shows.results || []).map((r) => ({ type: 'tv', id: r.id, title: r.name, names: [r.name, r.original_name], votes: r.vote_count })),
  ]
  const q = norm(title)
  const byVotes = (xs) => xs.sort((a, b) => b.votes - a.votes)[0] || null
  const exact = byVotes(all.filter((r) => r.names.some((n) => norm(n) === q)))
  if (exact) return exact
  const contains = byVotes(all.filter((r) => r.names.some((n) => norm(n).includes(q))))
  if (contains) return contains
  // Last resort: TMDB's own most relevant hit, if it shares a word with what they typed ("Laapataa Ladies" is
  // listed in English as "Lost Ladies"). Never the most-voted loose match: that's how "Piku" became "Twin Peaks".
  const words = new Set(q.split(' ').filter((w) => w.length > 2))
  const top = [all.find((r) => r.type === 'movie'), all.find((r) => r.type === 'tv')].filter(Boolean)
  return byVotes(top.filter((r) => r.names.some((n) => norm(n).split(' ').some((w) => words.has(w))))) || null
}

// Counts today's on-demand cards in Firestore; true if this one is allowed (and counts it).
async function takeDailySlot(firestore) {
  const ref = firestore.collection('limits').doc(`ondemand-${new Date().toISOString().slice(0, 10)}`)
  return firestore.runTransaction(async (t) => {
    const n = (await t.get(ref)).data()?.count || 0
    if (n >= PER_DAY) return false
    t.set(ref, { count: n + 1 }, { merge: true })
    return true
  })
}

export async function cardFor(title) {
  // Ours first: a title already in the store (or asked for by this name before) needs no search at all.
  const have = await loadStore()
  const q = norm(title)
  if (!q) return { status: 404, body: { error: 'not_found' } }
  const aliasId = have.aliases.find((a) => norm(a.name) === q)?.id
  const known = have.cards.find((c) => c.id === aliasId || norm(c.title) === q || norm(c.original_title) === q)
  if (known) return { status: 200, body: { card: known, made: false } }
  const hit = await findOnTmdb(title)
  if (!hit || hit.votes < MIN_VOTES) return { status: 404, body: { error: 'not_found' } }
  const id = `tmdb-${hit.type}-${hit.id}`

  const existing = have.cards.find((c) => c.id === id)
  if (existing) return { status: 200, body: { card: existing, made: false } }

  const firestore = db()
  if (!firestore) return { status: 503, body: { error: 'busy' } }
  if (!(await takeDailySlot(firestore))) return { status: 429, body: { error: 'limit' } }

  const { card, problems } = await makeCard({ type: hit.type, id: hit.id, title: hit.title })
  if (problems.length) return { status: 422, body: { error: 'failed' } }
  const [vector] = await embed([embedText(card)], 'RETRIEVAL_DOCUMENT', { patient: false })
  const rounded = vector.map((x) => Math.round(x * 1e5) / 1e5)
  await firestore.collection('cards').doc(id).set({ card, vector: rounded, requested_as: title.slice(0, 120), created_at: new Date().toISOString() })
  addCard(card, rounded, title)
  return { status: 200, body: { card, made: true } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  if (!title || title.length > 120) return res.status(400).json({ error: 'not_found' })
  if (visitorLimited(req)) return res.status(429).json({ error: 'busy' })
  try {
    const { status, body } = await cardFor(title)
    return res.status(status).json(body)
  } catch (e) {
    const busy = e.status === 429 || e.status === 503
    return res.status(busy ? 503 : 500).json({ error: busy ? 'busy' : 'failed' })
  }
}
