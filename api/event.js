// POST /api/event — Launch L6: anonymous product events for the PRD's success metrics (scripts/metrics.js reads them).
// Body: { name, visitor, search, props }. `visitor` is a random id the browser made (no account, no IP stored),
// `search` ties opens and saves to the search they came from. Mood text is never sent, only its length.
import { db, ipOf } from './_lib/firebase.js'

const NAMES = new Set(['visit', 'search', 'others', 'loosen', 'answer', 'open', 'save', 'compare', 'make_card', 'vote', 'open_title', 'find_title'])
const ID = /^[a-z0-9-]{8,40}$/i
const recent = new Map()

// Each prop is a short string, number or boolean; anything else is dropped.
function clean(props = {}) {
  const out = {}
  for (const [k, v] of Object.entries(props).slice(0, 12)) {
    if (!/^[a-z_]{1,24}$/.test(k)) continue
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    else if (typeof v === 'boolean') out[k] = v
    else if (typeof v === 'string') out[k] = v.slice(0, 80)
  }
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })
  // sendBeacon posts text/plain, so the body may arrive as a string.
  let body = req.body || {}
  if (typeof body === 'string') try { body = JSON.parse(body) } catch { body = {} }
  const { name, visitor, search, props } = body
  if (!NAMES.has(name) || !ID.test(visitor || '')) return res.status(400).json({ error: 'bad event' })

  // 120 events a minute per visitor connection is far beyond real use; past it, drop quietly.
  const ip = ipOf(req)
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter((t) => now - t < 60000)
  if (hits.length >= 120) return res.status(204).end()
  recent.set(ip, [...hits, now])

  const firestore = db()
  if (!firestore) return res.status(204).end()
  try {
    await firestore.collection('events').add({
      name,
      visitor,
      search: ID.test(search || '') ? search : null,
      props: clean(props),
      at: new Date().toISOString(),
      ...(process.env.FILMFOCUS_TEST && { test: true }),
    })
  } catch {
    // Analytics never breaks the app.
  }
  return res.status(204).end()
}
