import { useEffect, useRef } from 'react'
import './Hero.css'

export default function Hero() {
  const ref = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.classList.add('hero--visible')
    }, 100)
    return () => clearTimeout(timer)
  }, [])

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

          {/* Main heading */}
          <h1 className="hero__name">
            Sonal<br />
            <em>Singh.</em>
          </h1>

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
            <mark>AI/LLM integrations</mark> — from pushing query response times down
            by 40% to shipping real-time collaborative platforms.
          </p>

          {/* Quick stats */}
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-num caveat">2+</span>
              <span className="hero__stat-label mono">years exp.</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num caveat">15+</span>
              <span className="hero__stat-label mono">features shipped</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num caveat">40%</span>
              <span className="hero__stat-label mono">query speedup</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num caveat">3</span>
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
              href="https://linkedin.com/in/sonal-singh-dev"
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
