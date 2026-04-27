# Sonal Singh — Portfolio

A modern, interactive portfolio website showcasing full-stack development expertise, work experience, projects, and technical skills. Built with React, Vite, and a carefully crafted notebook-inspired design.

## 🎨 Features

- **Responsive Design** — Notebook-ruled paper aesthetic with handwritten typography
- **Smooth Animations** — Intersection Observer-based fade-in effects and scroll progress tracking
- **Interactive Navigation** — Fixed navbar with active section highlighting and mobile burger menu
- **Scroll Progress Bar** — Real-time scroll percentage indicator at the top
- **Project Showcase** — Polaroid-style cards with hover interactions
- **Timeline UI** — Elegant work experience and education timeline
- **Skill Categories** — Organized tech stack with color-coded skill groups
- **Contact Section** — Multiple ways to connect (email, GitHub, LinkedIn, phone)
- **Accessibility** — Semantic HTML, ARIA labels, and keyboard navigation support

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sonal0212/portfolio.git
cd portfolio

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

Production-ready files will be generated in the `dist/` directory.

### Preview

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Navbar.jsx      # Fixed navigation header
│   ├── Hero.jsx        # About section with intro
│   ├── Work.jsx        # Work experience timeline
│   ├── Projects.jsx    # Project showcase (polaroid cards)
│   ├── Skills.jsx      # Technical skills grid
│   ├── Contact.jsx     # Contact & social links
│   ├── ScrollProgress.jsx
│   └── *.css           # Component-scoped styles
├── App.jsx             # Main app component with routing logic
├── main.jsx            # React DOM entry point
└── index.css           # Global styles & CSS variables

index.html             # HTML entry point
vite.config.js        # Vite configuration
package.json          # Dependencies & scripts
```

## 🎯 Key Components

### [`Navbar`](src/components/Navbar.jsx)
Fixed navigation with smooth scroll-to sections. Includes mobile hamburger menu and responsive design.

### [`Hero`](src/components/Hero.jsx)
Eye-catching introduction with status badge, stats, and social links. Features handwritten typography via Caveat font.

### [`Work`](src/components/Work.jsx)
Timeline visualization of professional experience and education. Each card includes:
- Role, company, location, and period
- Bullet-point achievements
- Technology tags
- Intersection Observer animations

### [`Projects`](src/components/Projects.jsx)
Polaroid-style project cards with:
- Hover rotation effects
- Descriptive content
- Tech stacks
- GitHub links

### [`Skills`](src/components/Skills.jsx)
Categorized skill groups (Languages, Frameworks, Databases, etc.) with color-coded accents.

### [`Contact`](src/components/Contact.jsx)
Multi-column layout with email CTA, social card grid, and location info.

### [`ScrollProgress`](src/components/ScrollProgress.jsx)
Fixed progress bar and percentage label showing scroll position.

## 🎨 Design System

### Color Palette (CSS Variables)
```css
--paper: #F5EDD6           /* Background */
--paper-dark: #EDE0C0
--paper-darker: #E3D4A8
--ink: #2C1810             /* Text */
--ink-light: #5C3D2E
--ink-faint: #9B7B5E
--red: #C0392B             /* Accent */
--red-light: #E74C3C
--blue-ink: #2C4A7C
--green-ink: #1A5C3A
--rule: rgba(44, 24, 16, 0.15)
```

### Typography
- **Headings** — Instrument Serif
- **Body** — Crimson Text
- **Handwritten** — Caveat
- **Code/Meta** — JetBrains Mono

### Responsive Breakpoints
- Mobile: `max-width: 600px`
- Tablet: `max-width: 768px`
- Desktop: `900px` container max-width

## ✨ Notable Features

### Intersection Observer Animations
Components fade in and slide as they enter the viewport using the Intersection Observer API:
```javascript
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        ref.current?.classList.add('visible')
      }
    },
    { threshold: 0.2 }
  )
  if (ref.current) observer.observe(ref.current)
  return () => observer.disconnect()
}, [])
```

### Dynamic Active Section Tracking
The navbar updates active links based on scroll position via Intersection Observer in [`App.jsx`](src/App.jsx).

### Scroll Progress Tracking
Real-time scroll percentage calculation with passive event listeners for performance.

### Notebook Aesthetic
Pseudo-elements create ruled lines and margin rules in [`index.css`](src/index.css).

## 🔧 Technologies

- **React** 18.2.0 — UI library
- **Vite** 5.0.8 — Build tool & dev server
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **JavaScript ES6+** — Modern JS features

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
# Build locally
npm run build

# Deploy dist/ folder via Netlify UI or CLI
```

### GitHub Pages
Update `vite.config.js` with `base: '/repository-name/'` and push the `dist/` folder.

## 📧 Contact

- **Email** — sonals02.singh@gmail.com
- **GitHub** — [@sonal0212](https://github.com/sonal0212)
- **LinkedIn** — [sonal-singh-dev](https://linkedin.com/in/sonal-singh-dev)
- **Phone** — +91 769-629-3984

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ♥ by Sonal Singh**
