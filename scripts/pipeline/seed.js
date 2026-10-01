// node scripts/pipeline/seed.js — picks the seed catalogue from TMDB discover and writes data/seed.json.
// Mix (runbook 3.4): ~40% Hindi, ~30% regional, ~30% English and international; ~a quarter series.
// Only titles streaming on a flat-rate service in India, most-voted first, so the store is full of things people can watch.
import { writeFileSync, mkdirSync } from 'node:fs'
import { tmdb } from './sources.js'

process.loadEnvFile('.env')

// [type, original language, how many]
// TMDB has almost no Malayalam, Kannada or Marathi series with India streaming data, so those slots go to Hindi
// series and Tamil, Telugu and Malayalam films (regional stays ~28%, series ~23%).
const PLAN = [
  ['movie', 'hi', 90], ['tv', 'hi', 35],
  ['movie', 'ta', 21], ['movie', 'te', 18], ['movie', 'ml', 19], ['movie', 'kn', 8], ['movie', 'bn', 6], ['movie', 'mr', 4],
  ['tv', 'ta', 5], ['tv', 'te', 1], ['tv', 'bn', 3],
  ['movie', 'en', 52], ['movie', 'ko', 6], ['movie', 'ja', 4], ['movie', 'es', 3],
  ['tv', 'en', 20], ['tv', 'ko', 5],
]
// No news, reality, talk or soap for series; they aren't what people mean by "a show to watch".
const TV_EXCLUDE = '10763,10764,10767,10766'

const seed = []
for (const [type, lang, want] of PLAN) {
  const got = []
  for (let page = 1; got.length < want && page <= 10; page++) {
    const res = await tmdb(`/discover/${type}`, {
      watch_region: 'IN',
      with_watch_monetization_types: 'flatrate',
      with_original_language: lang,
      sort_by: 'vote_count.desc',
      'vote_count.gte': lang === 'en' ? '500' : '15',
      ...(type === 'tv' ? { without_genres: TV_EXCLUDE } : {}),
      page: String(page),
    })
    for (const r of res.results) {
      if (got.length >= want) break
      if (seed.some((s) => s.type === type && s.id === r.id)) continue
      got.push({ type, id: r.id, title: r.title || r.name, lang, votes: r.vote_count })
    }
    if (page >= res.total_pages) break
  }
  console.log(`${type} ${lang}: ${got.length}/${want}`)
  seed.push(...got)
}
mkdirSync('data', { recursive: true })
writeFileSync('data/seed.json', JSON.stringify(seed, null, 1))
console.log(`${seed.length} titles → data/seed.json (${seed.filter((s) => s.type === 'tv').length} series)`)
