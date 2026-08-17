/* Thin client for the /api/embed proxy (Gemini embeddings) plus the vector
   math the RAG needs. Talks only to our own origin, so the strict CSP
   (connect-src 'self') is untouched. Returns null on any failure so callers
   fall back to keyword retrieval.

   This whole module is optional. With no GEMINI_API_KEY set, the first call
   404/503s, the breaker trips, and the agent runs on keyword retrieval for
   the rest of the session. */

/* Circuit breaker: once /api/embed fails (no key, depleted credits, network),
   stop calling it for the rest of the session rather than hammering a dead
   endpoint with a 502 on every single message. Resets on page reload. */
let embeddingsDisabled = false

export async function embedTexts(texts) {
  if (!texts.length) return []
  if (embeddingsDisabled) return null

  try {
    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    })
    if (!res.ok) {
      embeddingsDisabled = true
      return null
    }
    const data = await res.json()
    if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length) {
      embeddingsDisabled = true
      return null
    }
    return data.embeddings
  } catch {
    embeddingsDisabled = true
    return null
  }
}

/* Cosine similarity. The vectors aren't guaranteed unit-length, so normalize
   on the fly rather than assuming a plain dot product suffices. */
export function cosineSim(a, b) {
  const n = Math.min(a.length, b.length)
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}
