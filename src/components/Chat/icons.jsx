/* Inline stroke icons. Hand-drawn weight (1.6) to sit alongside the
   notebook aesthetic rather than looking like a shipped UI kit. */

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export const ChatIcon = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4.2-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
  </svg>
)

export const CloseIcon = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const SendIcon = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

export const MicIcon = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
  </svg>
)

export const StopIcon = ({ size = 16 }) => (
  <svg {...base(size)}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </svg>
)

export const PlayIcon = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M6 3.5 20 12 6 20.5v-17z" />
  </svg>
)

export const SpeakerOn = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)

export const SpeakerOff = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M22 9l-6 6M16 9l6 6" />
  </svg>
)

/* Three bars that animate while a message is being spoken. */
export const WaveIcon = ({ size = 16 }) => (
  <svg {...base(size)}>
    <path className="wave-bar wave-bar-1" d="M6 10v4" />
    <path className="wave-bar wave-bar-2" d="M12 7v10" />
    <path className="wave-bar wave-bar-3" d="M18 10v4" />
  </svg>
)
