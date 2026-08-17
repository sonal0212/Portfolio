import { guard, json, getSarvamKey } from './_shared.mjs'

export const config = { path: '/api/sarvam/stt' }

const MAX_AUDIO_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_AUDIO_MIME = /^audio\/(webm|mp4|mpeg|wav|x-wav|ogg)/i

export default async function handler(req) {
  const blocked = guard(req)
  if (blocked) return blocked

  const lenHeader = req.headers.get('content-length')
  if (lenHeader && Number(lenHeader) > MAX_AUDIO_BYTES) {
    return json({ error: 'Audio too large' }, 413)
  }

  let form
  try {
    form = await req.formData()
  } catch {
    return json({ error: 'Expected multipart/form-data' }, 400)
  }

  const file = form.get('file')
  if (!file || typeof file === 'string') return json({ error: 'Missing audio file' }, 400)
  if (file.size > MAX_AUDIO_BYTES) return json({ error: 'Audio too large' }, 413)
  if (file.type && !ALLOWED_AUDIO_MIME.test(file.type)) {
    return json({ error: 'Unsupported audio type' }, 415)
  }

  const key = getSarvamKey()
  if (!key) return json({ error: 'Server not configured' }, 503)

  /* saarika:v2.5 is Sarvam's current flagship STT for Indian languages.
     Fall back to v2 if the model name is rejected. */
  const tryModel = (model) => {
    const f = new FormData()
    f.append('file', file)
    f.append('model', model)
    f.append('language_code', 'en-IN')
    return fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': key },
      body: f,
    })
  }

  let upstream
  try {
    upstream = await tryModel('saarika:v2.5')
    if (!upstream.ok && upstream.status === 400) {
      upstream = await tryModel('saarika:v2')
    }
  } catch (e) {
    return json({ error: 'Upstream unreachable', detail: String(e).slice(0, 200) }, 502)
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '')
    console.error('[sarvam stt] upstream', upstream.status, errText.slice(0, 500))
    /* Surface the upstream detail so debugging a 502 is actually possible. */
    return json(
      { error: 'Upstream failure', status: upstream.status, detail: errText.slice(0, 400) },
      502
    )
  }

  const data = await upstream.json().catch(() => null)
  if (!data || typeof data.transcript !== 'string') {
    return json({ transcript: '' })
  }
  return json({ transcript: data.transcript })
}
