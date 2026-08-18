import { useEffect, useMemo, useRef, useState } from 'react'
import { sarvamSpeak, sarvamTranscribe, SarvamError } from '../../services/sarvam'
import { buildKnowledgeBase } from '../../services/rag'
import { answerQuery } from '../../services/agent'
import { useChatHistory } from '../../context/ChatHistoryContext'
import { PlayIcon, StopIcon, MicIcon } from './icons'
import './VoiceAnalyzer.css'

/* Voice conversation section.
   1. Agent speaks an intro (manual start; visitor clicks play once).
   2. While speaking, the bars run off the TTS audio's analyser.
   3. When the intro finishes, the mic unlocks.
   4. Visitor presses the mic -> recording, bars run off the mic analyser.
   5. Silence (or pressing stop) -> STT transcribes, transcript fades in.
   6. RAG picks an answer -> TTS speaks it.
   7. Loops: the mic is ready again for the next turn. */

const GREETING =
  "Hi, I'm Sonal's assistant. She's a software engineer at PetroIT building agentic AI — MCP servers, RAG pipelines, and the Spring Boot backends underneath them. Press the mic and ask me anything about her work."

/* ── Bar geometry ──
   Columns are laid out by flexbox, so there is no viewBox to reason about:
   each bar is just a height percentage and the browser handles the widths. */
const BAR_MIN_PCT = 9 // a silent band still shows one dot, like an idle LED strip
const BAR_MAX_PCT = 100
const PHASE_STEP = 0.16 // radians per frame — drives the idle shimmer only

/* The slice of spectrum worth drawing. Voice runs roughly 80 Hz to 8 kHz;
   everything above that is hiss the columns would render as permanent dead
   space on the right of the strip. */
const BAND_LO_HZ = 80
const BAND_HI_HZ = 8000

/* FFT bin -> band edges, spaced logarithmically across the voice range.

   Slicing linearly across the whole spectrum is why the strip only lit up on
   the left. Two things were wrong: a linear slice puts every speech formant
   in the first few bins, and the top half of the range carries no voice
   energy at all. So the bands are log-spaced (perceptually even, matching how
   pitch is heard) AND clamped to BAND_LO_HZ..BAND_HI_HZ. */
function logBandEdges(binCount, bands, sampleRate) {
  const nyquist = sampleRate / 2
  const hzPerBin = nyquist / binCount
  const lo = Math.max(1, Math.floor(BAND_LO_HZ / hzPerBin))
  const hi = Math.max(lo + bands, Math.min(binCount, Math.ceil(BAND_HI_HZ / hzPerBin)))
  const edges = new Array(bands + 1)
  for (let i = 0; i <= bands; i++) {
    edges[i] = Math.round(lo * Math.pow(hi / lo, i / bands))
  }
  /* Guarantee strictly increasing edges — at the low end the log curve
     rounds several bands onto the same bin. */
  for (let i = 1; i <= bands; i++) {
    if (edges[i] <= edges[i - 1]) edges[i] = edges[i - 1] + 1
  }
  return edges
}

/* Peak within each band rather than the mean: averaging across a wide high
   band washes out exactly the transients that make the strip look alive.
   The tilt compensates for natural spectral rolloff, otherwise the right
   half stays visibly shorter than the left even with log spacing. */
function bandLevels(data, edges, bands) {
  const out = new Array(bands)
  for (let i = 0; i < bands; i++) {
    let peak = 0
    const end = Math.min(edges[i + 1], data.length)
    for (let j = edges[i]; j < end; j++) {
      if (data[j] > peak) peak = data[j]
    }
    const tilt = 1 + (i / bands) * 1.6
    out[i] = Math.min(1, (peak / 255) * tilt)
  }
  return out
}

/* Reduced-motion visitors keep the amplitude response — that is functional
   feedback that the mic is hearing them — but lose the idle shimmer. */
const wavePhaseStep = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 0
    : PHASE_STEP

