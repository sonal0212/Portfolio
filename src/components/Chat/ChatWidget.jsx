import { useEffect, useMemo, useRef, useState } from 'react'
import { buildKnowledgeBase } from '../../services/rag'
import { answerQuery } from '../../services/agent'
import { sarvamSpeak, sarvamTranscribe, SarvamError } from '../../services/sarvam'
import { useChatHistory } from '../../context/ChatHistoryContext'
import {
  ChatIcon,
  CloseIcon,
  SendIcon,
  MicIcon,
  StopIcon,
  SpeakerOn,
  SpeakerOff,
  WaveIcon,
} from './icons'
import './ChatWidget.css'

const GREETING =
  "Hi — I'm Sonal's portfolio agent. Ask me about her work, projects, or stack. Chat or voice both work."

const SUGGESTIONS = [
  'What does Sonal build at PetroIT?',
  'Tell me about her hackathon win',
  "What's her stack?",
  'Is she open to new roles?',
]

export default function ChatWidget() {
  const kb = useMemo(() => buildKnowledgeBase(), [])
  const { messages: history, addMessage } = useChatHistory()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [speakingId, setSpeakingId] = useState(null)
  const [notice, setNotice] = useState(null)

  const scrollRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)

  /* Turn a SarvamError into a friendly one-liner. Voice is best-effort —
     surface a short disclaimer so the visitor knows it's degraded but can
     still use the text chat. */
  const explain = (e, action) => {
    if (e instanceof SarvamError) {
      if (e.kind === 'unavailable') return 'Voice is offline right now. You can still chat in text.'
      if (e.kind === 'rate-limited') return 'Voice limit reached for now. Try again in a minute.'
      if (e.kind === 'network') return "Couldn't reach the voice service. Check your connection."
    }
    return action === 'speak' ? 'Voice playback failed.' : 'Voice transcription failed.'
  }

  /* Auto-clear the notice so it doesn't linger once the visitor has moved on. */
  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(t)
  }, [notice])

  /* The greeting lives ONLY in the render when real history is empty — it is
     never pushed into shared history. Seeding it via addMessage() on mount
     would duplicate it on every remount and pollute the voice transcript. */
  const messages = history.length
    ? history
    : [{ id: 0, role: 'agent', text: GREETING, source: 'text', ts: 0 }]

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, open])

  /* Cancel any in-flight playback. */
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setSpeakingId(null)
  }

  useEffect(() => () => stopAudio(), [])

  /* Play a message. Used for auto-play after a reply and for the per-message
     replay button. */
  const playMessage = async (msgId, text) => {
    stopAudio()
    setSpeakingId(msgId)
    try {
      const audio = await sarvamSpeak(text)
      if (!audio) {
        setSpeakingId(null)
        return
      }
      audioRef.current = audio
      audio.addEventListener('ended', () => {
        if (audioRef.current === audio) {
          setSpeakingId(null)
          audioRef.current = null
        }
      })
      audio.addEventListener('error', () => {
        setSpeakingId(null)
        setNotice('Voice playback failed mid-stream. Try again.')
      })
      await audio.play().catch(() => setSpeakingId(null))
    } catch (e) {
      setSpeakingId(null)
      setNotice(explain(e, 'speak'))
    }
  }

  const send = async (raw, viaVoice = false) => {
    const q = raw.trim()
    if (!q || busy) return
    setBusy(true)
    setInput('')

    /* Snapshot prior turns BEFORE adding the new one — the request appends
       the question itself, so we don't want it duplicated in the history. */
    const priorHistory = messages.map((m) => ({ role: m.role, text: m.text }))
    addMessage('user', q, viaVoice ? 'voice' : 'text')

    const answer = await answerQuery(q, kb, priorHistory)
    const bot = addMessage('agent', answer, 'text')

    if (voiceOn) playMessage(bot.id, answer)
    setBusy(false)
  }

  const startRecording = async () => {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const rec = new MediaRecorder(stream, { mimeType: mime })

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mime })
        setBusy(true)
        try {
          const transcript = await sarvamTranscribe(blob)
          setBusy(false)
          if (transcript) {
            await send(transcript, true)
          } else {
            addMessage('agent', "Didn't catch that — try typing instead, or check your mic.", 'text')
          }
        } catch (e) {
          setBusy(false)
          setNotice(explain(e, 'transcribe'))
        }
      }

      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch (e) {
      console.warn('Microphone access failed', e)
      setNotice('Microphone blocked. Allow mic access in your browser settings.')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setRecording(false)
  }

  const toggleVoice = () => {
    if (voiceOn) stopAudio()
    setVoiceOn((v) => !v)
  }

  return (
    <>
      <button
        type="button"
        className={`chat-fab${open ? ' chat-fab--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Ask Sonal'}
        aria-expanded={open}
      >
        <span className="chat-fab__icon">{open ? <CloseIcon size={14} /> : <ChatIcon size={14} />}</span>
        <span className="chat-fab__label caveat">{open ? 'close' : 'ask Sonal'}</span>
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat with Sonal's portfolio agent">
          <div className="chat-panel__tape" aria-hidden="true" />

          <header className="chat-head">
            <div className="chat-head__left">
              <span className="chat-head__led" />
              <div>
                <strong className="chat-head__title">Sonal's agent</strong>
                <span className="chat-head__sub mono">RAG · voice · en-IN</span>
              </div>
            </div>
            <div className="chat-head__right">
              <button
                type="button"
                className={`chat-icon-btn${voiceOn ? ' chat-icon-btn--on' : ''}`}
                onClick={toggleVoice}
                title={voiceOn ? 'Mute auto-voice' : 'Enable auto-voice'}
                aria-pressed={voiceOn}
              >
                {voiceOn ? <SpeakerOn size={14} /> : <SpeakerOff size={14} />}
              </button>
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          </header>

          {notice && (
            <div className="chat-notice" role="status">
              <span>{notice}</span>
              <button
                type="button"
                className="chat-notice__x"
                onClick={() => setNotice(null)}
                aria-label="Dismiss notice"
              >
                ×
              </button>
            </div>
          )}

          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m) => {
              const isUser = m.role === 'user'
              const rowClass = isUser ? 'user' : 'agent'
              return (
                <div key={m.id} className={`chat-row chat-row--${rowClass}`}>
                  {isUser && m.source === 'voice' && (
                    <span className="chat-voice-tag" title="Sent via voice">
                      <MicIcon size={11} />
                    </span>
                  )}
                  <div className={`chat-msg chat-msg--${rowClass}`}>{m.text}</div>
                  {!isUser && (
                    <button
                      type="button"
                      className={`chat-replay${speakingId === m.id ? ' chat-replay--speaking' : ''}`}
                      onClick={() =>
                        speakingId === m.id ? stopAudio() : playMessage(m.id, m.text)
                      }
                      aria-label={speakingId === m.id ? 'Stop playback' : 'Play message'}
                    >
                      {speakingId === m.id ? <WaveIcon size={12} /> : <span className="chat-replay__glyph">▶</span>}
                    </button>
                  )}
                </div>
              )
            })}

            {busy && (
              <div className="chat-row chat-row--agent">
                <div className="chat-msg chat-msg--agent chat-msg--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          <div className="chat-suggest">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="chat-chip mono"
                onClick={() => send(s)}
                disabled={busy}
              >
                {s}
              </button>
            ))}
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? 'Listening…' : 'Ask about her work, projects, anything'}
              disabled={busy && !recording}
              aria-label="Your question"
            />
            <button
              type="button"
              className={`chat-mic${recording ? ' chat-mic--recording' : ''}`}
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? 'Stop recording' : 'Start voice input'}
              disabled={busy && !recording}
            >
              {recording ? <StopIcon size={14} /> : <MicIcon size={14} />}
            </button>
            <button
              type="submit"
              className="chat-send"
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <SendIcon size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
