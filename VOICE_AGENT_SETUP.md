# Voice Agent — How It Works & How To Build It Here

Reverse-engineered from **`RaazKetan/ketan-v5`** at commit `52807f3^` (the last commit before
*"Remove the voice and chat agent, and the admin panel"*). The successor repo `ketan-v6` is
private, so v5's pre-deletion tree is the reference implementation.

Part 1 explains the design. Part 2 is a build plan adapted to **this** portfolio
(Vite 5 + React 18 JSX, deployed on Netlify).

---

## Part 1 — How the reference implementation works

### The big picture

It is **not** a realtime / WebRTC / duplex voice agent. There is no persistent socket and no
streaming ASR. It's a **turn-based pipeline** that the browser drives, with serverless
functions acting purely as key-hiding proxies.

```
                    ┌──────────────── browser ────────────────┐
  user speaks  ──▶  │ getUserMedia → MediaRecorder → Blob      │
                    │        │                                 │
                    │        ▼  POST multipart                 │
                    └────────┼─────────────────────────────────┘
                             ▼
                    /api/sarvam/stt  ──▶ Sarvam saarika:v2.5     ──▶ transcript
                             │
                    ┌────────▼─────── browser ────────────────┐
                    │ RAG: embed query, cosine vs KB vectors   │
                    │        │                                 │
                    └────────┼─────────────────────────────────┘
                             ▼
                    /api/embed       ──▶ Gemini embeddings      ──▶ top-3 chunks
                             │
                    /api/sarvam/chat ──▶ Sarvam sarvam-30b      ──▶ grounded answer
                             │
                    /api/sarvam/tts  ──▶ Sarvam bulbul:v3       ──▶ mp3 stream
                             │
                    ┌────────▼─────── browser ────────────────┐
                    │ MediaSource append → <audio> plays       │
                    │ AnalyserNode → animated bars             │
                    └──────────────────────────────────────────┘
```

**The single most important architectural decision:** the browser never holds an API key.
Every third-party call goes through a same-origin `/api/*` function that injects the key
server-side. That also means the site's CSP can stay at `connect-src 'self'` — no vendor
hosts to allow-list.

### File map (reference repo)

| File | Lines | Role |
|---|---|---|
| `api/sarvam/_shared.ts` | 197 | Origin check, rate limit, key loading, JSON helper |
| `api/sarvam/stt.ts` | 67 | Speech→text proxy |
| `api/sarvam/tts.ts` | 70 | Text→speech streaming proxy |
| `api/sarvam/chat.ts` | 110 | Grounded generation proxy (system prompt lives here) |
| `api/embed.ts` | 80 | Gemini batch-embedding proxy |
| `src/services/sarvam.ts` | 198 | Client for the three Sarvam routes |
| `src/services/embeddings.ts` | 51 | Client for `/api/embed` + cosine similarity |
| `src/services/rag.ts` | 92 | Keyword retrieval + extractive fallback answer |
| `src/services/agent.ts` | 111 | Orchestrator: retrieve → generate, with fallbacks |
| `src/data/agent-knowledge.md` | — | **The knowledge base, authored as plain Markdown** |
| `src/data/agent-knowledge.ts` | 52 | Parses the `.md` into chunks; contact-intent guard |
| `src/components/Chat/ChatWidget.tsx` | 590 | Text chat panel + mic button + replay |
| `src/components/Chat/VoiceAnalyzer.tsx` | 668 | Full voice mode: VAD, waveform bars, turn loop |

### The knowledge base is a Markdown file

This is the part worth copying verbatim. There is no vector database, no ingestion job, no
chunking heuristic. The KB is one hand-written document:

```markdown
## Who Ketan is
Ketan Raj is a Software Engineer at Emergent (YC24), previously at Google...

## Software Engineer at Google (ex-Google)
Ketan was a Software Engineer at Google in Bengaluru from April 2025...

## Contact policy
...
```

`agent-knowledge.ts` splits it on `^## ` — **each heading becomes exactly one retrievable
chunk**, and the heading text is its title. ~20 chunks total. To change what the agent knows,
you edit prose. That's the whole authoring workflow.

