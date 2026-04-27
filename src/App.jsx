import { useState, useEffect } from 'react'
import ScrollProgress from './components/ScrollProgress'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Work from './components/Work'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Contact from './components/Contact'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('about')

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.3 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="app">
      <ScrollProgress />
      <Navbar activeSection={activeSection} />
      <main>
        <Hero />
        <Work />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <footer className="site-footer">
        <div className="container">
          <p className="footer-text">
            <span className="caveat">crafted with ♥ by Sonal Singh</span>
            <span className="footer-year"> — {new Date().getFullYear()}</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
