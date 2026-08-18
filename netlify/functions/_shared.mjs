/* Shared helpers for the Sarvam / Gemini proxy functions.
   Centralizes rate limiting, origin enforcement, and key loading so each
   route stays small and the limits stay consistent.

   Nothing here ever reaches the browser — the API keys live only in this
   process. The client only ever talks to our own origin. */

/* Allowed browser origins. Single source of truth: the ALLOWED_ORIGINS env
   var (comma-separated). No hostnames hardcoded here.

   Dev convenience: ALLOWED_DEV_ORIGINS is layered in when NODE_ENV isn't
   production. Defaults cover Vite (5173) and `netlify dev` (8888) so a fresh
   clone works with no env config. */
const FALLBACK_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8888',
  'http://localhost:3000',
]

function parseList(s) {
  return (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

let warnedNoOrigins = false

function getAllowedOrigins() {
  const prodList = parseList(process.env.ALLOWED_ORIGINS)
  const devList = parseList(process.env.ALLOWED_DEV_ORIGINS)

  if (process.env.NODE_ENV === 'production' && prodList.length === 0 && !warnedNoOrigins) {
    warnedNoOrigins = true
    console.warn(
      '[proxy] ALLOWED_ORIGINS not set in production — every request with an ' +
        'Origin header will be rejected. Set it to a comma-separated list of ' +
        'your canonical hostnames.'
    )
  }

  const list = [...prodList]
  if (process.env.NODE_ENV !== 'production') {
    list.push(...(devList.length ? devList : FALLBACK_DEV_ORIGINS))
  }
  return new Set(list)
}

/* Deploy-preview origin matcher. Netlify mints ephemeral URLs per branch and
   PR; allow them so previews keep working without per-deploy env updates.
   Source: PREVIEW_ORIGIN_PATTERN — a regex SOURCE string, not a literal
   (no surrounding slashes or flags). Unset means the matcher is off. */
function getPreviewMatcher() {
  const pat = process.env.PREVIEW_ORIGIN_PATTERN
  if (!pat) return null
  try {
    return new RegExp(pat, 'i')
  } catch {
    console.warn('[proxy] PREVIEW_ORIGIN_PATTERN is not a valid regex; ignoring')
    return null
  }
}

/* Two-tier in-memory rate limit: token bucket for bursts, plus a daily cap.
   Per-instance only — each function instance keeps its own Map. Combined with
   Netlify's scaling this still bounds an abuser to roughly these limits. Swap
   for Upstash Redis if this ever needs to be airtight. Keyed by client IP. */
const buckets = new Map()
const daily = new Map()

/* Burst guard: 8 requests, then refills at ~12/min sustained. */
const CAPACITY = 8
const REFILL_PER_SEC = 0.2
/* Daily cap: stops one IP from spending the whole Sarvam credit overnight. */
const DAILY_CAP = 80
const DAY_MS = 24 * 60 * 60 * 1000

function rateLimit(ip) {
  const now = Date.now()

  /* Token bucket — handles bursts. */
  const b = buckets.get(ip) || { tokens: CAPACITY, refilled: now }
  const elapsed = (now - b.refilled) / 1000
  b.tokens = Math.min(CAPACITY, b.tokens + elapsed * REFILL_PER_SEC)
  b.refilled = now
  if (b.tokens < 1) {
    buckets.set(ip, b)
    return false
  }

  /* Daily cap — bounds total spend. */
  const d = daily.get(ip)
  if (!d || now - d.windowStart > DAY_MS) {
    daily.set(ip, { count: 1, windowStart: now })
  } else {
    if (d.count >= DAILY_CAP) return false
    d.count += 1
    daily.set(ip, d)
  }

  b.tokens -= 1
  buckets.set(ip, b)
  return true
}

function clientIp(req) {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/* Single guard called at the top of every handler. Returns null when the
   request is allowed, or a Response to return immediately when it isn't. */
export function guard(req, method = 'POST') {
  if (req.method !== method) {
    return json({ error: 'Method not allowed' }, 405)
  }

  const origin = req.headers.get('origin')
  /* Reject requests with no Origin header in production — browsers always
     send Origin on a cross-document POST, so this blocks cURL-style abuse. */
  if (process.env.NODE_ENV === 'production' && !origin) {
    return json({ error: 'Missing origin' }, 403)
  }
  if (origin) {
    const allowed = getAllowedOrigins()
    const preview = getPreviewMatcher()
    if (!allowed.has(origin) && !(preview && preview.test(origin))) {
      /* Say which kind of failure this is. An empty allow-list means
         ALLOWED_ORIGINS never reached this function — not set, not scoped to
         Functions, or set on a different deploy context — which is a very
         different fix from a value that is present but doesn't match. Only
         the size is reported, never the entries. */
      console.warn(
        `[proxy] rejected origin ${origin}; allow-list has ${allowed.size} entr` +
          `${allowed.size === 1 ? 'y' : 'ies'}`
      )
      return json(
        {
          error: 'Forbidden origin',
          reason: allowed.size === 0 ? 'allow-list-empty' : 'origin-not-listed',
        },
        403
      )
    }
  }

  if (!rateLimit(clientIp(req))) {
    return json({ error: 'Rate limit exceeded' }, 429)
  }
  return null
}

export function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}

let warnedNoKey = false
export function getSarvamKey() {
  const key = process.env.SARVAM_API_KEY || null
  if (!key && !warnedNoKey) {
    warnedNoKey = true
    console.warn(
      '[sarvam proxy] SARVAM_API_KEY not set. Add it to .env for `netlify dev`, ' +
        'or to Site settings → Environment variables on Netlify.'
    )
  }
  return key
}

let warnedNoGemini = false
/* GEMINI_API_KEY (server-only) powers /api/embed. Same leak caveat as the
   Sarvam key — never give these a VITE_ prefix, Vite inlines those into the
   client bundle. */
export function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null
  if (!key && !warnedNoGemini) {
    warnedNoGemini = true
    console.warn('[embed proxy] GEMINI_API_KEY not set — agent falls back to keyword retrieval.')
  }
  return key
}
