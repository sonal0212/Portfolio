import { useState, useEffect, useRef, useCallback } from 'react'
import './Notebook.css'

/* ── page data ── */
const PAGES = [
  {
    id: 'about-me',
    tab: 'About Me',
    title: 'About Me',
    stamp: '01',
    content: `I'm Sonal Singh, a software engineer building agentic AI and the backends underneath it. My work spans production agent systems — MCP servers, RAG pipelines, multi-provider LLM routing — running on top of the Java and Spring Boot micro-services I own end to end. I approach every project with the same philosophy: understand the domain deeply, write clean and testable code, and ship solutions that users genuinely rely on.`,
    photos: [
      { slot: 'portrait.jpg', caption: 'Portrait', rotate: '-3deg' },
      { slot: 'at-work.jpg', caption: 'At work', rotate: '2deg' },
    ],
    color: '#4A90D9',
    doodle: 'Code with intention. Build with purpose.',
  },
  {
    id: 'hackathons',
    tab: 'Hackathons',
    title: 'Hackathons',
    stamp: '02',
    content: `Hackathons have been a defining part of my growth as an engineer. Competing in national-level events pushed me to architect solutions under extreme constraints, collaborate with cross-functional teams, and deliver production-ready demos in 24 to 48 hours. From AI-driven platforms to real-time collaboration tools, each hackathon sharpened my ability to prioritize, prototype rapidly, and present with confidence.`,
    photos: [
      { slot: 'winning-moment.jpg', caption: 'Winning moment', rotate: '-4deg' },
      { slot: 'late-night-sprint.jpg', caption: 'Late-night sprint', rotate: '3deg' },
      { slot: 'demo-day.jpg', caption: 'Demo day', rotate: '-1deg' },
    ],
    color: '#E74C3C',
    doodle: 'Ship under pressure. Learn under fire.',
  },
  {
    id: 'certifications',
    tab: 'Certifications',
    title: 'Certifications',
    stamp: '03',
    content: `Continuous learning is non-negotiable in this field. I pursue certifications not for the credential alone, but for the structured deep-dives they demand. From cloud architecture fundamentals to advanced Java frameworks, each certification represents focused study, hands-on lab work, and a commitment to staying current.`,
    photos: [],
    certs: [
      { name: 'SQL Using MySQL', file: '/certificates/sql-mysql-certificate.pdf' },
      { name: 'AWS Cloud Solutions Architect (Coursera)', file: '/certificates/aws-architect-certificate.pdf' },
      { name: 'Full Stack Web Development Bootcamp', file: '/certificates/fullstack-bootcamp-certificate.pdf' },
    ],
    color: '#8E44AD',
    doodle: 'Stay curious. Stay certified. Stay sharp.',
  },
  {
    id: 'travelled',
    tab: 'Travelled',
    title: 'Places & Perspectives',
    stamp: '04',
    content: `Traveling broadens the lens through which I approach both work and life. Whether attending a tech conference in a new city or exploring a mountain trail solo, every journey adds perspective that shapes how I think about design, collaboration, and problem-solving. The best ideas often emerge when you step away from the screen and immerse yourself in unfamiliar environments and cultures.`,
    photos: [
      { slot: 'mountain-trail.jpg', caption: 'Mountain trail', rotate: '-4deg' },
      { slot: 'new-horizons.jpg', caption: 'New horizons', rotate: '2deg' },
      { slot: 'n.jpg', caption: 'New places', rotate: '-1deg' },
    ],
    color: '#D97706',
    doodle: 'New places. New perspectives. Better code.',
  },
]

const SPIRAL_COUNT = 14

