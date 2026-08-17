/* Client for the Sarvam proxy at /api/sarvam/*.
   The API key NEVER leaves the server — see netlify/functions/tts.mjs and
   stt.mjs. This module only talks to our own origin, so abuse is gated by the
   functions' rate limit, origin check, and payload caps. */

const TTS_URL = '/api/sarvam/tts'
const STT_URL = '/api/sarvam/stt'

/* Typed failure surface so callers can show a specific disclaimer
   ("voice unavailable" vs "rate limit" vs "transcription failed"). */
export class SarvamError extends Error {
  constructor(kind, message, status) {
    super(message)
    this.name = 'SarvamError'
    this.kind = kind // 'unavailable' | 'rate-limited' | 'network' | 'client'
    this.status = status
  }
}

function classify(status) {
  if (status === 503) return 'unavailable' // no key configured / upstream down
  if (status === 429) return 'rate-limited'
  if (status >= 400 && status < 500) return 'client'
  return 'network'
}

/* Streams the TTS response and starts playback as bytes arrive — much lower
   perceived latency than waiting for the full mp3.

   Strategy:
   - If MediaSource supports `audio/mpeg`, attach a SourceBuffer and append
     each fetched chunk; playback begins after the first few KB.
   - Fallback: collect all chunks, build a Blob, then play.

   Returns the Audio element so the caller can pause/cancel it. */
export async function sarvamSpeak(text, opts = {}) {
  const trimmed = (text || '').trim()
  if (!trimmed) return null

  let res
  try {
    res = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed.slice(0, 500), speaker: opts.speaker }),
    })
  } catch (e) {
    throw new SarvamError('network', 'TTS proxy unreachable: ' + e.message)
  }

  if (!res.ok || !res.body) {
    if (res.status !== 503) console.warn('Sarvam TTS proxy failed', res.status)
    throw new SarvamError(classify(res.status), `TTS proxy returned ${res.status}`, res.status)
  }

  const reader = res.body.getReader()

  if (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg')) {
    const mediaSource = new MediaSource()
    const url = URL.createObjectURL(mediaSource)
    const audio = new Audio(url)
    audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true })

    mediaSource.addEventListener('sourceopen', async () => {
      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
      /* appendBuffer throws if the SourceBuffer is still updating, so every
         append waits for the previous one to land. */
      const awaitUpdate = () =>
        new Promise((resolve) => {
          if (!sourceBuffer.updating) return resolve()
          sourceBuffer.addEventListener('updateend', () => resolve(), { once: true })
        })

      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) {
            await awaitUpdate()
            if (mediaSource.readyState === 'open') mediaSource.endOfStream()
            break
          }
          await awaitUpdate()
          sourceBuffer.appendBuffer(value)
        }
      } catch (e) {
        console.warn('Sarvam stream error', e)
        try {
          mediaSource.endOfStream('decode')
        } catch {
          /* noop */
        }
      }
    })

    return audio
  }

  /* Fallback: buffer the whole stream, then play. */
  const chunks = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const blob = new Blob(chunks, { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true })
  return audio
}

/* RAG generation via the /api/sarvam/chat proxy. Sends the question, the
   retrieved knowledge-base context, and recent history; gets back a grounded
   answer. Returns null on any failure so the caller can fall back to an
   extractive answer. Same-origin only — no key on the client. */
export async function sarvamChat({ question, context, history }) {
  try {
    const res = await fetch('/api/sarvam/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, history }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.answer || '').trim() || null
  } catch {
    return null
  }
}

/* Speech-to-text via the proxy. Server enforces a 5MB cap and an audio MIME
   allow-list; we check the size here too so we fail fast without an upload. */
export async function sarvamTranscribe(audioBlob) {
  if (audioBlob.size > 5 * 1024 * 1024) {
    console.warn('Sarvam STT: audio over 5MB, skipping')
    return ''
  }

  /* Name the file by its real MIME so Sarvam picks the right decoder.
     MediaRecorder gives audio/webm by default; some browsers give mp4. */
  const ext = audioBlob.type.includes('mp4')
    ? 'm4a'
    : audioBlob.type.includes('ogg')
      ? 'ogg'
      : audioBlob.type.includes('wav')
        ? 'wav'
        : 'webm'

  const form = new FormData()
  form.append('file', audioBlob, `audio.${ext}`)

  let res
  try {
    res = await fetch(STT_URL, { method: 'POST', body: form })
  } catch (e) {
    throw new SarvamError('network', 'STT proxy unreachable: ' + e.message)
  }

  if (!res.ok) {
    /* Surface the upstream detail so debugging a 502 is actually possible. */
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.detail || body?.error || JSON.stringify(body)
    } catch {
      /* not json */
    }
    if (res.status !== 503) console.warn(`Sarvam STT proxy failed (${res.status})`, detail)
    throw new SarvamError(
      classify(res.status),
      `STT proxy returned ${res.status}: ${detail}`,
      res.status
    )
  }

  const data = await res.json()
  return data.transcript || ''
}
