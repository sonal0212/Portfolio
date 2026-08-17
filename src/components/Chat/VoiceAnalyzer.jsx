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

/* ── Waveform geometry ──
   The SVG is stretched to fill its box (preserveAspectRatio="none"), so these
   are shape units, not pixels. Strokes stay round via non-scaling-stroke. */
const VIEW_W = 100
const VIEW_H = 40
const MID = VIEW_H / 2
const AMPLITUDE = 18 // leaves headroom at the top of the box on a full-volume peak
const WAVES = 2.6 // crests visible across the full width
const PHASE_STEP = 0.16 // radians per frame — how fast the wave travels left to right

/* Sampled analyser levels -> points on a travelling wave. Each sample is
   phase-offset from its neighbour (that's what makes it flow) and its height
   is that frequency band's amplitude, so silence collapses the whole thing
   onto the centreline. Tapered at both ends so the line settles into the rule
   instead of being chopped off by the edge of the box. */
function wavePoints(levels, phase, offset, scale) {
  const n = levels.length
  const span = Math.max(1, n - 1)
  const k = (WAVES * Math.PI * 2) / span
  const pts = new Array(n)
  for (let i = 0; i < n; i++) {
    const taper = Math.sin((Math.PI * i) / span)
    const y = MID + Math.sin(phase + offset + i * k) * levels[i] * taper * AMPLITUDE * scale
    pts[i] = [(i / span) * VIEW_W, y]
  }
  return pts
}

/* Reduced-motion visitors keep the amplitude response — that's functional
   feedback that the mic is hearing them — but lose the sideways travel. */
const wavePhaseStep = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 0
    : PHASE_STEP

/* Catmull-Rom spline through the points, emitted as cubic beziers. Without
   this the wave is a polyline and reads as jagged at 56 samples. */
function smoothPath(pts) {
  if (pts.length < 2) return ''
  const n = (v) => v.toFixed(2)
  let d = `M${n(pts[0][0])},${n(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${n(c1x)},${n(c1y)} ${n(c2x)},${n(c2y)} ${n(p2[0])},${n(p2[1])}`
  }
  return d
}

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

    let hasSpoken = false
    let lastVoiceAt = performance.now()
    let speakStartedAt = 0
    let vadFired = false

    const SPEAK_THRESHOLD = 0.2 // avg level above this counts as speech
    const SILENCE_HANG_MS = 1500 // silence after speech before auto-stop
    const MIN_SPEAK_MS = 400 // ignore brief blips (typing, a cough)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const step = Math.floor(data.length / SAMPLE_COUNT) || 1
      const next = []
      let sum = 0
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const v = data[i * step] / 255
        next.push(v)
        sum += v
      }
      const avg = sum / SAMPLE_COUNT
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
          levels: Array(SAMPLE_COUNT).fill(envelope),
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
      analyser.fftSize = 64
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
      analyser.fftSize = 128
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

  /* Three passes of the same wave — two low-opacity echoes running ahead and
     behind the main line at reduced amplitude. Costs one extra path each and
     is what turns a single stroke into something that reads as liquid. */
  const wavePaths = useMemo(
    () => [
      smoothPath(wavePoints(wave.levels, wave.phase, -0.9, 0.55)),
      smoothPath(wavePoints(wave.levels, wave.phase, 0.9, 0.75)),
      smoothPath(wavePoints(wave.levels, wave.phase, 0, 1)),
    ],
    [wave]
  )

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
              <svg
                className="va-wave__svg"
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                preserveAspectRatio="none"
              >
                <path className="va-wave__echo" d={wavePaths[0]} />
                <path className="va-wave__echo" d={wavePaths[1]} />
                <path className="va-wave__line" d={wavePaths[2]} />
              </svg>
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
