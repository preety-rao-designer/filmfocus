// node scripts/v2.js — checks the V2 screens ("The Late Show") end to end with Playwright against the real engine:
// home and its shelf, results with the focus moving between picks, every action (watch, watchlist, compare, the
// ending, the full page, three others), a title's page, watchlist, compare, chips, surprise, preferences, and the
// in-place states (follow-up, nothing fits, error, busy, offline). Replaces the V1 flow, states and lists checks.
// Runs at 390px and 1280px and snaps each screen into docs/design/snaps/v2-*.png.
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdirSync } from 'node:fs'

const outDir = 'docs/design/snaps'
mkdirSync(outDir, { recursive: true })
process.env.RATE_LIMIT_PER_MIN = '1000'
const server = await createServer({ server: { port: 5193, strictPort: false }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls.local[0]
const results = []
const check = (ok, name) => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (!ok) throw new Error(name)
}
const ready = (page) => page.getByRole('button', { name: /^Regenerate/ }).and(page.locator(':enabled')).waitFor({ timeout: 90000 })
const focused = (page) => page.locator('main h2').first().innerText()
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

const browser = await chromium.launch()
try {
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const tag = `${w}`
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
    await context.addInitScript(() => {
      if (!localStorage.getItem('filmfocus.prefs.v1'))
        localStorage.setItem('filmfocus.prefs.v1', JSON.stringify({ platforms: ['Netflix', 'Prime Video'], languages: ['hi', 'en'], subtitles_ok: false }))
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))

    // Home and the shelf.
    await page.goto(base)
    await page.getByRole('button', { name: /, see its page$/ }).first().waitFor({ timeout: 20000 })
    const posters = await page.getByRole('button', { name: /, see its page$/ }).count()
    check(posters >= 20, `${tag} shelf shows posters (${posters})`)
    check(await page.getByRole('button', { name: 'Find my watch' }).isDisabled(), `${tag} Find my watch waits for a mood`)
    const shelf = page.locator('section[aria-label^="Some of the titles"] > div').first()
    const before = await shelf.evaluate((el) => el.scrollLeft)
    await page.getByRole('button', { name: 'Scroll the shelf right' }).click()
    await page.waitForTimeout(700)
    check((await shelf.evaluate((el) => el.scrollLeft)) > before + 100, `${tag} shelf arrow scrolls`)
    check(await noSideScroll(page), `${tag} home has no sideways scroll`)
    await page.mouse.move(1, 1)
    await page.screenshot({ path: `${outDir}/v2-home-${tag}.png`, fullPage: true })

    // A shelf poster opens its page; Back returns home.
    const first = page.getByRole('button', { name: /, see its page$/ }).first()
    const name = (await first.getAttribute('aria-label')).replace(', see its page', '')
    await first.click()
    await page.waitForURL(/\/title\/tmdb-/)
    await page.locator('main h1').waitFor()
    check((await page.locator('main h1').innerText()) === name, `${tag} shelf poster opens ${name}'s page`)
    check(await page.getByText('Actually is').isVisible(), `${tag} title page shows the honest read`)
    check(await page.getByRole('heading', { name: 'Good for' }).isVisible(), `${tag} title page shows Good for`)
    await page.screenshot({ path: `${outDir}/v2-title-${tag}.png`, fullPage: true })
    await page.getByRole('button', { name: '← Back' }).click()
    await page.waitForURL(base)
    check(await page.getByRole('button', { name: 'Find my watch' }).isVisible(), `${tag} Back returns home`)

    // Title search from the header: as-you-type matches, keyboard to open, Esc to close, an offer when we don't have it.
    await page.getByRole('button', { name: 'Search for a title' }).click()
    const field = page.getByRole('searchbox', { name: 'Search a movie or show' })
    check(await field.evaluate((el) => el === document.activeElement), `${tag} search opens with the field focused`)
    await field.fill('laapataa')
    await page.getByRole('option', { name: /Lost Ladies/ }).waitFor()
    await page.screenshot({ path: `${outDir}/v2-search-${tag}.png` })
    await field.press('Enter')
    await page.waitForURL(/\/title\//)
    check((await page.locator('main h1').innerText()) === 'Lost Ladies', `${tag} search "laapataa" opens Lost Ladies`)
    await page.keyboard.press('/')
    await field.fill('dil')
    await page.getByRole('option').nth(2).waitFor()
    await field.press('ArrowDown')
    const second = await page.getByRole('option', { selected: true }).innerText()
    await field.press('Enter')
    await page.waitForURL(/\/title\//)
    check(second.startsWith(await page.locator('main h1').innerText()), `${tag} arrow keys pick the second match`)
    await page.keyboard.press('/')
    await field.fill('qwxzy film')
    await page.getByRole('button', { name: 'Make its card' }).waitFor()
    check(await page.getByText('We don’t have a card for “qwxzy film” yet').isVisible(), `${tag} unknown title offers to make its card`)
    await page.keyboard.press('Escape')
    check((await page.getByRole('dialog').count()) === 0, `${tag} Esc closes search`)
    await page.goto(base)
    await page.getByRole('button', { name: 'Find my watch' }).waitFor()

    // Chips.
    await page.getByRole('button', { name: 'How long' }).click()
    await page.getByRole('button', { name: 'One movie' }).click()
    check(await page.getByRole('button', { name: 'One movie' }).isVisible(), `${tag} chosen chip shows its answer`)
    await page.getByRole('button', { name: 'One movie' }).click() // reopens the answers
    await page.getByRole('group', { name: 'How long' }).getByRole('button', { name: 'One movie' }).click() // choosing it again clears it
    check(await page.getByRole('button', { name: 'How long' }).isVisible(), `${tag} chip clears`)

    // Search.
    await page.getByRole('textbox').fill('long week, want something funny and warm, nothing heavy')
    await page.getByRole('button', { name: 'Find my watch' }).click()
    await page.waitForURL(/\/results/)
    await page.screenshot({ path: `${outDir}/v2-loading-${tag}.png` })
    await ready(page)
    const t1 = await focused(page)
    check(t1.length > 0, `${tag} results focus pick 1 (${t1})`)
    const watch = page.getByRole('link', { name: /^Find it on / })
    if (await watch.count()) {
      const href = await watch.getAttribute('href')
      check(/netflix|primevideo|hotstar|apple|sunnxt|justwatch|sonyliv|zee5|aha/.test(href), `${tag} Find it on opens a service search (${href.slice(0, 40)}…)`)
      const [popup] = await Promise.all([context.waitForEvent('page'), watch.click()])
      await popup.close()
    }
    await page.screenshot({ path: `${outDir}/v2-results-${tag}.png`, fullPage: true })

    // Save pick 1, move to pick 2, compare 1 and 2.
    await page.getByRole('button', { name: 'Add to watchlist' }).first().click()
    check(await page.getByRole('button', { name: 'On your watchlist' }).first().isVisible(), `${tag} saved shows On your watchlist`)
    check(await page.getByRole('button', { name: /^Watchlist\s*1$/ }).isVisible(), `${tag} header counts the watchlist`)
    await page.getByRole('button', { name: 'Compare', exact: true }).click()
    check(await page.getByRole('button', { name: 'In compare' }).isVisible(), `${tag} compare shows In compare`)
    await page.getByRole('button', { name: /^02 / }).click()
    await page.waitForTimeout(600)
    const t2 = await focused(page)
    check(t2 !== t1, `${tag} tapping poster 02 moves the focus (${t2})`)
    check(await page.getByRole('button', { name: 'Add to watchlist' }).first().isVisible(), `${tag} pick 2 has its own watchlist state`)
    await page.getByRole('button', { name: 'Compare', exact: true }).click()
    check(await page.getByRole('button', { name: /^Compare\s*2$/ }).isVisible(), `${tag} header counts compare`)
    await page.screenshot({ path: `${outDir}/v2-results-pick2-${tag}.png` })
    if (w >= 900) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(600)
      check((await focused(page)) !== t2, `${tag} arrow key moves the focus on`)
      await page.keyboard.press('ArrowLeft')
      await page.waitForTimeout(600)
      check((await focused(page)) === t2, `${tag} arrow key moves the focus back`)
    }

    // The ending, then the full page and back to the same three.
    await page.getByRole('button', { name: 'Read how it ends' }).click()
    check(await page.locator('[id^="spoiler-"]').isVisible(), `${tag} Read how it ends shows the ending`)
    await page.getByRole('button', { name: 'Hide the ending' }).click()
    await page.getByRole('button', { name: 'See the full page →' }).click()
    await page.waitForURL(/\/title\//)
    check((await page.locator('main h1').innerText()) === t2, `${tag} See the full page opens ${t2}`)
    check(await page.getByRole('button', { name: 'In compare' }).isVisible(), `${tag} title page keeps the compare state`)
    await page.goBack()
    await page.waitForURL(/\/results/)
    await ready(page)
    const titles = await page.getByRole('button', { name: /^0[23] |, see its page$/ }).allInnerTexts()
    check(titles.join(' ').includes(t2), `${tag} back from a page keeps the same three`)
    // Tapping the focused poster opens its page.
    await page.locator('button[aria-current="true"]').click()
    await page.waitForURL(/\/title\//)
    check(await page.locator('main h1').isVisible(), `${tag} focused poster opens its page`)
    await page.goBack()
    await ready(page)

    // Three others.
    const seenBefore = await page.getByRole('button', { name: /^0[1-3] |, see its page$/ }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
    await page.getByRole('button', { name: /^Regenerate/ }).click()
    await ready(page)
    const seenAfter = await page.getByRole('button', { name: /^0[1-3] |, see its page$/ }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
    check(seenAfter.join() !== seenBefore.join(), `${tag} Regenerate brings new picks`)
    check(await noSideScroll(page), `${tag} results have no sideways scroll`)

    // Watchlist.
    await page.getByRole('button', { name: /^Watchlist/ }).click()
    await page.waitForURL(/\/watchlist/)
    check((await page.locator('main li').count()) === 1, `${tag} watchlist has the saved title`)
    await page.screenshot({ path: `${outDir}/v2-watchlist-${tag}.png`, fullPage: true })
    await page.locator('main li').getByRole('button', { name: /, see its page$/ }).click()
    await page.waitForURL(/\/title\//)
    check((await page.locator('main h1').innerText()) === t1, `${tag} watchlist poster opens its page`)
    await page.goBack()
    await page.getByRole('button', { name: 'On your watchlist' }).click()
    check(await page.getByText('Nothing saved yet').isVisible(), `${tag} removing the last title shows the empty state`)

    // Compare.
    await page.getByRole('button', { name: /^Compare\s*2$/ }).click()
    await page.waitForURL(/\/compare/)
    check((await page.locator('thead th').count()) === 3, `${tag} compare shows two titles`)
    check(await noSideScroll(page), `${tag} compare has no sideways page scroll`)
    await page.screenshot({ path: `${outDir}/v2-compare-${tag}.png`, fullPage: true })
    await page.getByRole('button', { name: /^Remove/ }).first().click()
    check(await page.getByText('is waiting. Add one more title').isVisible(), `${tag} removing one leaves one waiting`)
    await page.getByRole('button', { name: 'Find something' }).click()

    // Surprise me and preferences.
    await page.getByRole('button', { name: 'Surprise me' }).click()
    await ready(page)
    const surprise = await page.getByText('A surprise', { exact: true }).count()
    check(surprise >= 1 && /q=|results$/.test(page.url()), `${tag} Surprise me finds three (${surprise}, ${page.url()})`)
    await page.getByRole('button', { name: 'What I watch on' }).click()
    await page.waitForURL(/\/preferences/)
    await page.screenshot({ path: `${outDir}/v2-prefs-${tag}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Zee5' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('filmfocus.prefs.v1')))
    check(prefs.platforms.includes('Zee5'), `${tag} preferences save`)

    // The in-place states, forced by answering /api/recommend in the browser (they can't be caused on demand).
    const forced = async (body, status = 200) => {
      await page.route('**/api/recommend', (r) => (body === 'abort' ? r.abort() : r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })))
      await page.goto(`${base}results?q=${encodeURIComponent('something to fall asleep to')}`)
      await page.locator('main div[role="status"]').first().waitFor()
    }
    await forced({ followup: { slot: 'company', question: 'Who are you watching with?', options: ['Just me', 'With family'] }, picks: [] })
    check(await page.getByText('Who are you watching with?').isVisible() && (await page.getByRole('button', { name: 'With family' }).isVisible()), `${tag} follow-up question with pill answers`)
    await page.screenshot({ path: `${outDir}/v2-followup-${tag}.png` })
    await forced({ picks: [], no_match: { constraint: 'languages', label: 'Hindi only' } })
    check(await page.getByRole('button', { name: 'Try without “Hindi only”' }).isVisible(), `${tag} nothing-fits offers to loosen`)
    await forced({ error: 'x' }, 500)
    check(await page.getByText("Couldn't reach our film notes").isVisible() && (await page.getByRole('button', { name: 'Try again' }).isVisible()), `${tag} error says so and offers Try again`)
    await page.screenshot({ path: `${outDir}/v2-error-${tag}.png` })
    await forced({ error: 'busy' }, 429)
    check(await page.getByText('Lots of people are choosing right now').isVisible(), `${tag} busy state`)
    await forced('abort')
    check(await page.getByText('You seem to be offline').isVisible(), `${tag} offline state`)
    await page.unroute('**/api/recommend')
    await page.goto(`${base}title/tmdb-movie-1`)
    await page.getByText("We don't have a card for that title.").waitFor({ timeout: 10000 })
    check(await page.getByRole('button', { name: 'Find something else' }).isVisible(), `${tag} unknown title page says so`)

    check(errors.length === 0, `${tag} no page errors (${errors.join('; ')})`)
    await context.close()
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
