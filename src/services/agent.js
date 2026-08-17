/* The agent's RAG orchestrator: semantic retrieval (Gemini embeddings) plus
   grounded generation (Sarvam), with graceful fallbacks at every step so the
   chat and voice UI always get an answer.

   Pipeline for a query:
     1. Contact-intent → hard redirect to the Contact section (never hits the LLM).
     2. Retrieve top-k KB chunks by embedding cosine similarity.
        (Falls back to keyword scoring if embeddings are unavailable.)
     3. Generate a grounded answer from those chunks via the LLM.
        (Falls back to an extractive snippet if the LLM is unavailable.)

   Document vectors are embedded once and cached (in memory + localStorage,
   keyed by a signature of the KB) so only the query is embedded per turn. */

import { retrieve as keywordRetrieve, composeAnswer } from './rag'
import { isContactIntent } from '../data/agentKnowledge'
import { embedTexts, cosineSim } from './embeddings'
import { sarvamChat } from './sarvam'

const CACHE_PREFIX = 'kbvec:v1:'

let memVecs = null
let memSig = ''

/* Cheap, stable signature of the KB contents — invalidates the cached vectors
   automatically whenever a doc's id or body length changes. Edit the Markdown
   and the cache takes care of itself. */
function kbSignature(kb) {
  const s = kb.map((c) => `${c.id}:${c.body.length}`).join('|')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/* Embed (and cache) the document vectors. Returns null if embeddings are
   unavailable — the caller then drops to keyword retrieval. */
async function ensureDocVectors(kb) {
  const sig = kbSignature(kb)
  if (memVecs && memSig === sig) return memVecs

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + sig)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length === kb.length) {
        memVecs = parsed
        memSig = sig
        return parsed
      }
    }
  } catch {
    /* localStorage blocked or corrupt — fall through to a fresh embed. */
  }

  const vecs = await embedTexts(kb.map((c) => `${c.title}. ${c.body}`))
  if (!vecs || vecs.length !== kb.length) return null

  memVecs = vecs
  memSig = sig
  try {
    localStorage.setItem(CACHE_PREFIX + sig, JSON.stringify(vecs))
  } catch {
    /* Over quota / private mode — the in-memory cache still serves this session. */
  }
  return vecs
}

/* Semantic retrieval with a keyword fallback. */
export async function retrieveRelevant(query, kb, k = 3) {
  const docVecs = await ensureDocVectors(kb)
  if (docVecs) {
    const qv = await embedTexts([query])
    if (qv && qv[0]) {
      return kb
        .map((chunk, i) => ({ chunk, score: cosineSim(qv[0], docVecs[i]) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((s) => s.chunk)
    }
  }
  return keywordRetrieve(query, kb, k)
}

/* End to end: question -> grounded answer string. */
export async function answerQuery(query, kb, history = []) {
  /* Hard guardrail: contact requests never reach the model. */
  if (isContactIntent(query)) {
    const contact = kb.find((c) => c.id === 'contact-policy')
    if (contact) return contact.body
  }

  const chunks = await retrieveRelevant(query, kb)
  const context = chunks.map((c) => `### ${c.title}\n${c.body}`).join('\n\n')

  const generated = await sarvamChat({ question: query, context, history: history.slice(-6) })
  if (generated) return generated

  /* LLM unavailable — return an extractive answer from the same chunks. */
  return composeAnswer(query, chunks)
}