/* ── realistic page-flip sound via Web Audio API ── */
function playPageFlipSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const sampleRate = ctx.sampleRate
    const duration = 0.55
    const bufferSize = Math.floor(sampleRate * duration)
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate)

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate
        const lift = t < 0.08 ? Math.sin(t * 800) * Math.exp(-t * 30) * 0.15 : 0
        const slideT = Math.max(0, t - 0.05)
        const slideEnv = slideT > 0 && slideT < 0.2 ? Math.sin(slideT / 0.2 * Math.PI) * 0.4 : 0
        const slide = (Math.random() * 2 - 1) * slideEnv
        const flipT = Math.max(0, t - 0.15)
        const flipEnv = flipT > 0 && flipT < 0.2 ? Math.pow(Math.sin(flipT / 0.2 * Math.PI), 0.5) * 0.6 : 0
        const flip = (Math.random() * 2 - 1) * flipEnv
        const settleT = Math.max(0, t - 0.3)
        const settleEnv = settleT > 0 && settleT < 0.2 ? Math.exp(-settleT * 15) * 0.5 : 0
        const settle = (Math.random() * 2 - 1) * settleEnv
          + (settleT > 0 ? Math.sin(settleT * 120) * Math.exp(-settleT * 25) * 0.3 : 0)
        const tailT = Math.max(0, t - 0.35)
        const tailEnv = tailT > 0 ? Math.exp(-tailT * 20) * 0.1 : 0
        const tail = (Math.random() * 2 - 1) * tailEnv
        const stereoShift = ch === 0 ? 1.0 : 0.85
        data[i] = (lift + slide + flip + settle + tail) * 0.45 * stereoShift
      }
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    const lpFilter = ctx.createBiquadFilter()
    lpFilter.type = 'lowpass'
    lpFilter.frequency.value = 4500
    lpFilter.Q.value = 0.7
    const hpFilter = ctx.createBiquadFilter()
    hpFilter.type = 'highpass'
    hpFilter.frequency.value = 150
    hpFilter.Q.value = 0.5
    const convLen = Math.floor(sampleRate * 0.08)
    const convBuf = ctx.createBuffer(2, convLen, sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = convBuf.getChannelData(c)
      for (let i = 0; i < convLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / convLen * 6) * 0.3
      }
    }
    const convolver = ctx.createConvolver()
    convolver.buffer = convBuf
    const dryGain = ctx.createGain()
    dryGain.gain.value = 0.7
    const wetGain = ctx.createGain()
    wetGain.gain.value = 0.3
    const masterGain = ctx.createGain()
    masterGain.gain.value = 1.0
    source.connect(hpFilter)
    hpFilter.connect(lpFilter)
    lpFilter.connect(dryGain)
    dryGain.connect(masterGain)
    lpFilter.connect(convolver)
    convolver.connect(wetGain)
    wetGain.connect(masterGain)
    masterGain.connect(ctx.destination)
    source.start()
    source.onended = () => ctx.close()
  } catch {
    // silent fallback
  }
}

/* cover open uses the same page flip sound for consistency */
function playCoverOpenSound() {
  playPageFlipSound()
}

