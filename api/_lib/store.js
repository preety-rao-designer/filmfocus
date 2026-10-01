// The card store. Phase 3: data/cards.json and data/embeddings.json, read once per server process.
// (Launch moves this to Supabase; the functions that call it don't change.)
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let cache = null
export function store() {
  if (!cache) {
    const cards = JSON.parse(readFileSync(resolve('data/cards.json'), 'utf8'))
    const { vectors } = JSON.parse(readFileSync(resolve('data/embeddings.json'), 'utf8'))
    cache = { cards: cards.filter((c) => vectors[c.id]), vectors }
  }
  return cache
}

export const dot = (a, b) => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
