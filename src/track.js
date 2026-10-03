// Launch L6: anonymous product events (api/event.js). A random visitor id lives in this browser only; there are no
// accounts and no mood text is sent. Events go by sendBeacon so they never slow a tap or block leaving the page.
// L5: titles they chose (opened on a service or saved) are remembered here so S1 can ask "Did this match?" later.
const VISITOR = 'filmfocus.visitor.v1'
const LAST_VISIT = 'filmfocus.lastvisit.v1'
const CHOSEN = 'filmfocus.chosen.v1'

const get = (k) => {
  try {
    return window.localStorage.getItem(k)
  } catch {
    return null
  }
}
const set = (k, v) => {
  try {
    window.localStorage.setItem(k, v)
  } catch {
    // Not saved; fine.
  }
}
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)

let visitor = null
export function visitorId() {
  if (!visitor) {
    visitor = get(VISITOR) || newId()
    set(VISITOR, visitor)
  }
  return visitor
}

export const newSearchId = newId

export function track(name, props = {}, search = null) {
  const body = JSON.stringify({ name, visitor: visitorId(), search, props })
  try {
    if (navigator.sendBeacon?.(`/api/event`, body)) return
  } catch {
    // fall through to fetch
  }
  fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}

// One "visit" a day per browser: enough for 7-day returns without counting every reload.
export function trackVisit() {
  const today = new Date().toISOString().slice(0, 10)
  if (get(LAST_VISIT) === today) return
  set(LAST_VISIT, today)
  track('visit')
}

// "Did this match?" — the titles they chose, newest first, at most 20.
function loadChosen() {
  try {
    const list = JSON.parse(get(CHOSEN) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}
export function rememberChosen(card) {
  const list = loadChosen()
  if (list.some((c) => c.id === card.id)) return
  set(CHOSEN, JSON.stringify([{ id: card.id, title: card.title, at: Date.now(), asked: false }, ...list].slice(0, 20)))
}

// The newest chosen title not asked about yet, chosen at least 3 hours ago (time to have watched it).
export const ASK_AFTER_MS = 3 * 3600 * 1000
export function dueForMatch(now = Date.now()) {
  return loadChosen().find((c) => !c.asked && now - c.at >= ASK_AFTER_MS) || null
}
export function markAsked(id) {
  set(CHOSEN, JSON.stringify(loadChosen().map((c) => (c.id === id ? { ...c, asked: true } : c))))
}

// "Haven't watched it yet": ask again in a day.
export function snooze(id, now = Date.now()) {
  set(CHOSEN, JSON.stringify(loadChosen().map((c) => (c.id === id ? { ...c, at: now + 24 * 3600 * 1000 - ASK_AFTER_MS } : c))))
}

export async function sendVote(cardId, vote) {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: cardId, vote, visitor: visitorId() }),
    })
    return res.ok
  } catch {
    return false
  }
}
