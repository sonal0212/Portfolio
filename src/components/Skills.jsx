import { useEffect, useRef } from 'react'
import './Skills.css'

const skillGroups = [
  {
    category: 'Languages',
    icon: '{ }',
    color: '#C0392B',
    skills: ['Java', 'Python', 'JavaScript', 'TypeScript', 'SQL', 'HTML5', 'CSS3', 'jQuery'],
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
      'Hibernate',
      'Next.js',
      'React',
      'Bootstrap',
      'Maven',
    ],
  },
  {
    category: 'Databases',
    icon: '⬡',
    color: '#1A5C3A',
    skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'RabbitMQ', 'Firebase', 'Supabase'],
  },
  {
    category: 'Backend & Web',
    icon: '⇄',
    color: '#7B3FA0',
    skills: [
      'RESTful APIs',
      'MVC Architecture',
      'Microservices',
      'JWT / Session Auth',
      'WebSocket (STOMP)',
      'CRUD',
      'JSON / API Integration',
      'Data Ingestion',
      'Debugging',
      'Backend Automation',
    ],
  },
  {
    category: 'AI / LLM',
    icon: '✦',
    color: '#C0392B',
    skills: [
      'RAG',
      'LLM Integration',
      'MCP',
      'Prompt Engineering',
      'AI Chatbot Development',
      'Vector Databases',
      'OpenAI',
      'Gemini CLI',
      'Open-claw',
      'Open-source LLMs (Qwen, Mistral, Gemma)',
    ],
  },
  {
    category: 'Tools & Automation',
    icon: '◈',
    color: '#2C4A7C',
    skills: [
      'Git',
      'GitHub',
      'GitHub Actions',
      'Docker',
      'CI/CD Pipelines',
      'AWS EC2 & S3',
      'Cloud Deployments',
      'IntelliJ IDEA',
      'VS Code',
      'Postman',
      'n8n',
      'Webhooks',
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
