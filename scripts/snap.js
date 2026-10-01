// npm run snap — screenshots / at 390px and 1280px, light and dark, into docs/design/snaps/.
// Starts its own Vite server unless SNAP_URL points at a running one.
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdirSync } from 'node:fs'

const outDir = 'docs/design/snaps'
mkdirSync(outDir, { recursive: true })

let server
let base = process.env.SNAP_URL
if (!base) {
  server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: 'error' })
  await server.listen()
  base = server.resolvedUrls.local[0]
}

const paths = (process.env.SNAP_PATHS || '/').split(',')
const browser = await chromium.launch()
for (const path of paths) {
  const name = path === '/' ? 'home' : path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  for (const width of [390, 1280]) {
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 })
      await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const file = `${outDir}/${name}-${width}-${scheme}.png`
      await page.screenshot({ path: file, fullPage: true })
      console.log(file)
      await page.close()
    }
  }
}
await browser.close()
if (server) await server.close()
