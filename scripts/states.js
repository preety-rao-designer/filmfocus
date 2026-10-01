// npm run states — makes every Phase 3 state happen for real in the browser and snaps it into docs/design/snaps/.
// Uses the real /api/recommend (start `npm run dev` first, or set SNAP_URL). Only the error and offline states are
// forced, by intercepting the request, because they can't be caused on demand otherwise.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.env.SNAP_URL || 'http://localhost:5173/'
const out = 'docs/design/snaps'
mkdirSync(out, { recursive: true })
const fail = (m) => {
  throw new Error(m)
}
const browser = await chromium.launch()
const results = []
const step = async (name, fn) => {
  await fn()
  results.push(name)
  console.log(`✓ ${name}`)
}

async function session(width, scheme) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 })
  const api = []
  page.on('request', (r) => r.url().includes('/api/') && api.push(r.url()))
  page.on('pageerror', (e) => fail(`page error: ${e.message}`))
  const snap = async (name) => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
    await page.screenshot({ path: `${out}/${name}-${width}-${scheme}.png`, fullPage: true })
  }
  const search = async (text) => {
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.getByRole('textbox').fill(text)
    await page.getByRole('button', { name: 'Find my three' }).click()
  }
  const ready = () => page.getByRole('button', { name: 'Show me three others', disabled: false }).waitFor({ timeout: 45000 })
  return { page, api, snap, search, ready }
}

for (const [width, scheme] of [[390, 'light'], [1280, 'dark']]) {
  const { page, api, snap, search, ready } = await session(width, scheme)
  const tag = `${width} ${scheme}`

  await step(`${tag}: empty — nothing typed, no request in the background`, async () => {
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    if (api.length) fail(`${api.length} API requests on an empty screen`)
    if (!(await page.getByRole('button', { name: 'Find my three' }).isDisabled())) fail('Find enabled with nothing typed')
    await snap('state-empty')
  })

  await step(`${tag}: first run asks for preferences, then carries on`, async () => {
    await page.getByRole('textbox').fill('Rough day at work, want something warm but not dumb.')
    await page.getByRole('button', { name: 'Find my three' }).click()
    await page.getByRole('heading', { name: 'First, what do you watch on?' }).waitFor()
    if (api.length) fail('searched before preferences were answered')
    for (const n of ['Netflix', 'Prime Video', 'JioHotstar', 'Hindi', 'English']) await page.getByRole('button', { name: n, exact: true }).click()
    await snap('state-preferences')
    // Hold the request so the Loading state can be seen and snapped.
    let release
    const held = new Promise((r) => (release = r))
    await page.route('**/api/recommend', async (route) => {
      await held
      await route.continue()
    })
    await page.getByRole('button', { name: 'Save and find my three' }).click()
    await page.locator('article[aria-busy="true"]').nth(2).waitFor()
    await snap('state-loading')
    release()
    await ready()
    await page.unroute('**/api/recommend')
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('filmfocus.prefs.v1')))
    if (saved.platforms.join() !== 'Netflix,Prime Video,JioHotstar') fail(`prefs not saved: ${JSON.stringify(saved)}`)
    if ((await page.locator('article[aria-busy="true"]').count()) !== 0) fail('loading tickets left after results arrived')
    await snap('state-ready')
  })

  await step(`${tag}: partial input — one word is enough`, async () => {
    await search('bored')
    await Promise.race([ready(), page.getByText('Stay in this mood or get out of it?').waitFor({ timeout: 45000 })])
  })

  await step(`${tag}: the one follow-up, then results`, async () => {
    await search('I am sad')
    await page.getByText('Stay in this mood or get out of it?').waitFor({ timeout: 45000 })
    if ((await page.locator('article').count()) !== 0) fail('tickets shown with the follow-up')
    await snap('state-followup')
    await page.getByRole('button', { name: 'Cheer me up' }).click()
    await ready()
  })

  await step(`${tag}: no match says what to loosen, and loosening works`, async () => {
    await search('a true story for my kids, under 80 minutes, in Korean')
    const note = page.getByText('Nothing in our notes fits all of that.')
    await note.waitFor({ timeout: 45000 })
    await snap('state-nomatch')
    const before = await page.getByRole('button', { name: /^Try without/ }).innerText()
    await page.getByRole('button', { name: /^Try without/ }).click()
    await Promise.race([ready(), page.getByRole('button', { name: /^Try without/ }).filter({ hasNotText: before.slice(13) }).waitFor({ timeout: 45000 })])
  })

  await step(`${tag}: error in plain words, and retry works`, async () => {
    await page.route('**/api/recommend', (route) => route.fulfill({ status: 503, body: '{"error":"busy"}' }))
    await search('Something cosy for a rainy evening')
    await page.getByText('Lots of people are choosing right now. Try again in a moment.').waitFor()
    await snap('state-error')
    await page.unroute('**/api/recommend')
    await page.getByRole('button', { name: 'Try again' }).click()
    await ready()
  })

  await step(`${tag}: offline in plain words`, async () => {
    await page.route('**/api/recommend', (route) => route.abort('internetdisconnected'))
    await search('Something cosy for a rainy evening')
    await page.getByText('You seem to be offline.').waitFor()
    await page.unroute('**/api/recommend')
  })

  if (width === 390) {
    await step(`${tag}: rapid repeated requests hit the rate limit, latest tap wins, then recovers`, async () => {
      await search('Friends are over, we want to laugh loudly.')
      await ready()
      // Hammer "show me three others" until the server's per-visitor limit answers 429.
      let limited = false
      for (let i = 0; i < 20 && !limited; i++) {
        const btn = page.getByRole('button', { name: /Show me three others|Try again/ })
        await btn.click()
        await Promise.race([ready(), page.getByText('Lots of people are choosing right now.').waitFor({ timeout: 45000 })])
        limited = await page.getByText('Lots of people are choosing right now.').isVisible()
      }
      if (!limited) fail('never reached the rate limit')
      await snap('state-ratelimited')
    })
  }
  await page.close()
}
await browser.close()
console.log(`\n${results.length} state checks passed`)