```js
export const AGENT_KNOWLEDGE = md.split(/^##\s+/m).slice(1).map(section => {
  const nl = section.indexOf("\n");
  return { id: slugify(section.slice(0, nl)), topic: ..., body: ... };
});
```

### Retrieval: embeddings with a keyword fallback

`agent.ts` is the orchestrator, and it's deliberately layered so **every stage degrades
instead of failing**:

1. **Contact-intent short-circuit.** A regex list (`/\b(email|phone|linkedin|hire|dm)\b/i`)
   catches "how do I reach you" style questions and returns the `contact-policy` chunk
   *without ever calling the LLM*. This is a hard privacy guardrail — the model cannot leak
   an email it never received.
2. **Semantic retrieval.** All ~20 doc vectors are embedded **once** via
   `/api/embed` (Gemini `gemini-embedding-001`, batched), then cached in memory **and
   localStorage**, keyed by a hash of the KB contents:
   ```js
   function kbSignature(kb) {
     const s = kb.map(c => `${c.id}:${c.body.length}`).join("|");
     let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
     return (h >>> 0).toString(36);
   }
   ```
   Edit the Markdown, the signature changes, the cache invalidates automatically. Per turn,
   only the *query* is embedded — one small API call. Cosine similarity picks top-3.
3. **Keyword fallback.** If embeddings are unavailable, `rag.ts` scores chunks by token
   overlap (exact match = 2 points, prefix match = 1, stopwords stripped). A **circuit
   breaker** in `embeddings.ts` flips `embeddingsDisabled = true` on the first failure so a
   dead endpoint isn't hammered with 502s every turn.
4. **Generation.** Top-3 chunks are formatted as `### {title}\n{body}` and posted to
   `/api/sarvam/chat` with the last 6 turns of history.
5. **Extractive fallback.** If the LLM fails, `composeAnswer()` returns the first 2–3
   sentences of the top chunk. The user always gets *something*.

### The system prompt (in `api/sarvam/chat.ts`, not the client)

```
You are the portfolio agent for Ketan Raj, a software engineer.
Answer visitor questions about Ketan using ONLY the context below.

Rules:
- Be concise and conversational: 1-3 short sentences. No markdown headings or long bullet lists.
- Refer to Ketan in the third person ("Ketan...").
- Use ONLY facts present in the context. If the answer isn't there, say you don't have that
  detail and offer what you can cover (...).
- Never invent employers, dates, metrics, or links.
- Never share personal contact details (email, phone, social handles). If asked how to reach
  him, point to the Contact page on this site.

Context:
{retrieved chunks}
```

Keeping it server-side means a visitor can't read or override it from devtools. Note the
belt-and-braces approach: the contact rule exists in the prompt **and** as a client-side
regex that never reaches the model.

Model params: `sarvam-30b`, `temperature: 0.3`, `max_tokens: 2048`. That token cap has a
comment worth heeding — sarvam-30b is a reasoning model that burns tokens on hidden
`reasoning_content`, so a small cap gets fully consumed and returns empty content with
`finish_reason: "length"`.

### TTS: streaming so playback starts early

`sarvamSpeak()` doesn't wait for the whole mp3. It reads the response as a stream and appends
chunks into a `MediaSource` buffer, so audio starts after a few KB:

```js
const mediaSource = new MediaSource();
const audio = new Audio(URL.createObjectURL(mediaSource));
mediaSource.addEventListener("sourceopen", async () => {
  const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
  while (true) {
    const { done, value } = await reader.read();
    if (done) { await awaitUpdate(); mediaSource.endOfStream(); break; }
    await awaitUpdate();               // SourceBuffer can't accept while updating
    sourceBuffer.appendBuffer(value);
  }
});
```

Falls back to "buffer everything into a Blob, then play" when `MediaSource` can't do
`audio/mpeg`. Text is capped at 500 chars client-side *and* server-side.

