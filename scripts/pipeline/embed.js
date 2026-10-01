// node scripts/pipeline/embed.js — embeds every card in data/cards.json into data/embeddings.json.
// The text is what a mood is matched against: the vibe, the honest read, tone and arc words, and what it's good for.
import { readFileSync, writeFileSync } from 'node:fs'
import { embed, MODELS, EMBED_DIMS } from '../../api/_lib/gemini.js'

process.loadEnvFile('.env')

export const embedText = (c) =>
  [
    c.vibe,
    c.honest_read.actually_is,
    `Tone: ${c.tone_mix.map((t) => t.tone).join(', ')}.`,
    `Feels ${c.arc.start}, then ${c.arc.middle}, then ${c.arc.end}; ending ${c.ending}.`,
    `Good for ${c.good_for.join('; ')}.`,
  ].join(' ')

const cards = JSON.parse(readFileSync('data/cards.json', 'utf8'))
const vectors = await embed(cards.map(embedText))
const out = { model: MODELS.embed, dims: EMBED_DIMS, vectors: Object.fromEntries(cards.map((c, i) => [c.id, vectors[i].map((x) => Math.round(x * 1e5) / 1e5)])) }
writeFileSync('data/embeddings.json', JSON.stringify(out))
console.log(`${cards.length} cards embedded → data/embeddings.json (${EMBED_DIMS} dims, ${MODELS.embed})`)
