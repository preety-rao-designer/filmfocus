// Gemini, server side only. The key comes from process.env (loaded from .env in dev, from Vercel env vars at Launch).
// Models confirmed 2026-10-01 against ai.google.dev/gemini-api/docs/models; each chain falls back on overload.

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'

// Free tier allows only 20 requests a day per Flash model (QuotaFailure GenerateRequestsPerDayPerProjectPerModel-FreeTier,
// seen 2026-10-01), so the pipeline and the live engine run on Flash-Lite, which side-by-side wrote cards of nearly the
// same quality. Flash models stay at the end of each chain, and the eval judge uses them.
export const MODELS = {
  write: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'],
  rerank: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
  parse: ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'],
  judge: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'],
  embed: 'gemini-embedding-2',
}
export const EMBED_DIMS = 768

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function key() {
  const k = process.env.GEMINI_API_KEY
  if (!k) throw new Error('GEMINI_API_KEY is not set')
  return k
}

async function post(path, body, timeoutMs) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'x-goog-api-key': key(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${json.error?.message?.slice(0, 200) || 'no message'}`)
    err.status = res.status
    err.detail = JSON.stringify(json.error?.details || [])
    throw err
  }
  return json
}

// Strict JSON out: responseSchema limits enums to our vocabularies. Tries each model in the chain; on 429/503/timeouts
// it backs off and moves on. `attempts` rounds through the whole chain.
const exhausted = new Set()
export async function generateJSON({ chain, system, prompt, schema, temperature = 0.4, thinking = 'low', timeoutMs = 90000, attempts = 3 }) {
  let last
  for (let round = 0; round < attempts; round++) {
    for (const model of chain.filter((m) => !exhausted.has(m))) {
      try {
        const json = await post(
          `${model}:generateContent`,
          {
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              responseMimeType: 'application/json',
              responseSchema: schema,
              thinkingConfig: { thinkingLevel: thinking },
            },
          },
          timeoutMs,
        )
        const cand = json.candidates?.[0]
        const text = cand?.content?.parts?.filter((p) => !p.thought).map((p) => p.text).join('') || ''
        if (!text) throw Object.assign(new SyntaxError(`empty answer (finishReason ${cand?.finishReason || json.promptFeedback?.blockReason || 'none'})`), { finish: cand?.finishReason || json.promptFeedback?.blockReason })
        return { data: JSON.parse(text), model }
      } catch (e) {
        last = e
        if (process.env.GEMINI_DEBUG) console.error(`  [gemini] ${model} round ${round}: ${e.status || e.name} ${String(e.message).slice(0, 80)}`)
        if (e.status === 429 && /PerDay/.test(e.detail || '')) exhausted.add(model)
        // A blocked prompt stays blocked: hand it back so the caller can send less source text.
        if (e.finish === 'PROHIBITED_CONTENT' || e.finish === 'SAFETY' || e.finish === 'BLOCKLIST') throw e
        const retryable = e.status === 429 || e.status === 503 || e.status === 500 || e.name === 'TimeoutError' || e instanceof SyntaxError
        if (!retryable) throw e
        await sleep(e.status === 429 ? 4000 * (round + 1) : 800 * (round + 1))
      }
    }
  }
  throw last || Object.assign(new Error('Every model in the chain is out of daily quota'), { status: 429 })
}

export async function embed(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  const out = []
  for (let i = 0; i < texts.length; i += 20) {
    const batch = texts.slice(i, i + 20)
    let tries = 0
    for (;;) {
      try {
        const json = await post(
          `${MODELS.embed}:batchEmbedContents`,
          {
            requests: batch.map((text) => ({
              model: `models/${MODELS.embed}`,
              content: { parts: [{ text }] },
              taskType,
              outputDimensionality: EMBED_DIMS,
            })),
          },
          120000,
        )
        out.push(...json.embeddings.map((e) => normalise(e.values)))
        // Free tier: 100 embedded texts a minute. Pace big batches (the pipeline) to ~80; single queries don't wait.
        if (texts.length > 20 && i + 20 < texts.length) await sleep(15000)
        break
      } catch (e) {
        if (++tries > 5 || !(e.status === 429 || e.status === 503 || e.name === 'TimeoutError')) throw e
        await sleep(e.status === 429 ? 61000 : 3000 * tries)
      }
    }
  }
  return out
}

// Unit length, so cosine similarity is a plain dot product.
function normalise(v) {
  const n = Math.hypot(...v) || 1
  return v.map((x) => x / n)
}