Server side hits `https://api.sarvam.ai/text-to-speech/stream` with `bulbul:v3`,
`speech_sample_rate: 24000` (the streaming endpoint rejects 32k/44k/48k — those are REST-only,
and using 48k returns 502), `output_audio_codec: "mp3"`, `pace: 0.97`, and a 37-name
speaker allow-list defaulting to `shubh`.

### STT: record, stop, upload

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true,
           channelCount: 1, sampleRate: 16000 },   // 16k matches Sarvam's preferred rate
});
const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
```

The blob is named by its real MIME (`audio.webm` / `.m4a` / `.ogg` / `.wav`) so Sarvam picks
the right decoder. 5 MB cap enforced on both sides, plus a MIME allow-list server-side.
Model `saarika:v2.5` with a fallback to `saarika:v2` on HTTP 400.

### Voice Activity Detection — no library

The whole VAD is ~25 lines inside the `requestAnimationFrame` loop that also drives the
waveform bars. Same `AnalyserNode`, two jobs:

```js
const SPEAK_THRESHOLD = 0.2;    // avg normalized level counting as speech
const SILENCE_HANG_MS = 1500;   // silence after speech before auto-stop
const MIN_SPEAK_MS   = 400;     // ignore blips (typing, cough)

analyser.getByteFrequencyData(data);
const avg = /* mean of BAR_COUNT sampled bins / 255 */;
if (avg > SPEAK_THRESHOLD) { if (!hasSpoken) speakStartedAt = now; hasSpoken = true; lastVoiceAt = now; }
if (hasSpoken && now - speakStartedAt > MIN_SPEAK_MS && now - lastVoiceAt > SILENCE_HANG_MS) {
  vadFired = true; vadStop();   // → stopRecording() → STT → RAG → TTS
}
```

Two non-obvious details:

- **Push-to-talk is the default.** `autoLoop` is opt-in. The comment explains why: always-on
  listening lets background noise trigger spurious STT rounds, which costs money and feels broken.
- **A muted gain node is required.** Chromium won't pump a mic stream through an analyser
  unless something is connected to `destination`. So: `analyser → gain(0) → destination`.
  Volume zero, graph alive, no echo.

For agent playback, the audio element is wired through `createMediaElementSource()` into its
own analyser — same bar renderer, different source. A `WeakMap` caches those source nodes
because calling `createMediaElementSource()` twice on one element throws.

### The state machine

`VoiceAnalyzer.tsx` runs six explicit stages, and the single button's icon, handler, and
label are all derived from the current stage:

```
idle ──play──▶ agent-speak ──ends──▶ ready ──mic──▶ recording ──VAD/stop──▶ processing
                                       ▲                                        │
                                       └──── agent-reply ◀──── TTS ◀─── RAG ────┘
