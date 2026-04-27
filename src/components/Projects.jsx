import { useEffect, useRef, useState } from 'react'
import './Projects.css'

const screenshot = (url) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800`

const projects = [
  {
    title: 'TaskFlow AI',
    subtitle: 'AI-Powered Task Management Platform',
    period: '2024 — Present',
    description:
      'Full-stack AI task manager with real-time multi-user collaboration via WebSocket (STOMP). JWT auth with short-lived access tokens, refresh-token rotation, and Redis token blacklisting. Spring AI + GPT-4o-mini for intelligent task suggestions and auto-prioritisation. Redis read-through caching to relieve PostgreSQL under concurrent usage.',
    tags: ['Spring Boot', 'Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Spring AI', 'OpenAI', 'WebSocket', 'JWT'],
    accent: '#C0392B',
    rotate: '-2deg',
    label: '01',
    github: 'https://github.com/sonal0212',
    live: null,
    image: screenshot('https://github.com/sonal0212'),
  },
  {
    title: 'Platform',
    subtitle: 'Internal Enterprise Application',
    period: 'Apr 2024 — Present',
    description:
      'Push notification microservice delivering real-time alerts to 500+ concurrent users across the org. Interactive reporting engine with a custom SQL join builder and output in multiple ApexCharts types. Hierarchical RBAC supporting admin, manager, and viewer roles across multiple modules.',
    tags: ['Java', 'jQuery', 'Node.js', 'PostgreSQL', 'REST API', 'ApexCharts', 'Web Push API'],
    accent: '#2C4A7C',
    rotate: '1.5deg',
    label: '02',
    github: 'https://github.com/sonal0212',
    live: null,
    image: screenshot('https://github.com/sonal0212'),
  },
  {
    title: 'Receipt Slayer',
    subtitle: 'AI-Powered Expense Management App',
    period: '2024 — Present',
    description:
      'Multi-model pipeline: receipt image → OCR text extraction → LLM categorisation → DB insert with monthly reporting and anomaly flagging. Integrated Claude API for natural-language financial insights. Produced full BRD, pitch deck, and architecture diagrams for the product.',
    tags: ['React Native', 'Node.js', 'PostgreSQL', 'Claude API', 'OpenAI', 'OCR'],
    accent: '#1A5C3A',
    rotate: '-1deg',
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
    rotate: '1.2deg',
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
    rotate: '-1.5deg',
    label: '05',
    github: 'https://github.com/sonal0212',
    live: 'https://dentalcare-dev.netlify.app/',
    image: screenshot('https://dentalcare-dev.netlify.app/'),
  },
]

function ProjectCard({ project, index }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) ref.current?.classList.add('project-card--visible')
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="project-card"
      ref={ref}
      style={{
        '--accent': project.accent,
        '--rotate': hovered ? '0deg' : project.rotate,
        transitionDelay: `${index * 0.1}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Polaroid photo area */}
      {project.live ? (
        <a
          className="project-card__photo project-card__photo--link"
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${project.title} live site`}
        >
          <div className="project-card__photo-inner">
            {project.image ? (
              <img
                src={project.image}
                alt={`${project.title} preview`}
                className="project-card__photo-img"
                loading="lazy"
              />
            ) : (
              <>
                <span className="project-card__num caveat">{project.label}</span>
                <div className="project-card__photo-grid" />
                <p className="project-card__photo-title caveat">{project.title}</p>
              </>
            )}
            <span className="project-card__photo-overlay mono">visit live ↗</span>
          </div>
        </a>
      ) : (
        <div className="project-card__photo">
          <div className="project-card__photo-inner">
            {project.image ? (
              <img
                src={project.image}
                alt={`${project.title} preview`}
                className="project-card__photo-img"
                loading="lazy"
              />
            ) : (
              <>
                <span className="project-card__num caveat">{project.label}</span>
                <div className="project-card__photo-grid" />
                <p className="project-card__photo-title caveat">{project.title}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Polaroid caption area */}
      <div className="project-card__caption">
        <div className="project-card__caption-header">
          <div>
            <h3 className="project-card__title">{project.title}</h3>
            <p className="project-card__subtitle caveat">{project.subtitle}</p>
          </div>
          <span className="project-card__period mono">{project.period}</span>
        </div>

        <p className="project-card__desc">{project.description}</p>

        <div className="project-card__tags">
          {project.tags.map((t) => (
            <span key={t} className="project-tag mono">{t}</span>
          ))}
        </div>

        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="project-card__link mono"
        >
          view on github ↗
        </a>
      </div>

      {/* Tape */}
      <div className="project-card__tape" />
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

        <div className="projects__grid">
          {projects.map((p, i) => (
            <ProjectCard key={i} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
