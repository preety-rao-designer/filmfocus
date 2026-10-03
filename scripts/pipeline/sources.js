// Raw sources for one title: TMDB, Wikidata, Wikipedia, Tavily. Every response is cached under data/cache/<source>/
// (git-ignored: it holds third-party text), so re-runs are free and resumable.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'

// On Vercel (on-demand cards) only /tmp is writable, and the cache there lasts as long as the server instance.
const CACHE = process.env.VERCEL ? '/tmp/filmfocus-cache' : 'data/cache'
const UA = 'FilmFocus/0.1 (mood-to-movie prototype; non-commercial)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function cached(source, id, fetcher) {
  const dir = `${CACHE}/${source}`
  const file = `${dir}/${String(id).replace(/[^a-z0-9-]+/gi, '_')}.json`
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'))
  const data = await fetcher()
  mkdirSync(dir, { recursive: true })
  writeFileSync(file, JSON.stringify(data))
  return data
}

async function getJSON(url, opts = {}, tries = 4) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(30000) })
      if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`HTTP ${res.status}`), { retry: true })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.split('?')[0]}`)
      return await res.json()
    } catch (e) {
      // A cut-off body (SyntaxError) is as transient as a timeout.
      if (i >= tries || !(e.retry || e.name === 'TimeoutError' || e.name === 'SyntaxError' || e.cause)) throw e
      await sleep(1500 * (i + 1))
    }
  }
}

// ---- TMDB ----
const tmdbKey = () => process.env.TMDB_API_KEY
// api.tmdb.org is TMDB's alternate API domain; some Indian ISPs (Jio) block api.themoviedb.org.
export const tmdb = (path, params = {}) =>
  getJSON(`https://api.tmdb.org/3${path}?${new URLSearchParams({ api_key: tmdbKey(), ...params })}`)

export function tmdbDetails(type, id) {
  const extra = type === 'movie' ? 'external_ids,keywords,watch/providers,release_dates' : 'external_ids,keywords,watch/providers,content_ratings'
  return cached('tmdb', `${type}-${id}`, () => tmdb(`/${type}/${id}`, { append_to_response: extra }))
}

// Average episode length from the first season's episodes, when TMDB's episode_run_time is empty.
export function tmdbSeason(id, n) {
  return cached('tmdb', `tv-${id}-s${n}`, () => tmdb(`/tv/${id}/season/${n}`))
}

// ---- Wikidata ----
// Looks the title up by its TMDB id (P4947 film, P4983 series). Returns based-on works, main subjects, genres and
// the English Wikipedia article, with the instance-of classes we need to judge truth status.
export function wikidata(type, id) {
  return cached('wikidata', `${type}-${id}`, async () => {
    const prop = type === 'movie' ? 'P4947' : 'P4983'
    const q = `SELECT ?item ?article ?basedOn ?basedOnLabel ?basedOnClass ?subject ?subjectLabel ?subjectClass ?subjectWhen ?genre WHERE {
      ?item wdt:${prop} "${id}".
      OPTIONAL { ?item wdt:P144 ?basedOn. OPTIONAL { ?basedOn wdt:P31 ?basedOnClass. } }
      OPTIONAL { ?item wdt:P921 ?subject. OPTIONAL { ?subject wdt:P31 ?subjectClass. } OPTIONAL { ?subject wdt:P585|wdt:P580 ?subjectWhen. } }
      OPTIONAL { ?item wdt:P136 ?genre. }
      OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 200`
    await sleep(500)
    const json = await getJSON(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
    })
    const rows = json.results.bindings
    const qid = (u) => u?.value.split('/').pop()
    const uniq = (xs) => [...new Map(xs.filter((x) => x.id).map((x) => [x.id + (x.cls || ''), x])).values()]
    return {
      item: qid(rows[0]?.item),
      article: rows.find((r) => r.article)?.article.value || null,
      based_on: uniq(rows.map((r) => ({ id: qid(r.basedOn), label: r.basedOnLabel?.value, cls: qid(r.basedOnClass) }))),
      main_subject: uniq(rows.map((r) => ({ id: qid(r.subject), label: r.subjectLabel?.value, cls: qid(r.subjectClass), dated: Boolean(r.subjectWhen) }))),
      genres: [...new Set(rows.map((r) => qid(r.genre)).filter(Boolean))],
    }
  })
}

// ---- Wikipedia ----
// Plain-text plot and reception sections of the English article (CC BY-SA; we only read them, never copy them).
export function wikipedia(articleUrl, fallbackTitle) {
  const title = articleUrl ? decodeURIComponent(articleUrl.split('/wiki/')[1]) : fallbackTitle
  return cached('wikipedia', title, async () => {
    const params = new URLSearchParams({
      action: 'query', prop: 'extracts', explaintext: '1', exsectionformat: 'wiki', redirects: '1',
      titles: title, format: 'json', formatversion: '2',
    })
    const json = await getJSON(`https://en.wikipedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
    const page = json.query?.pages?.[0]
    if (!page || page.missing || !page.extract) return { title, found: false }
    const sections = {}
    let current = 'lead'
    for (const line of page.extract.split('\n')) {
      const h = line.match(/^==\s*([^=].*?)\s*==$/)
      if (h) current = h[1].toLowerCase()
      else if (line.trim()) sections[current] = (sections[current] || '') + line + '\n'
    }
    const pick = (re, n) => Object.entries(sections).filter(([k]) => re.test(k)).map(([, v]) => v).join('\n').slice(0, n)
    return {
      title: page.title,
      found: true,
      lead: (sections.lead || '').slice(0, 1500),
      plot: pick(/^(plot|synopsis|premise|story|plot summary|summary|series overview|overview)/, 5000),
      reception: pick(/reception|response|reviews|critical|accolades|legacy/, 4000),
      basis: pick(/background|development|historical accuracy|production|inspiration/, 1500),
    }
  })
}

// ---- Tavily: audience reactions ----
export function reactions(type, id, title, year) {
  return cached('tavily', `${type}-${id}`, async () => {
    const kind = type === 'movie' ? 'movie' : 'series'
    const json = await getJSON('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({
        query: `${title} ${year} ${kind} audience reactions what it is really like reddit review`,
        search_depth: 'basic',
        max_results: 6,
        include_answer: false,
      }),
    })
    return (json.results || []).map((r) => ({ url: r.url, title: r.title, content: (r.content || '').slice(0, 1200) }))
  })
}
