import { useEffect, useRef } from 'react'
import './Skills.css'

const skillGroups = [
  {
    category: 'Languages',
    icon: '{ }',
    color: '#C0392B',
    skills: ['Java (Core, OOP, Java 21)', 'Python', 'JavaScript', 'TypeScript', 'SQL', 'HTML5', 'CSS3', 'jQuery'],
  },
  {
    category: 'Frameworks',
    icon: '⚡',
    color: '#2C4A7C',
    skills: [
      'Spring Boot',
      'Spring MVC',
      'Spring Data JPA',
      'Spring Security',
      'Spring AI',
      'Hibernate / ORM',
      'FastAPI',
      'Next.js',
      'React',
      'Angular (review & integration)',
      'Bootstrap',
      'Maven',
    ],
  },
  {
    category: 'Databases',
    icon: '⬡',
    color: '#1A5C3A',
    skills: [
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'RabbitMQ',
      'pgvector',
      'Qdrant',
      'Query Optimisation & Indexing',
      'Firebase',
      'Supabase',
    ],
  },
  {
    category: 'Backend & Architecture',
    icon: '⇄',
    color: '#7B3FA0',
    skills: [
      'RESTful APIs',
      'Microservices Architecture',
      'Multitenant SaaS',
      'MVC Architecture',
      'JWT / OAuth2',
      'RBAC',
      'WebSocket (STOMP)',
      'SSE (Server-Sent Events)',
      'Async Ingestion Pipelines',
      'Idempotent Processing',
      'Retries & Rollback',
      'Data Ingestion',
      'Backend Automation',
    ],
  },
  {
    category: 'AI / Agentic Systems',
    icon: '✦',
    color: '#C0392B',
    skills: [
      'MCP (Model Context Protocol)',
      'LangGraph',
      'LangChain',
      'Multi-Agent Orchestration',
      'Multi-Provider LLM Routing',
      'RAG Pipeline Design',
      'Retrieval Optimisation',
      'Document Fingerprinting',
      'Prompt Engineering',
      'Tool / Function Calling',
      'Guardrails & Output Validation',
      'Spec-Driven Development',
      'Claude / OpenAI / Gemini APIs',
      'Ollama, DeepSeek, NVIDIA NIM, OpenRouter',
      'Open-source LLMs (Qwen, Mistral, Gemma, LLaMA)',
    ],
  },
  {
    category: 'Testing & Quality',
    icon: '✓',
    color: '#1A5C3A',
    skills: [
      'JUnit (319 tests on Flight61)',
      'SonarQube (95% score)',
      'Code Review',
      'SIT / UAT Triage',
      'Performance Testing',
      'Postman',
      'Debugging & RCA',
    ],
  },
  {
    category: 'Tools & DevOps',
    icon: '◈',
    color: '#2C4A7C',
    skills: [
      'Git',
      'GitHub',
      'GitHub Actions',
      'Jenkins',
      'Docker',
      'Kubernetes (familiar)',
      'CI/CD Pipelines',
      'AWS EC2 & S3',
      'Claude Code',
      'Cursor',
      'GitHub Copilot',
      'n8n',
      'Webhooks',
      'Zoho CRM / WhatsApp Cloud API',
      'Linux',
      'Production Support',
    ],
  },
]

function SkillGroup({ group, index }) {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) ref.current?.classList.add('skill-group--visible')
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="skill-group"
      ref={ref}
      style={{
        '--group-color': group.color,
        transitionDelay: `${index * 0.08}s`,
      }}
    >
      <div className="skill-group__band" />
      <div className="skill-group__header">
        <div className="skill-group__title">
          <span className="skill-group__icon">{group.icon}</span>
          <h3 className="skill-group__category mono">{group.category}</h3>
        </div>
        <span className="skill-group__count caveat">{group.skills.length}</span>
      </div>
      <div className="skill-group__pills">
        {group.skills.map((skill, idx) => (
          <span
            key={skill}
            className="skill-pill"
            style={{ '--pill-i': idx }}
          >
            {skill}
          </span>
        ))}
      </div>
      <span className="skill-group__corner" aria-hidden="true" />
    </div>
  )
}

export default function Skills() {
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
    <section id="skills">
      <div className="container">
        <div className="fade-in" ref={headingRef}>
          <p className="section-stamp">§ 04 — Technical Skills</p>
          <h2 className="section-title">The <em>toolkit.</em></h2>
          <p className="skills__intro">
            Languages, frameworks, and tools I reach for — and know well.
          </p>
        </div>

        <div className="skills__grid">
          {skillGroups.map((group, i) => (
            <SkillGroup key={group.category} group={group} index={i} />
          ))}
        </div>

        {/* Handwritten aside */}
        <div className="skills__aside caveat">
          * always learning — currently exploring agentic AI systems and distributed architectures.
        </div>
      </div>
    </section>
  )
}
