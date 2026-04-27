import { useEffect, useRef } from 'react'
import './Work.css'

const experience = [
  {
    role: 'Associate Developer',
    company: 'PetroIT Software Solutions',
    location: 'Gurugram, India',
    period: 'Sep 2024 — Present',
    current: true,
    bullets: [
      'Spearheaded full-stack development of an enterprise platform serving 500+ users, building frontend with HTML, CSS, JS, jQuery and backend with Java, Spring Boot, PostgreSQL.',
      'Engineered push notification system using Web Push API, increasing user engagement by 35% with real-time alerts for critical business events.',
      'Designed dynamic reporting module with drag-and-drop SQL join builder — reduced report generation from hours to under 2 minutes.',
      'Integrated ApexCharts for interactive data visualisation (bar, line, pie, area), replacing static CSV exports.',
      'Established RBAC system managing 5+ user roles with fine-grained permissions across all modules.',
      'Collaborated with cross-functional teams of 8+ engineers, PMs, and clients to deliver 15+ features within Agile/Scrum sprints.',
    ],
    tags: ['Java', 'Spring Boot', 'PostgreSQL', 'JavaScript', 'jQuery', 'Web Push API', 'ApexCharts'],
  },
  {
    role: 'Software Developer Intern',
    company: 'PetroIT Software Solutions',
    location: 'Gurugram, India',
    period: 'Feb 2024 — Aug 2024',
    current: false,
    bullets: [
      'Optimised 20+ SQL queries and deployed indexing strategies, reducing data retrieval time by 40% and cutting API latency from 1.2s to 0.3s.',
      'Crafted reusable Java utility modules adopted by 3 team members, reducing code duplication by 25%.',
      'Built 10+ responsive, accessible UI components with UI/UX designers ensuring pixel-perfect rendering across all devices.',
      'Maintained 95%+ code quality score in SonarQube through daily stand-ups and bi-weekly code reviews.',
    ],
    tags: ['Java', 'SQL', 'SonarQube', 'REST APIs', 'HTML', 'CSS'],
  },
]

const education = {
  degree: 'Bachelor of Engineering in Computer Science',
  institution: 'Chandigarh University',
  location: 'Mohali, India',
  period: 'Aug 2020 — Jul 2024',
}

function WorkCard({ job, index }) {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          ref.current?.classList.add('work-card--visible')
        }
      },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="work-card"
      ref={ref}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      <div className="work-card__line" />
      <div className="work-card__dot" />

      <div className="work-card__body">
        <div className="work-card__header">
          <div>
            <h3 className="work-card__role">{job.role}</h3>
            <p className="work-card__company">
              {job.company}
              <span className="work-card__location mono"> — {job.location}</span>
            </p>
          </div>
          <div className="work-card__period-wrap">
            <span className="work-card__period mono">{job.period}</span>
            {job.current && (
              <span className="work-card__badge mono">current</span>
            )}
          </div>
        </div>

        <ul className="work-card__bullets">
          {job.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        <div className="work-card__tags">
          {job.tags.map((t) => (
            <span key={t} className="work-tag mono">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Work() {
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
    <section id="work">
      <div className="container">
        <div className="fade-in" ref={headingRef}>
          <p className="section-stamp">§ 02 — Work History</p>
          <h2 className="section-title">Where I've <em>worked.</em></h2>
          <p className="work__intro">
            Two years at the same company — from intern to lead developer. Here's what I built.
          </p>
        </div>

        <div className="work__timeline">
          {experience.map((job, i) => (
            <WorkCard key={i} job={job} index={i} />
          ))}

          {/* Education card */}
          <div className="work-card work-card--edu">
            <div className="work-card__line work-card__line--last" />
            <div className="work-card__dot work-card__dot--edu" />
            <div className="work-card__body">
              <div className="work-card__header">
                <div>
                  <h3 className="work-card__role">{education.degree}</h3>
                  <p className="work-card__company">
                    {education.institution}
                    <span className="work-card__location mono"> — {education.location}</span>
                  </p>
                </div>
                <span className="work-card__period mono">{education.period}</span>
              </div>
              <p className="work-card__edu-note caveat">
                Graduated with a strong CS foundation — data structures, OS, databases, and beyond.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
