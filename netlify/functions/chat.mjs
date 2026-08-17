import { guard, json, getSarvamKey } from './_shared.mjs'

export const config = { path: '/api/sarvam/chat' }

/* RAG generation proxy. Takes the visitor's question plus the knowledge-base
   context assembled on the client, and asks Sarvam to write a grounded,
   conversational answer. The key never leaves this process.

   Guardrails live in the system prompt AND upstream of it: the client
   short-circuits contact-intent questions before they ever get here, so the
   model is told never to volunteer contact details either way. */

const MAX_QUESTION = 800
const MAX_CONTEXT = 8000
const MAX_HISTORY = 6
const MAX_TURN_CHARS = 1000

function systemPrompt(context) {
  return [
    'You are the portfolio agent for Sonal Singh, a Software Engineer at PetroIT Software Solutions working on agentic AI and LLM systems.',
    'Answer visitor questions about Sonal using ONLY the context below.',
    '',
    'Rules:',
    '- Be concise and conversational: 1-3 short sentences. No markdown headings or long bullet lists.',
    '- Refer to Sonal in the third person ("Sonal...") and use she/her pronouns.',
    '- Her job title is Software Engineer. Keep the title plain and let the specialisation live in the description: "a Software Engineer working on agentic AI and LLM systems". Do NOT invent titles like "AI Engineer" or "Full-Stack Developer" as her designation.',
    "- Use ONLY facts present in the context. If the answer isn't there, say you don't have that detail and offer what you can cover (her work at PetroIT, her projects like TaskFlow AI or Receipt Slayer, her stack, or her hackathon win).",
    '- Never invent employers, dates, metrics, or links.',
    '- Never share personal contact details (email, phone, social handles). If asked how to reach her, point to the Contact section at the bottom of this site.',
    '- Receipt Slayer was a PetroIT company hackathon project built by a team, not a personal side project. TaskFlow AI is her personal project.',
    '- She has not stated a remote, hybrid, or onsite preference. Never claim one.',
    '- You are speaking to recruiters and engineers visiting her portfolio. Be warm but professional.',
    '',
    'Context:',
    context || '(no context retrieved)',
  ].join('\n')
}

export default async function handler(req) {
  const blocked = guard(req)
  if (blocked) return blocked

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const question = String(body?.question ?? '').slice(0, MAX_QUESTION).trim()
  if (!question) return json({ error: 'Empty question' }, 400)

  const context = String(body?.context ?? '').slice(0, MAX_CONTEXT)

  const history = Array.isArray(body?.history) ? body.history.slice(-MAX_HISTORY) : []
  const historyMsgs = history
    .filter((t) => t && typeof t.text === 'string' && t.text.trim())
    .map((t) => ({
      role: t.role === 'user' ? 'user' : 'assistant',
      content: String(t.text).slice(0, MAX_TURN_CHARS),
    }))

  const key = getSarvamKey()
  if (!key) return json({ error: 'Server not configured' }, 503)

  const messages = [
    { role: 'system', content: systemPrompt(context) },
    ...historyMsgs,
    { role: 'user', content: question },
  ]

  let upstream
  try {
    upstream = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        /* Send both auth styles — the /v1 route is OpenAI-compatible (Bearer)
           while Sarvam's native APIs use api-subscription-key. */
        Authorization: `Bearer ${key}`,
        'api-subscription-key': key,
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages,
        temperature: 0.3,
        /* Sarvam's reasoning models spend tokens on hidden reasoning_content
           before emitting the answer. A small cap gets fully consumed and
           returns empty content with finish_reason "length" — give it room. */
        max_tokens: 2048,
      }),
    })
  } catch (e) {
    return json({ error: 'Upstream unreachable', detail: String(e).slice(0, 200) }, 502)
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '')
    console.error('[sarvam chat] upstream', upstream.status, errText.slice(0, 400))
    return json(
      { error: 'Upstream failure', status: upstream.status, detail: errText.slice(0, 400) },
      502
    )
  }

  const data = await upstream.json().catch(() => null)
  const answer = (data?.choices?.[0]?.message?.content || '').trim()
  if (!answer) return json({ error: 'Empty answer' }, 502)

  return json({ answer }, 200, { 'Cache-Control': 'no-store' })
}