```

### Abuse protection (`_shared.ts`)

Because these endpoints spend real money, `guard()` runs at the top of every handler:

- **Method check** — non-POST gets 405.
- **Origin allow-list** from the `ALLOWED_ORIGINS` env var. No hostnames in code. In
  production a **missing** `Origin` header is a 403, which blocks cURL-style abuse (browsers
  always send Origin on POST).
- **Preview-deploy regex** via `PREVIEW_ORIGIN_PATTERN`, so ephemeral deploy URLs work
  without env churn. Disabled when unset.
- **Two-tier rate limit, keyed by IP**: token bucket (8 burst, refill 0.2/s ≈ 12/min) plus a
  **daily cap of 80** — explicitly described as "keeps one IP from spending the credit
  overnight". In-memory per instance; the comment notes you'd swap in Redis/KV for real
  production limits.
- **Payload caps**: 800-char question, 8000-char context, 6 history turns, 500-char TTS text,
  5 MB audio, 32 texts per embed batch.

### Typed error surface

`SarvamError` carries a `kind` — `unavailable` (503, no key), `rate-limited` (429),
`network`, `client` — and the UI maps each to a specific one-liner:

| kind | message shown |
|---|---|
| `unavailable` | "Voice is offline right now. You can still chat in text." |
| `rate-limited` | "Voice limit reached for now. Try again in a minute." |
| `network` | "Couldn't reach voice service. Check your connection." |

Notices auto-dismiss after 6s. Voice is treated as a best-effort enhancement — text chat
always works.

---

## Part 2 — Building this for **this** portfolio

### What's different here

| | Reference (ketan-v5) | This repo |
|---|---|---|
| Host | Vercel Edge Functions | **Netlify** |
| Language | TypeScript | **JSX (no TS)** |
| React | 19 + react-router | **18, single page** |
| Path alias | `@/` configured | **none — use relative imports** |
| Dev API shim | custom `vite-plugin-api.ts` | **`netlify dev` handles it** |

The good news: **Netlify Functions v2 use the same Web `Request`/`Response` signature as
Vercel Edge functions**, so the four proxy files port almost unchanged — mostly deleting type
annotations. And `netlify dev` runs them locally, so you don't need the 96-line Vite
middleware plugin the reference repo wrote.

### Scope decision: skip the optional half

The reference tree also contains Supabase conversation logging, an admin dashboard, and
analytics (`api/admin/*`, `api/conversations/*`, `supabase/migrations/`). **None of that is
needed for a working voice agent.** Ship the core first; it's 4 server files + 4 client
files + 1 Markdown file.

### Prerequisites

1. **Sarvam AI key** — sign up at [sarvam.ai](https://www.sarvam.ai/), grab the subscription
   key. Powers STT + TTS + the chat LLM. Voices are `en-IN`-tuned, which fits an Indian-English
   portfolio well.
2. **Gemini API key** *(optional)* — [aistudio.google.com](https://aistudio.google.com/) for
   embeddings. **Skip it to start**; the keyword retriever handles a ~20-chunk KB fine, and
   adding it later is a drop-in upgrade.
3. **Netlify CLI** — `npm i -D netlify-cli`, then use `netlify dev` instead of `vite` while
   working on the functions.

> **Mic requires a secure context.** `getUserMedia` only works on `https://` or `localhost`.
> Netlify gives you HTTPS by default, so production is fine.

### Step 1 — Write your knowledge base first

Create `src/data/agent-knowledge.md`. **Do this before any code** — it's the thing that
determines whether the agent is good, and it's the only file you'll keep editing afterwards.

```markdown
# Sonal Singh — Agent Knowledge

<!-- Each "## " heading becomes ONE retrievable chunk. Work-only content:
     no email/phone here — the contact guard redirects those. -->

## Who Sonal is
Sonal Singh is a full-stack developer... (2-4 sentences)

## Current focus
...

## <Each role — one section per job>
...

## <Each project — one section per project>
...

## Stack and tools
...

## Contact policy
Head to the contact section on this site — that's the right way to reach Sonal.
I won't share personal contact details in this chat.
```

Rules that make retrieval work: **one topic per heading**, 3–6 sentences per section, repeat
proper nouns inside the body (the heading alone isn't enough signal for keyword scoring),
and keep the `## Contact policy` heading exactly as written — the code looks it up by the
slug `contact-policy`.

Your existing `src/components/Work.jsx`, `Projects.jsx`, and `Skills.jsx` are the source
material. Note the reference deliberately keeps the KB **separate** from the site's display
data, so the agent can't accidentally surface something you only meant to render.

### Step 2 — Server proxies

Create `netlify/functions/`. Netlify v2 syntax adds a `config.path` export that maps the
function straight onto the `/api/*` URL — no redirect rules needed.

**`netlify/functions/_shared.mjs`** — port of `api/sarvam/_shared.ts` (drop the types, keep
every limit). Exports `guard(req)`, `json(body, status, extra)`, `getSarvamKey()`,
`getGeminiKey()`. Adjust `FALLBACK_DEV_ORIGINS` to include `http://localhost:8888`
(the `netlify dev` port) alongside `5173`.

**`netlify/functions/tts.mjs`**

```js
import { guard, json, getSarvamKey } from "./_shared.mjs";

export const config = { path: "/api/sarvam/tts" };

const SPEAKERS = new Set(["shubh", "aditya", "ritu", "priya", "neha", /* ...37 total */]);

