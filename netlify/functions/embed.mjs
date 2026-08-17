import { guard, json, getGeminiKey } from './_shared.mjs'

export const config = { path: '/api/embed' }

/* Embeddings proxy. Batch-embeds short texts via Gemini and returns the raw
   vectors. The key never leaves the server; abuse is bounded by the shared
   origin check and rate limit.

   OPTIONAL. Without GEMINI_API_KEY this returns 503, the client trips its
   circuit breaker, and the agent runs on keyword retrieval instead — which
   is perfectly adequate for a knowledge base this size. Add the key later
   for semantic retrieval; nothing else changes.

   All calls are same-origin (/api/embed), so the site's CSP can stay at
   connect-src 'self' with no vendor hosts added. */

const MODEL = 'gemini-embedding-001'
const MAX_TEXTS = 32 // the KB is ~20 docs; one batch covers it with headroom
const MAX_CHARS = 4000 // per-text cap

export default async function handler(req) {
  const blocked = guard(req)
  if (blocked) return blocked

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const raw = Array.isArray(body?.texts) ? body.texts : []
  const texts = raw
    .filter((t) => typeof t === 'string')
    .map((t) => t.slice(0, MAX_CHARS).trim())
    .filter(Boolean)
    .slice(0, MAX_TEXTS)

  if (!texts.length) return json({ error: 'No texts to embed' }, 400)

  const key = getGeminiKey()
  if (!key) return json({ error: 'Server not configured' }, 503)

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}` +
    `:batchEmbedContents?key=${encodeURIComponent(key)}`

  let upstream
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${MODEL}`,
          content: { parts: [{ text }] },
        })),
      }),
    })
  } catch (e) {
    return json({ error: 'Upstream unreachable', detail: String(e).slice(0, 200) }, 502)
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '')
    console.error('[embed] upstream', upstream.status, errText.slice(0, 400))
    return json(
      { error: 'Upstream failure', status: upstream.status, detail: errText.slice(0, 400) },
      502
    )
  }

  const data = await upstream.json().catch(() => null)
  const embeddings = (data?.embeddings ?? [])
    .map((e) => e.values)
    .filter((v) => Array.isArray(v))

  if (embeddings.length !== texts.length) {
    console.error('[embed] count mismatch', embeddings.length, 'vs', texts.length)
    return json({ error: 'Embedding count mismatch' }, 502)
  }

  return json({ embeddings }, 200, { 'Cache-Control': 'no-store' })
}
