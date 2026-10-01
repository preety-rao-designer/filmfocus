// The live engine: the same call as src/engine/mock.js, answered by /api/recommend on the server.
// Throws an Error with `kind` ('busy' | 'offline' | 'failed') so the screen can say what went wrong in plain words.
export async function recommend({ text = '', chips = {}, exclude = [], prefs = {}, answer = null, loosen = [], signal } = {}) {
  let res
  try {
    res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, chips, exclude, prefs, answer, loosen }),
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw Object.assign(new Error('offline'), { kind: 'offline' })
  }
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { kind: res.status === 503 || res.status === 429 ? 'busy' : 'failed' })
  return res.json()
}