export default async function handler(req) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  const text = String(body.text || "").slice(0, 500).trim();
  if (!text) return json({ error: "Empty text" }, 400);
  const speaker = SPEAKERS.has(body.speaker) ? body.speaker : "shubh";

  const key = getSarvamKey();
  if (!key) return json({ error: "Server not configured" }, 503);

  const upstream = await fetch("https://api.sarvam.ai/text-to-speech/stream", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text, target_language_code: "en-IN", speaker, model: "bulbul:v3",
      pace: 0.97, speech_sample_rate: 24000,      // 24k only — higher rates are REST-only
      output_audio_codec: "mp3", enable_preprocessing: true,
    }),
  });
  if (!upstream.ok || !upstream.body) return json({ error: "Upstream failure" }, 502);

  return new Response(upstream.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store",
               "X-Content-Type-Options": "nosniff" },
  });
}
```

**`netlify/functions/stt.mjs`** (`config.path = "/api/sarvam/stt"`) — `req.formData()`, check
`file.size <= 5MB` and `/^audio\/(webm|mp4|mpeg|wav|x-wav|ogg)/i`, forward to
`https://api.sarvam.ai/speech-to-text` with `model: saarika:v2.5` and `language_code: en-IN`,
retry once with `saarika:v2` on a 400, return `{ transcript }`.

**`netlify/functions/chat.mjs`** (`config.path = "/api/sarvam/chat"`) — build the system
prompt with **your** name and facts, POST to `https://api.sarvam.ai/v1/chat/completions` with
both `Authorization: Bearer` and `api-subscription-key` headers (the `/v1` route is
OpenAI-compatible), `model: "sarvam-30b"`, `temperature: 0.3`, `max_tokens: 2048`.

**`netlify/functions/embed.mjs`** (`config.path = "/api/embed"`) — *optional, add in phase 2.*

> **Streaming check.** Netlify Functions v2 support streamed responses, but verify TTS
> playback actually starts early after your first deploy. If the response arrives buffered,
> nothing breaks — `sarvamSpeak`'s Blob fallback path still plays it, just with more latency.

### Step 3 — Client services

Copy these four into `src/services/`, converting `.ts` → `.js` (delete type annotations and
the `export type` blocks; the logic is plain JS):

| File | Change needed |
|---|---|
| `sarvam.js` | None beyond types. Keep `SarvamError` — the UI depends on `.kind`. |
| `rag.js` | Rewrite `composeAnswer`'s fallback strings for your name. |
| `agent.js` | None beyond types. |
| `embeddings.js` | Phase 2 only. |

`src/data/agent-knowledge.js` needs the `?raw` import, which Vite supports natively:

```js
import doc from "./agent-knowledge.md?raw";
```

Then update `CONTACT_INTENT_PATTERNS` — the reference regex list is a good starting point;
add any handle you don't want spoken aloud.

**Imports:** the reference uses `@/services/...`. Either add the alias to `vite.config.js`:

```js
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
```

…or just use relative paths (`../services/agent`). One alias is less churn.

### Step 4 — UI

Two components, and they're independent — **build the chat widget first**. It's simpler, it
proves the whole RAG pipeline end to end, and voice is a strict addition on top.

- **`ChatWidget.jsx`** — floating button + panel, message list, suggested-prompt chips, mic
  button, per-message replay. The reference ships CSS in a template literal inside the
  component; this repo uses paired `.css` files (`Navbar.jsx` / `Navbar.css`), so split it
  out to match — and swap its CSS variables (`--ink`, `--bg`, `--accent`, `--line`) for
  whatever your `index.css` defines.
- **`VoiceAnalyzer.jsx`** — the full voice experience: stage machine, VAD, waveform bars.
  Port `runAnalyserLoop` unchanged; the constants are tuned and there's no reason to
  re-derive them.

