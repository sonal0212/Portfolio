import { useEffect, useRef, useState } from 'react'
import './Hero.css'

const FIRST = 'Sonal'
const SECOND = 'Singh.'
const TOTAL = FIRST.length + SECOND.length

function CountUp({ end, suffix = '+', duration = 1500, delay = 0 }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    let start = 0
    const startTimer = setTimeout(() => {
      const tick = (now) => {
        if (!start) start = now
        const t = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(Math.round(eased * end))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(startTimer)
      cancelAnimationFrame(raf)
    }
  }, [end, duration, delay])

  return (
    <>
      {value}
      {suffix}
    </>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.classList.add('hero--visible')
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typed >= TOTAL) return
    // longer pause right after finishing "Sonal" before starting "Singh."
    const delay = typed === FIRST.length ? 380 : 105
    const t = setTimeout(() => setTyped((c) => c + 1), delay)
    return () => clearTimeout(t)
  }, [typed])

  const firstShown = Math.min(typed, FIRST.length)
  const secondShown = Math.max(0, typed - FIRST.length)
  const lineBreakVisible = firstShown >= FIRST.length
  const isDone = typed >= TOTAL

  const polaroids = [
    { src: '/photos/hackathon.jpg', caption: 'AI Trailblazer · Hackathon ’26 Winner', rotate: '-5deg' },
    { src: '/photos/portrait.jpg', caption: 'Hi, I’m Sonal :)', rotate: '3deg' },
    { src: '/photos/campus.jpg', caption: 'On Campus, ’26', rotate: '-2deg' },
  ]

  return (
    <section id="about" className="hero" ref={ref}>
      <div className="container">
        <div className="hero__inner">
          {/* Margin annotation */}
          <span className="hero__margin-note caveat">§ 01 — About</span>

          {/* Status badge */}
          <div className="hero__status">
            <span className="hero__status-dot" />
            <span className="hero__status-text mono">available for opportunities</span>
          </div>

          {/* Heading + polaroids on the right */}
          <div className="hero__head">
            <h1 className="hero__name" aria-label="Sonal Singh">
              <span aria-hidden="true">
                {FIRST.slice(0, firstShown)}
                {lineBreakVisible && <br />}
                {secondShown > 0 && <em>{SECOND.slice(0, secondShown)}</em>}
                <span
                  className={`hero__cursor${isDone ? ' hero__cursor--done' : ''}`}
                >
                  |
                </span>
              </span>
            </h1>

            <div className="hero__polaroids" aria-hidden="false">
              {polaroids.map((p, i) => (
                <figure
                  key={i}
                  className="hero__polaroid"
                  style={{ '--rotate': p.rotate, '--i': i }}
                >
                  <div className="hero__polaroid-tape" />
                  <img src={p.src} alt={p.caption} loading="lazy" />
                  <figcaption className="caveat">{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Handwritten subtitle */}
          <p className="hero__subtitle caveat">
            Full-Stack Java Developer ✦ AI Integrations ✦ 2+ yrs
          </p>

          <div className="hero__divider" />

          {/* Summary */}
          <p className="hero__summary">
            Results-driven developer who turns complex business problems into clean,
            scalable systems. I specialise in{' '}
            <mark>Spring Boot</mark>, <mark>React/Next.js</mark>, and{' '}
            <mark>AI/LLM integrations</mark> — from databases and APIs to shipping
            real-time collaborative platforms.
          </p>

          {/* Quick stats */}
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-num caveat">
                <CountUp end={2} duration={1100} delay={1800} />
              </span>
              <span className="hero__stat-label mono">years exp.</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num caveat">
                <CountUp end={25} duration={1500} delay={1850} />
              </span>
              <span className="hero__stat-label mono">features shipped</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num caveat">
                <CountUp end={500} duration={1800} delay={1900} />
              </span>
              <span className="hero__stat-label mono">users impacted</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num caveat">
                <CountUp end={7} duration={1300} delay={1950} />
              </span>
              <span className="hero__stat-label mono">active projects</span>
            </div>
          </div>

          {/* Social links */}
          <div className="hero__links">
            <a
              href="https://github.com/sonal0212"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__link mono"
            >
              GitHub ↗
            </a>
            <a
              href="https://www.linkedin.com/in/sonal-singh-dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__link mono"
            >
              LinkedIn ↗
            </a>
            <a
              href="mailto:sonals02.singh@gmail.com"
              className="hero__link mono"
            >
              Email ↗
            </a>
          </div>

          {/* Decorative handwritten note */}
          <div className="hero__doodle-note caveat">
            "I write code that scales, not just code that works."
          </div>
        </div>
      </div>

      {/* Decorative grid rule */}
      <div className="hero__grid-corner" />
    </section>
  )
}
