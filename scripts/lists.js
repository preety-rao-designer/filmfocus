// node scripts/lists.js — checks S4 Watchlist and S5 Compare with Playwright, without the engine: lists are seeded
// with real cards from data/cards.json. Snaps both screens at 390px and 1280px, light and dark, into docs/design/snaps/.
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdirSync, readFileSync } from 'node:fs'

const outDir = 'docs/design/snaps'
mkdirSync(outDir, { recursive: true })
const raw = JSON.parse(readFileSync('data/cards.json', 'utf8'))
const cards = raw.cards || raw
const pick = (title) => cards.find((c) => c.title === title) || fail(`no card "${title}"`)
const [a, b, c, d] = ['Pad Man', 'Panchayat', 'Get Out', 'Bulbbul'].map(pick)

const server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls.local[0]
function fail(msg) {
  throw new Error(msg)
}
const results = []
const check = (ok, name) => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (!ok) fail(name)
}

const browser = await chromium.launch()
try {
  // Behaviour, once.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => localStorage.setItem('filmfocus.prefs.v1', JSON.stringify({ platforms: ['Prime Video', 'Netflix'], languages: ['hi'], subtitles_ok: false })))
    await page.goto(`${base}watchlist`)
    check(await page.getByText('Nothing saved yet').isVisible(), 'watchlist empty state')
    check(await page.getByRole('button', { name: 'Watchlist', exact: true }).isVisible(), 'header shows Watchlist with no count')
    check((await page.getByRole('button', { name: /^Compare/ }).count()) === 0, 'no Compare link while compare is empty')

    await page.evaluate(([w, cmp]) => {
      localStorage.setItem('filmfocus.watchlist.v1', JSON.stringify(w))
      localStorage.setItem('filmfocus.compare.v1', JSON.stringify(cmp))
    }, [[a, b, c], [a]])
    await page.reload()
    check((await page.locator('article h3').allInnerTexts()).join('|') === 'Pad Man|Panchayat|Get Out', 'watchlist shows saved cards in order')
    check(await page.getByRole('button', { name: 'Watchlist 3' }).isVisible(), 'header count 3')
    check(await page.getByRole('button', { name: 'Compare 1' }).isVisible(), 'header shows Compare 1')
    check((await page.locator('article p.italic').count()) === 0, 'no why line on saved cards')

    // Where to watch: services the person has come first and open that service's search; others fall back to JustWatch.
    const card = (t) => page.locator('article', { has: page.locator('h3', { hasText: t }) })
    const q = card('Pad Man')
    const line = await q.getByText(/You have it on/).innerText()
    check(line.startsWith('You have it on Prime Video') && /Also on/.test(line), `your services first (${line})`)
    const href = (name) => q.getByRole('link', { name: new RegExp(`^${name}`) }).getAttribute('href')
    check((await href('Prime Video')) === 'https://www.primevideo.com/search?phrase=Pad%20Man', 'Prime Video opens its search')
    check((await href('Zee5')).startsWith('https://www.justwatch.com/in/search?q=Pad%20Man'), 'unchecked service opens JustWatch')
    check((await q.getByRole('link', { name: /^Prime Video/ }).getAttribute('target')) === '_blank', 'service links open a new tab')
    const go = card('Get Out').locator('p', { hasText: /^(Watch on|You have it on)/ })
    check((await go.innerText()).startsWith('Watch on'), `no saved service on the card reads "Watch on" (${await go.innerText()})`)

    // Add two to compare from the watchlist: the third add fills it, and a fourth card can't be added.
    await card('Panchayat').getByRole('button', { name: 'Add to compare' }).click()
    await card('Get Out').getByRole('button', { name: 'Add to compare' }).click()
    check(await page.getByRole('button', { name: 'Compare 3' }).isVisible(), 'compare count 3 after adds')
    check((await card('Pad Man').getByRole('button', { name: 'In compare' }).getAttribute('aria-pressed')) === 'true', 'in-compare pill pressed')
    await page.evaluate((x) => {
      const w = JSON.parse(localStorage.getItem('filmfocus.watchlist.v1'))
      localStorage.setItem('filmfocus.watchlist.v1', JSON.stringify([...w, x]))
    }, d)
    await page.reload()
    check(await card('Bulbbul').getByRole('button', { name: 'Compare is full' }).isDisabled(), 'fourth card says compare is full')

    // Compare screen.
    await page.getByRole('button', { name: 'Compare 3' }).click()
    check(page.url().endsWith('/compare'), 'Compare link opens /compare')
    check((await page.locator('thead th span.font-display').allInnerTexts()).length === 3, 'three columns')
    check((await page.locator('tbody tr').count()) === 8, 'eight comparison rows')
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    check(pageWidth <= 390, `no page-level sideways scroll at 390px (${pageWidth})`)
    await page.getByRole('button', { name: 'Remove Get Out' }).click()
    check((await page.locator('thead th span.font-display').count()) === 2, 'remove leaves two columns')
    await page.getByRole('button', { name: 'Remove Panchayat' }).click()
    check(await page.getByText('Pad Man is waiting').isVisible(), 'one left: asks for one more')
    await page.goBack()
    check(page.url().endsWith('/watchlist'), 'back returns to the watchlist')

    // Take everything off the watchlist: the last one off shows the empty state, and it survives a reload.
    for (const t of ['Pad Man', 'Panchayat', 'Get Out', 'Bulbbul']) await card(t).getByRole('button', { name: 'On your watchlist' }).click()
    check(await page.getByText('Nothing saved yet').isVisible(), 'removing the last title shows the empty state')
    await page.reload()
    check(await page.getByText('Nothing saved yet').isVisible(), 'empty watchlist persists after reload')

    // Broken storage must not break the screens.
    await page.evaluate(() => localStorage.setItem('filmfocus.watchlist.v1', '{not json'))
    await page.reload()
    check(await page.getByText('Nothing saved yet').isVisible(), 'corrupt storage falls back to empty')
    check(errors.length === 0, `no page errors (${errors.join('; ')})`)
    await page.close()
  }

  // Snaps.
  for (const width of [390, 1280]) {
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 })
      await page.addInitScript(([w, cmp]) => {
        localStorage.setItem('filmfocus.prefs.v1', JSON.stringify({ platforms: ['Prime Video'], languages: ['hi'], subtitles_ok: false }))
        localStorage.setItem('filmfocus.watchlist.v1', JSON.stringify(w))
        localStorage.setItem('filmfocus.compare.v1', JSON.stringify(cmp))
      }, [[a, b], [a, b, c]])
      await page.goto(`${base}watchlist`)
      await page.screenshot({ path: `${outDir}/s4-watchlist-${width}-${scheme}.png`, fullPage: true })
      await page.goto(`${base}compare`)
      await page.screenshot({ path: `${outDir}/s5-compare-${width}-${scheme}.png`, fullPage: true })
      await page.close()
    }
  }
  console.log(results.join('\n'))
} catch (e) {
  console.log(results.join('\n'))
  console.error('FAILED:', e.message)
  process.exitCode = 1
} finally {
  await browser.close()
  await server.close()
}
