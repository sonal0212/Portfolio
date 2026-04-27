import { useEffect, useRef, useState } from 'react'
import './Contact.css'

const socials = [
  {
    label: 'GitHub',
    handle: '@sonal0212',
    href: 'https://github.com/sonal0212',
    desc: 'code & projects',
  },
  {
    label: 'LinkedIn',
    handle: 'sonal-singh-dev',
    href: 'https://linkedin.com/in/sonal-singh-dev',
    desc: 'professional profile',
  },
  {
    label: 'Email',
    handle: 'sonals02.singh@gmail.com',
    href: 'mailto:sonals02.singh@gmail.com',
    desc: 'fastest way to reach me',
  },
  {
    label: 'Phone',
    handle: '+1 769-629-3984',
    href: 'tel:+17696293984',
    desc: 'call or text',
  },
]

export default function Contact() {
  const headingRef = useRef(null)
  const [copied, setCopied] = useState(false)

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

  const copyEmail = () => {
    navigator.clipboard.writeText('sonals02.singh@gmail.com').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section id="contact">
      <div className="container">
        <div className="fade-in" ref={headingRef}>
          <p className="section-stamp">§ 05 — Say Hello</p>
          <h2 className="section-title">Let's <em>connect.</em></h2>
        </div>

        <div className="contact__layout">
          <div className="contact__left">
            <p className="contact__body">
              I'm currently open to new opportunities — whether it's a full-time role,
              a freelance project, or just a good conversation about tech.
            </p>
            <p className="contact__body">
              If you're building something interesting or want to talk shop about
              Spring Boot, AI integrations, or scalable systems — my inbox is always open.
            </p>

            {/* Big email button */}
            <div className="contact__email-block">
              <a
                href="mailto:sonals02.singh@gmail.com"
                className="contact__email-link"
              >
                sonals02.singh@gmail.com
              </a>
              <button
                className="contact__copy-btn mono"
                onClick={copyEmail}
                aria-label="Copy email"
              >
                {copied ? '✓ copied!' : 'copy'}
              </button>
            </div>

            {/* Handwritten note */}
            <p className="contact__note caveat">
              "Response time: usually same day ✦"
            </p>
          </div>

          <div className="contact__right">
            <div className="contact__socials">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="contact__social-card"
                >
                  <div className="contact__social-top">
                    <span className="contact__social-label mono">{s.label}</span>
                    <span className="contact__social-arrow">↗</span>
                  </div>
                  <span className="contact__social-handle caveat">{s.handle}</span>
                  <span className="contact__social-desc mono">{s.desc}</span>
                </a>
              ))}
            </div>

            {/* Location note */}
            <div className="contact__location">
              <span className="contact__location-pin">📍</span>
              <div>
                <p className="contact__location-city caveat">Gurugram, India</p>
                <p className="contact__location-zone mono">IST (UTC +5:30)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
