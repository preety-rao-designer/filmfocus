// node scripts/pipeline/run.js [--only tmdb-movie-123,...] [--redo] — builds data/cards.json from data/seed.json.
// Resumable: titles already in cards.json are skipped (unless --redo or named in --only), and every source call is
// cached, so a re-run after a crash or a quota stop just carries on. Failures go to data/failures.json.
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { makeCard } from './card.js'

process.loadEnvFile('.env')

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null
const redo = args.includes('--redo')
const CONCURRENCY = Number(process.env.PIPELINE_CONCURRENCY || 3)

const load = (f, d) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d)
const save = (f, data) => {
  writeFileSync(`${f}.tmp`, JSON.stringify(data, null, 1))
  renameSync(`${f}.tmp`, f)
}
const idOf = (s) => `tmdb-${s.type === 'movie' ? 'movie' : 'tv'}-${s.id}`

const seed = load('data/seed.json', [])
const cards = load('data/cards.json', [])
const failures = load('data/failures.json', {})
const have = new Set(cards.map((c) => c.id))
const todo = seed.filter((s) => (only ? only.includes(idOf(s)) : redo || !have.has(idOf(s))))
console.log(`${todo.length} to make (${cards.length} already in the store), concurrency ${CONCURRENCY}`)

const stats = { made: 0, failed: 0, wikidata: 0, models: {} }
let next = 0
async function worker() {
  while (next < todo.length) {
    const s = todo[next++]
    const id = idOf(s)
    const t = Date.now()
    try {
      const { card, problems, model, wikidataOverrode } = await makeCard(s)
      if (problems.length) throw new Error(`rejected after rewrite: ${problems.join(' / ')}`)
      const i = cards.findIndex((c) => c.id === id)
      if (i >= 0) cards[i] = card
      else cards.push(card)
      delete failures[id]
      save('data/cards.json', cards)
      stats.made++
      stats.models[model] = (stats.models[model] || 0) + 1
      if (wikidataOverrode) stats.wikidata++
      console.log(`✓ ${card.title} (${card.year}) ${card.confidence.level} · ${model} · ${Math.round((Date.now() - t) / 1000)}s`)
    } catch (e) {
      failures[id] = { title: s.title, error: String(e.message).slice(0, 400), at: new Date().toISOString() }
      stats.failed++
      console.log(`✗ ${s.title}: ${String(e.message).slice(0, 160)}`)
    }
    save('data/failures.json', failures)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

const levels = cards.reduce((a, c) => ({ ...a, [c.confidence.level]: (a[c.confidence.level] || 0) + 1 }), {})
console.log(JSON.stringify({ ...stats, store: cards.length, confidence: levels, failures: Object.keys(failures).length }))
