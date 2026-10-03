// Watchlist (S4) and compare (S5), in this browser only, like preferences. Each list keeps whole cards, so the
// watchlist and compare screens render without asking the server again. Guarded the same way as prefs.js.
const KEYS = { watchlist: 'filmfocus.watchlist.v1', compare: 'filmfocus.compare.v1' }
export const COMPARE_MAX = 3

export function loadList(name) {
  try {
    const raw = window.localStorage.getItem(KEYS[name])
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveList(name, list) {
  try {
    window.localStorage.setItem(KEYS[name], JSON.stringify(list))
  } catch {
    // Not saved; still used for this visit.
  }
}

// Newest first. Adding a card that's already there removes it, so one button can toggle.
export function toggleCard(list, card, max = Infinity) {
  if (list.some((c) => c.id === card.id)) return list.filter((c) => c.id !== card.id)
  if (list.length >= max) return list
  return [card, ...list]
}
