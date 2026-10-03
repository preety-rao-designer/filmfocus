// Where a "Watch on" name takes you. No streaming service lets other apps link to accounts or look up its own
// title ids, so each name opens that service's search for the title (on phones this usually opens the app).
// Patterns checked by loading them on 2026-10-03; Sony Liv, Zee5 and aha refused the check, so they and anything
// not listed open JustWatch India's page for the title instead, which has a button for every service.
const SEARCH = {
  Netflix: 'https://www.netflix.com/search?q=',
  'Prime Video': 'https://www.primevideo.com/search?phrase=',
  JioHotstar: 'https://www.hotstar.com/in/explore?search_query=',
  'Apple TV+': 'https://tv.apple.com/in/search?term=',
  'Sun Nxt': 'https://www.sunnxt.com/search?q=',
}
const JUSTWATCH = 'https://www.justwatch.com/in/search?q='

export const watchLink = (platform, title) => (SEARCH[platform] || JUSTWATCH) + encodeURIComponent(title)

// The services the person said they have come first, in the card's order; the rest follow.
export function splitPlatforms(platforms, mine = []) {
  return {
    yours: platforms.filter((p) => mine.includes(p)),
    others: platforms.filter((p) => !mine.includes(p)),
  }
}
