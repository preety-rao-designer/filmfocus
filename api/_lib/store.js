// The card store. Seed cards and their embeddings are bundled with the deploy (data/cards.json, data/embeddings.json)
// and searched in memory. Cards made on demand (api/card.js) live in Firestore `cards/{id}` as { card, vector } and
// are merged in: read once per server start and at most every few minutes after, so reads stay far under the free cap.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { db } from './firebase.js'

const REFRESH_MS = 5 * 60 * 1000
let seed = null
let extra = { cards: [], vectors: {}, aliases: [], at: 0 }
let merged = null

function seedStore() {
  if (!seed) {
    const cards = JSON.parse(readFileSync(resolve('data/cards.json'), 'utf8'))
    const { vectors } = JSON.parse(readFileSync(resolve('data/embeddings.json'), 'utf8'))
    seed = { cards: cards.filter((c) => vectors[c.id]), vectors }
  }
  return seed
}

function merge() {
  const s = seedStore()
  const ids = new Set(s.cards.map((c) => c.id))
  // aliases: the names people asked for on-demand cards by ("Laapataa Ladies" for TMDB's "Lost Ladies").
  merged = { cards: [...s.cards, ...extra.cards.filter((c) => !ids.has(c.id))], vectors: { ...s.vectors, ...extra.vectors }, aliases: extra.aliases }
  return merged
}

// Synchronous: whatever is loaded now (the seed, plus on-demand cards from the last refresh).
export function store() {
  return merged || merge()
}

// Pull on-demand cards from Firestore when stale. A Firestore problem never breaks search: the seed still works.
export async function loadStore() {
  const firestore = db()
  if (firestore && Date.now() - extra.at > REFRESH_MS) {
    try {
      const snap = await firestore.collection('cards').get()
      const cards = []
      const vectors = {}
      const aliases = []
      for (const doc of snap.docs) {
        const { card, vector, requested_as } = doc.data()
        if (card?.id && vector?.length) {
          cards.push(card)
          vectors[card.id] = vector
          if (requested_as) aliases.push({ name: requested_as, id: card.id })
        }
      }
      extra = { cards, vectors, aliases, at: Date.now() }
      merge()
    } catch {
      extra.at = Date.now() // don't retry on every request while Firestore is down
    }
  }
  return store()
}

// A card just made on this server joins the store at once, before the next refresh.
export function addCard(card, vector, alias) {
  extra = { cards: [...extra.cards.filter((c) => c.id !== card.id), card], vectors: { ...extra.vectors, [card.id]: vector }, aliases: alias ? [...extra.aliases, { name: alias, id: card.id }] : extra.aliases, at: extra.at }
  merge()
}

export const dot = (a, b) => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
