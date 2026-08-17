/* The agent's knowledge base, authored as a plain Markdown document
   (agent-knowledge.md). Each "## " section there becomes one retrievable
   chunk here. Work-only content — no contact details live in the doc;
   contact requests are caught by isContactIntent() and redirected.

   To change what the agent knows, edit agent-knowledge.md — not this file. */

import doc from './agent-knowledge.md?raw'

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/* Split the doc into one chunk per "## " heading. Anything before the first
   "## " (the title and authoring note) is ignored. HTML comments are stripped
   so the TODO notes never reach the model. */
function parseDoc(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/^##\s+/m)
    .slice(1)
    .map((section) => {
      const nl = section.indexOf('\n')
      const topic = (nl === -1 ? section : section.slice(0, nl)).trim()
      const body = (nl === -1 ? '' : section.slice(nl + 1)).trim()
      return { id: slugify(topic), topic, body }
    })
    .filter((d) => d.id && d.body)
}

export const AGENT_KNOWLEDGE = parseDoc(doc)

/* Patterns that always redirect to the Contact section rather than leak.
   This runs BEFORE the LLM, so the model never even sees these questions —
   it can't hallucinate an address it was never given. */
const CONTACT_INTENT_PATTERNS = [
  /\b(email|e-?mail|gmail|inbox)\b/i,
  /\b(phone|number|mobile|whatsapp|whats app|call her|text her)\b/i,
  /\b(address|where (do|does) (she|you|sonal) live)\b/i,
  /\b(reach|contact|dm|message|hire|book|schedule|get in touch)\b/i,
  /\b(linkedin|github|twitter|topmate|calendly|instagram)\b/i,
]

/* True when the query is asking how to reach Sonal. */
export function isContactIntent(query) {
  return CONTACT_INTENT_PATTERNS.some((rx) => rx.test(query))
}
