import { useState, useEffect } from 'react'
import './Navbar.css'

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'ask', label: 'Ask' },
  { id: 'my-journey', label: 'Journey' },
  { id: 'work', label: 'Work' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

export default function Navbar({ activeSection }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <button className="navbar__logo caveat" onClick={() => scrollTo('about')}>
          Sonal Singh
        </button>

        <nav className={`navbar__nav ${menuOpen ? 'navbar__nav--open' : ''}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`navbar__link caveat ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
          <a
            className="navbar__resume mono"
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Resume"
            download="Sonal Singh - Resume.pdf"
          >
            resume ↗
          </a>
        </nav>

        <button
          className="navbar__burger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