Both use a shared `ChatHistoryContext`. If you skip Supabase (recommended), reduce it to a
`useState` list — `addMessage(role, text, source)` returning `{ id, role, text, source, ts }`
is the entire contract those components need.

Mount in `App.jsx` alongside your existing sections.

**Copy the greeting-render trick.** The reference has a comment about seeding the greeting via
`addMessage()` on mount and filling the database with duplicate rows — one per route change,
doubled in StrictMode. The fix: render the greeting as a static fallback when history is empty,
never persist it.

```jsx
const messages = history.length ? history : [{ id: 0, role: "agent", text: GREETING, source: "text", ts: 0 }];
```

### Step 5 — Environment

`.env` locally (git-ignored — `.env` is already in your `.gitignore`), and Netlify →
Site settings → Environment variables for production:

```bash
SARVAM_API_KEY=sk_...
GEMINI_API_KEY=                      # phase 2
ALLOWED_ORIGINS=https://your-domain.netlify.app,https://yourdomain.com
ALLOWED_DEV_ORIGINS=http://localhost:5173,http://localhost:8888
```

**No `VITE_` prefix on any of these.** Vite inlines every `VITE_`-prefixed variable into the
client bundle — prefixing a secret publishes it. This is the one mistake that actually costs
money.

### Step 6 — Headers

Add to `netlify.toml` (your current file only has build config and the SPA redirect):

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Permissions-Policy = "camera=(), geolocation=(), microphone=(self), payment=()"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'self'"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store, max-age=0"
    X-Robots-Tag = "noindex"
```

`microphone=(self)` is **required** — without it the browser blocks `getUserMedia` even after
the user grants permission. And `media-src blob:` is required for the `MediaSource` playback URL.

Note `connect-src 'self'` stays clean precisely because everything is proxied. That's the
payoff of the proxy design.

### Suggested order

| Phase | Deliverable | Why this order |
|---|---|---|
| 1 | `agent-knowledge.md` | Determines answer quality; nothing else matters if it's thin |
| 2 | `chat.mjs` + `rag.js` + `agent.js` + text-only `ChatWidget` | Proves RAG end to end, cheapest to debug |
| 3 | `tts.mjs` + `sarvamSpeak` + replay button | Adds voice output; failure is graceful |
| 4 | `stt.mjs` + mic recording | Adds voice input |
| 5 | `VoiceAnalyzer` with VAD + bars | The showpiece |
| 6 | `embed.mjs` + `embeddings.js` | Retrieval upgrade, drop-in |

### Things that will bite

- **`createMediaElementSource()` throws on second call** for the same `<audio>` element.
  Keep the `WeakMap` cache.
- **AudioContext starts suspended** until a user gesture. `ensureCtx()` calls `.resume()`;
  keep that, and keep the intro behind an explicit play button.
- **`SourceBuffer.appendBuffer()` throws while `updating === true`.** The `awaitUpdate()`
  helper exists for this. Don't remove it.
- **iOS zoom-on-focus** — chat input needs `font-size: 16px` on mobile.
- **Mobile keyboard** — the panel uses `100dvh`, not `100vh`, so the URL bar collapsing
  doesn't push it off-screen.
- **sarvam-30b needs `max_tokens: 2048`.** A small cap returns empty content.
- **In-memory rate limits reset** on cold start and aren't shared across instances. Fine for
  a portfolio; the daily cap of 80/IP is what actually protects the bill.

### If you'd rather not use Sarvam

Everything vendor-specific lives in the four `netlify/functions/` files. Swapping providers
means editing those and nothing else — the client, RAG, VAD, and UI don't know who's on the
other end. Alternatives worth considering: Deepgram or OpenAI Whisper for STT, ElevenLabs or
OpenAI for TTS, and any OpenAI-compatible chat endpoint for generation. Sarvam's advantage
here is Indian-English pronunciation and one key covering all three.

---

## Recovering the reference code

```bash
git clone https://github.com/RaazKetan/ketan-v5.git
cd ketan-v5
git checkout 52807f3^          # last commit containing the voice agent
ls api/sarvam src/services src/components/Chat
```
