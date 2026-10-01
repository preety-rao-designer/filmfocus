// Saved preferences (S6): platforms and languages, in this browser only. localStorage can be missing or throw
// (private windows, blocked storage), so every read and write is guarded and the app works without it.
const KEY = 'filmfocus.prefs.v1'

export const PLATFORMS = ['Netflix', 'Prime Video', 'JioHotstar', 'Sony Liv', 'Zee5', 'Apple TV+', 'Sun Nxt', 'aha']
export const LANGUAGES = [
  ['hi', 'Hindi'], ['en', 'English'], ['ta', 'Tamil'], ['te', 'Telugu'],
  ['ml', 'Malayalam'], ['kn', 'Kannada'], ['bn', 'Bengali'], ['mr', 'Marathi'],
]

export function loadPrefs() {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function savePrefs(prefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Not saved; still used for this visit.
  }
}
