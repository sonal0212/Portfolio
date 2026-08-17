import { guard, json, getSarvamKey } from './_shared.mjs'

export const config = { path: '/api/sarvam/tts' }

/* Allow-list of Bulbul v3 speaker IDs we expose. Sourced from Sarvam's docs.
   The default is set by TTS_SPEAKER below — change that one line to change
   the agent's voice. */
const SPEAKERS = new Set([
  'shubh', 'aditya', 'ritu', 'priya', 'neha', 'rahul', 'pooja', 'rohan',
  'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun',
  'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'ashutosh', 'advait', 'anand',
  'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani',
  'mohit', 'kavitha', 'rehan', 'soham', 'rupali',
])

/* The agent speaks as Sonal's assistant, so a female en-IN voice fits.
   Swap for any ID in the set above — 'priya', 'shreya', 'kavya', 'ishita'
   and 'suhani' are all worth auditioning. */
const TTS_SPEAKER = 'ritu'

const MAX_TEXT_LEN = 500

export default async function handler(req) {
  const blocked = guard(req)
  if (blocked) return blocked

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const text = String(body?.text ?? '').slice(0, MAX_TEXT_LEN).trim()
  if (!text) return json({ error: 'Empty text' }, 400)

  const speaker = body?.speaker && SPEAKERS.has(body.speaker) ? body.speaker : TTS_SPEAKER

  const key = getSarvamKey()
  if (!key) return json({ error: 'Server not configured' }, 503)

  /* The streaming endpoint caps sample_rate at 24000 — 32k/44k/48k are
     REST-only on bulbul:v3 and return 502 here. */
  let upstream
  try {
    upstream = await fetch('https://api.sarvam.ai/text-to-speech/stream', {
      method: 'POST',
      headers: {
        'api-subscription-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_language_code: 'en-IN',
        speaker,
        model: 'bulbul:v3',
        pace: 0.97,
        speech_sample_rate: 24000,
        output_audio_codec: 'mp3',
        enable_preprocessing: true,
      }),
    })
  } catch (e) {
    return json({ error: 'Upstream unreachable', detail: String(e).slice(0, 200) }, 502)
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '')
    console.error('[sarvam tts] upstream', upstream.status, errText.slice(0, 400))
    return json(
      { error: 'Upstream failure', status: upstream.status, detail: errText.slice(0, 200) },
      502
    )
  }

  /* Pass the stream straight through so the client can start playing after
     the first few KB instead of waiting for the whole file. */
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