/* ── component ── */
export default function Notebook() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [flipDir, setFlipDir] = useState(null)
  const [photosVisible, setPhotosVisible] = useState(false)
  const sectionRef = useRef(null)
  const pageAreaRef = useRef(null)

  /* reveal photos after page settles */
  useEffect(() => {
    if (!isOpen) return
    setPhotosVisible(false)
    const t = setTimeout(() => setPhotosVisible(true), 500)
    return () => clearTimeout(t)
  }, [currentPage, isOpen])

  /* click cover to open */
  const openNotebook = useCallback(() => {
    if (isOpen) return
    playCoverOpenSound()
    setIsOpen(true)
  }, [isOpen])

  /* click page: left half = prev, right half = next */
  const handlePageClick = useCallback(
    (e) => {
      if (flipping || !isOpen) return
      const rect = pageAreaRef.current?.getBoundingClientRect()
      if (!rect) return
      const clickX = e.clientX - rect.left
      const half = rect.width / 2

      let nextIdx
      if (clickX < half) {
        nextIdx = currentPage - 1
      } else {
        nextIdx = currentPage + 1
      }

      if (nextIdx < 0 || nextIdx >= PAGES.length) return

      const dir = nextIdx > currentPage ? 'next' : 'prev'
      setFlipDir(dir)
      setFlipping(true)
      playPageFlipSound()
      setTimeout(() => {
        setCurrentPage(nextIdx)
        setFlipping(false)
        setFlipDir(null)
      }, 600)
    },
    [currentPage, flipping, isOpen]
  )

  /* tab click */
  const goTo = useCallback(
    (idx) => {
      if (flipping || idx === currentPage || idx < 0 || idx >= PAGES.length || !isOpen) return
      const dir = idx > currentPage ? 'next' : 'prev'
      setFlipDir(dir)
      setFlipping(true)
      playPageFlipSound()
      setTimeout(() => {
        setCurrentPage(idx)
        setFlipping(false)
        setFlipDir(null)
      }, 600)
    },
    [currentPage, flipping, isOpen]
  )

  const page = PAGES[currentPage]

  return (
    <section id="my-journey" className="nb-section" ref={sectionRef}>
      <div className="container">
        <span className="section-stamp caveat">§ journey</span>
        <h2 className="section-title">
          My <em>Journey</em>
        </h2>
        <p className="nb-section__intro">
          A scrapbook of memories, milestones, and moments that shaped me.
        </p>

        {/* ── THE NOTEBOOK ── */}
        <div className={`nb ${isOpen ? 'nb--open' : ''}`}>

          {/* cover — user clicks to open */}
          <div className="nb__cover" onClick={openNotebook}>
            <div className="nb__cover-inner">
              <div className="nb__cover-holes">
                {[...Array(SPIRAL_COUNT)].map((_, i) => (
                  <div key={i} className="nb__cover-hole" />
                ))}
              </div>
              <div className="nb__cover-content">
                <div className="nb__cover-badge">PORTFOLIO</div>
                <span className="nb__cover-title caveat">Sonal Singh</span>
                <span className="nb__cover-sub-title">Developer &middot; Builder &middot; Learner</span>
                <span className="nb__cover-year mono">2024 — present</span>
                <div className="nb__cover-doodles">
                  <span>&#123; &#125;</span><span>&#60;/&#62;</span><span>&#9733;</span>
                </div>
                <span className="nb__cover-hint caveat">click to open</span>
              </div>
            </div>
          </div>

          {/* spiral binding */}
          <div className="nb__spiral" aria-hidden="true">
            {[...Array(SPIRAL_COUNT)].map((_, i) => (
              <div key={i} className="nb__ring">
                <div className="nb__ring-wire" />
              </div>
            ))}
          </div>

          {/* back cover */}
          <div className="nb__back" />

          {/* stacked page edges */}
          <div className="nb__edges">
            <div className="nb__edge nb__edge--1" />
            <div className="nb__edge nb__edge--2" />
            <div className="nb__edge nb__edge--3" />
            <div className="nb__edge nb__edge--4" />
          </div>

          {/* page tabs (sticky notes) — only visible when open */}
          <div className="nb__tabs">
            {PAGES.map((p, i) => (
              <button
                key={p.id}
                className={`nb__tab caveat ${i === currentPage ? 'nb__tab--active' : ''}`}
                style={{ '--tab-color': p.color }}
                onClick={() => goTo(i)}
                title={p.tab}
              >
                <span className="nb__tab-text">{p.tab}</span>
              </button>
            ))}
          </div>

          {/* ── MAIN PAGE — click to flip ── */}
          <div
            className={`nb__page-area ${isOpen ? '' : 'nb__page-area--hidden'}`}
            ref={pageAreaRef}
            onClick={handlePageClick}
          >
            {/* cursor hint zones */}
            <div className="nb__click-zone nb__click-zone--left" />
            <div className="nb__click-zone nb__click-zone--right" />

            {/* lined paper bg */}
            <div className="nb__lines" aria-hidden="true" />
            <div className="nb__margin-line" aria-hidden="true" />

            {/* holes on paper */}
            <div className="nb__paper-holes" aria-hidden="true">
              {[...Array(SPIRAL_COUNT)].map((_, i) => (
                <div key={i} className="nb__paper-hole" />
              ))}
            </div>

            {/* the page content */}
            <div
              className={`nb__content ${flipping ? `nb__content--flip-${flipDir}` : ''}`}
              key={`page-${currentPage}`}
            >
              {/* page number circle */}
              <div className="nb__page-num" style={{ background: page.color }}>
                <span className="mono">{page.stamp}</span>
              </div>

              {/* title with underline doodle */}
              <h3 className="nb__title">{page.title}</h3>
              <svg className="nb__title-underline" viewBox="0 0 200 8" style={{ '--line-color': page.color }}>
                <path d="M0 5 Q40 0, 80 5 T160 5 T200 3" fill="none" stroke={page.color} strokeWidth="2.5" strokeLinecap="round"/>
              </svg>

              {/* written content */}
              <p className="nb__text kalam">{page.content}</p>

              {/* certificate links */}
              {page.certs && page.certs.length > 0 && (
                <div className="nb__certs">
                  {page.certs.map((cert, i) => (
                    <a
                      key={i}
                      href={cert.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nb__cert-link caveat"
                      style={{ color: page.color }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {cert.name}
                    </a>
                  ))}
                </div>
              )}

              {/* photo collage */}
              <div className={`nb__photos ${photosVisible ? 'nb__photos--show' : ''}`}>
                {page.photos.map((photo, i) => (
                  <figure
                    key={i}
                    className="nb__photo"
                    style={{
                      '--rot': photo.rotate,
                      '--d': `${i * 0.12}s`,
                    }}
                  >
                    <div className="nb__photo-pin" style={{ background: page.color }} />
                    <div className="nb__photo-img">
                      <img
                        src={`/photos/${photo.slot}`}
                        alt={photo.caption}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div className="nb__photo-empty" style={{ display: 'none' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <span className="caveat">add photo</span>
                      </div>
                    </div>
                    <figcaption className="caveat">{photo.caption}</figcaption>
                  </figure>
                ))}
              </div>

              {/* doodle quote */}
              <div className="nb__quote caveat" style={{ '--q-color': page.color }}>
                <span className="nb__quote-mark">"</span>
                {page.doodle.replace(/"/g, '')}
                <span className="nb__quote-mark">"</span>
              </div>

              {/* bottom corner page info */}
              <div className="nb__corner-doodle caveat" style={{ color: page.color }}>
                pg. {currentPage + 1} of {PAGES.length}
                <span className="nb__flip-hint mono"> — click to flip</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
