import { useEffect, useRef } from 'react'
import './Work.css'

const experience = [
  {
    role: 'Associate Developer',
    company: 'PetroIT Software Solutions',
    location: 'Gurugram, India',
    period: 'Aug 2024 — Present',
    current: true,
    bullets: [
      'Architected and spearheaded the full-stack development of an enterprise platform serving 5,000+ users, utilizing Java (Spring Boot) and PostgreSQL to handle complex business logic and high-concurrency data workflows.',
      'Engineered a robust RBAC framework using Spring Security; reduced security-related support tickets by 25% and ensured 100% compliance with enterprise audit standards.',
      'Optimized PostgreSQL database schemas and refactored SQL queries, resulting in a 40% reduction in query response times and improved overall system reliability.',
      'Developed a real-time push notification system using Web Push API, which increased user engagement by 35% and provided critical alerts for business-critical events.',
      'Designed and deployed knowledge-based bots leveraging LLMs and retrieval-augmented generation (RAG) to surface answers from internal documentation, reducing manual support lookups and accelerating user self-service.',
      'Managed cloud infrastructure on AWS (EC2, S3) and automated deployment workflows using Docker and GitHub Actions, reducing deployment downtime and streamlining CI/CD pipelines.',
      'Collaborated in an Agile environment to translate complex business requirements into technical specifications, providing production support and root-cause analysis (RCA) for mission-critical APIs.',
    ],
    tags: ['Java', 'Spring Boot', 'PostgreSQL', 'Spring Security', 'Web Push API', 'AWS', 'Docker', 'GitHub Actions', 'LLM', 'RAG'],
  },
  {
    role: 'Software Developer Intern',
    company: 'PetroIT Software Solutions',
    location: 'Gurugram, India',
    period: 'Feb 2024 — Jul 2024',
    current: false,
    bullets: [
      'Integrated ApexCharts for interactive data visualization (bar, line, pie, area), replacing static CSV exports and improving stakeholder decision-making.',
      'Optimized 20+ SQL queries and backend data workflows using indexing strategies, resulting in a 40% decrease in retrieval time.',
      'Built 20+ responsive, accessible UI components with UI/UX designers, ensuring pixel-perfect rendering across mobile, tablet, and web.',
      'Maintained 95%+ code quality score in SonarQube through daily stand-ups, sprint planning, and bi-weekly code reviews.',
    ],
    tags: ['Java', 'SQL', 'ApexCharts', 'SonarQube', 'HTML', 'CSS', 'REST APIs'],
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
          <div className="work-card work-card--edu work-card--visible">
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