export default function VoiceAnalyzer({ variant = 'feature' }) {
  const kb = useMemo(() => buildKnowledgeBase(), [])
  const { addMessage } = useChatHistory()

  const isFeature = variant === 'feature'
  const SAMPLE_COUNT = isFeature ? 56 : 22

  const [stage, setStage] = useState('idle')
  // 'idle' | 'agent-speak' | 'ready' | 'recording' | 'processing' | 'agent-reply'
  const [line, setLine] = useState(null)
  /* levels + phase live in one state object so the analyser loop does a single
     setState per frame instead of two. */
  const [wave, setWave] = useState(() => ({ levels: Array(SAMPLE_COUNT).fill(0), phase: 0 }))
  const phaseStep = useMemo(wavePhaseStep, [])
  const [notice, setNotice] = useState(null)

  /* WebAudio graph + RAF refs. */
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  /* createMediaElementSource() throws if called twice for the same element,
     so cache the source node per audio element. */
  const mediaSourceMapRef = useRef(new WeakMap())

  /* Mic recording refs. */
  const recorderRef = useRef(null)
  const recStreamRef = useRef(null)
  const recChunksRef = useRef([])

  /* Push-to-talk by default — the agent gets to finish speaking before the
     mic reopens, and only then if the visitor opts into hands-free. Avoids
     the "always listening" feel where background noise triggers another
     paid STT round through the VAD. */
  const [autoLoop, setAutoLoop] = useState(false)
  const autoLoopRef = useRef(false)
  useEffect(() => {
    autoLoopRef.current = autoLoop
  }, [autoLoop])

  const explainSarvam = (e, action) => {
    if (e instanceof SarvamError) {
      if (e.kind === 'unavailable') return 'Voice is offline right now. Try the chat widget instead.'
      if (e.kind === 'rate-limited') return 'Voice limit reached. Try again in a minute.'
      if (e.kind === 'network') return "Couldn't reach the voice service. Check your connection."
    }
    return action === 'speak' ? 'Voice playback failed.' : 'Voice transcription failed.'
  }

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(t)
  }, [notice])

  const ensureCtx = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    /* Browsers start the context suspended until a user gesture. */
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  /* Flat line, phase back to zero — the wave only moves on real audio. */
  const resetWave = () => setWave({ levels: Array(SAMPLE_COUNT).fill(0), phase: 0 })

  /* Cleanup on unmount. */
  useEffect(() => {
    return () => {
      stopRaf()
      audioRef.current?.pause()
      recorderRef.current?.stop()
      recStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  /* Run the analyser loop until cancelled. It drives the bars, and when
     vadStop is provided it doubles as voice activity detection: fires once
     the speaker has been active and then quiet for SILENCE_HANG_MS. */
  const runAnalyserLoop = (analyser, vadStop) => {
    const data = new Uint8Array(analyser.frequencyBinCount)
    const edges = logBandEdges(
      analyser.frequencyBinCount,
      SAMPLE_COUNT,
      analyser.context.sampleRate
    )

    let hasSpoken = false
    let lastVoiceAt = performance.now()
    let speakStartedAt = 0
    let vadFired = false

    const SPEAK_THRESHOLD = 0.2 // avg level above this counts as speech
    const SILENCE_HANG_MS = 1500 // silence after speech before auto-stop
    const MIN_SPEAK_MS = 400 // ignore brief blips (typing, a cough)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const next = bandLevels(data, edges, SAMPLE_COUNT)

      /* VAD deliberately measures the raw spectrum mean, not the bar levels.
         Those are per-band peaks with a treble tilt applied for looks; feeding
         them to the threshold would redefine what counts as speech and throw
         off the silence timing that ends a turn. */
      let raw = 0
      for (let j = 0; j < data.length; j++) raw += data[j]
      const avg = raw / data.length / 255

      setWave((w) => ({ levels: next, phase: w.phase + phaseStep }))

      if (vadStop && !vadFired) {
        const now = performance.now()
        if (avg > SPEAK_THRESHOLD) {
          if (!hasSpoken) speakStartedAt = now
          hasSpoken = true
          lastVoiceAt = now
        }
        if (
          hasSpoken &&
          now - speakStartedAt > MIN_SPEAK_MS &&
          now - lastVoiceAt > SILENCE_HANG_MS
        ) {
          vadFired = true
          vadStop()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  /* Speak text, driving the bars from its audio. Resolves when playback
     ends (or fails). */
  const speak = async (text) => {
    let audio = null
    try {
      audio = await sarvamSpeak(text)
    } catch (e) {
      setNotice(explainSarvam(e, 'speak'))
    }

    if (!audio) {
      /* No audio came back — missing key, or an upstream 502. Run a short
         synthetic swell so the click is acknowledged instead of the section
         sitting dead. Eased in and out, so it settles onto the centreline
         rather than snapping flat. This is also the only motion you get
         locally until SARVAM_API_KEY is set. */
      const FALLBACK_MS = 2000
      const startedAt = performance.now()
      const tick = () => {
        const progress = Math.min(1, (performance.now() - startedAt) / FALLBACK_MS)
        const envelope = Math.sin(Math.PI * progress) * 0.45
        setWave((w) => ({
          /* Vary by column so the fallback reads as a strip responding, not a
             single block rising and falling together. */
          levels: Array.from({ length: SAMPLE_COUNT }, (_, i) =>
            Math.max(0, envelope * (0.55 + 0.45 * Math.sin(w.phase + i * 0.5)))
          ),
          phase: w.phase + phaseStep,
        }))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
      await new Promise((r) => setTimeout(r, FALLBACK_MS))
      stopRaf()
      resetWave()
      return
    }

    audioRef.current = audio
    try {
      const ctx = await ensureCtx()
      let source = mediaSourceMapRef.current.get(audio)
      if (!source) {
        source = ctx.createMediaElementSource(audio)
        mediaSourceMapRef.current.set(audio, source)
      }
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.7
      source.connect(analyser)
      analyser.connect(ctx.destination)
      runAnalyserLoop(analyser)
    } catch (err) {
      console.warn('AudioContext wire failed', err)
    }

    await new Promise((resolve) => {
      audio.addEventListener('ended', () => resolve(), { once: true })
      audio.addEventListener('error', () => resolve(), { once: true })
      audio.play().catch(() => resolve())
    })

    stopRaf()
    resetWave()
    audioRef.current = null
  }

  const playIntro = async () => {
    if (stage !== 'idle') return
    setStage('agent-speak')
    setLine({ speaker: 'agent', text: GREETING })
    addMessage('agent', GREETING, 'voice')
    await speak(GREETING)
    setStage('ready')
    if (autoLoopRef.current) window.setTimeout(() => startRecording(), 600)
  }

  const stopAgent = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    stopRaf()
    resetWave()
    setStage('ready')
  }

  const startRecording = async () => {
    if (stage !== 'ready') return
    try {
      /* Aggressive mic constraints: noise suppression, echo cancel and AGC,
         single channel at 16kHz — matches Sarvam's preferred STT rate, halves
         the uploaded audio, and gives the noise suppressor a tighter band. */
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      })
      recStreamRef.current = stream

      const ctx = await ensureCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.6
      source.connect(analyser)

      /* Chromium won't pump a mic stream through an analyser unless something
         reaches the destination. gain = 0 keeps the graph alive without the
         visitor hearing themselves echo. */
      const muted = ctx.createGain()
      muted.gain.value = 0
      analyser.connect(muted)
      muted.connect(ctx.destination)

      runAnalyserLoop(analyser, () => stopRecording())

      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      recChunksRef.current = []

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) recChunksRef.current.push(e.data)
      }

      rec.onstop = async () => {
        stopRaf()
        resetWave()
        stream.getTracks().forEach((t) => t.stop())
        recStreamRef.current = null
        const blob = new Blob(recChunksRef.current, { type: mime })

        setStage('processing')
        let transcript = ''
        try {
          transcript = await sarvamTranscribe(blob)
        } catch (e) {
          setNotice(explainSarvam(e, 'listen'))
          setStage('ready')
          return
        }

        if (!transcript.trim()) {
          const msg = "Didn't catch that. Try again?"
          setLine({ speaker: 'agent', text: msg })
          addMessage('agent', msg, 'voice')
          setStage('ready')
          return
        }

        setLine({ speaker: 'user', text: transcript })
        addMessage('user', transcript, 'voice')

        /* Beat so the visitor reads their own transcript before the reply. */
        await new Promise((r) => setTimeout(r, 700))

        const answer = await answerQuery(transcript, kb)
        setLine({ speaker: 'agent', text: answer })
        addMessage('agent', answer, 'voice')
        setStage('agent-reply')
        await speak(answer)
        setStage('ready')
        if (autoLoopRef.current) window.setTimeout(() => startRecording(), 600)
      }

      recorderRef.current = rec
      rec.start()
      setLine({ speaker: 'user', text: 'Listening…' })
      setStage('recording')
    } catch (e) {
      console.warn('Mic permission failed', e)
      setNotice('Microphone blocked. Allow mic access in your browser to talk.')
      setStage('ready')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
  }

  /* What the single button does and shows, derived from the stage. */
  const buttonConfig = (() => {
    const s = isFeature ? 20 : 12
    switch (stage) {
      case 'idle':
        return { onClick: playIntro, icon: <PlayIcon size={s} />, label: 'Play intro' }
      case 'agent-speak':
      case 'agent-reply':
        return { onClick: stopAgent, icon: <StopIcon size={s} />, label: 'Stop' }
      case 'ready':
        return { onClick: startRecording, icon: <MicIcon size={s} />, label: 'Press the mic to talk' }
      case 'recording':
        return { onClick: stopRecording, icon: <StopIcon size={s} />, label: 'Send' }
      case 'processing':
      default:
        return { onClick: undefined, icon: <PlayIcon size={s} />, label: 'Thinking…' }
    }
  })()

  const status = {
    idle: 'Press play to start',
    'agent-speak': 'Agent · speaking',
    ready: autoLoop ? 'Listening…' : 'Your turn · press the mic',
    recording: "Recording · I'll stop on silence",
    processing: 'Thinking…',
    'agent-reply': 'Agent · speaking',
  }[stage]

  const speaking = stage === 'agent-speak' || stage === 'agent-reply' || stage === 'recording'

  return (
    <section id="ask" className="va-section">
      <div className="container">
        {/* Non-numeric stamp, same as the Journey section — keeps the numbered
            run (01 About → 05 Contact) intact wherever this section sits. */}
        <p className="section-stamp">§ ask me anything</p>
        <h2 className="section-title">
          Talk to my <em>agent.</em>
        </h2>
        <p className="va-section__intro">
          A retrieval-augmented voice agent I built, running on my own knowledge base.
          Ask it about my work, projects, or stack — out loud, or in the chat widget.
        </p>

        <div className="va-card">
          <div className="va-card__tape" aria-hidden="true" />

          <div className="va-card__head">
            <span className="va-card__label mono">voice agent</span>
            <button
              type="button"
              className={`va-loop mono${autoLoop ? ' va-loop--on' : ''}`}
              onClick={() => setAutoLoop((v) => !v)}
              aria-pressed={autoLoop}
              title="Hands-free keeps the mic open between turns"
            >
              {autoLoop ? '● hands-free' : '○ push to talk'}
            </button>
          </div>

          {notice && (
            <div className="va-notice mono" role="status">
              {notice}
            </div>
          )}

          <div className="va-stage">
            <button
              type="button"
              className={`va-btn${speaking ? ' va-btn--active' : ''}`}
              onClick={buttonConfig.onClick}
              disabled={!buttonConfig.onClick}
              aria-label={buttonConfig.label}
              title={buttonConfig.label}
            >
              {buttonConfig.icon}
            </button>

            <div className="va-wave" aria-hidden="true">
              {wave.levels.map((v, i) => (
                <span
                  key={i}
                  className="va-bar"
                  style={{ height: `${BAR_MIN_PCT + v * (BAR_MAX_PCT - BAR_MIN_PCT)}%` }}
                />
              ))}
            </div>
          </div>

          <p className={`va-status mono va-status--${stage}`}>{status}</p>

          <div className="va-transcript">
            <p
              key={line ? line.speaker + line.text.slice(0, 24) : 'empty'}
              className={`va-line ${line ? `va-line--${line.speaker}` : 'va-line--empty'} ${
                line?.speaker === 'user' ? 'caveat' : ''
              }`}
            >
              {line ? line.text : 'Press play to hear from me.'}
            </p>
          </div>

          <p className="va-foot caveat">
            built with RAG over my own knowledge base — the same pattern I ship at work.
          </p>
        </div>
      </div>
    </section>
  )
}
