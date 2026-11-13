// GET /api/search?q=queen — find a title in the store by name, for the header search (V2). No model call: names are
// matched in memory against the title, the original title (so "लापता लेडीज़" works) and the names on-demand cards
// were asked for (so "Laapataa Ladies" finds TMDB's "Lost Ladies"). Best matches first, most-voted breaking ties.
import { loadStore } from './_lib/store.js'

const LIMIT = 8
// Letters and digits in any script; accents dropped so "Bāhubali" matches "bahubali".
const norm = (t = '') => t.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

// How people actually type names: no punctuation or spaces ("kgf", "spiderman"), doubled letters ("baahubali"),
// initials ("ddlj"), one slip of the finger ("dangl"). `loose` squashes spaces and repeated letters.
const loose = (n) => n.replace(/ /g, '').replace(/(.)\1+/gu, '$1')

function edits(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = row
  }
  return prev[b.length]
}

// A typo: the query is within 1 edit (2 from 7 letters) of the start of the name or of one of its words.
function typo(n, lq) {
  if (lq.length < 4) return false
  const allowed = lq.length >= 7 ? 2 : 1
  const words = n.split(' ')
  return words.some((_, i) => {
    const from = loose(words.slice(i).join(' '))
    return [-1, 0, 1].some((d) => edits(from.slice(0, lq.length + d), lq) <= allowed)
  })
}

// 0 exact, 1 starts with, 2 a word starts with or initials, 3 contains anywhere, 4 loose spelling, 5 a typo;
// null when it doesn't match.
function rank(name, q) {
  const n = norm(name)
  if (!n) return null
  if (n === q) return 0
  if (n.startsWith(q)) return 1
  if (n.includes(` ${q}`)) return 2
  if (!q.includes(' ') && q.length >= 3 && n.split(' ').map((w) => w[0]).join('').startsWith(q)) return 2
  if (n.includes(q)) return 3
  const ln = loose(n)
  const lq = loose(q)
  if (lq.length >= 3 && ln.includes(lq)) return 4
  // Every word they typed is in there ("kgf 2"); a lone letter or digit has to be a whole word, or "stree 2" finds Street.
  const words = n.split(' ')
  if (q.includes(' ') && q.split(' ').every((w) => (w.length < 2 ? words.includes(w) : ln.includes(loose(w))))) return 4
  if (typo(n, lq)) return 5
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
  // Typo matches only when nothing closer turned up, so "dangal" doesn't also bring Bangalore Days.
  const shown = found[0]?.r < 5 ? found.filter((f) => f.r < 5) : found
  const items = shown.slice(0, LIMIT).map(({ c }) => ({ id: c.id, title: c.title, original_title: c.original_title, year: c.year, type: c.type, poster_path: c.poster_path }))
  res.setHeader('Cache-Control', 'public, max-age=300')
  // exact: one of them is the very name they typed. If not, the panel still offers to make a card for it.
  return res.status(200).json({ items, exact: found.some((f) => f.r === 0) })
}
