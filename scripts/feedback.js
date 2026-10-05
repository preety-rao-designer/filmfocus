// node scripts/feedback.js — checks Launch L5 ("Did this match?") and L6 (events) end to end with Playwright against
// real Firestore. Uses a `test-` visitor id and deletes every doc it wrote at the end, so live metrics stay clean.
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { db } from '../api/_lib/firebase.js'

process.loadEnvFile('.env')
process.env.RATE_LIMIT_PER_MIN = '1000'
const firestore = db()
const VISITOR = `test-${Date.now().toString(36)}`
const results = []
const check = (ok, name) => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (!ok) throw new Error(name)
}
const eventsOf = async (visitor) => (await firestore.collection('events').where('visitor', '==', visitor).get()).docs.map((d) => d.data())
const waitFor = async (fn, ms = 8000) => {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 300))) if (await fn()) return true
  return false
}

const server = await createServer({ server: { port: 5195 }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
const flagCard = 'tmdb-movie-247645' // Queen, for the flag check; its real stats are restored after
const before = (await firestore.collection('cardStats').doc(flagCard).get()).data() || null
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } })
  await context.addInitScript((v) => {
    localStorage.setItem('filmfocus.visitor.v1', v)
    localStorage.setItem('filmfocus.prefs.v1', JSON.stringify({ platforms: ['Netflix', 'Prime Video', 'JioHotstar'], languages: ['hi', 'en'], subtitles_ok: false }))
  }, VISITOR)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))

  // A search, a service tap and a save.
  await page.goto(base)
  await page.getByRole('textbox').fill('rough day, want something warm and funny')
  await page.getByRole('button', { name: 'Find my watch' }).click()
  await page.getByRole('button', { name: 'Show me three others' }).and(page.locator(':enabled')).waitFor({ timeout: 90000 })
  check((await page.locator('#match-q').count()) === 0, 'no match question on results')
  const [popup] = await Promise.all([context.waitForEvent('page'), page.locator('main a[target="_blank"]').first().click()])
  await popup.close()
  await page.getByRole('button', { name: /^02 / }).click()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: 'Add to watchlist' }).click()
  await page.getByRole('button', { name: 'Show me three others' }).click()
  await page.getByRole('button', { name: 'Show me three others' }).and(page.locator(':enabled')).waitFor({ timeout: 90000 })

  check(await waitFor(async () => (await eventsOf(VISITOR)).length >= 5), 'events reach Firestore')
  const ev = await eventsOf(VISITOR)
  const names = ev.map((e) => e.name).sort().join(',')
  check(['visit', 'search', 'open', 'save', 'others'].every((n) => names.includes(n)), `visit, search, open, save, others logged (${names})`)
  const search = ev.find((e) => e.name === 'search')
  check(ev.filter((e) => ['open', 'save', 'others'].includes(e.name)).every((e) => e.search === search.search), 'open, save and others carry the search id')
  check(search.props.chars > 0 && !('text' in search.props), 'mood text not sent, only its length')
  check(ev.filter((e) => e.name === 'visit').length === 1, 'one visit per day')
  check(ev.filter((e) => e.name === 'save').length === 1, 'one tap, one save event')
  check(ev.every((e) => e.test === true), 'local events tagged test (left out of metrics)')

  // Too soon: nothing asked. Three hours on: asked about the newest chosen title.
  await page.goto(base)
  check((await page.locator('#match-q').count()) === 0, 'not asked before 3 hours')
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('filmfocus.chosen.v1'))
    localStorage.setItem('filmfocus.chosen.v1', JSON.stringify(list.map((c) => ({ ...c, at: c.at - 4 * 3600e3 }))))
  })
  await page.reload()
  const q = await page.locator('#match-q').innerText()
  check(/Did it match your mood\?/.test(q), `asked after 3 hours (${q})`)
  const asked = q.match(/chose (.*)\. Did/)[1]
  await page.getByRole('button', { name: 'Haven’t watched it yet' }).click()
  check(await page.getByText('We’ll ask tomorrow.').isVisible(), 'snooze says tomorrow')
  await page.reload()
  const next = (await page.locator('#match-q').count()) ? await page.locator('#match-q').innerText() : ''
  check(!next.includes(asked), 'snoozed title not asked again today')
  if (next) {
    await page.getByRole('button', { name: 'No', exact: true }).click()
    check(await page.getByText('Thanks.').isVisible(), 'vote thanks')
    await page.reload()
    check((await page.locator('#match-q').count()) === 0 || !(await page.locator('#match-q').innerText()).includes(next.match(/chose (.*)\. Did/)[1]), 'answered title retired')
    check(await waitFor(async () => (await firestore.collection('votes').where('visitor', '==', VISITOR).get()).size === 1), 'vote stored in Firestore')
  } else {
    // Only one title was chosen; un-snooze it and vote on it instead.
    await page.evaluate(() => {
      const list = JSON.parse(localStorage.getItem('filmfocus.chosen.v1'))
      localStorage.setItem('filmfocus.chosen.v1', JSON.stringify(list.map((c) => ({ ...c, at: Date.now() - 4 * 3600e3 }))))
    })
    await page.reload()
    await page.getByRole('button', { name: 'No', exact: true }).click()
    check(await waitFor(async () => (await firestore.collection('votes').where('visitor', '==', VISITOR).get()).size === 1), 'vote stored in Firestore')
  }
  check(errors.length === 0, `no page errors (${errors.join('; ')})`)

  // Three "no" votes from different visitors flag a card; a changed vote replaces, never double-counts.
  const vote = (visitor, v) => fetch(`${base}api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card_id: flagCard, vote: v, visitor }) })
  const base0 = before?.no || 0
  for (const i of [1, 2, 3]) await vote(`${VISITOR}-${i}`, 'no')
  let stats = (await firestore.collection('cardStats').doc(flagCard).get()).data()
  check(stats.no === base0 + 3 && stats.flagged, `3 "no" votes flag the card (no=${stats.no})`)
  await vote(`${VISITOR}-3`, 'yes')
  stats = (await firestore.collection('cardStats').doc(flagCard).get()).data()
  check(stats.no === base0 + 2 && stats.yes === (before?.yes || 0) + 1, 'a changed vote moves, not doubles')
  check((await vote(VISITOR, 'maybe')).status === 400, 'bad vote rejected')
  console.log(results.join('\n'))
} catch (e) {
  console.log(results.join('\n'))
  console.error('FAILED:', e.message)
  process.exitCode = 1
} finally {
  // Clean up everything this run wrote.
  const visitors = [VISITOR, `${VISITOR}-1`, `${VISITOR}-2`, `${VISITOR}-3`]
  for (const v of visitors) {
    for (const d of (await firestore.collection('events').where('visitor', '==', v).get()).docs) await d.ref.delete()
    for (const d of (await firestore.collection('votes').where('visitor', '==', v).get()).docs) {
      const { card_id, vote } = d.data()
      if (card_id !== flagCard) {
        // Undo this vote's count on the card it went to.
        const ref = firestore.collection('cardStats').doc(card_id)
        const st = (await ref.get()).data()
        if (st) {
          const next = { ...st, [vote]: Math.max(0, (st[vote] || 0) - 1) }
          next.flagged = (next.no || 0) >= 3
          if (!next.yes && !next.partly && !next.no) await ref.delete()
          else await ref.set(next)
        }
      }
      await d.ref.delete()
    }
  }
  const statsRef = firestore.collection('cardStats').doc(flagCard)
  if (before) await statsRef.set(before)
  else await statsRef.delete()
  console.log('cleaned up test data')
  await browser.close()
  await server.close()
}
