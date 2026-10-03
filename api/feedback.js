// POST /api/feedback — Launch L5: "Did this match?" on a title they chose earlier.
// Body: { card_id, vote: 'yes' | 'partly' | 'no', visitor }. Saves the vote in Firestore `votes` and keeps a running
// count per card in `cardStats/{id}`. Three or more "no" votes flag the card for regeneration (`flagged: true`).
import { FieldValue } from 'firebase-admin/firestore'
import { db, ipOf } from './_lib/firebase.js'

const VOTES = new Set(['yes', 'partly', 'no'])
const ID = /^[a-z0-9-]{8,40}$/i
const FLAG_AT = 3
const recent = new Map()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })
  const { card_id, vote, visitor } = req.body || {}
  if (!/^tmdb-(movie|tv)-\d+$/.test(card_id || '') || !VOTES.has(vote) || !ID.test(visitor || '')) return res.status(400).json({ error: 'bad vote' })

  // 20 votes an hour per connection: plenty for a person, too few to stuff a card's count.
  const ip = ipOf(req)
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter((t) => now - t < 3600000)
  if (hits.length >= 20) return res.status(429).json({ error: 'busy' })
  recent.set(ip, [...hits, now])

  const firestore = db()
  if (!firestore) return res.status(503).json({ error: 'busy' })
  try {
    // One vote per visitor per card: the doc id makes a second vote replace the first.
    const voteRef = firestore.collection('votes').doc(`${card_id}__${visitor}`)
    const statsRef = firestore.collection('cardStats').doc(card_id)
    await firestore.runTransaction(async (t) => {
      const before = (await t.get(voteRef)).data()?.vote
      const stats = (await t.get(statsRef)).data() || {}
      const counts = { yes: stats.yes || 0, partly: stats.partly || 0, no: stats.no || 0 }
      if (before) counts[before] = Math.max(0, counts[before] - 1)
      counts[vote] += 1
      t.set(voteRef, { card_id, vote, visitor, at: new Date().toISOString(), ...(process.env.FILMFOCUS_TEST && { test: true }) })
      t.set(statsRef, { ...counts, flagged: counts.no >= FLAG_AT, updated_at: FieldValue.serverTimestamp() }, { merge: true })
    })
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(500).json({ error: 'failed' })
  }
}
