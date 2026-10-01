// npm run flow — clicks through the happy flow with Playwright (against the live engine since Phase 3) and snaps S1 (populated) and S2 at 390px and 1280px,
// light and dark, into docs/design/snaps/. Fails loudly if a step doesn't do what it should.
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdirSync } from 'node:fs'

const outDir = 'docs/design/snaps'
mkdirSync(outDir, { recursive: true })

// Four passes back to back would trip the per-visitor limit meant for real people; lift it for this test server only.
process.env.RATE_LIMIT_PER_MIN = '1000'
const server = await createServer({ server: { port: 5198, strictPort: false }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls.local[0]

const fail = (msg) => {
  throw new Error(msg)
}
const titles = (page) => page.locator('article h3').allInnerTexts()

const browser = await chromium.launch()
try {
  for (const width of [390, 1280]) {
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 })
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      // Preferences already answered, so this checks the main flow (scripts/states.js covers the first run).
      await page.addInitScript(() =>
        localStorage.setItem('filmfocus.prefs.v1', JSON.stringify({ platforms: ['Netflix', 'Prime Video', 'JioHotstar'], languages: ['hi', 'en'], subtitles_ok: false })),
      )
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)

      // S1: type and tap chips.
      const find = page.getByRole('button', { name: 'Find my three' })
      if (!(await find.isDisabled())) fail('Find my three should wait for some input')
      await page.getByRole('textbox').fill('Rough day. Want something warm but not dumb.')
      for (const [question, answer] of [["Who's watching", 'With family'], ['How long', 'One movie'], ['Stay in this mood or shift it', 'Comfort me']]) {
        await page.getByRole('button', { name: question, exact: true }).click()
        await page.getByRole('group', { name: question }).getByRole('button', { name: answer }).click()
        const chip = page.getByRole('button', { name: answer, exact: true })
        if ((await chip.getAttribute('aria-pressed')) !== 'true') fail(`${answer} chip did not show as chosen`)
      }
      // Open one question so the snap shows answers as well as chosen chips.
      await page.getByRole('button', { name: 'With family', exact: true }).click()
      await page.screenshot({ path: `${outDir}/s1-${width}-${scheme}.png`, fullPage: true })

      // S2: find, then show others twice.
      await find.click()
      await page.waitForURL('**/results**')
      await page.getByRole('button', { name: 'Show me three others', disabled: false }).waitFor({ timeout: 45000 })
      // The one animation moment: three tickets, 320ms each, 80ms apart. Check it, then let it finish before snapping.
      const anims = await page.evaluate(() =>
        document.getAnimations().map((a) => [a.animationName, a.effect.getTiming().duration, a.effect.getTiming().delay]),
      )
      if (JSON.stringify(anims) !== JSON.stringify([['ticket-in', 320, 0], ['ticket-in', 320, 80], ['ticket-in', 320, 160]]))
        fail(`unexpected animations: ${JSON.stringify(anims)}`)
      await page.waitForFunction(() => document.getAnimations().length === 0 || document.getAnimations().every((a) => a.playState === 'finished'))
      await page.evaluate(() => document.fonts.ready)
      const first = await titles(page)
      if (first.length !== 3) fail(`expected 3 cards, got ${first.length}`)
      await page.screenshot({ path: `${outDir}/s2-${width}-${scheme}.png`, fullPage: true })

      const seen = new Set(first)
      for (let lap = 0; lap < 2; lap++) {
        await page.getByRole('button', { name: 'Show me three others' }).click()
        await page.getByRole('button', { name: 'Show me three others', disabled: false }).waitFor({ timeout: 45000 })
        await page.waitForFunction((prev) => document.querySelector('article h3')?.innerText !== prev, first[0])
        const next = await titles(page)
        if (next.length !== 3) fail(`expected 3 cards, got ${next.length}`)
        if (next.some((t) => seen.has(t))) fail(`"show me others" repeated a title: ${next.join(', ')}`)
        next.forEach((t) => seen.add(t))
        first[0] = next[0]
      }

      // Spoiler reveal still works on the results screen.
      const reveal = page.getByRole('button', { name: 'Read how it ends' }).first()
      await reveal.click()
      if ((await page.getByRole('button', { name: 'Hide the ending' }).first().getAttribute('aria-expanded')) !== 'true') fail('spoiler did not open')

      // Back to S1 keeps what was typed.
      await page.getByRole('button', { name: 'Change my mood' }).click()
      if ((await page.getByRole('textbox').inputValue()) === '') fail('mood text was lost going back')

      // Under reduced motion the tickets simply appear.
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.getByRole('button', { name: 'Find my three' }).click()
      await page.locator('article').first().waitFor()
      const reduced = await page.evaluate(() => document.getAnimations().length)
      if (reduced !== 0) fail(`${reduced} animations ran under reduced motion`)

      if (errors.length) fail(`page errors: ${errors.join('; ')}`)
      console.log(`${width} ${scheme}: OK — ${[...seen].join(' | ')}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
