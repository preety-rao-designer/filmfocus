// npm run flow — clicks through the happy flow with Playwright and snaps S1 (populated) and S2 at 390px and 1280px,
// light and dark, into docs/design/snaps/. Fails loudly if a step doesn't do what it should.
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdirSync } from 'node:fs'

const outDir = 'docs/design/snaps'
mkdirSync(outDir, { recursive: true })

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
      await page.locator('article h3').first().waitFor()
      await page.evaluate(() => document.fonts.ready)
      const first = await titles(page)
      if (first.length !== 3) fail(`expected 3 cards, got ${first.length}`)
      await page.screenshot({ path: `${outDir}/s2-${width}-${scheme}.png`, fullPage: true })

      const seen = new Set(first)
      for (let lap = 0; lap < 2; lap++) {
        await page.getByRole('button', { name: 'Show me three others' }).click()
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

      if (errors.length) fail(`page errors: ${errors.join('; ')}`)
      console.log(`${width} ${scheme}: OK — ${[...seen].join(' | ')}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
