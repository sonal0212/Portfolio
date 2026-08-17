import { useEffect, useRef } from 'react'
import './Work.css'

const experience = [
  {
    role: 'Software Engineer',
    company: 'PetroIT Software Solutions',
    location: 'Gurugram, India',
    period: 'Feb 2024 — Present',
    current: true,
    /* Title stays generic to match the résumé; the agentic AI positioning is
       carried by the tagline and bullets instead. Progression line keeps the
       two promotions visible without splitting the span into three cards. */
    progression: 'Software Developer Intern → Associate Developer → Software Engineer',
    bullets: [
      'Own the architecture and buildout of Mozaic, a multitenant SaaS platform on Java (Spring Boot), microservices, and PostgreSQL — built for 1M+ request traffic while preserving modular architecture and system reliability.',
      'Designed and built Kalp, a production MCP (Model Context Protocol) server embedded in Mozaic, publishing 15 tools across six specialised agents — reporting, analysis, form-fill, document-linking, LOV management, and extraction — with tool-calling, persisted chat memory, and streaming responses.',
      'Implemented multi-provider LLM routing (Claude, GPT, Ollama, DeepSeek, NVIDIA NIM, OpenRouter) through a custom ModelRouter, plus a pgvector-backed RAG and document-fingerprinting pipeline, shipped via Docker and Jenkins with JWT/OAuth2-secured endpoints for external clients.',
      'Designed a multi-agent knowledge-bot architecture — each agent scoped to its own domain, tools, and data behind a shared orchestration layer, with least-privilege tool access enforced at the middleware layer and shared vector memory for secure cross-agent knowledge sharing.',
      'Built a secure RBAC framework with Spring Security handling permission edge cases and auth failures across multi-tenant services; cut security-related support tickets by 25% while holding SonarQube quality at 95%.',
      'Indexed and tuned 20+ PostgreSQL queries, cutting response times by 40%; automated build and deploy pipelines on GitHub Actions and AWS (EC2, S3).',
      'Authored and presented an AI adoption roadmap and governance plan to engineering leadership, translating technical capability into a business-readable strategy with a 30/60/90-day rollout plan.',
      'Tracked and triaged issues through SIT, UAT, and performance testing in an Agile team, and reviewed the Angular components consuming our REST APIs.',
      'Started as an intern: integrated ApexCharts for interactive data visualisation (bar, line, pie, area) replacing static CSV exports, and built 20+ responsive, accessible UI components alongside UI/UX designers.',
    ],
    tags: ['Java 21', 'Spring Boot', 'Microservices', 'MCP', 'LangGraph', 'pgvector', 'RAG', 'PostgreSQL', 'Spring Security', 'Docker', 'Jenkins', 'AWS', 'SonarQube'],
  },
]

/* Client / platform work worth calling out separately from the role itself. */
const engagements = [
  {
    name: 'Flight61',
    client: 'Chimes Aviation Academy',
    tagline: 'Aviation safety & pilot-training analytics',
    bullets: [
      'Wrote a framework-free rules engine — ~19 independent rules, 319 JUnit tests, ~46,000 lines in Java 21 / Spring Boot 3.3.5 — to catch and grade safety events from per-second flight telemetry.',
      'Set up async ingestion pipelines on dedicated thread pools for telemetry, sortie logs, and nightly CRM syncs, so none of it blocks live HTTP traffic.',
      'Integrated the Claude API to turn raw findings into plain-English debrief narratives, plus an admin AI chatbot answering natural-language questions against a read-only DB view, with WhatsApp Cloud API and Zoho CRM webhook integrations.',
    ],
    tags: ['Java 21', 'Spring Boot 3.3.5', 'JUnit', 'MySQL', 'Hibernate', 'Claude API', 'Zoho CRM', 'WhatsApp Cloud API'],
  },
  {
    name: 'Anuvaad',
    client: 'PetroIT',
    tagline: 'AI-powered multilingual enterprise platform',
    bullets: [
      'Built resilient multi-LLM job orchestration (Mistral, LLaMA, Gemma, GPT-class) with automatic retries, rollback, and idempotent re-processing, so a partial failure never corrupts the output.',
      'Added a work-stealing batch pipeline, secure external REST APIs, webhook integrations, RBAC, governance-based approval flows, and real-time SSE progress tracking.',
    ],
    tags: ['Java', 'Spring Boot', 'Multi-LLM', 'SSE', 'RBAC', 'Webhooks'],
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
            {job.progression && (
              <p className="work-card__progression caveat">{job.progression}</p>
            )}
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
            Two years at the same company — intern to Software Engineer, two promotions. Here's what I built.
          </p>
        </div>

        <div className="work__timeline">
          {experience.map((job, i) => (
            <WorkCard key={i} job={job} index={i} />
          ))}

          {/* Platform / client engagements built inside the role above */}
          <div className="work-card work-card--engagements work-card--visible">
            <div className="work-card__line" />
            <div className="work-card__dot work-card__dot--engagement" />
            <div className="work-card__body">
              <p className="work-card__engagement-label mono">platforms built</p>
              <div className="work__engagements">
                {engagements.map((e) => (
                  <div key={e.name} className="engagement">
                    <div className="engagement__head">
                      <h4 className="engagement__name">{e.name}</h4>
                      <span className="engagement__client mono">{e.client}</span>
                    </div>
                    <p className="engagement__tagline caveat">{e.tagline}</p>
                    <ul className="work-card__bullets">
                      {e.bullets.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                    <div className="work-card__tags">
                      {e.tags.map((t) => (
                        <span key={t} className="work-tag mono">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
