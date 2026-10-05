// GET /api/search?q=queen — find a title in the store by name, for the header search (V2). No model call: names are
// matched in memory against the title, the original title (so "लापता लेडीज़" works) and the names on-demand cards
// were asked for (so "Laapataa Ladies" finds TMDB's "Lost Ladies"). Best matches first, most-voted breaking ties.
import { loadStore } from './_lib/store.js'

const LIMIT = 8
// Letters and digits in any script; accents dropped so "Bāhubali" matches "bahubali".
const norm = (t = '') => t.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

// 0 exact, 1 starts with, 2 a word starts with, 3 contains anywhere; null when it doesn't match.
function rank(name, q) {
  const n = norm(name)
  if (!n) return null
  if (n === q) return 0
  if (n.startsWith(q)) return 1
  if (n.includes(` ${q}`)) return 2
  if (n.includes(q)) return 3
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' })
  const q = norm(new URL(req.url, 'http://x').searchParams.get('q') || '').slice(0, 80)
  if (q.length < 2) return res.status(200).json({ items: [] })
  const { cards, aliases } = await loadStore()
  const asked = {}
  for (const a of aliases || []) (asked[a.id] ||= []).push(a.name)
  const found = []
  for (const c of cards) {
    const ranks = [c.title, c.original_title, ...(asked[c.id] || [])].map((n) => rank(n, q)).filter((r) => r !== null)
    if (ranks.length) found.push({ c, r: Math.min(...ranks) })
  }
  found.sort((a, b) => a.r - b.r || (b.c.rating?.votes || 0) - (a.c.rating?.votes || 0))
  const items = found.slice(0, LIMIT).map(({ c }) => ({ id: c.id, title: c.title, original_title: c.original_title, year: c.year, type: c.type, poster_path: c.poster_path }))
  res.setHeader('Cache-Control', 'public, max-age=300')
  return res.status(200).json({ items })
}
