import { useEffect, useRef, useState } from 'react'
import './Projects.css'

const screenshot = (url, waitMs = 0) => {
  const wait = waitMs > 0 ? `&waitFor=${waitMs}` : ''
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800${wait}`
}

const projects = [
  {
    title: 'Receipt Slayer',
    subtitle: 'AI Expense Pipeline — Hackathon Winner, ₹2L',
    period: '2026',
    description:
      'Winner of the AI Trailblazer Hackathon, a company-wide event at PetroIT — built by a team using spec-driven development with AI tools. A multi-model pipeline turns a receipt photo into structured data: OCR text extraction → LLM categorisation → DB insert, with monthly reporting and anomaly flagging on top. The Claude API generates natural-language financial insights. Shipped alongside a full BRD, pitch deck, and architecture diagrams.',
    tags: ['Claude API', 'OpenAI', 'OCR', 'Multi-Model Pipeline', 'React Native', 'Node.js', 'PostgreSQL'],
    accent: '#1A5C3A',
    label: '01',
    award: 'Hackathon Winner · ₹2 Lakh',
    github: 'https://github.com/sonal0212',
    live: 'https://receipt-slayer.netlify.app/',
    image: screenshot('https://receipt-slayer.netlify.app/'),
  },
  {
    title: 'TaskFlow AI',
    subtitle: 'Spring AI Task Platform',
    period: '2024 — Present',
    description:
      'Spring AI with GPT-4o-mini drives intelligent task suggestions and auto-prioritisation, on a Spring Boot backend built for concurrency: Redis read-through caching to relieve PostgreSQL, JWT auth with short-lived access tokens, refresh-token rotation, and Redis token blacklisting. Real-time multi-user collaboration over WebSocket (STOMP).',
    tags: ['Spring AI', 'OpenAI', 'Spring Boot', 'Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'WebSocket', 'JWT'],
    accent: '#2C4A7C',
    label: '02',
    github: 'https://github.com/sonal0212/TaskFlow-AI',
    live: 'https://taskflowwithai.netlify.app/',
    image: screenshot('https://taskflowwithai.netlify.app/'),
  },
  {
    title: 'GID Supervision',
    subtitle: 'Field Supervision & Workforce Management',
    period: 'Apr 2024 — Present',
    description:
      'End-to-end supervision platform for managing field agents, assignments, and real-time status tracking. Role-based dashboards for supervisors and agents, attendance logging, task dispatch, and live reporting, with a responsive UI supporting both desktop supervisors and mobile field workers.',
    tags: ['Java', 'jQuery', 'Node.js', 'PostgreSQL', 'REST API', 'ApexCharts', 'Web Push API'],
    accent: '#7B3FA0',
    label: '03',
    github: 'https://github.com/sonal0212',
    live: 'https://gidsupervision.netlify.app/',
    image: screenshot('https://gidsupervision.netlify.app/', 3000),
  },
]

function ProjectRow({ project, index }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)
  const reversed = index % 2 !== 0

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) ref.current?.classList.add('project-row--visible')
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`project-row ${reversed ? 'project-row--reversed' : ''}`}
      ref={ref}
      style={{ '--accent': project.accent, transitionDelay: `${index * 0.05}s` }}
    >
      {/* Image side */}
      <div className="project-row__image-wrap">
        <div
          className="project-row__image"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="project-row__browser-bar">
            <span /><span /><span />
            <div className="project-row__url-bar mono">
              {project.live?.replace('https://', '') || 'this page — § 06 ask me anything'}
            </div>
          </div>
          <div className="project-row__screen">
            {project.image ? (
              <img
                src={project.image}
                alt={`${project.title} preview`}
                loading="lazy"
              />
            ) : (
              <div className="project-row__screen-empty">
                <span className="caveat" style={{ color: project.accent }}>{project.title}</span>
              </div>
            )}
            {project.live && (
              <a
                className={`project-row__overlay mono ${hovered ? 'project-row__overlay--show' : ''}`}
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${project.title} live site`}
              >
                visit live ↗
              </a>
            )}
            {project.anchor && (
              <a
                className={`project-row__overlay mono ${hovered ? 'project-row__overlay--show' : ''}`}
                href={project.anchor}
                aria-label="Jump to the voice agent on this page"
              >
                try it ↓
              </a>
            )}
          </div>
          <div className="project-row__tape" />
        </div>
      </div>

      {/* Content side */}
      <div className="project-row__content">
        <span className="project-row__label mono" style={{ color: project.accent }}>
          {project.label}
        </span>
        <h3 className="project-row__title">{project.title}</h3>
        <p className="project-row__subtitle caveat">{project.subtitle}</p>
        <span className="project-row__period mono">{project.period}</span>

        {project.award && (
          <span
            className="project-row__award mono"
            style={{ '--award-color': project.accent }}
          >
            ★ {project.award}
          </span>
        )}

        <p className="project-row__desc">{project.description}</p>

        <div className="project-row__tags">
          {project.tags.map((t) => (
            <span key={t} className="project-tag mono">{t}</span>
          ))}
        </div>

        <div className="project-row__links">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="project-row__link mono"
          >
            GitHub ↗
          </a>
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="project-row__link project-row__link--live mono"
              style={{ color: project.accent, borderColor: project.accent }}
            >
              Live site ↗
            </a>
          )}
          {project.anchor && (
            /* Same-page jump — no new tab, the agent is right below. */
            <a
              href={project.anchor}
              className="project-row__link project-row__link--live mono"
              style={{ color: project.accent, borderColor: project.accent }}
            >
              {project.anchorLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const headingRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) headingRef.current?.classList.add('visible')
      },
      { threshold: 0.2 }
    )
    if (headingRef.current) observer.observe(headingRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="projects">
      <div className="container">
        <div className="fade-in" ref={headingRef}>
          <p className="section-stamp">§ 03 — Things I Built</p>
          <h2 className="section-title">Projects I'm <em>proud of.</em></h2>
          <p className="projects__intro">
            Agentic AI, LLM pipelines, and the backends that carry them. Most of my
            production work lives behind company walls — these are the ones I can show you.
          </p>
        </div>

        <div className="projects__list">
          {projects.map((p, i) => (
            <ProjectRow key={i} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
