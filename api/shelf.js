// GET /api/shelf — the posters drifting on the home screen (V2). A day's mix from the store: well-known titles with a
// poster, two Indian-language titles for every one from elsewhere, shuffled by date so the shelf changes daily but stays
// the same within a day. Light items only; the details page fetches the full card (api/title.js).
import { loadStore } from './_lib/store.js'

const INDIAN = new Set(['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa'])
const SIZE = 24

// A small seeded shuffle, so every visitor sees the same shelf on the same day.
function shuffled(list, seed) {
  const out = [...list]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' })
  const { cards } = await loadStore()
  const known = cards.filter((c) => c.poster_path).sort((a, b) => (b.rating?.votes || 0) - (a.rating?.votes || 0))
  const day = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''))
  const indian = shuffled(known.filter((c) => INDIAN.has(c.languages[0])).slice(0, 120), day)
  const rest = shuffled(known.filter((c) => !INDIAN.has(c.languages[0])).slice(0, 60), day + 1)
  const picked = []
  for (let i = 0; picked.length < SIZE && (indian.length || rest.length); i++) {
    const from = i % 3 === 2 ? rest : indian
    picked.push((from.length ? from : from === rest ? indian : rest).shift())
  }
  const items = picked.map((c) => ({ id: c.id, title: c.title, year: c.year, poster_path: c.poster_path }))
  res.setHeader('Cache-Control', 'public, max-age=600')
  return res.status(200).json({ items })
}
