/* Lightweight RAG over the curated agent knowledge document.
   No vector store — keyword scoring over AGENT_KNOWLEDGE. Contact-intent
   queries are handled separately so personal details never leak. */

import { AGENT_KNOWLEDGE, isContactIntent } from '../data/agentKnowledge'

/* Build the agent's KB from the curated document. */
export function buildKnowledgeBase() {
  return AGENT_KNOWLEDGE.map((d) => ({
    id: d.id,
    title: d.topic,
    body: d.body,
    source: d.topic,
  }))
}

function tokenize(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'what', 'who', 'how', 'when', 'where', 'why',
  'did', 'does', 'your', 'you', 'are', 'was', 'were', 'has', 'have',
  'this', 'that', 'from', 'about', 'tell', 'more', 'give', 'show', 'any',
  'can', 'could', 'would', 'should', 'her', 'hers', 'she',
])

/* Score chunks by token overlap with the query: exact match 2, prefix 1. */
export function retrieve(query, kb, k = 3) {
  const qTokens = tokenize(query).filter((t) => !STOPWORDS.has(t))
  if (!qTokens.length) return kb.slice(0, k)

  const scored = kb.map((chunk) => {
    const bodyTokens = tokenize(chunk.title + ' ' + chunk.body)
    let score = 0
    for (const qt of qTokens) {
      for (const bt of bodyTokens) {
        if (bt === qt) score += 2
        else if (bt.startsWith(qt) || qt.startsWith(bt)) score += 1
      }
    }
    return { chunk, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk)
}

/* Compose a short answer from the retrieved chunks. Used when the LLM is
   unavailable — the visitor always gets something rather than an error.
   Includes a hard redirect for contact-intent queries. */
export function composeAnswer(query, chunks) {
  if (isContactIntent(query)) {
    const contactChunk = chunks.find((c) => c.id === 'contact-policy')
    if (contactChunk) return contactChunk.body
    return (
      'Head to the Contact section at the bottom of this site — that\'s the ' +
      'right way to reach Sonal. I won\'t share personal contact details in this chat.'
    )
  }

  if (!chunks.length) {
    return (
      "I don't have that on hand. Try asking about Sonal's work at PetroIT, her " +
      'projects (TaskFlow AI, Receipt Slayer, GID Supervision), her stack, or her ' +
      'hackathon wins.'
    )
  }

  /* First 2-3 sentences of the top chunk. */
  const lead = chunks[0]
  return lead.body.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ')
}
