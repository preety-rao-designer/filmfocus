// node scripts/pipeline/add-titles.js "Title|year|movie" ... — adds titles to data/seed.json by TMDB search, for
// filling catalogue gaps the eval finds. Then run the pipeline (only the new ones are made) and re-embed.
import { readFileSync, writeFileSync } from 'node:fs'
import { tmdb } from './sources.js'

process.loadEnvFile('.env')
const seed = JSON.parse(readFileSync('data/seed.json', 'utf8'))
for (const arg of process.argv.slice(2)) {
  const [title, year, kind = 'movie'] = arg.split('|')
  const type = kind === 'tv' ? 'tv' : 'movie'
  const res = await tmdb(`/search/${type}`, { query: title, ...(year ? { [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: year } : {}) })
  const r = res.results?.sort((a, b) => b.vote_count - a.vote_count)[0]
  if (!r) { console.log(`✗ not found: ${title}`); continue }
  if (seed.some((s) => s.type === type && s.id === r.id)) { console.log(`· already in seed: ${r.title || r.name}`); continue }
  seed.push({ type, id: r.id, title: r.title || r.name, lang: r.original_language, votes: r.vote_count, added_for: 'eval gap' })
  console.log(`+ ${r.title || r.name} (${(r.release_date || r.first_air_date || '').slice(0, 4)}, ${r.original_language}, ${r.vote_count} votes)`)
}
writeFileSync('data/seed.json', JSON.stringify(seed, null, 1))
