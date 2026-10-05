// GET /api/title?id=tmdb-movie-123 — one card from the store, for the details page (V2) when it's opened from the
// shelf or a reloaded /title/… link. Cards already on screen (results, watchlist) are passed along without this.
import { loadStore } from './_lib/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' })
  const id = new URL(req.url, 'http://x').searchParams.get('id') || ''
  if (!/^tmdb-(movie|tv)-\d+$/.test(id)) return res.status(400).json({ error: 'bad id' })
  const { cards } = await loadStore()
  const card = cards.find((c) => c.id === id)
  if (!card) return res.status(404).json({ error: 'not_found' })
  res.setHeader('Cache-Control', 'public, max-age=600')
  return res.status(200).json({ card })
}
