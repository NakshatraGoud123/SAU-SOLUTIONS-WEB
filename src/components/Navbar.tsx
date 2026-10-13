import { useRef, useState } from 'react'
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { usePreferences } from '../context/usePreferences'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'What We Offer', href: '/what-we-offer' },
  { label: 'Our Products', href: '/products' },
  { label: 'Service Area', href: '/service-area' },
  { label: 'Partner Interest', href: '/partner/register' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const { theme, toggleTheme } = usePreferences()

  return (
    <header className="site-header">
      <nav
        className="navbar container"
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && menuOpen) {
            setMenuOpen(false)
            menuToggleRef.current?.focus()
          }
        }}
      >
        <Link className="wordmark" to="/" onClick={() => setMenuOpen(false)} aria-label="SAU Solutions home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">SAU<span>SOLUTIONS</span><small>LOCAL SERVICES · COMING SOON</small></span>
        </Link>
        <button
          ref={menuToggleRef}
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation-links"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <div id="primary-navigation-links" className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          {links.map((link) => <NavLink key={link.label} to={link.href} onClick={() => setMenuOpen(false)}>{link.label}</NavLink>)}
        </div>
        <div className="nav-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
          <Link className="button button-primary nav-cta" to="/app-coming-soon" aria-label="SAU SERVICES app coming soon"><span className="nav-cta-label">App coming soon</span><ArrowRight size={16} /></Link>
        </div>
      </nav>
    </header>
  )
}
