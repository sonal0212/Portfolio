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

/* Levenshtein distance, capped — we only care whether two tokens are within
   a slip or two of each other, so bail out as soon as the row minimum exceeds
   the cap. Speech-to-text routinely drops or doubles a letter in proper nouns
   ("Anuvaad" comes back as "Anuvad"), and an exact-match-only scorer throws
   those chunks away entirely. */
function editDistance(a, b, cap) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      if (cur[j] < rowMin) rowMin = cur[j]
    }
    if (rowMin > cap) return cap + 1
    prev = cur
  }
  return prev[b.length]
}

/* How close two tokens are, as a score multiplier. Exact beats a near-miss
   beats a prefix; anything further apart does not match at all. */
function tokenAffinity(q, t) {
  if (q === t) return 1
  const cap = q.length >= 8 ? 2 : q.length >= 5 ? 1 : 0
  if (cap > 0) {
    const d = editDistance(q, t, cap)
    if (d <= cap) return d === 1 ? 0.8 : 0.6
  }
  if (t.startsWith(q) || q.startsWith(t)) return 0.5
  return 0
}

/* Inverse document frequency over the knowledge base. A term that appears in
   one chunk ("anuvaad") identifies it; a term in half the chunks ("work",
   "project") identifies nothing. Weighting by IDF is what stops a generic
   word from outvoting a specific one. */
function buildIdf(kb) {
  const df = new Map()
  for (const chunk of kb) {
    for (const t of new Set(tokenize(chunk.title + ' ' + chunk.body))) {
      df.set(t, (df.get(t) || 0) + 1)
    }
  }
  return (token) => Math.log(1 + kb.length / (1 + (df.get(token) || 0)))
}

/* Score chunks by IDF-weighted, slip-tolerant token overlap. Title matches
   count double — a chunk titled "Anuvaad" is about Anuvaad, whereas a passing
   mention in a body is not. */
export function retrieve(query, kb, k = 3) {
  const qTokens = tokenize(query).filter((t) => !STOPWORDS.has(t))
  if (!qTokens.length) return kb.slice(0, k)

  const idf = buildIdf(kb)

  const scored = kb.map((chunk) => {
    const titleTokens = new Set(tokenize(chunk.title))
    const bodyTokens = tokenize(chunk.body)
    let score = 0
    for (const qt of qTokens) {
      /* Best single match for this query token, not the sum over every
         occurrence — otherwise a long chunk wins on repetition alone. */
      let best = 0
      for (const bt of new Set([...titleTokens, ...bodyTokens])) {
        const affinity = tokenAffinity(qt, bt)
        if (!affinity) continue
        /* IDF is squared. Linear IDF leaves rare and common terms too close
           together: a generic word sitting in a title ("TaskFlow AI — personal
           project") would outscore a distinctive proper noun matched in its
           own title, and "project" would beat "Anuvaad". Squaring widens the
           gap so a specific term decides the match. */
        const w = idf(bt)
        const weight = affinity * w * w * (titleTokens.has(bt) ? 2 : 1)
        if (weight > best) best = weight
      }
      score += best
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
