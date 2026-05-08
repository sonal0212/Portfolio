import { useEffect, useRef, useState } from 'react'
import './Projects.css'

const screenshot = (url, waitMs = 0) => {
  const wait = waitMs > 0 ? `&waitFor=${waitMs}` : ''
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800${wait}`
}

const projects = [
  {
    title: 'TaskFlow AI',
    subtitle: 'AI-Powered Task Management Platform',
    period: '2024 — Present',
    description:
      'Full-stack AI task manager with real-time multi-user collaboration via WebSocket (STOMP). JWT auth with short-lived access tokens, refresh-token rotation, and Redis token blacklisting. Spring AI + GPT-4o-mini for intelligent task suggestions and auto-prioritisation. Redis read-through caching to relieve PostgreSQL under concurrent usage.',
    tags: ['Spring Boot', 'Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Spring AI', 'OpenAI', 'WebSocket', 'JWT'],
    accent: '#C0392B',
    label: '01',
    github: 'https://github.com/sonal0212/TaskFlow-AI',
    live: 'https://taskflowwithai.netlify.app/',
    image: screenshot('https://taskflowwithai.netlify.app/'),
  },
  {
    title: 'GID Supervision',
    subtitle: 'Field Supervision & Workforce Management',
    period: 'Apr 2024 — Present',
    description:
      'End-to-end supervision platform for managing field agents, assignments, and real-time status tracking. Features role-based dashboards for supervisors and agents, attendance logging, task dispatch, and live reporting. Built with a responsive UI to support both desktop supervisors and mobile field workers.',
    tags: ['Java', 'jQuery', 'Node.js', 'PostgreSQL', 'REST API', 'ApexCharts', 'Web Push API'],
    accent: '#2C4A7C',
    label: '02',
    github: 'https://github.com/sonal0212',
    live: 'https://gidsupervision.netlify.app/',
    image: screenshot('https://gidsupervision.netlify.app/', 3000),
  },
  {
    title: 'Receipt Slayer',
    subtitle: 'AI-Powered Expense Management App',
    period: '2024 — Present',
    description:
      'Multi-model pipeline: receipt image → OCR text extraction → LLM categorisation → DB insert with monthly reporting and anomaly flagging. Integrated Claude API for natural-language financial insights. Produced full BRD, pitch deck, and architecture diagrams for the product.',
    tags: ['React Native', 'Node.js', 'PostgreSQL', 'Claude API', 'OpenAI', 'OCR'],
    accent: '#1A5C3A',
    label: '03',
    github: 'https://github.com/sonal0212',
    live: 'https://receipt-slayer.netlify.app/',
    image: screenshot('https://receipt-slayer.netlify.app/'),
  },
  {
    title: 'Omnifood',
    subtitle: 'Responsive Food Delivery Website',
    period: '2023 — 2024',
    description:
      'Modern, fully responsive food delivery landing page built with HTML, CSS, and JavaScript. Features smooth scroll navigation, interactive testimonials, and mobile-first design. Showcases best practices in semantic HTML, CSS Grid/Flexbox layouts, and vanilla JavaScript interactions for enhanced UX.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'UI/UX'],
    accent: '#FF9500',
    label: '04',
    github: 'https://github.com/sonal0212',
    live: 'https://omnifood-sonal.netlify.app',
    image: screenshot('https://omnifood-sonal.netlify.app'),
  },
  {
    title: 'DentalCare',
    subtitle: 'Healthcare Clinic Management System',
    period: '2023 — 2024',
    description:
      'Full-stack dental clinic website featuring patient booking system, service catalog, and clinic information. Built with responsive design principles to provide seamless experience across devices. Includes appointment scheduling, service listings, and contact integration for modern healthcare service delivery.',
    tags: ['React', 'HTML', 'CSS', 'Responsive Design', 'Healthcare'],
    accent: '#4A90E2',
    label: '05',
    github: 'https://github.com/sonal0212',
    live: 'https://dentalcare-dev.netlify.app/',
    image: screenshot('https://dentalcare-dev.netlify.app/', 20000),
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
            <div className="project-row__url-bar mono">{project.live?.replace('https://', '')}</div>
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
                <span className="caveat" style={{ color: project.accent }}>{project.label}</span>
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
            A mix of AI tooling, enterprise systems, responsive web applications, and mobile apps — each one taught me something new.
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
