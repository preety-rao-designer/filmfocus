import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Serves the Vercel-style functions in api/ during `npm run dev`, so the browser only ever calls /api/* and keys stay
// in this Node process (Vite only exposes VITE_-prefixed variables to the browser, and we have none).
function apiDev() {
  return {
    name: 'filmfocus-api-dev',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      // Events and votes from local runs (tests, trying things out) are tagged, so live metrics count only the real site.
      process.env.FILMFOCUS_TEST = process.env.FILMFOCUS_TEST || '1'
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()
        const name = req.url.slice(5).split('?')[0]
        const file = resolve('api', `${name}.js`)
        const send = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (!/^[a-z-]+$/.test(name) || !existsSync(file)) return send(404, { error: 'Not found' })
        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          req.body = raw ? JSON.parse(raw) : {}
          res.status = (code) => ((res.statusCode = code), res)
          res.json = (body) => send(res.statusCode || 200, body)
          const mod = await server.ssrLoadModule(file)
          await mod.default(req, res)
        } catch (e) {
          server.config.logger.error(`api/${name}: ${e.message}`)
          send(500, { error: 'Something went wrong on our side.' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDev()],
})
